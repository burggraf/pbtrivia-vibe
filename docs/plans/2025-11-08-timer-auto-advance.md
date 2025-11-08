# Timer Auto-Advance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement automatic game state progression with countdown timer UI when timers are configured in game metadata.

**Architecture:** Host-driven timer with client UI sync. Controller creates timer timestamps on state transitions and auto-advances when expired. Clients calculate remaining time from expiration timestamp and display progress bar. All state synced via PocketBase real-time subscriptions.

**Tech Stack:** React, TypeScript, shadcn/ui (Progress component), PocketBase real-time subscriptions, Tailwind CSS

---

## Task 1: Create GameTimer Component

**Files:**
- Create: `src/components/games/GameTimer.tsx`

**Step 1: Create component file with basic structure**

Create `src/components/games/GameTimer.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'

interface GameTimerProps {
  timer: {
    startedAt: string
    duration: number
    expiresAt: string
  }
}

export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const expiresAt = new Date(timer.expiresAt).getTime()
      const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000))
      setRemainingSeconds(remaining)

      // Calculate progress percentage (100% = full time, 0% = expired)
      const percentage = Math.max(0, Math.min(100, (remaining / timer.duration) * 100))
      setProgressValue(percentage)
    }

    // Initial update
    updateTimer()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [timer])

  const secondsText = remainingSeconds === 1 ? 'second' : 'seconds'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 3: Commit**

```bash
git add src/components/games/GameTimer.tsx
git commit -m "feat: create GameTimer component with countdown display

- Fixed position at viewport bottom
- Shows remaining seconds text
- Progress bar from 100% to 0%
- Updates every 100ms for smooth countdown
- Dark mode support

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Update TypeScript Types for Timer State

**Files:**
- Modify: `src/pages/ControllerPage.tsx:17-41`

**Step 1: Add timer interface to GameData type**

In `src/pages/ControllerPage.tsx`, update the `GameData` interface (lines 19-41):

```typescript
interface GameData {
  state: GameState
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
    categories: string[]
  }
  question?: {
    id: string
    question_number: number
    category: string
    question: string
    difficulty: string
    a: string
    b: string
    c: string
    d: string
    correct_answer?: string
    submitted_answer?: string
  }
  timer?: {
    startedAt: string
    duration: number
    expiresAt: string
  }
}
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add timer field to GameData type

- Add optional timer object to GameData interface
- Includes startedAt, duration, and expiresAt timestamps
- Enables timer state tracking in game data

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Timer Creation Helper Function

**Files:**
- Modify: `src/pages/ControllerPage.tsx:53-227`

**Step 1: Add helper function to create timer object**

In `src/pages/ControllerPage.tsx`, add this helper function after the `GAME_STATES` array (around line 52):

```typescript
// Helper function to create timer object from metadata
const createTimerForState = (state: GameState, isAnswerRevealed: boolean, metadata?: GameMetadata): GameData['timer'] | undefined => {
  if (!metadata) return undefined

  let timerSeconds: number | null | undefined

  // Map state to appropriate timer field
  switch (state) {
    case 'game-start':
      timerSeconds = metadata.game_start_timer
      break
    case 'round-start':
      timerSeconds = metadata.round_start_timer
      break
    case 'round-play':
      // Use question_timer before reveal, answer_timer after reveal
      timerSeconds = isAnswerRevealed ? metadata.answer_timer : metadata.question_timer
      break
    case 'game-end':
      timerSeconds = metadata.game_end_timer
      break
    case 'thanks':
      timerSeconds = metadata.thanks_timer
      break
    default:
      return undefined
  }

  // Only create timer if value is positive
  if (!timerSeconds || timerSeconds <= 0) return undefined

  const startedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + timerSeconds * 1000).toISOString()

  return {
    startedAt,
    duration: timerSeconds,
    expiresAt
  }
}
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed (may have unused function warning, that's OK)

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add timer creation helper function

- Maps game states to metadata timer fields
- Handles round-play dual timers (question/answer)
- Returns undefined for null/zero/missing timers
- Calculates startedAt and expiresAt timestamps

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Integrate Timer Creation in State Transitions

**Files:**
- Modify: `src/pages/ControllerPage.tsx:214-225`
- Modify: `src/pages/ControllerPage.tsx:228-528`

**Step 1: Update updateGameDataClean to accept timer parameter**

Replace the `updateGameDataClean` function (around lines 214-225) with this version:

```typescript
const updateGameDataClean = async (cleanGameData: GameData) => {
  if (!id) return

  try {
    await pb.collection('games').update(id, {
      data: JSON.stringify(cleanGameData)
    })
    setGameData(cleanGameData)
  } catch (error) {
    console.error('Failed to update game data:', error)
  }
}
```

**Step 2: Add timer creation to state transitions in handleNextState**

In the `handleNextState` function, update each state transition to include timer creation. Here are the key changes:

**For game-start → round-start transition** (around line 424):

```typescript
case 'game-start': {
  // Move to first round
  const firstRound = await createRoundObject(0)
  if (firstRound) {
    const newGameData: GameData = {
      state: 'round-start',
      round: firstRound
    }
    // Add timer if configured
    const timer = createTimerForState('round-start', false, game?.metadata)
    if (timer) newGameData.timer = timer

    await updateGameDataClean(newGameData)
    // Update game status to in-progress
    if (game) {
      await gamesService.updateGame(game.id, { status: 'in-progress' })
      console.log('🎮 Game status updated to in-progress')
    }
  }
  break
}
```

**For round-start → round-play transition** (around line 440):

```typescript
case 'round-start': {
  // Load first question
  const currentRoundIndex = getCurrentRoundIndex()
  const currentRound = rounds[currentRoundIndex]
  if (currentRound) {
    const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
    if (gameQuestions.length > 0) {
      const firstQuestion = await questionsService.getQuestionById(gameQuestions[0].question)
      const gameQuestion = gameQuestions[0]

      // Use the secure key to shuffle answers
      const { getShuffledAnswers } = await import('@/lib/answerShuffler')
      const shuffled = getShuffledAnswers(
        gameQuestion.key,
        firstQuestion.answer_a,
        firstQuestion.answer_b,
        firstQuestion.answer_c,
        firstQuestion.answer_d
      )

      const newGameData: GameData = {
        state: 'round-play',
        round: gameData.round,
        question: {
          id: gameQuestion.id,
          question_number: 1,
          category: firstQuestion.category,
          question: firstQuestion.question,
          difficulty: firstQuestion.difficulty,
          a: shuffled.shuffledAnswers[0].text,
          b: shuffled.shuffledAnswers[1].text,
          c: shuffled.shuffledAnswers[2].text,
          d: shuffled.shuffledAnswers[3].text
        }
      }
      // Add timer if configured (question timer, not revealed yet)
      const timer = createTimerForState('round-play', false, game?.metadata)
      if (timer) newGameData.timer = timer

      await updateGameDataClean(newGameData)
    }
  }
  break
}
```

**For round-play answer reveal** (around line 338):

```typescript
if (!isAnswerRevealed) {
  console.log('🎮 ENTERING REVEAL AND GRADE BLOCK')
  // Reveal answer and grade all submissions
  console.log('🔍 DEBUG: Revealing answer and grading submissions')
  if (gameData.question && id) {
    console.log('🎮 gameData.question exists, id:', id)
    // Get the game_questions record to access the secure key
    const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
    const gameQuestion = gameQuestions.find(gq => gq.id === gameData.question!.id)

    if (gameQuestion) {
      console.log('🎮 gameQuestion found:', gameQuestion.id)
      // Use the secure key to get the correct answer label
      const { getCorrectAnswerLabel, translateAnswerToOriginal, isTranslatedAnswerCorrect } = await import('@/lib/answerShuffler')
      const correctAnswerLabel = getCorrectAnswerLabel(gameQuestion.key)

      // Grade all submitted answers for this question
      const { gameAnswersService } = await import('@/lib/gameAnswers')
      const submittedAnswers = await gameAnswersService.getTeamAnswersForQuestion(id, gameData.question.id)

      console.log(`🎯 Grading ${submittedAnswers.length} submitted answers`)

      // Update each answer with translation and correctness
      for (const answer of submittedAnswers) {
        if (answer.answer) {
          try {
            // Translate the shuffled answer to original position
            const translatedAnswer = translateAnswerToOriginal(
              gameQuestion.key,
              answer.answer as 'A' | 'B' | 'C' | 'D'
            )

            // Check if the translated answer is correct (A is always correct)
            const isCorrect = isTranslatedAnswerCorrect(translatedAnswer)

            // Update the answer record with translation and correctness
            await gameAnswersService.updateAnswer(answer.id, {
              translated_answer: translatedAnswer,
              is_correct: isCorrect
            })

            console.log(`✅ Graded answer for team ${answer.team}: ${answer.answer} → ${translatedAnswer} (${isCorrect ? 'CORRECT' : 'INCORRECT'})`)
          } catch (error) {
            console.error(`❌ Failed to grade answer ${answer.id}:`, error)
          }
        }
      }

      // Update game data with correct answer
      const newGameData: GameData = {
        state: 'round-play',
        round: gameData.round,
        question: {
          ...gameData.question,
          correct_answer: correctAnswerLabel
        }
      }
      // Add timer if configured (answer timer, now revealed)
      const timer = createTimerForState('round-play', true, game?.metadata)
      if (timer) newGameData.timer = timer

      await updateGameDataClean(newGameData)

      console.log(`🎯 All answers graded. Correct answer: ${correctAnswerLabel}`)

      // Update scoreboard with latest scores
      console.log('🔴 BEFORE updateScoreboard call - Game ID:', id, 'Round:', gameData.round?.round_number)
      try {
        await scoreboardService.updateScoreboard(id, gameData.round?.round_number || 1)
        console.log('🟢 AFTER updateScoreboard call - Success!')
      } catch (error) {
        console.error('🔴 AFTER updateScoreboard call - Failed:', error)
        // Don't block game flow if scoreboard update fails
      }
    }
  }
  return
}
```

**For round-play next question** (around line 391):

```typescript
// Load next question
console.log('🔍 DEBUG: Loading next question', nextQuestionNumber)
const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
const nextQuestionIndex = nextQuestionNumber - 1
if (gameQuestions.length > nextQuestionIndex) {
  const nextQuestion = await questionsService.getQuestionById(gameQuestions[nextQuestionIndex].question)
  const gameQuestion = gameQuestions[nextQuestionIndex]

  // Use the secure key to shuffle answers
  const { getShuffledAnswers } = await import('@/lib/answerShuffler')
  const shuffled = getShuffledAnswers(
    gameQuestion.key,
    nextQuestion.answer_a,
    nextQuestion.answer_b,
    nextQuestion.answer_c,
    nextQuestion.answer_d
  )

  const newGameData: GameData = {
    state: 'round-play',
    round: gameData.round,
    question: {
      id: gameQuestion.id,
      question_number: nextQuestionNumber,
      category: nextQuestion.category,
      question: nextQuestion.question,
      difficulty: nextQuestion.difficulty,
      a: shuffled.shuffledAnswers[0].text,
      b: shuffled.shuffledAnswers[1].text,
      c: shuffled.shuffledAnswers[2].text,
      d: shuffled.shuffledAnswers[3].text
    }
  }
  // Add timer if configured (question timer, not revealed yet)
  const timer = createTimerForState('round-play', false, game?.metadata)
  if (timer) newGameData.timer = timer

  await updateGameDataClean(newGameData)
  console.log('🔍 DEBUG: Next question loaded successfully')
}
```

**For round-end transitions** (around line 412 and 480):

```typescript
// End of round
console.log('🔍 DEBUG: Ending round')
const newGameData: GameData = {
  state: 'round-end',
  round: gameData.round
}
// No timer for round-end state
await updateGameDataClean(newGameData)
return
```

And later:

```typescript
case 'round-end': {
  // Check if there are more rounds
  const nextRoundIndex = getCurrentRoundIndex() + 1
  if (nextRoundIndex < rounds.length) {
    // Start next round
    const nextRound = await createRoundObject(nextRoundIndex)
    if (nextRound) {
      const newGameData: GameData = {
        state: 'round-start',
        round: nextRound
      }
      // Add timer if configured
      const timer = createTimerForState('round-start', false, game?.metadata)
      if (timer) newGameData.timer = timer

      await updateGameDataClean(newGameData)
    }
  } else {
    // All rounds completed, go to game-end
    const newGameData: GameData = {
      state: 'game-end'
    }
    // Add timer if configured
    const timer = createTimerForState('game-end', false, game?.metadata)
    if (timer) newGameData.timer = timer

    await updateGameDataClean(newGameData)
    // Update game status to completed
    if (game) {
      await gamesService.updateGame(game.id, { status: 'completed' })
      console.log('🏁 Game status updated to completed')
    }
  }
  break
}
```

**For game-end and thanks transitions** (around line 506):

```typescript
case 'game-end': {
  const newGameData: GameData = {
    state: 'thanks'
  }
  // Add timer if configured
  const timer = createTimerForState('thanks', false, game?.metadata)
  if (timer) newGameData.timer = timer

  await updateGameDataClean(newGameData)
  break
}

case 'thanks': {
  const newGameData: GameData = {
    state: 'return-to-lobby'
  }
  // No timer for return-to-lobby
  await updateGameDataClean(newGameData)
  break
}
```

**Step 3: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 4: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: integrate timer creation in state transitions

- Create timer on each state transition when configured
- Handle round-play dual timers (question vs answer)
- Pass timer in game data updates
- No timer for round-end and return-to-lobby states

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Auto-Advance Effect to ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:613-675`

**Step 1: Add auto-advance useEffect**

In `src/pages/ControllerPage.tsx`, add this effect after the `fetchGameData` function and before the main subscription useEffect (around line 612):

```typescript
// Auto-advance when timer expires (host only)
useEffect(() => {
  if (!gameData?.timer || !id) return

  console.log('⏰ Timer active:', {
    state: gameData.state,
    expiresAt: gameData.timer.expiresAt,
    duration: gameData.timer.duration
  })

  const checkTimer = setInterval(() => {
    const now = Date.now()
    const expiresAt = new Date(gameData.timer!.expiresAt).getTime()

    if (now >= expiresAt) {
      console.log('⏰ Timer expired! Auto-advancing from state:', gameData.state)
      clearInterval(checkTimer)
      handleNextState()
    }
  }, 100)

  return () => {
    clearInterval(checkTimer)
  }
}, [gameData?.timer, id])
```

**Step 2: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add auto-advance effect when timer expires

- Check timer expiration every 100ms
- Auto-advance to next state when expired
- Log timer activity for debugging
- Clean up interval on state change

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Integrate GameTimer Component into ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:1-15`
- Modify: `src/pages/ControllerPage.tsx:677-782`

**Step 1: Import GameTimer component**

At the top of `src/pages/ControllerPage.tsx`, add the import (around line 8):

```typescript
import GameTimer from '@/components/games/GameTimer'
```

**Step 2: Render GameTimer in component**

In the return statement, add GameTimer before the closing `</div>` tag (around line 779, just before the final `</div>`):

```typescript
        {/* Next Question Preview - Show during gameplay */}
        {gameData && game && id && (
          <NextQuestionPreview
            gameId={id}
            gameData={gameData}
            rounds={rounds}
          />
        )}
      </div>

      {/* Timer Display - Fixed to bottom when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}
    </div>
  )
}
```

**Step 3: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 4: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: integrate GameTimer into ControllerPage

- Import GameTimer component
- Render when timer exists in game data
- Fixed position at viewport bottom

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Integrate GameTimer Component into GamePage

**Files:**
- Modify: `src/pages/GamePage.tsx:1-11`
- Modify: `src/pages/GamePage.tsx:383-443`

**Step 1: Import GameTimer component**

At the top of `src/pages/GamePage.tsx`, add the import (around line 6):

```typescript
import GameTimer from '@/components/games/GameTimer'
```

**Step 2: Render GameTimer in component**

In the return statement, add GameTimer before the closing `</div>` tags (around line 432, before the TeamSelectionModal):

```typescript
        {/* Game End Navigation - Show when game is in game-end state */}
        {gameData?.state === 'game-end' && (
          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/lobby')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Return to Lobby →
            </Button>
          </div>
        )}
      </div>

      {/* Timer Display - Fixed to bottom when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}

      {/* Team Selection Modal */}
      {game && showTeamModal && (
        <TeamSelectionModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          gameId={game.id}
          onTeamSelected={handleTeamSelected}
        />
      )}
    </div>
  )
}
```

**Step 3: Verify build**

Run: `pnpm run build`
Expected: TypeScript compilation and Vite build succeed

**Step 4: Commit**

```bash
git add src/pages/GamePage.tsx
git commit -m "feat: integrate GameTimer into GamePage

- Import GameTimer component
- Render when timer exists in game data
- Fixed position at viewport bottom
- Synchronized with controller timer

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Manual Testing and Verification

**Files:**
- None (testing only)

**Step 1: Start development environment**

Run: `pnpm run dev`
Expected: Dev server starts on port 5173 (or next available)

**Step 2: Create test game with timers**

1. Navigate to localhost:5173
2. Log in as host
3. Create new game with timer configuration:
   - game_start_timer: 5 seconds
   - round_start_timer: 5 seconds
   - question_timer: 10 seconds
   - answer_timer: 5 seconds
4. Add at least 1 round with 2 questions
5. Set game to "Ready"

**Step 3: Test game-start timer**

1. Open game in controller
2. Verify timer bar appears at bottom showing "5 seconds"
3. Verify progress bar starts at 100%
4. Wait and observe countdown
5. Verify auto-advance to round-start after 5 seconds

Expected: Timer displays correctly, auto-advances to round-start

**Step 4: Test round-start timer**

1. Observe round-start screen
2. Verify timer shows "5 seconds" and counts down
3. Verify auto-advance to first question

Expected: Timer displays correctly, auto-advances to round-play

**Step 5: Test question timer**

1. Observe question display
2. Verify timer shows "10 seconds"
3. Open game in separate browser (player view)
4. Verify player sees same countdown
5. Wait for auto-advance to answer reveal

Expected: Both controller and player see synchronized timer, auto-advances to reveal

**Step 6: Test answer timer**

1. Observe answer reveal screen
2. Verify timer shows "5 seconds"
3. Verify auto-advance to next question (or round-end if last question)

Expected: Timer displays correctly, auto-advances appropriately

**Step 7: Test manual override**

1. Start a new round
2. On question screen, click "Reveal" before timer expires
3. Verify timer clears and answer timer starts
4. On answer screen, click "Next" before timer expires
5. Verify timer clears and new question timer starts

Expected: Manual advance cancels current timer, new state gets fresh timer

**Step 8: Test without timers**

1. Create new game with all timers set to null or 0
2. Progress through game states
3. Verify no timer bar appears
4. Verify no auto-advance occurs

Expected: Game works normally without timers, requires manual clicks

**Step 9: Test mobile responsive**

1. Open browser dev tools
2. Switch to mobile viewport (375px width)
3. Go through game with timers
4. Verify timer bar displays correctly on mobile
5. Verify text is readable and progress bar is visible

Expected: Timer displays correctly on mobile, proper spacing and sizing

**Step 10: Test dark mode**

1. Toggle dark mode
2. Verify timer bar has proper dark mode styling
3. Verify text is readable
4. Verify progress bar is visible

Expected: Timer displays correctly in dark mode with proper contrast

**Step 11: Document any issues**

If any issues found:
1. Note the specific scenario
2. Note expected vs actual behavior
3. Create issue ticket or fix immediately

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Build succeeds without errors: `pnpm run build`
- [ ] ESLint passes: `pnpm run lint`
- [ ] Timer displays on controller page when configured
- [ ] Timer displays on game page when configured
- [ ] Timer counts down smoothly (updates visible)
- [ ] Progress bar animates from 100% to 0%
- [ ] Auto-advance works after timer expires
- [ ] Manual advance cancels timer
- [ ] New state gets fresh timer
- [ ] No timer shown when metadata is null/0
- [ ] Mobile responsive (works at 375px width)
- [ ] Dark mode displays correctly
- [ ] Multiple clients see synchronized countdown
- [ ] Fixed position at viewport bottom
- [ ] Timer text shows correct singular/plural ("second" vs "seconds")

---

## Notes for Engineer

**Testing Strategy:**
- No automated tests in this project
- Use manual testing with real game flow
- Test on both controller and player views
- Test with multiple browser windows for sync verification

**Key Implementation Details:**
- Timer object includes `startedAt`, `duration`, and `expiresAt` timestamps
- Clients calculate remaining time from `expiresAt` (not counting down locally)
- This ensures all clients stay synchronized even if they join mid-timer
- Controller checks expiration every 100ms and calls `handleNextState()`
- Timer state stored in `game.data` JSON field, synced via PocketBase

**Common Pitfalls:**
- Don't forget to handle `round-play` dual timers (question vs answer)
- Ensure timer is created AFTER state change, not before
- Remember to check for null/0 timer values (means no timer)
- Auto-advance effect must check if timer exists before setting interval

**References:**
- Design doc: `docs/plans/2025-11-08-timer-auto-advance-design.md`
- UI Style Guide: `docs/design/ui-style-guide.md`
- shadcn/ui Progress: Already installed, use `@/components/ui/progress`
