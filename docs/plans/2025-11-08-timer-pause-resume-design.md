# Timer Pause/Resume Design

**Date:** 2025-11-08
**Status:** Approved
**Author:** Claude Code

## Overview

Add pause/resume functionality for game timers, allowing the host to pause any active timer and resume from the remaining time. When paused, all clients (controller and players) see a "PAUSED" indicator and the countdown freezes.

## Requirements

### Functional Requirements

1. **Pause Button**: Host sees a pause button in the top-right header (left of "Next" button) when any timer is active
2. **Pause Action**: Clicking pause freezes the timer, stores remaining time, syncs pause state across all clients
3. **Resume Action**: Clicking resume (on paused timer) continues countdown from remaining time
4. **Visual Feedback**: Paused timers show "PAUSED" indicator on both controller and player screens
5. **All Timers Pausable**: Applies to question, answer, game_start, round_start, game_end, thanks, and early-advance timers

### User Experience

**Resume Behavior:**
- Timer continues from remaining time (not full duration)
- Example: 30-second timer paused at 15 seconds → resumes with 15 seconds remaining

**Player Visibility:**
- Players see paused state with "PAUSED" indicator
- Timer countdown freezes at current value
- Progress bar stops animating

**Button States:**
- Not paused: Pause icon (⏸️)
- Paused: Play/Resume icon (▶️)

## Architecture

### Approach: Extend Timer Object with Pause Fields

**Rationale:**
- Clean extension of existing timer structure
- Minimal changes to existing components
- State persists naturally through PocketBase sync

**Rejected Alternatives:**
1. **Remove timer on pause**: More complex state management, breaks auto-advance naturally but requires separate storage
2. **UI-only pause**: Simpler but requires guard clauses throughout, timer still "running" in data

## Data Structure

### Timer Interface Extension

```typescript
timer?: {
  startedAt: string        // When timer started (existing)
  duration: number          // Total duration in seconds (existing)
  expiresAt: string        // When timer expires (existing)
  isEarlyAdvance?: boolean // Early-advance flag (existing)

  // New pause fields:
  isPaused?: boolean       // Whether timer is currently paused
  pausedAt?: string        // ISO timestamp when paused
  pausedRemaining?: number // Seconds remaining when paused
}
```

### Pause Logic

**When host clicks pause:**
1. Calculate remaining time: `remainingMs = expiresAt - now`
2. Convert to seconds: `remainingSeconds = Math.ceil(remainingMs / 1000)`
3. Update timer:
   ```typescript
   {
     ...timer,
     isPaused: true,
     pausedAt: new Date().toISOString(),
     pausedRemaining: remainingSeconds
   }
   ```
4. Sync via `updateGameDataClean()`

**When host clicks resume:**
1. Calculate new expiration: `expiresAt = now + (pausedRemaining * 1000)`
2. Update timer:
   ```typescript
   {
     ...timer,
     expiresAt: new Date(expiresAt).toISOString(),
     isPaused: false,
     pausedAt: undefined,
     pausedRemaining: undefined
   }
   ```
3. Sync via `updateGameDataClean()`

## Components

### 1. ControllerPage Modifications

**New Handler:**
```typescript
const handleTogglePause = useCallback(async () => {
  if (!gameData?.timer || !id) return

  if (gameData.timer.isPaused) {
    // Resume: calculate new expiresAt
    const remaining = gameData.timer.pausedRemaining || 0
    const timer = {
      ...gameData.timer,
      expiresAt: new Date(Date.now() + remaining * 1000).toISOString(),
      isPaused: false,
      pausedAt: undefined,
      pausedRemaining: undefined
    }
    await updateGameDataClean({ ...gameData, timer })
  } else {
    // Pause: calculate and store remaining time
    const now = Date.now()
    const expiresAt = new Date(gameData.timer.expiresAt).getTime()
    const remainingMs = Math.max(0, expiresAt - now)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    const timer = {
      ...gameData.timer,
      isPaused: true,
      pausedAt: new Date().toISOString(),
      pausedRemaining: remainingSeconds
    }
    await updateGameDataClean({ ...gameData, timer })
  }
}, [gameData, id, updateGameDataClean])
```

**Button Rendering (in header, before "Next" button):**
```typescript
{gameData?.timer && (
  <Button
    variant="outline"
    size="sm"
    onClick={handleTogglePause}
  >
    {gameData.timer.isPaused ? <Play /> : <Pause />}
  </Button>
)}
```

**Auto-Advance Guard Clause:**
- Add `|| gameData.timer.isPaused` to the guard clause:
  ```typescript
  if (!gameData?.timer || gameData.timer.isPaused) return
  ```

### 2. GameTimer Component Modifications

**Display Logic:**
- When `timer.isPaused === true`:
  - Show "PAUSED" badge/text near timer display
  - Display frozen `pausedRemaining` value instead of calculating from `expiresAt`
  - Stop progress bar animation (keep current percentage)
  - Consider yellow/warning color scheme for paused state

**Implementation approach:**
```typescript
const remainingSeconds = timer.isPaused
  ? timer.pausedRemaining
  : Math.ceil((new Date(timer.expiresAt).getTime() - Date.now()) / 1000)

const progressValue = timer.isPaused
  ? (timer.pausedRemaining! / timer.duration) * 100
  : /* existing calculation */
```

### 3. Early-Advance Subscription Interaction

**Guard Clause:**
- Don't create early-advance timer if current timer is paused:
  ```typescript
  if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
    // Create early-advance timer
  }
  ```

**Rationale:** If host paused for a reason (discussion, question, etc.), respect that intent. Don't auto-create early-advance timer while paused.

## Edge Cases

### 1. Manual Advance While Paused
**Scenario:** Host clicks "Next" button while timer is paused.
**Behavior:** Timer clears, game advances normally (same as manual advance on active timer).

### 2. Pause During Early-Advance Countdown
**Scenario:** Host pauses the 3-second early-advance timer.
**Behavior:** Works like any other timer - freezes countdown, shows "PAUSED", resumes from remaining time.

### 3. Multiple Rapid Pause/Resume Clicks
**Scenario:** Host rapidly clicks pause/resume button.
**Behavior:** `updateGameDataClean` is async, clicks are queued naturally. Last action wins.

### 4. Timer Expires While Pause Button Clicked
**Scenario:** Race condition - timer expires just as host clicks pause.
**Behavior:** If timer expires first, pause button disappears (timer no longer exists). If pause wins, timer pauses normally.

### 5. Page Refresh While Paused
**Scenario:** Host refreshes browser while timer is paused.
**Behavior:** Timer remains paused (state persisted in PocketBase). Pause button shows play icon on reload.

### 6. All Teams Answer While Paused
**Scenario:** Timer is paused, then all teams submit answers.
**Behavior:** Early-advance timer does NOT trigger (guard clause checks `isPaused`). Timer remains paused until host resumes.

### 7. Resume Then All Teams Answer
**Scenario:** Host resumes timer, then all teams answer before timeout.
**Behavior:** Early-advance CAN trigger (existing behavior preserved). Replaces resumed timer with 3-second countdown.

## Implementation Steps

1. **Extend timer interface** - Add `isPaused`, `pausedAt`, `pausedRemaining` fields
2. **Add handleTogglePause handler** - Implement pause/resume logic in ControllerPage
3. **Add pause button UI** - Render button in header when timer exists
4. **Update auto-advance guard** - Add `isPaused` check to prevent auto-advance
5. **Update early-advance guard** - Don't create early-advance timer when paused
6. **Modify GameTimer component** - Display paused state and frozen countdown
7. **Import icons** - Add Pause and Play icons from lucide-react
8. **Test edge cases** - Verify all edge case behaviors

## Testing Strategy

### Manual Testing Scenarios

1. **Basic pause/resume**: 30-second question timer → pause at 15 seconds → resume → verify continues from 15 seconds
2. **Pause early-advance**: All teams answer → 3-second countdown starts → pause → verify countdown freezes
3. **Pause prevents early-advance**: Pause question timer → all teams answer → verify early-advance doesn't trigger
4. **Resume enables early-advance**: Resume paused timer → all teams answer → verify early-advance triggers
5. **Manual advance while paused**: Pause timer → click Next → verify game advances normally
6. **Paused state visible to players**: Pause on controller → verify players see "PAUSED" indicator
7. **Page refresh while paused**: Pause timer → refresh browser → verify timer still paused
8. **Rapid pause/resume**: Rapidly click pause/resume → verify final state is correct

### Visual Testing

- Pause button appears when timer active
- Pause button shows correct icon (Pause vs Play)
- Paused indicator visible on both controller and player screens
- Progress bar stops animating when paused
- Timer text shows frozen value when paused

## Success Criteria

- ✅ Pause button appears when timer is active
- ✅ Pause freezes timer and syncs across all clients
- ✅ Resume continues from remaining time
- ✅ "PAUSED" indicator visible to players
- ✅ Auto-advance doesn't trigger while paused
- ✅ Early-advance doesn't trigger while paused
- ✅ Manual advance works during pause
- ✅ All timer types can be paused (including early-advance)
- ✅ Edge cases handled gracefully

## Future Enhancements

- Keyboard shortcut for pause/resume (spacebar?)
- Pause timer automatically when host opens a modal/dialog
- Show pause history in game logs
- Allow configuring whether early-advance is allowed during resumed timers
