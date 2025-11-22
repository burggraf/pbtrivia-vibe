/// <reference path="../pb_data/types.d.ts" />

// Track worker state
let isProcessing = false;

// Helper: Get Gemini API keys from environment
function getGeminiApiKeys() {
  const keysJson = __env.get('GEMINI_API_KEYS') || '[]';
  try {
    const keys = JSON.parse(keysJson);
    if (!Array.isArray(keys) || keys.length === 0) {
      console.error('[AudioGen] No Gemini API keys configured');
      return [];
    }
    return keys;
  } catch (e) {
    console.error('[AudioGen] Failed to parse GEMINI_API_KEYS:', e);
    return [];
  }
}

// Helper: Call Gemini TTS API with 30-second timeout
async function generateAudio(text, apiKey) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('API request timeout after 30 seconds')), 30000);
  });

  // Create fetch promise
  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { text: text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-C'
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    })
  });

  // Race between fetch and timeout
  const response = await Promise.race([fetchPromise, timeoutPromise]);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.audioContent; // base64 encoded MP3
}

// API endpoint: POST /api/games/:id/generate-audio
routerAdd("POST", "/api/games/{id}/generate-audio", (e) => {
  const gameId = e.request.pathValue("id");

  // Get auth record from request (PocketBase automatically parses Authorization header)
  const authRecord = e.auth;

  if (!authRecord) {
    return e.json(403, { error: "Authentication required" });
  }

  try {
    // Verify game exists and user is host
    const game = e.app.findRecordById("games", gameId);
    if (!game) {
      return e.json(404, { error: "Game not found" });
    }

    if (game.getString("host") !== authRecord.id) {
      return e.json(403, { error: "Only game host can generate audio" });
    }

    // Verify game status is "setup"
    if (game.getString("status") !== "setup") {
      return e.json(400, { error: "Audio can only be generated during game setup" });
    }

    // Check for existing pending/processing job (idempotency)
    const existingJobs = e.app.findRecordsByFilter(
      "audio_generation_jobs",
      `game = {:gameId} && (status = "pending" || status = "processing")`,
      "-created",
      1,
      0,
      { gameId }
    );

    if (existingJobs.length > 0) {
      const existingJob = existingJobs[0];
      return e.json(409, {
        error: "Job already in progress",
        job_id: existingJob.id,
        status: existingJob.getString("status"),
        progress: existingJob.getInt("progress")
      });
    }

    // Count total game_questions for this game
    const gameQuestions = e.app.findRecordsByFilter(
      "game_questions",
      `game = {:gameId}`,
      "",
      -1,
      0,
      { gameId }
    );

    const totalQuestions = gameQuestions.length;

    if (totalQuestions === 0) {
      return e.json(400, { error: "No questions found for this game" });
    }

    // Create job record
    const jobsCollection = e.app.findCollectionByNameOrId("audio_generation_jobs");
    const jobRecord = new Record(jobsCollection);

    jobRecord.load({
      game: gameId,
      status: "pending",
      progress: 0,
      total_questions: totalQuestions,
      processed_questions: 0,
      failed_questions: [],
      current_api_key_index: 0
    });

    const jobForm = new RecordUpsertForm(e.app, jobRecord);
    jobForm.submit();

    return e.json(202, {
      job_id: jobRecord.id,
      status: "pending",
      total_questions: totalQuestions
    });

  } catch (err) {
    console.error('[AudioGen] Error creating job:', err);
    return e.json(500, { error: "Failed to create audio generation job" });
  }
});

// Start worker on app initialization
onBootstrap((e) => {
  console.log('[AudioGen] Starting background worker');

  // NOTE: PocketBase JSVM does not support setTimeout/setInterval (no event loop)
  // cronAdd is the only way to schedule recurring tasks, but has 1-minute minimum
  // For sub-minute scheduling, would need to implement in Go
  // See: https://pocketbase.io/docs/js-overview/ and https://github.com/pocketbase/pocketbase/discussions/3535
  cronAdd("audioGenerationWorker", "* * * * *", async () => {
    // Try to reset any stuck jobs (will be empty most of the time)
    try {
      const stuckJobs = $app.findRecordsByFilter(
        "audio_generation_jobs",
        `status = "processing"`,
        "",
        -1,
        0
      );

      if (stuckJobs && stuckJobs.length > 0) {
        for (const job of stuckJobs) {
          const form = new RecordUpsertForm($app, job);
          form.load({ status: "pending" });
          form.submit();
          console.log(`[AudioGen] Reset stuck job ${job.id} to pending`);
        }
      }
    } catch (err) {
      // Silently ignore stuck job recovery errors
    }

    // Process pending jobs - inline implementation
    if (isProcessing) {
      return; // Already processing, skip this interval
    }

    try {
      isProcessing = true;

      // Find oldest pending job
      const pendingJobs = $app.findRecordsByFilter(
        "audio_generation_jobs",
        `status = "pending"`,
        "+created",
        1,
        0
      );

      if (pendingJobs.length === 0) {
        return; // No pending jobs
      }

      const job = pendingJobs[0];
      const gameId = job.getString("game");

      console.log(`[AudioGen] Processing job ${job.id} for game ${gameId}`);

      // Update job status to processing
      const jobForm = new RecordUpsertForm($app, job);
      jobForm.load({ status: "processing" });
      jobForm.submit();

      // Get API keys
      const apiKeys = getGeminiApiKeys();
      if (apiKeys.length === 0) {
        throw new Error("No Gemini API keys available");
      }

      let currentKeyIndex = job.getInt("current_api_key_index");
      const failedQuestions = [];

      // Get all game_questions for this game
      const gameQuestions = $app.findRecordsByFilter(
        "game_questions",
        `game = {:gameId}`,
        "round_order,order",
        -1,
        0,
        { gameId }
      );

      let processedCount = job.getInt("processed_questions");

      // Process each question
      for (let i = 0; i < gameQuestions.length; i++) {
        const gameQuestion = gameQuestions[i];

        // Skip if already has audio
        if (gameQuestion.getString("audio_status") === "available") {
          processedCount++;
          continue;
        }

        try {
          // Update status to generating
          const gqForm = new RecordUpsertForm($app, gameQuestion);
          gqForm.load({ audio_status: "generating" });
          gqForm.submit();

          // Get question text
          const questionId = gameQuestion.getString("question");
          const question = $app.findRecordById("questions", questionId);
          const questionText = question.getString("text");

          // Try to generate audio with retry logic
          let audioContent = null;
          let attempts = 0;
          let lastError = null;

          while (attempts < 3 && audioContent === null) {
            try {
              const apiKey = apiKeys[currentKeyIndex % apiKeys.length];
              audioContent = await generateAudio(questionText, apiKey);
            } catch (err) {
              lastError = err;
              attempts++;

              // If rate limit, rotate immediately
              if (err.message.includes("429")) {
                currentKeyIndex++;
              } else {
                // For other errors, try next key
                currentKeyIndex++;
              }

              // Update job with new key index
              const updateForm = new RecordUpsertForm($app, job);
              updateForm.load({ current_api_key_index: currentKeyIndex });
              updateForm.submit();
            }
          }

          if (audioContent) {
            // Decode base64 and save as file
            const audioBytes = atob(audioContent);
            const audioArray = new Uint8Array(audioBytes.length);
            for (let i = 0; i < audioBytes.length; i++) {
              audioArray[i] = audioBytes.charCodeAt(i);
            }
            const filename = `${gameQuestion.id}.mp3`;

            // Create form with file
            const fileForm = new RecordUpsertForm($app, gameQuestion);
            const fileData = new FormData();
            fileData.append('audio_file', new Blob([audioArray], { type: 'audio/mpeg' }), filename);
            fileData.append('audio_status', 'available');
            fileForm.loadFormData(fileData);
            fileForm.submit();

            console.log(`[AudioGen] Generated audio for question ${gameQuestion.id}`);
          } else {
            // Failed after all retries
            const errorMsg = lastError?.message || "Unknown error";
            const gqErrorForm = new RecordUpsertForm($app, gameQuestion);
            gqErrorForm.load({
              audio_status: "failed",
              audio_error: errorMsg.substring(0, 255)
            });
            gqErrorForm.submit();

            failedQuestions.push({
              game_question_id: gameQuestion.id,
              error_message: errorMsg
            });

            console.error(`[AudioGen] Failed to generate audio for question ${gameQuestion.id}:`, errorMsg);
          }

          processedCount++;

          // Update job progress
          const progressForm = new RecordUpsertForm($app, job);
          progressForm.load({
            processed_questions: processedCount,
            progress: Math.floor((processedCount / gameQuestions.length) * 100),
            failed_questions: failedQuestions
          });
          progressForm.submit();

          // Rate limit safety: wait 200ms between questions
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (err) {
          console.error(`[AudioGen] Unexpected error processing question ${gameQuestion.id}:`, err);

          // Mark as failed and continue
          const gqErrorForm = new RecordUpsertForm($app, gameQuestion);
          gqErrorForm.load({
            audio_status: "failed",
            audio_error: err.message.substring(0, 255)
          });
          gqErrorForm.submit();

          failedQuestions.push({
            game_question_id: gameQuestion.id,
            error_message: err.message
          });

          processedCount++;

          const progressForm = new RecordUpsertForm($app, job);
          progressForm.load({
            processed_questions: processedCount,
            progress: Math.floor((processedCount / gameQuestions.length) * 100),
            failed_questions: failedQuestions
          });
          progressForm.submit();
        }
      }

      // Mark job as complete or failed
      const finalStatus = failedQuestions.length > 0 ? "failed" : "completed";
      const finalForm = new RecordUpsertForm($app, job);
      finalForm.load({ status: finalStatus });
      finalForm.submit();

      console.log(`[AudioGen] Job ${job.id} ${finalStatus} (${processedCount}/${gameQuestions.length} processed, ${failedQuestions.length} failed)`);

    } catch (err) {
      console.error('[AudioGen] Worker error:', err);
    } finally {
      isProcessing = false;
    }
  });

  // Continue bootstrap process
  e.next();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGeminiApiKeys, generateAudio };
}
