# TTS Audio Generation Feature Design

**Date**: 2025-11-22
**Status**: Design Approved
**Architecture**: Job Queue with Background Worker

## Overview

Add text-to-speech (TTS) audio generation for trivia questions, allowing the display app to read questions aloud to the audience. Audio is generated on-demand using Google Gemini 2.5 Flash TTS API and stored in PocketBase, then downloaded and played by the display app during gameplay.

## Requirements Summary

- Host triggers audio generation from game setup screen
- Audio generated for all questions in a game (via round_questions)
- Sequential processing to manage API rate limits
- Progress tracking with real-time updates
- Graceful error handling with retry capability
- Audio stored per round_question (game-specific, not reusable)
- Display app automatically plays audio when available
- MP3 format for universal compatibility

## Architecture

### High-Level Flow

1. **Frontend trigger**: Host clicks "Generate Audio" button in game setup (only available when game status = "setup")
2. **API endpoint**: `POST /api/games/{gameId}/generate-audio` creates job record, returns 202 Accepted
3. **Background worker**: PocketBase interval check picks up pending jobs, processes sequentially
4. **Audio generation**: For each round_question, call Gemini TTS API, save MP3 to PocketBase storage
5. **Progress monitoring**: Frontend subscribes to job updates via realtime, shows progress bar
6. **Playback**: Display app downloads audio files during game using round_questions.audio_file field

### Component Architecture

```
┌─────────────────┐
│  Game Setup UI  │ (Frontend)
└────────┬────────┘
         │ POST /api/games/{id}/generate-audio
         ▼
┌─────────────────┐
│  Custom Route   │ (PocketBase Hook)
│  - Validate     │
│  - Create Job   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  audio_generation_jobs  │ (Collection)
│  - status: pending      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Background Worker      │ (PocketBase Hook)
│  - Poll for jobs        │
│  - Process sequentially │
│  - Rotate API keys      │
└────────┬────────────────┘
         │
         ├─► Gemini TTS API
         │
         ▼
┌─────────────────────────┐
│  round_questions        │
│  - audio_file (MP3)     │
│  - audio_status         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Display App Playback   │ (Tauri)
└─────────────────────────┘
```

## Database Schema

### New Collection: `audio_generation_jobs`

| Field | Type | Description |
|-------|------|-------------|
| `game` | relation | Link to games collection (required) |
| `status` | select | "pending", "processing", "completed", "failed" |
| `progress` | number | 0-100, percentage complete |
| `total_questions` | number | Total round_questions to process |
| `processed_questions` | number | Questions completed so far |
| `failed_questions` | json | Array of `{round_question_id, error_message}` |
| `current_api_key_index` | number | Index of Gemini API key to use next (for rotation) |
| `created` | datetime | Auto-generated |
| `updated` | datetime | Auto-generated |

**Access Rules**:
- Create: Only game host (`game.host.id = @request.auth.id`)
- Read: Only game host (`game.host.id = @request.auth.id`)
- Update: Only PocketBase internal (no external updates)
- Delete: Only game host (for cleanup)

### Modified Collection: `round_questions`

**New Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `audio_file` | file | Single MP3 file, max 5MB, accepts audio/* |
| `audio_status` | select | "none", "generating", "available", "failed" |
| `audio_error` | text | Optional, stores error message if generation failed |

**Access Rules** (additions):
- Audio fields readable by anyone who can read round_questions (needed for display app)
- Audio file writable only by PocketBase internal

## API Endpoint

### `POST /api/games/{gameId}/generate-audio`

**Request**: No body required, game ID in URL

**Validation**:
- Game exists
- User is game host
- Game status is "setup" (not "ready", "in-progress", or "completed")
- No existing "pending" or "processing" job for this game (idempotency)

**Process**:
1. Query all round_questions for this game (via rounds relationship)
2. Create audio_generation_jobs record:
   - game: {gameId}
   - status: "pending"
   - total_questions: count of round_questions
   - processed_questions: 0
   - failed_questions: []
   - current_api_key_index: 0
3. Return 202 Accepted with job ID

**Response**:
```json
{
  "job_id": "xyz123",
  "status": "pending",
  "total_questions": 50
}
```

**Error Responses**:
- 403: User is not game host
- 400: Game status is not "setup"
- 409: Job already in progress for this game (return existing job ID)

## Background Worker

### Job Processing Loop

**Interval**: Check for pending jobs every 5 seconds

**Process**:
1. Find oldest job with status="pending"
2. Update job status to "processing"
3. Load `GEMINI_API_KEYS` from environment variable (JSON array)
4. For each round_question in game (ordered by round, then question order):
   - Update round_question.audio_status = "generating"
   - Load question text from related questions record
   - Call Gemini TTS API with current API key
   - **On success**:
     - Save MP3 to round_question.audio_file
     - Set audio_status = "available"
     - Increment job.processed_questions
   - **On rate limit (429)**:
     - Rotate to next API key (job.current_api_key_index++)
     - Retry same question immediately
   - **On other error**:
     - Try up to 3 API keys total
     - If all fail: Set audio_status = "failed", record error in audio_error
     - Add to job.failed_questions array
     - Increment job.processed_questions (count as processed)
   - Update job.progress = (processed_questions / total_questions) * 100
   - Wait 200ms between questions (rate limit safety)
5. When all questions processed:
   - If failed_questions.length > 0: job.status = "failed"
   - Else: job.status = "completed"

### Startup Recovery

- On PocketBase startup, find any jobs with status="processing"
- Reset to status="pending" (server was restarted mid-processing)
- Worker will pick them up on next interval

### Timeout Handling

- Each API call has 30-second timeout
- If timeout occurs, treat as error (try next API key or mark failed)

## Gemini API Integration

### Configuration

**Environment Variable**: `GEMINI_API_KEYS`
```bash
GEMINI_API_KEYS='["AIzaSyAbc123...", "AIzaSyDef456...", "AIzaSyGhi789..."]'
```

### API Details

- **Service**: Google Cloud Text-to-Speech API v1
- **Endpoint**: `https://texttospeech.googleapis.com/v1/text:synthesize`
- **Authentication**: API key in query parameter or header
- **Model**: `en-US-Neural2-C` (neutral voice, clear pronunciation)
- **Audio Format**: MP3, 24kHz sample rate
- **Rate Limits**: ~300 requests/minute per API key

### Request Format

```json
{
  "input": {
    "text": "{question_text}"
  },
  "voice": {
    "languageCode": "en-US",
    "name": "en-US-Neural2-C"
  },
  "audioConfig": {
    "audioEncoding": "MP3"
  }
}
```

### Response Format

```json
{
  "audioContent": "{base64_encoded_mp3}"
}
```

### API Key Rotation

- Start with key at index 0
- On 429 error: increment index, wrap to 0 at end
- On other errors: try up to 3 keys total before marking failed
- Job tracks current_api_key_index for persistence across worker restarts

## Frontend Integration

### Game Setup Screen

**New UI Elements**:
- "Generate Audio" button
  - Visible only when game.status = "setup"
  - Disabled if job already in progress
  - Shows "Regenerate Audio" if audio exists but game still in setup

**Progress Modal**:
- Opens automatically after clicking "Generate Audio"
- Shows:
  - Progress bar: visual representation of completion
  - Text: "Generating audio: X of Y questions"
  - Cancel button (future: allows canceling job)
- Updates via realtime subscription to job record
- On completion:
  - Success: "Audio generation complete!" with checkmark
  - Partial failure: "Audio generated with X failures. Click Retry to regenerate failed questions."
  - Retry button if failures exist

**Realtime Subscription**:
```javascript
pb.collection('audio_generation_jobs').subscribe(jobId, (job) => {
  updateProgress(job.processed_questions, job.total_questions);
  if (job.status === 'completed' || job.status === 'failed') {
    showFinalStatus(job);
  }
});
```

### Display App Playback

**Question Display Logic** (`trivia-party-display/src/`):

```javascript
// When question is displayed
const currentQuestion = game.data.rounds[roundIndex].questions[questionIndex];

if (currentQuestion.audio_status === 'available') {
  const audioUrl = pb.getFileUrl(currentQuestion, currentQuestion.audio_file);
  await playAudio(audioUrl);
}
// If audio_status is "none" or "failed", silently skip - just show question text
```

**Audio Playback**:
- Download MP3 from PocketBase file API
- Play automatically when question appears
- No user controls (auto-play for question reading)
- If download fails: silently skip, no error shown to audience

**Platform Compatibility**:
- macOS: HTML5 audio element via Tauri webview
- Android TV: Same HTML5 audio (WebView supports MP3)
- Works on both platforms without platform-specific code

## Error Handling

### API Key Rotation Strategy

1. **Rate Limit (429)**:
   - Immediately rotate to next API key
   - Retry same question
   - Continue until all keys tried

2. **Invalid Key / Auth Error**:
   - Try next API key (up to 3 total attempts)
   - If all fail: mark question as failed

3. **Network Error / Timeout**:
   - Try same key once more
   - If fails again: try next API key
   - Max 3 total attempts across all keys

4. **All Keys Exhausted**:
   - Mark question as failed
   - Record error in round_question.audio_error
   - Add to job.failed_questions
   - Continue to next question

### Job Retry

**From Frontend**:
- If job.status = "failed" with failed_questions array populated
- Show "Retry Failed Questions" button
- Creates new job targeting only failed round_questions:
  - Reset audio_status from "failed" to "none"
  - Create new job with subset of questions
  - Process with same background worker logic

**Idempotency**:
- If "Generate Audio" clicked while job in progress: return existing job ID
- If round_question already has audio_status="available": skip generation, count as success
- No duplicate job creation

### Worker Resilience

- **Startup Recovery**: Reset "processing" jobs to "pending"
- **Per-Question Timeout**: 30 seconds max per API call
- **Error Isolation**: One question failure doesn't stop job
- **Progress Persistence**: Job progress saved after each question

## UI/UX Considerations

### Host Experience

1. **Setup Phase**:
   - Clear "Generate Audio" button in setup screen
   - One-click to start generation
   - Progress modal with real-time updates
   - Can close modal and return later (job continues in background)

2. **Progress Visibility**:
   - Progress bar shows completion percentage
   - Text shows "X of Y questions"
   - Clear indication when complete or failed

3. **Error Handling**:
   - Failed questions clearly indicated
   - One-click retry for failed subset
   - Game can start even with partial audio (graceful degradation)

### Player/Audience Experience

- **Display App**: Audio enhancement is transparent
  - Questions with audio: played automatically
  - Questions without audio: shown normally with text
  - No jarring transitions or error messages

- **Mobile Players**: No audio for players (controller app)
  - Audio is display-only feature
  - Players see question text as normal

## Future Enhancements

(Not in initial scope, documented for reference)

1. **Manual Regeneration**:
   - Allow host to regenerate audio for specific questions
   - "Regenerate All" option to recreate all audio

2. **Voice Customization**:
   - Allow host to choose voice type
   - Speed/pitch adjustments
   - Preview before generation

3. **Multi-Language Support**:
   - Auto-detect language from question text
   - Support non-English questions

4. **Progress Notifications**:
   - Email/push notification when generation complete
   - Especially useful for large games (100+ questions)

5. **Audio Preview**:
   - Play button in setup screen to preview audio
   - Verify quality before game start

6. **Bulk Operations**:
   - Generate audio for multiple games at once
   - Pre-generate audio for question library

## Implementation Notes

### Migration Strategy

1. Create migration for audio_generation_jobs collection
2. Create migration to add audio fields to round_questions
3. Add custom API route in pb_hooks/audio_generation.pb.js
4. Add background worker in same hook file
5. Update frontend game setup screen
6. Update display app playback logic

### Testing Considerations

- **Unit Tests**: API endpoint validation, worker logic
- **Integration Tests**: Full flow from button click to audio playback
- **Load Tests**: Large games (100+ questions), API rate limits
- **Error Tests**: API failures, network issues, invalid keys
- **Platform Tests**: Audio playback on macOS and Android TV

### Deployment Steps

1. Add GEMINI_API_KEYS environment variable to production server
2. Deploy migration files
3. Deploy hook code
4. Deploy frontend changes
5. Deploy display app updates
6. Monitor first few audio generation jobs for issues

## Success Criteria

- ✅ Host can generate audio for entire game with single button click
- ✅ Progress shown in real-time during generation
- ✅ Failed questions can be retried without regenerating successful ones
- ✅ Display app plays audio automatically when available
- ✅ Graceful degradation if audio unavailable (game works normally)
- ✅ API rate limits handled via key rotation
- ✅ Generation works for games of any size (10-100+ questions)
- ✅ Audio playback works on all platforms (macOS, Android TV)
