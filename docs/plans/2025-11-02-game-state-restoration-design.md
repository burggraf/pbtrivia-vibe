# Game State Restoration Design

**Date:** 2025-11-02
**Status:** Approved
**Approach:** Minimal HostPage Change

## Problem Statement

When a host clicks "Play" to rejoin an in-progress game, the game restarts from the beginning instead of resuming at the current round/question. This happens because HostPage unconditionally overwrites `games.data` with `{ state: 'game-start' }`, destroying the saved game state.

## Current Behavior (Bug)

**File:** `src/pages/HostPage.tsx:343-346`

```typescript
// ❌ Always overwrites existing state
await pb.collection('games').update(gameId, {
  data: { state: 'game-start' }
})
```

When host clicks "Play":
1. HostPage sets `games.data = { state: 'game-start' }`
2. Navigates to `/controller/{gameId}`
3. ControllerPage loads the overwritten data
4. Game starts from beginning, losing all progress

## Requirements

- **Resume Behavior:** Always auto-resume when `games.data` exists
- **Status Tracking:** Use existing status field ('ready', 'in-progress', 'completed')
- **State Coverage:** Resume at ANY game state seamlessly (game-start, round-start, round-play, round-end, game-end, thanks, return-to-lobby)
- **Data Validation:** Trust `games.data` - no validation needed

## Design Decisions

### Architectural Approach: Minimal HostPage Change

HostPage checks if `games.data` exists:
- **If yes:** Skip initialization, just navigate
- **If no:** Initialize to `{ state: 'game-start' }`

Status updated by ControllerPage on mount/unmount.

**Why This Approach:**
- Simplest change with minimal code modification
- Leverages existing ControllerPage state restoration (already works!)
- Clear ownership: HostPage handles navigation, ControllerPage handles game state
- Low risk of introducing bugs

### Alternative Approaches Considered

1. **Service-Based Lifecycle:** Create `gamesService.startOrResumeGame(id)` - More centralized but unnecessary complexity
2. **ControllerPage Ownership:** Remove init from HostPage entirely - Makes ControllerPage more complex

## Implementation Design

### 1. HostPage: Conditional Initialization

**File:** `src/pages/HostPage.tsx:330-354`

**Changes:**
- Check if `game.data` exists and has content before initializing
- Only set `data: { state: 'game-start' }` if data is missing/empty
- Add logging to distinguish new game vs resume

```typescript
const handlePlayGame = async (gameId: string) => {
  try {
    console.log('🎮 Starting/Resuming game:', gameId)

    const game = games.find(g => g.id === gameId)

    // Update status to 'ready' if in 'setup'
    if (game?.status === 'setup') {
      await gamesService.updateGame(gameId, { status: 'ready' })
    }

    // NEW: Only initialize data if it doesn't exist
    const shouldInitialize = !game?.data ||
                             (typeof game.data === 'string' && game.data === '') ||
                             (typeof game.data === 'object' && Object.keys(game.data).length === 0)

    if (shouldInitialize) {
      console.log('🆕 Initializing new game state')
      await pb.collection('games').update(gameId, {
        data: { state: 'game-start' }
      })
    } else {
      console.log('▶️  Resuming existing game state')
      // Don't touch games.data - let ControllerPage load it
    }

    // Navigate to controller
    navigate(`/controller/${gameId}`)
  } catch (error) {
    console.error('❌ Failed to start game:', error)
  }
}
```

### 2. ControllerPage: Status Lifecycle Management

**Files:**
- `src/pages/ControllerPage.tsx:172-199` (fetchGameData)
- `src/pages/ControllerPage.tsx:532-534` (handleNextState return-to-lobby case)

**Changes:**
- Update `games.status` to `'in-progress'` when ControllerPage mounts
- Update `games.status` to `'completed'` when host clicks "Return to Lobby"

```typescript
// In fetchGameData (after fetching game data)
if (gameData.status === 'ready') {
  await gamesService.updateGame(id, { status: 'in-progress' })
}

// In handleNextState at 'return-to-lobby' case
case 'return-to-lobby': {
  await gamesService.updateGame(id!, { status: 'completed' })
  navigate('/host')
  return
}
```

**Status Lifecycle:**
1. `'setup'` → Game created, rounds being added (HostPage)
2. `'ready'` → Rounds exist, ready to play (HostPage.handlePlayGame)
3. `'in-progress'` → Host entered ControllerPage (ControllerPage.fetchGameData)
4. `'completed'` → Host finished and returned to lobby (ControllerPage.handleNextState)

### 3. ControllerPage: State Restoration (No Changes Needed)

**File:** `src/pages/ControllerPage.tsx:172-199`

**Verification:** The existing code already handles restoration perfectly!

```typescript
const fetchGameData = async () => {
  // Fetches game + rounds
  const gameData = await gamesService.getGame(id)
  setGame(gameData)

  const roundsData = await roundsService.getRounds(id)
  setRounds(roundsData.sort((a, b) => a.sequence_number - b.sequence_number))

  // ✅ Automatically restores state from games.data
  if (gameData.data) {
    const parsedData = typeof gameData.data === 'string'
      ? JSON.parse(gameData.data)
      : gameData.data
    setGameData(parsedData)
  }
}
```

**Why It Works:**
- GameStateDisplay component (line 786-790) reads from `gameData` state
- State machine UI renders based on `gameData.state`
- Round info displays from `gameData.round`
- Question content displays from `gameData.question`
- Scoreboard rebuilds from `game.scoreboard` and real-time subscriptions

**What Restores Automatically:**
- Current game state (game-start, round-play, etc.)
- Round number and round metadata (title, categories, question count)
- Question number and question content (text, answers, difficulty)
- Correct answer (if already revealed)
- Scoreboard (rebuilt from database)

## State Data Structure

All game state persists in `games.data` (JSON string in database):

```typescript
interface GameData {
  state: 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'
  round?: {
    round_number: number      // sequence_number from rounds table
    rounds: number            // total rounds count
    question_count: number    // questions in this round
    title: string
    categories: string[]
  }
  question?: {
    id: string                // game_questions record ID
    question_number: number   // 1-based position in round
    category: string
    question: string
    difficulty: string
    a: string                 // shuffled answers
    b: string
    c: string
    d: string
    correct_answer?: string   // 'A'|'B'|'C'|'D' (if revealed)
  }
}
```

## Testing Strategy

### Manual Testing Scenarios

1. **New Game (No Existing Data)**
   - Create game, add rounds
   - Click "Play"
   - Expected: Game starts at 'game-start', status → 'in-progress'

2. **Resume at Round Start**
   - Start game, advance to round 2 start screen
   - Close browser/tab
   - Navigate back to /host, click "Play"
   - Expected: Resumes at round 2 start screen

3. **Resume During Question**
   - Start game, advance to round 1, question 3
   - Close browser/tab
   - Navigate back to /host, click "Play"
   - Expected: Shows round 1, question 3 (unrevealed or revealed state preserved)

4. **Resume at Round End**
   - Complete all questions in round 1, show round end screen
   - Close browser/tab
   - Navigate back to /host, click "Play"
   - Expected: Shows round 1 end screen with "Next Round" button

5. **Resume at Game End**
   - Complete all rounds, reach game end screen
   - Close browser/tab
   - Navigate back to /host, click "Play"
   - Expected: Shows final scoreboard with "Thanks" button

6. **Complete Game Lifecycle**
   - Play through entire game to "Return to Lobby"
   - Check status → should be 'completed'
   - Click "Play" again
   - Expected: Restarts at 'game-start' (status was 'completed', no data preserved intentionally)

### Edge Cases

- **Empty games.data:** Should initialize to 'game-start'
- **Corrupted JSON:** Caught by try/catch in fetchGameData (line 193-196)
- **Status transitions:** Verify status updates correctly through lifecycle
- **Multiple browser tabs:** Real-time subscriptions keep both tabs in sync

## Files Modified

1. `src/pages/HostPage.tsx` - handlePlayGame function (lines 330-354)
2. `src/pages/ControllerPage.tsx` - fetchGameData function (lines 172-199)
3. `src/pages/ControllerPage.tsx` - handleNextState function (lines 532-534)

## Rollback Plan

If issues arise:
1. Revert HostPage changes → Always initialize to 'game-start' (original behavior)
2. Games will restart but functionality remains intact
3. No database migrations needed - only code changes

## Future Enhancements

- Add "Resume" badge in HostPage UI when `games.data` exists
- Add confirmation dialog: "Resume where you left off?" with option to restart
- Track resume events in analytics/logging
- Add admin UI to view/reset game state for debugging
