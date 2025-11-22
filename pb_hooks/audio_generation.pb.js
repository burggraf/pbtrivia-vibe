/// <reference path="../pb_data/types.d.ts" />

// Track worker state
let workerInterval = null;
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

// Helper: Call Gemini TTS API
async function generateAudio(text, apiKey) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await fetch(url, {
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
    const jobForm = new RecordUpsertForm(e.app, jobRecord);

    jobForm.loadData({
      game: gameId,
      status: "pending",
      progress: 0,
      total_questions: totalQuestions,
      processed_questions: 0,
      failed_questions: [],
      current_api_key_index: 0
    });

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

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGeminiApiKeys, generateAudio };
}
