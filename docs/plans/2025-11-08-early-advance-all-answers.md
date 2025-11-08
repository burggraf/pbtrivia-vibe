# Early Advance on All Answers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement smart early advance that automatically reveals answers 3 seconds after all teams have submitted, improving game pacing.

**Architecture:** Real-time subscription to game_answers collection detects when all teams with players have answered. When condition met, replace question timer with 3-second early-advance timer. Existing timer infrastructure handles countdown and auto-advance.

**Tech Stack:** React, TypeScript, PocketBase real-time subscriptions, existing timer system

---

## Task 1: Extend Timer Interface with Early-Advance Flag

**Files:**
- Modify: `src/pages/ControllerPage.tsx:19-47`

**Step 1: Add isEarlyAdvance field to timer interface**

In `src/pages/ControllerPage.tsx`, update the `GameData` interface timer field (around lines 41-46):

```typescript
timer?: {
  startedAt: string
  duration: number
  expiresAt: string
  isEarlyAdvance?: boolean
}
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add isEarlyAdvance flag to timer interface

- Add optional isEarlyAdvance field to track early-advance timers
- Prevents re-creating timer on subsequent answer events
- No functional changes yet

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Answer Subscription to ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:675-730` (after rebuildScoreboard, before fetchGameData)

**Step 1: Add answer subscription useEffect**

In `src/pages/ControllerPage.tsx`, add this useEffect after the `rebuildScoreboard` function and before `fetchGameData` (around line 162):

```typescript
// Check if all teams have answered and trigger early advance
useEffect(() => {
  // Only monitor when question is active (not revealed yet)
  if (!gameData?.question?.id || gameData.question.correct_answer || !id || !game?.scoreboard) return

  console.log('👥 Monitoring answers for early advance:', {
    questionId: gameData.question.id,
    gameId: id
  })

  const unsubscribe = pb.collection('game_answers').subscribe('*', async (e) => {
    // Filter to current question
    if ((e.record as any).game_questions_id !== gameData.question!.id) return
    if ((e.record as any).game !== id) return

    console.log('👥 Answer event detected:', {
      action: e.action,
      questionId: (e.record as any).game_questions_id,
      team: (e.record as any).team
    })

    // Count teams with players
    const teamsWithPlayers = Object.values(game.scoreboard.teams)
      .filter(team => team.players && team.players.length > 0).length

    console.log('👥 Teams with players:', teamsWithPlayers)

    // If no teams with players, skip
    if (teamsWithPlayers === 0) {
      console.log('👥 No teams with players, skipping early advance check')
      return
    }

    // Get all answers for current question
    const { gameAnswersService } = await import('@/lib/gameAnswers')
    const answers = await gameAnswersService.getTeamAnswersForQuestion(id, gameData.question!.id)
    const teamsAnswered = answers.length

    console.log('👥 Teams answered:', teamsAnswered, 'of', teamsWithPlayers)

    // If all answered and no early-advance timer exists yet
    if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance) {
      console.log('🎉 All teams answered! Triggering early advance in 3 seconds')

      // Create 3-second early-advance timer
      const timer = {
        startedAt: new Date().toISOString(),
        duration: 3,
        expiresAt: new Date(Date.now() + 3000).toISOString(),
        isEarlyAdvance: true
      }

      await updateGameDataClean({
        ...gameData,
        timer
      })
    }
  }, { filter: `game = "${id}"` })

  return () => {
    console.log('👥 Cleaning up answer subscription for question:', gameData.question?.id)
    unsubscribe.then(unsub => unsub())
  }
}, [gameData?.question?.id, gameData?.question?.correct_answer, id, game?.scoreboard, updateGameDataClean])
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add answer subscription for early advance detection

- Subscribe to game_answers collection for current question
- Count teams with players vs teams that answered
- Create 3-second early-advance timer when all teams answer
- Extensive logging for debugging
- Cleanup subscription on question change

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Manual Testing and Verification

**Files:**
- None (testing only)

**Step 1: Start development environment**

Run: `pnpm run dev`
Expected: Dev server starts on port 5173 (or next available)

**Step 2: Create test game with timers**

1. Navigate to localhost:5173
2. Log in as host
3. Create new game with timer configuration:
   - question_timer: 30 seconds
   - answer_timer: 5 seconds
4. Add 1 round with 2 questions
5. Set game to "Ready"

**Step 3: Test basic early advance (3 teams scenario)**

1. Open game in controller
2. Open 3 separate browser windows/tabs for players
3. Join each player to a different team (3 teams total)
4. Start game, navigate to first question
5. Verify question timer shows "30 seconds"
6. Have first player submit answer
   - Verify timer continues counting down
7. Have second player submit answer
   - Verify timer continues counting down
8. Have third player submit answer (all teams answered)
   - Verify timer immediately switches to "3 seconds"
   - Verify progress bar resets to 100% and counts down
9. Wait for 3-second countdown to complete
   - Verify answer is automatically revealed
   - Verify answer timer starts (5 seconds)

Expected: Early advance triggers when all 3 teams answer

**Step 4: Test partial answers (not all teams)**

1. Navigate to second question
2. Verify question timer shows "30 seconds"
3. Have only 2 of 3 teams submit answers
4. Verify timer continues counting down normally
5. Wait for question timer to expire naturally
6. Verify answer is revealed after 30 seconds

Expected: Question timer runs full duration when not all teams answer

**Step 5: Test manual override during early advance**

1. Create new round with questions
2. Start question, have all teams answer quickly
3. Verify early advance timer starts ("3 seconds")
4. Before countdown finishes, click "Reveal" button
5. Verify answer is immediately revealed
6. Verify answer timer starts normally

Expected: Manual advance works during early-advance countdown

**Step 6: Test empty teams scenario**

1. Create new game with 4 teams
2. Assign players to only 2 teams (2 teams empty)
3. Start question
4. Have both teams with players submit answers
5. Verify early advance triggers (ignores empty teams)

Expected: Empty teams don't block early advance

**Step 7: Test no teams with players**

1. Create game with no teams
2. Start question
3. Verify question timer runs normally
4. Verify no early advance occurs

Expected: Game works normally with no teams

**Step 8: Test answer change during countdown**

1. Start question with 3 teams
2. All teams submit answers (early advance starts)
3. During 3-second countdown, have one team change their answer
4. Verify countdown continues (doesn't restart)

Expected: Countdown continues even if answer changes

**Step 9: Check console logs**

Open browser console and verify:
- "👥 Monitoring answers for early advance" appears when question starts
- "👥 Answer event detected" appears when answers submitted
- "👥 Teams with players: X" shows correct count
- "👥 Teams answered: X of Y" shows correct progress
- "🎉 All teams answered! Triggering early advance" appears when condition met
- "👥 Cleaning up answer subscription" appears on question change

**Step 10: Test with existing dev servers**

Note: You have 3 background dev servers running. Use one of them for testing:
- Bash 3a6da1 (pnpm run dev)
- Bash 7f614f (pnpm run dev)
- Bash a44e31 (pnpm run preview)

Check which port each is running on with:
```bash
pnpm run dev
```

**Step 11: Document any issues**

If any issues found:
1. Note the specific scenario
2. Note expected vs actual behavior
3. Fix immediately or create issue ticket

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Build succeeds without errors: `pnpm run build`
- [ ] ESLint passes: `pnpm run lint`
- [ ] Early advance triggers when all teams answer
- [ ] Timer shows "3 seconds" countdown
- [ ] Progress bar animates smoothly during countdown
- [ ] Answer auto-reveals after 3 seconds
- [ ] Question timer continues if not all teams answer
- [ ] Manual advance works during early-advance countdown
- [ ] Empty teams are ignored in count
- [ ] No teams scenario works normally
- [ ] Answer changes during countdown don't reset timer
- [ ] Console logs show correct team counts
- [ ] Works on both controller and player pages
- [ ] Dark mode displays correctly

---

## Notes for Engineer

**Testing Strategy:**
- No automated tests in this project
- Use manual testing with real game flow
- Test with multiple browser windows for different players
- Test on both controller and player views
- Check browser console for debug logs

**Key Implementation Details:**
- Subscription filtered by `game = "${id}"` for efficiency
- Only monitors when `gameData.question.correct_answer` is undefined (not revealed yet)
- Counts teams where `team.players.length > 0` (excludes empty teams)
- Uses existing `updateGameDataClean` to sync timer across all clients
- Early-advance timer has same structure as normal timers, just different duration
- `isEarlyAdvance` flag prevents re-creating timer on subsequent events

**Common Pitfalls:**
- Don't forget to check `teamsWithPlayers > 0` before comparing counts
- Ensure subscription cleanup runs when question changes
- Remember to filter subscription events by question ID and game ID
- Early-advance timer must have `isEarlyAdvance: true` to prevent loops

**Existing Background Servers:**
- You have 3 dev servers already running
- Check which ports they're using before starting new server
- Can use existing servers for testing

**References:**
- Design doc: `docs/plans/2025-11-08-early-advance-on-all-answers-design.md`
- Timer auto-advance: `docs/plans/2025-11-08-timer-auto-advance.md`
- Game timer component: `src/components/games/GameTimer.tsx`
