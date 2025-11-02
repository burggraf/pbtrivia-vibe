# Host Rejoin State Restoration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow hosts to resume in-progress games at the exact point they left off (current round, question, and all game state) when clicking "Play" button.

**Architecture:** Minimal HostPage change approach - HostPage checks if games.data exists before initializing, ControllerPage manages status lifecycle transitions ('ready' → 'in-progress' → 'completed').

**Tech Stack:** React, TypeScript, PocketBase, React Router

**Design Document:** `docs/plans/2025-11-02-game-state-restoration-design.md`

---

## Task 1: Modify HostPage to Conditionally Initialize Game Data

**Files:**
- Modify: `src/pages/HostPage.tsx:330-354` (handlePlayGame function)

**Step 1: Read current HostPage.handlePlayGame implementation**

Read: `src/pages/HostPage.tsx:330-354`

Understand current logic:
- Updates game status to 'ready' if in 'setup'
- Always overwrites games.data with `{ state: 'game-start' }`
- Navigates to `/controller/{gameId}`

**Step 2: Modify handlePlayGame to check for existing games.data**

Update the function to only initialize games.data if it doesn't exist:

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

**Step 3: Verify changes compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit HostPage changes**

```bash
git add src/pages/HostPage.tsx
git commit -m "feat: preserve existing game state when host rejoins

Only initialize games.data to game-start if it doesn't exist.
If data exists, skip initialization to allow state restoration.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Status Management to ControllerPage fetchGameData

**Files:**
- Modify: `src/pages/ControllerPage.tsx:172-199` (fetchGameData function)

**Step 1: Read current ControllerPage.fetchGameData implementation**

Read: `src/pages/ControllerPage.tsx:172-199`

Understand current logic:
- Fetches game data
- Fetches rounds sorted by sequence
- Parses games.data if exists
- No status updates

**Step 2: Add status update to 'in-progress' in fetchGameData**

Add status update after loading game data, before parsing games.data:

```typescript
const fetchGameData = async () => {
  if (!id) return

  try {
    // Get game with scoreboard
    const gameData = await gamesService.getGame(id)
    setGame(gameData)

    // Get all rounds sorted by sequence
    const roundsData = await roundsService.getRounds(id)
    setRounds(roundsData.sort((a, b) => a.sequence_number - b.sequence_number))

    // NEW: Update status to 'in-progress' when host enters ControllerPage
    if (gameData.status === 'ready') {
      await gamesService.updateGame(id, { status: 'in-progress' })
    }

    // Parse gameData.data if it exists
    if (gameData.data) {
      try {
        const parsedData = typeof gameData.data === 'string'
          ? JSON.parse(gameData.data)
          : gameData.data
        setGameData(parsedData)
      } catch (error) {
        console.error('Failed to parse game data:', error)
        setGameData(null)
      }
    }
  } catch (error) {
    console.error('Failed to fetch game data:', error)
  } finally {
    setIsLoading(false)
  }
}
```

**Step 3: Verify changes compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit fetchGameData changes**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: update game status to in-progress on controller mount

When host enters ControllerPage, automatically transition
game status from 'ready' to 'in-progress' to reflect active gameplay.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Status Management to ControllerPage handleNextState

**Files:**
- Modify: `src/pages/ControllerPage.tsx:532-534` (handleNextState 'return-to-lobby' case)

**Step 1: Read current handleNextState 'return-to-lobby' case**

Read: `src/pages/ControllerPage.tsx:526-536`

Current logic:
```typescript
case 'return-to-lobby': {
  navigate('/host')
  return
}
```

**Step 2: Add status update to 'completed' before navigation**

Update the case to mark game as completed:

```typescript
case 'return-to-lobby': {
  // Mark game as completed before returning to lobby
  await gamesService.updateGame(id!, { status: 'completed' })
  navigate('/host')
  return
}
```

**Step 3: Verify changes compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit handleNextState changes**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: update game status to completed when returning to lobby

When host completes game and returns to lobby, mark game
status as 'completed' to reflect finished state.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Manual Testing and Verification

**Step 1: Start development environment**

Run: `./dev.sh`
Expected: PocketBase + frontend running on port 5173

**Step 2: Test Scenario 1 - New Game (No Existing Data)**

1. Navigate to http://localhost:5173/host
2. Create new game, add rounds
3. Click "Play" button
4. Verify in browser console: "🆕 Initializing new game state"
5. Verify game starts at 'game-start' state
6. Check PocketBase admin: game status = 'in-progress'

**Step 3: Test Scenario 2 - Resume at Round Start**

1. From Scenario 1, advance to Round 2 start screen
2. Copy game URL from browser
3. Navigate back to /host (don't click Return to Lobby)
4. Click "Play" on the same game
5. Verify in browser console: "▶️ Resuming existing game state"
6. Verify game shows Round 2 start screen (not game-start)
7. Check PocketBase admin: games.data contains round.round_number = 2

**Step 4: Test Scenario 3 - Resume During Question**

1. Start fresh game, advance to Round 1, Question 3
2. DO NOT reveal answer yet
3. Navigate back to /host
4. Click "Play"
5. Verify game shows Round 1, Question 3 (unrevealed)
6. Click "Reveal Answer"
7. Verify answer displays correctly

**Step 5: Test Scenario 4 - Resume with Answer Revealed**

1. Start fresh game, advance to Round 1, Question 2
2. Click "Reveal Answer"
3. Navigate back to /host
4. Click "Play"
5. Verify game shows Round 1, Question 2 with answer revealed
6. Verify correct answer is highlighted
7. Click "Next" to advance to Question 3

**Step 6: Test Scenario 5 - Resume at Round End**

1. Start fresh game, complete all questions in Round 1
2. Verify round end screen displays
3. Navigate back to /host
4. Click "Play"
5. Verify round end screen still displays
6. Click "Next Round" to advance to Round 2

**Step 7: Test Scenario 6 - Resume at Game End**

1. Start fresh game, complete all rounds
2. Verify game end screen with final scoreboard
3. Navigate back to /host
4. Click "Play"
5. Verify game end screen displays
6. Click through to "Return to Lobby"
7. Check PocketBase admin: game status = 'completed'

**Step 8: Test Scenario 7 - Completed Game Lifecycle**

1. From Scenario 6 completed game
2. Click "Play" again on same game
3. Verify game initializes fresh (since status = 'completed')
4. Verify new game state starts at 'game-start'

**Step 9: Test Edge Case - Empty games.data**

1. Use PocketBase admin to manually clear games.data for a game
2. Set status back to 'ready'
3. Click "Play" on that game
4. Verify game initializes to 'game-start' (empty data detected)

**Step 10: Document test results**

Create: `docs/testing/2025-11-02-state-restoration-test-results.md`

Document:
- All 7 scenarios tested
- Pass/fail status for each
- Any bugs or unexpected behavior found
- Screenshots if relevant

---

## Task 5: Final Build and Lint Check

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no new errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No NEW warnings beyond baseline (62 pre-existing warnings acceptable)

**Step 3: Commit test results (if created)**

```bash
git add docs/testing/2025-11-02-state-restoration-test-results.md
git commit -m "docs: add manual test results for state restoration

Documents successful testing of all 7 scenarios including
new games, mid-round resumes, and completed game handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary

**Total Tasks:** 5
**Estimated Time:** 20-30 minutes
**Files Modified:** 2
- `src/pages/HostPage.tsx`
- `src/pages/ControllerPage.tsx`

**Key Changes:**
1. HostPage: Conditional games.data initialization
2. ControllerPage: Status lifecycle management ('ready' → 'in-progress' → 'completed')
3. No changes needed to state restoration logic (already works!)

**Success Criteria:**
- Hosts can resume games at exact state they left off
- Status field accurately reflects game lifecycle
- All 7 test scenarios pass
- No new lint warnings or TypeScript errors
- Build succeeds

---

## Rollback Plan

If issues arise, revert commits in reverse order:
1. Revert Task 3 commit (handleNextState)
2. Revert Task 2 commit (fetchGameData)
3. Revert Task 1 commit (HostPage)

Original behavior restored: games always restart from beginning.
