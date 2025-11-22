# TTS Audio Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement text-to-speech audio generation for trivia questions using Google Gemini 2.5 Flash TTS API with job queue architecture.

**Architecture:** Job-based background worker system where hosts trigger audio generation from game setup, PocketBase processes questions sequentially with API key rotation, and display app automatically plays audio during gameplay.

**Tech Stack:** PocketBase (backend/migrations/hooks), Google Gemini TTS API, React (frontend UI), Tauri (display app), TypeScript

---

## Prerequisites

Before starting, ensure:
- PocketBase version 0.30.3 is running locally
- GEMINI_API_KEYS environment variable will be available (add to server config)
- `game_questions` collection already has `audio_file`, `audio_status`, and `audio_error` fields (created via PocketBase UI)

## Task 1: Create audio_generation_jobs Collection Migration

**Files:**
- Create: `pb_migrations/[timestamp]_create_audio_generation_jobs.js`

**Step 1: Generate timestamp for migration file**

Run: `date +%s`
Expected: Unix timestamp (e.g., 1732294800)

**Step 2: Create migration file**

Create file: `pb_migrations/[timestamp]_create_audio_generation_jobs.js` (replace [timestamp] with actual value)

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    name: "audio_generation_jobs",
    type: "base",
    system: false,
    schema: [
      {
        name: "game",
        type: "relation",
        required: true,
        options: {
          collectionId: "", // Will be resolved dynamically
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
          displayFields: ["name"]
        }
      },
      {
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["pending", "processing", "completed", "failed"]
        }
      },
      {
        name: "progress",
        type: "number",
        required: true,
        options: {
          min: 0,
          max: 100
        }
      },
      {
        name: "total_questions",
        type: "number",
        required: true,
        options: {
          min: 0
        }
      },
      {
        name: "processed_questions",
        type: "number",
        required: true,
        options: {
          min: 0
        }
      },
      {
        name: "failed_questions",
        type: "json",
        required: false,
        options: {}
      },
      {
        name: "current_api_key_index",
        type: "number",
        required: true,
        options: {
          min: 0
        }
      }
    ],
    indexes: [
      "CREATE INDEX idx_job_status ON audio_generation_jobs (status)",
      "CREATE INDEX idx_job_game ON audio_generation_jobs (game)"
    ],
    listRule: "@request.auth.id != '' && game.host.id = @request.auth.id",
    viewRule: "@request.auth.id != '' && game.host.id = @request.auth.id",
    createRule: "@request.auth.id != '' && game.host.id = @request.auth.id",
    updateRule: null, // Only PocketBase internal can update
    deleteRule: "@request.auth.id != '' && game.host.id = @request.auth.id"
  });

  // Resolve games collection ID dynamically
  const gamesCollection = db.findCollectionByNameOrId("games");
  if (!gamesCollection) {
    throw new Error("games collection not found");
  }

  // Set the relation to games collection
  collection.schema.find(f => f.name === "game").options.collectionId = gamesCollection.id;

  return db.saveCollection(collection);
}, (db) => {
  // Rollback: delete collection
  const collection = db.findCollectionByNameOrId("audio_generation_jobs");
  if (collection) {
    return db.deleteCollection(collection);
  }
});
```

**Step 3: Test migration**

Run: `pocketbase migrate up --dir=pb_migrations`
Expected: Migration applies successfully, collection created

**Step 4: Verify in admin panel**

1. Open http://localhost:8090/_/
2. Navigate to Collections
3. Verify "audio_generation_jobs" exists with all fields
4. Check access rules match specification

**Step 5: Commit**

```bash
git add pb_migrations/[timestamp]_create_audio_generation_jobs.js
git commit -m "feat(migration): create audio_generation_jobs collection

Add collection for tracking TTS audio generation job status and progress.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create PocketBase Hook for Audio Generation API

**Files:**
- Create: `pb_hooks/audio_generation.pb.js`

**Step 1: Create hooks directory if needed**

Run: `mkdir -p pb_hooks`

**Step 2: Create hook file with API endpoint**

Create file: `pb_hooks/audio_generation.pb.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />

// Track worker state
let workerInterval = null;
let isProcessing = false;

// Helper: Get Gemini API keys from environment
function getGeminiApiKeys() {
  const keysJson = process.env.GEMINI_API_KEYS || '[]';
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
      input: { text },
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
routerAdd("POST", "/api/games/:id/generate-audio", (e) => {
  const gameId = e.request.pathValue("id");
  const authRecord = e.requestInfo().authRecord;

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
}, $apis.requireAuth());

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getGeminiApiKeys, generateAudio };
}
```

**Step 3: Test API endpoint manually**

1. Start PocketBase: `pocketbase serve --dev --http 0.0.0.0:8090`
2. Create a test game in setup status via admin panel
3. Use curl or Postman to test endpoint:

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","password":"Password123"}' \
  | jq -r '.token')

# Call endpoint
curl -X POST http://localhost:8090/api/games/GAME_ID/generate-audio \
  -H "Authorization: Bearer $TOKEN"
```

Expected: 202 response with job_id, status="pending", total_questions count

**Step 4: Test idempotency**

Call same endpoint again immediately.
Expected: 409 response with existing job details

**Step 5: Commit**

```bash
git add pb_hooks/audio_generation.pb.js
git commit -m "feat(api): add audio generation endpoint

Implement POST /api/games/:id/generate-audio endpoint that creates
job records for background processing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Implement Background Worker Logic

**Files:**
- Modify: `pb_hooks/audio_generation.pb.js`

**Step 1: Add worker function**

Add this code to `pb_hooks/audio_generation.pb.js` after the API endpoint:

```javascript
// Background worker: Process pending jobs
async function processJobs(app) {
  if (isProcessing) {
    return; // Already processing, skip this interval
  }

  try {
    isProcessing = true;

    // Find oldest pending job
    const pendingJobs = app.findRecordsByFilter(
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
    const jobForm = new RecordUpsertForm(app, job);
    jobForm.loadData({ status: "processing" });
    jobForm.submit();

    // Get API keys
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
      throw new Error("No Gemini API keys available");
    }

    let currentKeyIndex = job.getInt("current_api_key_index");
    const failedQuestions = [];

    // Get all game_questions for this game
    const gameQuestions = app.findRecordsByFilter(
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
        const gqForm = new RecordUpsertForm(app, gameQuestion);
        gqForm.loadData({ audio_status: "generating" });
        gqForm.submit();

        // Get question text
        const questionId = gameQuestion.getString("question");
        const question = app.findRecordById("questions", questionId);
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
            const updateForm = new RecordUpsertForm(app, job);
            updateForm.loadData({ current_api_key_index: currentKeyIndex });
            updateForm.submit();
          }
        }

        if (audioContent) {
          // Decode base64 and save as file
          const audioBuffer = Buffer.from(audioContent, 'base64');
          const filename = `${gameQuestion.id}.mp3`;

          // Create form with file
          const fileForm = new RecordUpsertForm(app, gameQuestion);
          const fileData = new FormData();
          fileData.append('audio_file', new Blob([audioBuffer], { type: 'audio/mpeg' }), filename);
          fileData.append('audio_status', 'available');
          fileForm.loadFormData(fileData);
          fileForm.submit();

          console.log(`[AudioGen] Generated audio for question ${gameQuestion.id}`);
        } else {
          // Failed after all retries
          const errorMsg = lastError?.message || "Unknown error";
          const gqErrorForm = new RecordUpsertForm(app, gameQuestion);
          gqErrorForm.loadData({
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
        const progressForm = new RecordUpsertForm(app, job);
        progressForm.loadData({
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
        const gqErrorForm = new RecordUpsertForm(app, gameQuestion);
        gqErrorForm.loadData({
          audio_status: "failed",
          audio_error: err.message.substring(0, 255)
        });
        gqErrorForm.submit();

        failedQuestions.push({
          game_question_id: gameQuestion.id,
          error_message: err.message
        });

        processedCount++;

        const progressForm = new RecordUpsertForm(app, job);
        progressForm.loadData({
          processed_questions: processedCount,
          progress: Math.floor((processedCount / gameQuestions.length) * 100),
          failed_questions: failedQuestions
        });
        progressForm.submit();
      }
    }

    // Mark job as complete or failed
    const finalStatus = failedQuestions.length > 0 ? "failed" : "completed";
    const finalForm = new RecordUpsertForm(app, job);
    finalForm.loadData({ status: finalStatus });
    finalForm.submit();

    console.log(`[AudioGen] Job ${job.id} ${finalStatus} (${processedCount}/${gameQuestions.length} processed, ${failedQuestions.length} failed)`);

  } catch (err) {
    console.error('[AudioGen] Worker error:', err);
  } finally {
    isProcessing = false;
  }
}

// Start worker on app initialization
onAfterBootstrap((e) => {
  console.log('[AudioGen] Starting background worker');

  // Reset any "processing" jobs to "pending" (server restart recovery)
  const stuckJobs = e.app.findRecordsByFilter(
    "audio_generation_jobs",
    `status = "processing"`,
    "",
    -1,
    0
  );

  for (const job of stuckJobs) {
    const form = new RecordUpsertForm(e.app, job);
    form.loadData({ status: "pending" });
    form.submit();
    console.log(`[AudioGen] Reset stuck job ${job.id} to pending`);
  }

  // Start interval worker (every 5 seconds)
  workerInterval = setInterval(() => {
    processJobs(e.app).catch(err => {
      console.error('[AudioGen] Worker interval error:', err);
    });
  }, 5000);
});

// Cleanup on shutdown
onBeforeServe((e) => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
});
```

**Step 2: Set environment variable**

Add to your shell profile or run before starting PocketBase:

```bash
export GEMINI_API_KEYS='["YOUR_API_KEY_HERE"]'
```

For testing, you can use a mock key for now (will fail but we can test the flow).

**Step 3: Test worker manually**

1. Stop PocketBase if running
2. Set GEMINI_API_KEYS environment variable
3. Start PocketBase: `GEMINI_API_KEYS='["test"]' pocketbase serve --dev --http 0.0.0.0:8090`
4. Watch logs for "[AudioGen] Starting background worker"
5. Create a job via API endpoint (from Task 2)
6. Watch logs for job processing

Expected: Worker picks up job, attempts to process, logs errors (API key invalid but flow works)

**Step 4: Commit**

```bash
git add pb_hooks/audio_generation.pb.js
git commit -m "feat(worker): implement background audio generation worker

Add background worker that processes job queue, calls Gemini TTS API,
handles retries and API key rotation, saves audio files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add TypeScript Types for Audio Generation

**Files:**
- Create: `src/types/audioGeneration.ts`

**Step 1: Create types file**

Create file: `src/types/audioGeneration.ts`

```typescript
export interface AudioGenerationJob {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  game: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  total_questions: number;
  processed_questions: number;
  failed_questions: Array<{
    game_question_id: string;
    error_message: string;
  }>;
  current_api_key_index: number;
}

export interface AudioGenerationResponse {
  job_id: string;
  status: string;
  total_questions: number;
}

export interface AudioGenerationError {
  error: string;
  job_id?: string;
  status?: string;
  progress?: number;
}
```

**Step 2: Update game_questions type**

Modify: `src/types/games.ts`

Find the GameQuestion type and add audio fields:

```typescript
export interface GameQuestion {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  game: string;
  round_order: number;
  order: number;
  question: string;
  audio_file?: string; // New field
  audio_status: 'none' | 'generating' | 'available' | 'failed'; // New field
  audio_error?: string; // New field
  expand?: {
    question?: Question;
  };
}
```

**Step 3: Verify types compile**

Run: `pnpm run build`
Expected: TypeScript compiles without errors

**Step 4: Commit**

```bash
git add src/types/audioGeneration.ts src/types/games.ts
git commit -m "feat(types): add audio generation TypeScript types

Add types for audio generation jobs and update GameQuestion type
with audio fields.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create Frontend Audio Generation Button Component

**Files:**
- Create: `src/components/games/AudioGenerationButton.tsx`

**Step 1: Create component file**

Create file: `src/components/games/AudioGenerationButton.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { Game } from '@/types/games';
import { AudioGenerationResponse, AudioGenerationError } from '@/types/audioGeneration';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface AudioGenerationButtonProps {
  game: Game;
  onJobCreated: (jobId: string) => void;
  disabled?: boolean;
}

export default function AudioGenerationButton({ game, onJobCreated, disabled = false }: AudioGenerationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateAudio = async () => {
    if (!game || game.status !== 'setup') {
      toast({
        title: 'Cannot generate audio',
        description: 'Audio can only be generated during game setup.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${pb.baseUrl}/api/games/${game.id}/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': pb.authStore.token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: AudioGenerationError = await response.json();

        if (response.status === 409) {
          // Job already in progress
          toast({
            title: 'Audio generation in progress',
            description: 'An audio generation job is already running for this game.',
            variant: 'default'
          });
          if (errorData.job_id) {
            onJobCreated(errorData.job_id);
          }
        } else {
          throw new Error(errorData.error || 'Failed to start audio generation');
        }
      } else {
        const data: AudioGenerationResponse = await response.json();

        toast({
          title: 'Audio generation started',
          description: `Generating audio for ${data.total_questions} questions...`,
        });

        onJobCreated(data.job_id);
      }
    } catch (error) {
      console.error('Error starting audio generation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start audio generation',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || game.status !== 'setup';

  return (
    <Button
      onClick={handleGenerateAudio}
      disabled={isDisabled}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Generate Audio
        </>
      )}
    </Button>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/games/AudioGenerationButton.tsx
git commit -m "feat(ui): add audio generation button component

Implement button component for triggering TTS audio generation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Audio Generation Progress Modal

**Files:**
- Create: `src/components/games/AudioGenerationModal.tsx`

**Step 1: Create modal component**

Create file: `src/components/games/AudioGenerationModal.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AudioGenerationJob } from '@/types/audioGeneration';
import { pb } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface AudioGenerationModalProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export default function AudioGenerationModal({ jobId, isOpen, onClose, onRetry }: AudioGenerationModalProps) {
  const [job, setJob] = useState<AudioGenerationJob | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!jobId || !isOpen) {
      return;
    }

    // Initial fetch
    pb.collection('audio_generation_jobs')
      .getOne<AudioGenerationJob>(jobId)
      .then(setJob)
      .catch(err => {
        console.error('Error fetching job:', err);
        toast({
          title: 'Error',
          description: 'Failed to load job status',
          variant: 'destructive'
        });
      });

    // Subscribe to realtime updates
    const unsubscribe = pb.collection('audio_generation_jobs').subscribe<AudioGenerationJob>(
      jobId,
      (data) => {
        setJob(data.record);
      }
    );

    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, [jobId, isOpen, toast]);

  if (!job) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isComplete = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isInProgress = job.status === 'processing' || job.status === 'pending';
  const hasFailures = job.failed_questions && job.failed_questions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete && !hasFailures && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {(isFailed || hasFailures) && <XCircle className="h-5 w-5 text-red-500" />}
            {isInProgress && <Loader2 className="h-5 w-5 animate-spin" />}
            Audio Generation
          </DialogTitle>
          <DialogDescription>
            {isComplete && !hasFailures && 'Audio generation completed successfully'}
            {isFailed && 'Audio generation completed with errors'}
            {isInProgress && 'Generating audio for questions...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {job.processed_questions} of {job.total_questions} questions
              </span>
            </div>
            <Progress value={job.progress} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {job.progress}%
            </div>
          </div>

          {hasFailures && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                {job.failed_questions.length} question{job.failed_questions.length !== 1 ? 's' : ''} failed
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                The game can still be played. Failed questions will not have audio.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {hasFailures && onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Retry Failed
              </Button>
            )}
            <Button onClick={onClose} variant="default" size="sm">
              {isInProgress ? 'Close' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify component compiles**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/games/AudioGenerationModal.tsx
git commit -m "feat(ui): add audio generation progress modal

Implement modal that shows real-time progress of audio generation
with realtime subscription updates.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Integrate Audio Generation into Game Setup UI

**Files:**
- Modify: `src/components/games/GameEditModal.tsx` or `src/pages/HostPage.tsx` (whichever has game setup UI)

**Step 1: Check which file has game setup**

Run: `grep -n "game.*setup\|status.*setup" src/pages/HostPage.tsx src/components/games/GameEditModal.tsx`

Identify the file where games in "setup" status are displayed.

**Step 2: Add audio generation button to game setup UI**

If in `HostPage.tsx`, add near other game action buttons:

```typescript
import AudioGenerationButton from '@/components/games/AudioGenerationButton';
import AudioGenerationModal from '@/components/games/AudioGenerationModal';

// Inside component:
const [audioJobId, setAudioJobId] = useState<string | null>(null);
const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

// In the render, near other buttons for games in "setup" status:
{game.status === 'setup' && (
  <AudioGenerationButton
    game={game}
    onJobCreated={(jobId) => {
      setAudioJobId(jobId);
      setIsAudioModalOpen(true);
    }}
  />
)}

// At bottom of component (outside main render):
<AudioGenerationModal
  jobId={audioJobId}
  isOpen={isAudioModalOpen}
  onClose={() => setIsAudioModalOpen(false)}
  onRetry={() => {
    // Clicking retry would re-trigger button, for now just close
    setIsAudioModalOpen(false);
    setAudioJobId(null);
  }}
/>
```

**Step 3: Test in browser**

1. Start dev environment: `./dev.sh`
2. Navigate to game setup screen
3. Verify "Generate Audio" button appears for games in setup status
4. Click button
5. Verify modal opens and shows progress (will fail without valid API key but UI should work)

**Step 4: Commit**

```bash
git add src/pages/HostPage.tsx  # or GameEditModal.tsx
git commit -m "feat(ui): integrate audio generation into game setup

Add audio generation button and progress modal to game setup screen.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Audio Playback to Display App

**Files:**
- Modify: `trivia-party-display/src/components/RoundPlayDisplay.tsx` (or wherever questions are displayed)

**Step 1: Read current question display logic**

Run: `grep -A 10 "currentQuestion\|question.*text" trivia-party-display/src/components/RoundPlayDisplay.tsx | head -20`

Identify where questions are displayed.

**Step 2: Add audio playback hook**

Add to `trivia-party-display/src/components/RoundPlayDisplay.tsx`:

```typescript
import { useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';

// Inside component, near other hooks:
const audioRef = useRef<HTMLAudioElement | null>(null);

// Add effect to play audio when question changes
useEffect(() => {
  if (!currentQuestion) return;

  // Clean up previous audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }

  // Check if audio is available
  if (currentQuestion.audio_status === 'available' && currentQuestion.audio_file) {
    try {
      const audioUrl = pb.files.getUrl(currentQuestion, currentQuestion.audio_file);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.play().catch(err => {
        console.error('Failed to play audio:', err);
        // Silently fail - question still displays
      });
    } catch (err) {
      console.error('Error loading audio:', err);
      // Silently fail - question still displays
    }
  }

  // Cleanup on unmount
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, [currentQuestion, currentQuestion?.id]); // Re-run when question changes
```

**Step 3: Test audio playback**

1. Build display app: `cd trivia-party-display && pnpm tauri:build`
2. Run display app
3. Join a game
4. When question with audio appears, verify audio plays automatically
5. When question without audio appears, verify text shows normally (no errors)

**Step 4: Commit**

```bash
git add trivia-party-display/src/components/RoundPlayDisplay.tsx
git commit -m "feat(display): add automatic audio playback for questions

Play TTS audio automatically when questions with audio are displayed.
Gracefully handles missing audio.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add Environment Variable Documentation

**Files:**
- Modify: `README.md` or create `docs/DEPLOYMENT.md`

**Step 1: Add environment variable documentation**

Add section to README.md:

```markdown
## Environment Variables

### GEMINI_API_KEYS

Required for TTS audio generation feature. JSON array of Google Gemini API keys.

```bash
export GEMINI_API_KEYS='["AIzaSyAbc123...", "AIzaSyDef456..."]'
```

Multiple keys enable automatic rotation when rate limits are hit.

To start PocketBase with API keys:

```bash
GEMINI_API_KEYS='["your-key-here"]' pocketbase serve --dev --http 0.0.0.0:8090
```

To get a Gemini API key:
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Enable Text-to-Speech API
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add GEMINI_API_KEYS environment variable documentation

Document how to configure Gemini API keys for TTS audio generation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: End-to-End Testing

**Files:**
- None (manual testing)

**Step 1: Setup test environment**

1. Get valid Gemini API key from https://makersuite.google.com/app/apikey
2. Set environment variable: `export GEMINI_API_KEYS='["your-real-key"]'`
3. Start PocketBase: `GEMINI_API_KEYS='["your-key"]' pocketbase serve --dev --http 0.0.0.0:8090`
4. Start frontend: `./dev.sh` (in separate terminal)

**Step 2: Create test game**

1. Login to frontend
2. Create new game with 3-5 questions
3. Game should be in "setup" status

**Step 3: Test audio generation**

1. Click "Generate Audio" button
2. Verify modal opens with progress bar
3. Watch progress update in real-time
4. Wait for completion
5. Verify all questions show audio_status="available" in admin panel

**Step 4: Test display app playback**

1. Start display app: `cd trivia-party-display && pnpm tauri:dev`
2. Connect to same game
3. Start game from host screen
4. When question appears, verify audio plays automatically
5. Verify question text displays correctly

**Step 5: Test error handling**

1. Use invalid API key: `GEMINI_API_KEYS='["invalid"]'`
2. Restart PocketBase
3. Try generating audio
4. Verify all questions marked as "failed"
5. Verify modal shows error count
6. Verify game can still start and play (without audio)

**Step 6: Test idempotency**

1. Start audio generation
2. While processing, click "Generate Audio" again
3. Verify 409 response with existing job info
4. Verify only one job exists in database

**Step 7: Document test results**

Create file: `docs/testing/tts-audio-generation-test-results.md`

Document:
- Test date
- Test scenarios covered
- Pass/fail status for each scenario
- Any bugs found
- Performance observations (time to generate N questions)

**Step 8: Commit test documentation**

```bash
git add docs/testing/tts-audio-generation-test-results.md
git commit -m "test: document TTS audio generation end-to-end testing

Record test scenarios, results, and observations.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Success Criteria

- ✅ Migration creates audio_generation_jobs collection with correct schema
- ✅ API endpoint creates jobs and validates permissions/status
- ✅ Background worker processes jobs sequentially
- ✅ API key rotation works on rate limits
- ✅ Audio files saved to PocketBase storage
- ✅ Frontend shows "Generate Audio" button in game setup
- ✅ Progress modal updates in real-time via subscriptions
- ✅ Display app plays audio automatically when available
- ✅ Graceful degradation when audio unavailable
- ✅ Error handling prevents crashes, allows game to continue
- ✅ Documentation updated with environment variable setup

## Known Limitations

1. **No cancellation**: Once started, job runs to completion
2. **Sequential only**: Processes one question at a time (by design)
3. **No preview**: Host cannot preview audio before game
4. **English only**: No multi-language support yet
5. **No voice customization**: Uses default Gemini voice

These are documented for future enhancements.

## Troubleshooting

**Problem: Audio generation fails immediately**
- Check GEMINI_API_KEYS environment variable is set
- Verify API key is valid
- Check PocketBase logs for detailed errors

**Problem: Progress modal doesn't update**
- Check PocketBase realtime connection
- Verify job ID is correct
- Check browser console for subscription errors

**Problem: Display app doesn't play audio**
- Verify audio_file field is populated in database
- Check audio URL is accessible
- Look for CORS errors in console
- Verify HTML5 audio support in webview

**Problem: Worker doesn't pick up jobs**
- Verify worker started (check logs for "[AudioGen] Starting background worker")
- Check job status is "pending" (not stuck in "processing")
- Restart PocketBase to reset worker
