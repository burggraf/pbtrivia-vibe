# Rejoin In-Progress Games Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow registered players to rejoin games that are already in-progress while blocking unregistered players.

**Architecture:** Update the games service to fetch games with broader status filter ("ready" OR "in-progress"), then add validation in LobbyPage to block unregistered players from joining in-progress games.

**Tech Stack:** React 18, TypeScript, PocketBase, Playwright for E2E testing

**Design Document:** See `docs/plans/2025-11-02-rejoin-in-progress-games-design.md`

---

## Task 1: Update Games Service to Allow In-Progress Game Lookup

**Files:**
- Modify: `src/lib/games.ts:103-118` (findGameByCode method)
- Test: `tests/e2e/rejoin-in-progress.spec.ts` (create new)

### Step 1: Write the failing E2E test

Create new test file to verify the full rejoin flow:

```typescript
// tests/e2e/rejoin-in-progress.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Rejoin In-Progress Games', () => {
  test('registered player can rejoin in-progress game', async ({ page, context }) => {
    // Setup: Create host and start game
    const hostPage = await context.newPage();
    await hostPage.goto('http://localhost:5173/');

    // Host login
    await hostPage.fill('input[type="email"]', 'host@example.com');
    await hostPage.fill('input[type="password"]', 'password123');
    await hostPage.click('button:has-text("Login")');
    await hostPage.waitForURL('**/host');

    // Create and start game
    await hostPage.click('button:has-text("New Game")');
    await hostPage.fill('input[placeholder="Game Name"]', 'Test Rejoin Game');
    await hostPage.click('button:has-text("Create")');

    // Get game code
    const gameCodeElement = await hostPage.locator('[data-testid="game-code"]');
    const gameCode = await gameCodeElement.textContent();

    // Mark game as ready
    await hostPage.click('button:has-text("Ready")');

    // Player joins game
    await page.goto('http://localhost:5173/');
    await page.fill('input[type="email"]', 'player@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/lobby');

    await page.fill('input[placeholder="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Select team
    await page.click('button:has-text("Team A")');
    await page.waitForURL(`**/game/${gameCode}`);

    // Host starts game (changes status to "in-progress")
    await hostPage.click('button:has-text("Start Game")');

    // Player disconnects (simulated by going back to lobby)
    await page.goto('http://localhost:5173/lobby');

    // Player tries to rejoin - should succeed
    await page.fill('input[placeholder="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Should navigate directly to game page
    await expect(page).toHaveURL(`**/game/${gameCode}`);
    await expect(page.locator('h1')).toContainText('Test Rejoin Game');
  });

  test('unregistered player cannot join in-progress game', async ({ page, context }) => {
    // Setup: Create host and start game
    const hostPage = await context.newPage();
    await hostPage.goto('http://localhost:5173/');

    await hostPage.fill('input[type="email"]', 'host@example.com');
    await hostPage.fill('input[type="password"]', 'password123');
    await hostPage.click('button:has-text("Login")');
    await hostPage.waitForURL('**/host');

    await hostPage.click('button:has-text("New Game")');
    await hostPage.fill('input[placeholder="Game Name"]', 'Test Block Game');
    await hostPage.click('button:has-text("Create")');

    const gameCodeElement = await hostPage.locator('[data-testid="game-code"]');
    const gameCode = await gameCodeElement.textContent();

    await hostPage.click('button:has-text("Ready")');
    await hostPage.click('button:has-text("Start Game")');

    // New player tries to join in-progress game
    await page.goto('http://localhost:5173/');
    await page.fill('input[type="email"]', 'newplayer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/lobby');

    await page.fill('input[placeholder="ABC123"]', gameCode!);
    await page.click('button:has-text("Join Game")');

    // Should see error message
    await expect(page.locator('text=This game is already in progress')).toBeVisible();
    await expect(page).toHaveURL('**/lobby');
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm run test:e2e rejoin-in-progress
```

Expected: FAIL - Tests will fail because `findGameByCode` only returns games with status "ready"

### Step 3: Update games service to allow in-progress games

Modify `src/lib/games.ts:103-118`:

```typescript
async findGameByCode(code: string): Promise<Game | null> {
  try {
    // Get games with status "ready" OR "in-progress"
    const result = await pb.collection('games').getList<Game>(1, 50, {
      filter: `code = "${code}" && (status = "ready" || status = "in-progress")`
    });

    if (result.items.length > 0) {
      return result.items[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to find game by code:', error);
    throw error;
  }
},
```

### Step 4: Run test again - should still fail

Run:
```bash
npm run test:e2e rejoin-in-progress
```

Expected: First test may pass partially, but second test will fail because we haven't added validation yet

### Step 5: Commit games service change

```bash
git add src/lib/games.ts tests/e2e/rejoin-in-progress.spec.ts
git commit -m "feat: allow finding games with in-progress status

Update findGameByCode to return games with status 'ready' or 'in-progress'.
This enables registered players to rejoin games that have already started.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Lobby Page Validation for In-Progress Games

**Files:**
- Modify: `src/pages/LobbyPage.tsx:28-76` (handleJoinGame method)

### Step 1: Update LobbyPage validation logic

Modify `src/pages/LobbyPage.tsx` in the `handleJoinGame` function after the existing player check:

```typescript
const handleJoinGame = async () => {
  if (!gameCode.trim()) {
    setError('Please enter a game code')
    return
  }

  try {
    setIsLoading(true)
    setError('')

    // Find game by code with status "ready" or "in-progress"
    const game = await gamesService.findGameByCode(gameCode.trim().toUpperCase())

    if (!game) {
      setError('Game not found or not ready to join')
      return
    }

    // Check if player is already in this game
    if (pb.authStore.model?.id) {
      const existingPlayer = await gamePlayersService.findPlayerInGame(game.id, pb.authStore.model.id)

      if (existingPlayer) {
        // Player is already in the game - allow rejoin
        if (existingPlayer.team) {
          // Player is on a team - go directly to game page
          console.log('Player already in game with team, redirecting to game page')
          navigate(`/game/${game.id}`)
          return
        } else {
          // Player is in game but not on a team - show team selection
          console.log('Player already in game but no team, showing team selection')
          setCurrentGame(game)
          setShowTeamModal(true)
          return
        }
      }

      // NEW: Block unregistered players from joining in-progress games
      if (game.status === 'in-progress') {
        setError('This game is already in progress. Only registered players can rejoin.')
        return
      }
    }

    // New player - show team selection (only for "ready" games)
    setCurrentGame(game)
    setShowTeamModal(true)
  } catch (error) {
    console.error('Failed to join game:', error)
    setError('Failed to join game. Please try again.')
  } finally {
    setIsLoading(false)
  }
}
```

### Step 2: Run tests to verify they pass

Run:
```bash
npm run test:e2e rejoin-in-progress
```

Expected: PASS - Both tests should now pass
- Registered player can rejoin in-progress game
- Unregistered player sees error when trying to join in-progress game

### Step 3: Run full E2E test suite to ensure no regressions

Run:
```bash
npm run test:e2e
```

Expected: All existing tests still pass

### Step 4: Commit lobby page changes

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: block unregistered players from joining in-progress games

Add validation in LobbyPage to prevent new players from joining games
that have already started. Registered players with game_players records
can still rejoin to recover from disconnections.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Manual Testing and Verification

**Files:**
- N/A (manual testing)

### Step 1: Start development environment

```bash
./dev.sh
```

### Step 2: Test registered player rejoin flow

1. Open browser to `http://localhost:5173/`
2. Login as host (admin@example.com / Password123)
3. Create a new game and note the game code
4. Mark game as "Ready"
5. Open incognito window to `http://localhost:5173/`
6. Login as player (create account if needed)
7. Join game using game code
8. Select a team
9. In host window, click "Start Game" (changes status to "in-progress")
10. In player window, navigate to `/lobby`
11. Enter same game code and click "Join Game"
12. **Expected:** Player is redirected back to the game page

### Step 3: Test unregistered player block flow

1. Keep game in-progress from previous test
2. Open new incognito window to `http://localhost:5173/`
3. Login as different player (not registered in game)
4. Enter the game code and click "Join Game"
5. **Expected:** Error message "This game is already in progress. Only registered players can rejoin."
6. **Expected:** Player remains on lobby page

### Step 4: Test completed game block flow

1. In host window, complete the game
2. In player window (still on lobby), enter game code
3. Click "Join Game"
4. **Expected:** Error message "Game not found or not ready to join"

### Step 5: Document manual test results

Create a comment or note summarizing test results:
- ✅ Registered player can rejoin in-progress game
- ✅ Unregistered player blocked from in-progress game
- ✅ Completed games are not joinable
- ✅ New players can still join ready games

---

## Task 4: Final Build and Cleanup

**Files:**
- N/A (build verification)

### Step 1: Run TypeScript compilation

```bash
npm run build
```

Expected: No TypeScript errors

### Step 2: Run linter

```bash
npm run lint
```

Expected: No new linting errors (max 20 warnings allowed per project config)

### Step 3: Create final commit if any fixes needed

If linter or build identified issues:

```bash
git add .
git commit -m "fix: address linting/build issues for rejoin feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 4: Review all commits

```bash
git log --oneline main..HEAD
```

Expected: See 2-3 commits for this feature

---

## Definition of Done

- [ ] E2E tests pass for registered player rejoin
- [ ] E2E tests pass for unregistered player block
- [ ] Full E2E suite passes (no regressions)
- [ ] Manual testing confirms all three scenarios
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] All changes committed with descriptive messages
- [ ] Ready for code review

---

## Notes for Code Review

- Changes are minimal (2 files modified)
- Validation happens in frontend for immediate user feedback
- Error messages are clear and user-friendly
- No database schema or migration changes needed
- No changes to PocketBase access rules
- Existing team selection flow preserved

## Related Skills

- @superpowers:verification-before-completion - Use before claiming tasks complete
- @superpowers:finishing-a-development-branch - Use after all tasks complete
