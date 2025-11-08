# Timer Auto-Advance Design

**Date:** 2025-11-08
**Status:** Approved
**Author:** Claude Code

## Overview

Implement automatic game state progression based on timer configuration. When a game state has a timer configured in `games.metadata`, the game will automatically advance to the next state when the timer expires. Both host (controller) and players will see a countdown timer with progress bar.

## Requirements

### Functional Requirements

1. **Timer Configuration**: Use existing timer values from `games.metadata` (already implemented in timer configuration feature)
2. **Auto-Advance**: Automatically progress game state when timer expires
3. **Visual Feedback**: Display countdown timer and progress bar on both controller and player screens
4. **Manual Override**: Host can manually advance before timer expires
5. **State Synchronization**: All clients show synchronized countdown based on authoritative timestamp

### Timer State Mapping

| Game State | Timer Field | Description |
|------------|-------------|-------------|
| `game-start` | `metadata.game_start_timer` | Time before game begins |
| `round-start` | `metadata.round_start_timer` | Time showing round info before questions |
| `round-play` (before reveal) | `metadata.question_timer` | Time to answer question |
| `round-play` (after reveal) | `metadata.answer_timer` | Time showing correct answer |
| `round-end` | None | No timer (scoreboard) |
| `game-end` | `metadata.game_end_timer` | Time showing final scores |
| `thanks` | `metadata.thanks_timer` | Time showing thank you screen |

### User Experience Requirements

- Progress bar fixed to bottom of viewport (always visible)
- Text showing "X seconds" countdown
- Smooth countdown updates (100ms intervals)
- Mobile-responsive design
- Dark mode support
- Timer cancels when host clicks Next/Reveal
- New state gets fresh timer (if configured)

## Architecture

### Approach: Host-Driven with Client UI Sync

**Rationale:**
- No backend changes required (migrations, cron jobs)
- Leverages existing PocketBase real-time subscriptions
- Simple implementation using existing game state machine
- Trade-off: Requires host to stay connected

**Rejected Alternatives:**
1. **Server-side orchestration**: Too complex, requires backend timer infrastructure
2. **Distributed leader election**: Potential race conditions, unnecessary complexity

## Data Model

### Timer State Extension

Extend existing `game.data` JSON structure with timer information:

```typescript
interface GameData {
  state: GameState;
  round?: RoundData;
  question?: QuestionData;
  timer?: {
    startedAt: string;    // ISO timestamp when timer started
    duration: number;     // seconds for this state (from metadata)
    expiresAt: string;    // calculated expiration time
  };
}
```

**Example:**
```json
{
  "state": "round-play",
  "round": {...},
  "question": {...},
  "timer": {
    "startedAt": "2025-11-08T14:30:00.000Z",
    "duration": 40,
    "expiresAt": "2025-11-08T14:30:40.000Z"
  }
}
```

### Timer Lifecycle

1. **Creation**: When state transitions, check if metadata has timer for new state
2. **Storage**: If timer exists (not null/0), create timer object and save to `game.data`
3. **Sync**: PocketBase broadcasts update to all subscribed clients
4. **Calculation**: Clients compute remaining time by comparing current time to `expiresAt`
5. **Expiration**: Controller checks timer and auto-advances when expired
6. **Cancellation**: Manual advance clears current timer, new state gets own timer

## Components

### 1. Timer Logic (ControllerPage.tsx)

**Timer Creation:**
- Modify `updateGameDataClean` or state transition logic
- Check `game.metadata` for timer value based on new state
- If timer configured, create timer object with current timestamp
- Calculate `expiresAt = startedAt + duration`

**Auto-Advance Effect:**
```typescript
useEffect(() => {
  if (!gameData?.timer || !id) return;

  const checkTimer = setInterval(() => {
    const now = new Date().getTime();
    const expiresAt = new Date(gameData.timer.expiresAt).getTime();

    if (now >= expiresAt) {
      // Timer expired - auto-advance
      handleNextState();
    }
  }, 100);

  return () => clearInterval(checkTimer);
}, [gameData?.timer, id]);
```

**Edge Cases:**
- If host disconnects, timer stops (no advance until reconnect)
- Multiple controller tabs: First to expire wins (acceptable race)
- Timer cleared on state change before new timer creation

### 2. GameTimer Component (New)

**Location:** `src/components/games/GameTimer.tsx`

**Props:**
```typescript
interface GameTimerProps {
  timer: {
    startedAt: string;
    duration: number;
    expiresAt: string;
  };
}
```

**Rendering:**
- Fixed position: `fixed bottom-0 left-0 right-0 z-50`
- Background: `bg-white dark:bg-slate-800` with border
- Padding: Mobile-responsive padding
- Text: Centered, shows "X seconds" (singular when 1)
- Progress: shadcn/ui Progress component
- Progress value: `(remainingSeconds / duration) * 100`
- Update interval: 100ms

**Visual Layout:**
```
┌─────────────────────────────────────┐
│         30 seconds                  │  ← Text (text-center)
│ ████████████████░░░░░░░░░░░░░░░░   │  ← Progress bar
└─────────────────────────────────────┘
```

**Time Calculation:**
```typescript
const [remainingSeconds, setRemainingSeconds] = useState(0);

useEffect(() => {
  const updateTimer = setInterval(() => {
    const now = Date.now();
    const expiresAt = new Date(timer.expiresAt).getTime();
    const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    setRemainingSeconds(remaining);
  }, 100);

  return () => clearInterval(updateTimer);
}, [timer]);
```

### 3. Integration Points

**ControllerPage.tsx:**
- Import and render `<GameTimer />` when `gameData.timer` exists
- Position after main content, before closing div
- Auto-advance effect as described above

**GamePage.tsx:**
- Import and render `<GameTimer />` when `gameData.timer` exists
- Same positioning as controller
- No auto-advance logic (read-only client)

## Implementation Steps

1. **Create GameTimer component**
   - Build UI with shadcn/ui Progress
   - Implement time calculation logic
   - Add dark mode support
   - Test with mock timer data

2. **Add timer creation logic**
   - Modify state transition code (ControllerPage)
   - Map game states to metadata timer fields
   - Create timer object with timestamps
   - Handle special case: round-play has two timers (question/answer)

3. **Implement auto-advance**
   - Add useEffect in ControllerPage
   - Check timer expiration every 100ms
   - Call handleNextState when expired
   - Clean up interval on unmount

4. **Integrate GameTimer into pages**
   - Add to ControllerPage when timer exists
   - Add to GamePage when timer exists
   - Test with real game flow

5. **Handle edge cases**
   - Manual advance cancels timer
   - New state gets fresh timer
   - Player reconnection syncs to current time
   - No timer when metadata value is null/0

## Testing Strategy

### Manual Testing Scenarios

1. **Basic timer flow**: Create game with timers, verify auto-advance works
2. **Manual override**: Click Next before timer expires, verify cancellation
3. **Multi-client sync**: Open controller + game page, verify synchronized countdown
4. **Reconnection**: Disconnect player, wait, reconnect - verify time syncs
5. **Mixed timers**: Some states with timers, some without
6. **Zero/null timers**: Verify no timer shows, no auto-advance
7. **State transitions**: Verify timer clears and new timer starts correctly
8. **Mobile responsive**: Test on mobile viewport
9. **Dark mode**: Verify timer displays correctly in dark mode

### Edge Cases to Verify

- Host loses connection during countdown (timer stops)
- Multiple controller tabs open (race condition acceptable)
- Very short timers (1-2 seconds)
- Very long timers (minutes)
- Timer expiring during state transition
- Player joins mid-timer

## Success Criteria

- ✅ Game auto-advances when timer expires
- ✅ Countdown displays on both controller and game pages
- ✅ Progress bar shows visual time remaining (100% → 0%)
- ✅ Text shows seconds remaining
- ✅ Manual advance cancels timer
- ✅ New states get fresh timers
- ✅ Fixed position at viewport bottom
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ Smooth countdown updates

## Future Enhancements

- Sound/notification when timer about to expire
- Pause/resume timer functionality
- Server-side timer enforcement (resilient to host disconnect)
- Timer adjustment during gameplay
- Visual indicator of auto-advance vs manual advance in logs
