# Early Advance Notification Design

**Date:** 2025-11-11
**Status:** Approved
**Author:** Claude Code

## Overview

Refine the early-advance behavior to show a non-intrusive notification instead of a timer bar when all teams answer, and skip the 3-second delay when time is already running out.

## Requirements

### Functional Requirements

1. **Time-Aware Early Advance**: Only trigger 3-second delay if >3 seconds remain on question timer
2. **Natural Expiration**: If ≤3 seconds remain, let question timer expire naturally (no delay, no notification)
3. **Notification Display**: Replace timer bar with popover notification saying "All teams have answered."
4. **Positioning**: Display notification near timer area (bottom center, above normal timer position)
5. **Animation**: Fade in/out transition for notification
6. **Multi-Location**: Apply consistently across /controller, /game pages, and trivia-party-display app

### User Experience

**When >3 seconds remain:**
- All teams answer → Notification appears near bottom center
- "All teams have answered." message with fade-in animation
- Notification stays visible for 3 seconds
- Auto-advance to answer reveal after 3 seconds

**When ≤3 seconds remain:**
- All teams answer → No notification, no timer change
- Existing question timer continues counting down
- Auto-advance happens when original timer expires

## Architecture

### Approach: Conditional GameTimer Rendering

**Rationale:**
- Minimal changes to existing timer infrastructure
- GameTimer already receives timer object via props
- Simple conditional rendering based on new flag
- Clean coordination across multiple locations

**Rejected Alternatives:**
1. **Enhanced timer with display mode**: Extra complexity with mode field
2. **Separate notification component**: More components to coordinate across 3 locations

## Components

### 1. Early Advance Logic (ControllerPage.tsx)

**Location:** `src/pages/ControllerPage.tsx` line ~316

**Current Behavior:**
```typescript
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  if (hasTimersConfigured) {
    // Create 3-second early-advance timer
    const timer = {
      startedAt: new Date().toISOString(),
      duration: 3,
      expiresAt: new Date(Date.now() + 3000).toISOString(),
      isEarlyAdvance: true
    }
    await updateGameDataClean({ ...gameData, timer })
  }
}
```

**New Behavior:**
```typescript
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  if (hasTimersConfigured) {
    // Check remaining time on question timer
    const questionTimerExpiresAt = gameData.timer?.expiresAt
    const remainingMs = questionTimerExpiresAt
      ? new Date(questionTimerExpiresAt).getTime() - Date.now()
      : Infinity

    // Only trigger 3-second early advance if >3 seconds remain
    if (remainingMs > 3000) {
      console.log('🎉 All teams answered! Triggering notification for 3 seconds')

      // Create 3-second early-advance timer WITH notification flag
      const timer = {
        startedAt: new Date().toISOString(),
        duration: 3,
        expiresAt: new Date(Date.now() + 3000).toISOString(),
        isEarlyAdvance: true,
        showAsNotification: true  // NEW: tells GameTimer to show popover
      }

      await updateGameDataClean({ ...gameData, timer })
    } else {
      // Let existing question timer expire naturally
      console.log('👥 All teams answered with ≤3s remaining, letting timer expire naturally')
    }
  }
}
```

**Key Changes:**
- Calculate remaining milliseconds on question timer
- Only create early-advance timer if `remainingMs > 3000`
- Add `showAsNotification: true` flag to timer object
- If ≤3 seconds, do nothing (existing timer continues)

### 2. Timer Interface Extension

**Locations:**
- `src/pages/ControllerPage.tsx` (GameData interface)
- `src/components/games/GameTimer.tsx` (GameTimerProps interface)
- `trivia-party-display/src/components/GameTimer.tsx` (GameTimerProps interface)

**Add New Optional Field:**
```typescript
timer?: {
  startedAt: string
  duration: number
  expiresAt: string
  isEarlyAdvance?: boolean
  isPaused?: boolean
  pausedAt?: string
  pausedRemaining?: number
  showAsNotification?: boolean  // NEW
}
```

### 3. GameTimer Component Updates

**Locations:**
- `src/components/games/GameTimer.tsx`
- `trivia-party-display/src/components/GameTimer.tsx`

**Changes:**

```typescript
export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  // ... existing timer calculation logic remains unchanged ...

  // Render notification popover for early-advance
  if (timer.showAsNotification) {
    return (
      <div
        className="
          fixed bottom-20 left-1/2 -translate-x-1/2 z-50
          bg-blue-500 dark:bg-blue-600 text-white
          px-6 py-3 rounded-lg shadow-lg
          transition-opacity duration-300 opacity-100
        "
      >
        <div className="text-center font-medium">
          All teams have answered.
        </div>
      </div>
    )
  }

  // Standard timer bar (existing code unchanged)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
          {timer.isPaused && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              PAUSED
            </span>
          )}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
```

**Notification Styling:**
- **Position**: Fixed bottom with offset (`bottom-20`), horizontally centered
- **Appearance**: Blue background, white text, rounded corners, shadow
- **Animation**: CSS transition on opacity (fade in on mount)
- **Z-index**: `z-50` (same as timer bar, won't conflict since they don't coexist)

## Data Flow

### When >3 Seconds Remain

1. **Player submits final answer** → `game_answers` record created
2. **Subscription fires** in ControllerPage → Calculate remaining time on question timer
3. **remainingMs > 3000** → Create early-advance timer with `showAsNotification: true`
4. **Update game.data** via PocketBase → All clients receive update
5. **GameTimer renders** notification popover (not timer bar)
6. **Auto-advance effect** detects timer expiration after 3 seconds → Calls `handleNextState()`
7. **Answer revealed** → Timer object removed from gameData → Notification unmounts

### When ≤3 Seconds Remain

1. **Player submits final answer** → `game_answers` record created
2. **Subscription fires** in ControllerPage → Calculate remaining time
3. **remainingMs ≤ 3000** → No action taken (log message only)
4. **Question timer continues** counting down normally
5. **Auto-advance effect** detects timer expiration → Calls `handleNextState()`
6. **Answer revealed** normally

## Multi-Location Coordination

### Three Locations Affected

1. **ControllerPage** (`src/pages/ControllerPage.tsx`):
   - Creates timers (active role)
   - Needs: Remaining time check + `showAsNotification` flag

2. **GamePage** (`src/pages/GamePage.tsx`):
   - Displays timers (passive role)
   - Uses: `<GameTimer timer={gameData.timer} />`
   - Receives updates via PocketBase subscription
   - No changes needed

3. **Display App GameDisplay** (`trivia-party-display/src/components/GameDisplay.tsx`):
   - Displays timers (passive role)
   - Uses: `<GameTimer timer={gameData.timer} />`
   - Receives updates via PocketBase subscription
   - No changes needed

**Key Insight:** Only ControllerPage creates timers. GamePage and Display app passively receive timer updates through PocketBase realtime subscriptions. This means:
- Only ControllerPage early-advance logic needs updating
- Both GameTimer components need UI changes
- TypeScript interfaces need updating in both codebases
- No coordination logic needed (PocketBase handles distribution)

## Edge Cases

### 1. Timer Paused When All Teams Answer

**Scenario:** All teams answer while question timer is paused.

**Behavior:** Early advance doesn't trigger (existing check: `!gameData.timer?.isPaused`).

**Rationale:** Paused state should prevent automatic transitions.

### 2. No Question Timer Active

**Scenario:** All teams answer but no question timer was started (manual mode).

**Calculation:** `remainingMs = Infinity` (no expiresAt)

**Behavior:** `Infinity > 3000` → Show 3-second notification

**Rationale:** If there's no time pressure, notification is appropriate.

### 3. Exactly 3 Seconds Remaining

**Scenario:** All teams answer with exactly 3000ms remaining.

**Behavior:** `3000 > 3000` → false → Let timer expire naturally

**Rationale:** Clean boundary, avoids confusion with overlapping timers.

### 4. Team Removes Answer During Notification

**Scenario:** Team changes answer during 3-second notification countdown.

**Behavior:** Notification continues (timer already has `isEarlyAdvance` flag).

**Rationale:** Simple, predictable behavior. Same as current implementation.

### 5. Host Manual Advance During Notification

**Scenario:** Host clicks "Reveal Answer" while notification showing.

**Behavior:** Manual advance immediately reveals answer and removes timer.

**Rationale:** Manual override always wins (existing behavior).

## Implementation Steps

1. **Update timer interfaces** - Add `showAsNotification?: boolean` field
   - `src/pages/ControllerPage.tsx` (GameData interface)
   - `src/components/games/GameTimer.tsx` (GameTimerProps interface)
   - `trivia-party-display/src/components/GameTimer.tsx` (GameTimerProps interface)

2. **Modify early-advance logic** - Add remaining time check in ControllerPage
   - Calculate `remainingMs` from question timer
   - Only create timer if `remainingMs > 3000`
   - Add `showAsNotification: true` flag

3. **Update GameTimer components** - Add conditional notification rendering
   - Main app: `src/components/games/GameTimer.tsx`
   - Display app: `trivia-party-display/src/components/GameTimer.tsx`
   - Check `timer.showAsNotification` flag
   - Render popover instead of timer bar

4. **Test across all locations** - Verify behavior in all three contexts
   - Controller page (host view)
   - Game page (player view)
   - Display app (presentation view)

## Testing Strategy

### Manual Testing Scenarios

1. **Basic notification** (>3s remaining):
   - Start question with 10-second timer
   - All teams answer quickly
   - Verify notification appears (not timer bar)
   - Verify auto-advance after 3 seconds

2. **Natural expiration** (≤3s remaining):
   - Start question with 10-second timer
   - Wait 7+ seconds
   - All teams answer
   - Verify no notification
   - Verify timer continues to zero
   - Verify auto-advance when original timer expires

3. **Boundary test** (exactly 3s):
   - Start question with 10-second timer
   - Wait exactly 7 seconds
   - All teams answer
   - Verify natural expiration (no notification)

4. **No timer active**:
   - Start question without timer (manual mode)
   - All teams answer
   - Verify notification appears
   - Verify auto-advance after 3 seconds

5. **Paused timer**:
   - Start question with timer
   - Pause timer
   - All teams answer
   - Verify no notification (pause prevents early advance)

6. **Manual override**:
   - All teams answer, notification showing
   - Host clicks "Reveal Answer"
   - Verify immediate reveal

7. **Multi-location consistency**:
   - Test scenario 1 and 2 while viewing:
     - Controller page (/controller)
     - Player page (/game)
     - Display app (trivia-party-display)
   - Verify all show same behavior

## Success Criteria

- ✅ Early advance skipped when ≤3 seconds remain on question timer
- ✅ Notification appears instead of timer bar when >3 seconds remain
- ✅ Notification displays "All teams have answered." with fade animation
- ✅ Notification positioned near timer area (bottom center)
- ✅ Behavior consistent across /controller, /game, and display app
- ✅ Edge cases handled gracefully (paused, manual override, boundary conditions)

## Future Enhancements

- Configurable notification duration (currently hardcoded to 3 seconds)
- Configurable notification threshold (currently hardcoded to 3 seconds remaining)
- Customizable notification message
- Sound/haptic feedback when notification appears
