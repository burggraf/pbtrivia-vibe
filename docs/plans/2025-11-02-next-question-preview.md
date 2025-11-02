# Next Question Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Next Question" preview section to the controller screen showing upcoming question with shuffled answers and correct answer highlighted.

**Architecture:** Create standalone NextQuestionPreview component that fetches and displays next question based on current game state. Component handles cross-round transitions and gracefully hides when no questions remain.

**Tech Stack:** React, TypeScript, PocketBase, existing game services (gameQuestionsService, questionsService, answerShuffler)

---

## Task 1: Create NextQuestionPreview Component Structure

**Files:**
- Create: `src/components/games/NextQuestionPreview.tsx`

**Step 1: Create component file with TypeScript interfaces**

Create the file with complete type definitions:

```typescript
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { questionsService } from '@/lib/questions'
import { getShuffledAnswers, getCorrectAnswerLabel } from '@/lib/answerShuffler'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

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
}

interface Round {
  id: string
  sequence_number: number
  question_count: number
  title: string
}

interface NextQuestionPreviewProps {
  gameId: string
  gameData: GameData | null
  rounds: Round[]
}

interface NextQuestionData {
  roundNumber: number
  totalRounds: number
  questionNumber: number
  category: string
  question: string
  difficulty: string
  answers: Array<{ label: string; text: string }>
  correctAnswerLabel: string
}

export default function NextQuestionPreview({ gameId, gameData, rounds }: NextQuestionPreviewProps) {
  const [nextQuestion, setNextQuestion] = useState<NextQuestionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Component logic will go here

  return null // Temporary
}
```

**Step 2: Commit component structure**

```bash
git add src/components/games/NextQuestionPreview.tsx
git commit -m "feat: add NextQuestionPreview component structure with types"
```

---

## Task 2: Implement Next Question Lookup Logic

**Files:**
- Modify: `src/components/games/NextQuestionPreview.tsx`

**Step 1: Add helper function to determine next question coordinates**

Add this function inside the component, before the useEffect:

```typescript
  // Determine which question to preview based on current game state
  const getNextQuestionCoordinates = (): { roundIndex: number; questionNumber: number } | null => {
    if (!gameData || rounds.length === 0) return null

    // States where we should hide the preview
    if (gameData.state === 'game-end' || gameData.state === 'thanks' || gameData.state === 'return-to-lobby') {
      return null
    }

    // game-start: Show Round 1, Question 1
    if (gameData.state === 'game-start') {
      return { roundIndex: 0, questionNumber: 1 }
    }

    // round-start: Show Question 1 of current round
    if (gameData.state === 'round-start' && gameData.round) {
      const roundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (roundIndex === -1) return null
      return { roundIndex, questionNumber: 1 }
    }

    // round-play: Show next question (or first question of next round)
    if (gameData.state === 'round-play' && gameData.round && gameData.question) {
      const currentRoundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (currentRoundIndex === -1) return null

      const currentRound = rounds[currentRoundIndex]
      const currentQuestionNumber = gameData.question.question_number
      const nextQuestionNumber = currentQuestionNumber + 1

      // If there's a next question in this round
      if (nextQuestionNumber <= currentRound.question_count) {
        return { roundIndex: currentRoundIndex, questionNumber: nextQuestionNumber }
      }

      // Otherwise, first question of next round
      const nextRoundIndex = currentRoundIndex + 1
      if (nextRoundIndex < rounds.length) {
        return { roundIndex: nextRoundIndex, questionNumber: 1 }
      }

      // No more questions
      return null
    }

    // round-end: Show Question 1 of next round
    if (gameData.state === 'round-end' && gameData.round) {
      const currentRoundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (currentRoundIndex === -1) return null

      const nextRoundIndex = currentRoundIndex + 1
      if (nextRoundIndex < rounds.length) {
        return { roundIndex: nextRoundIndex, questionNumber: 1 }
      }

      // No more rounds
      return null
    }

    return null
  }
```

**Step 2: Commit lookup logic**

```bash
git add src/components/games/NextQuestionPreview.tsx
git commit -m "feat: add next question coordinate lookup logic"
```

---

## Task 3: Implement Question Fetching with useEffect

**Files:**
- Modify: `src/components/games/NextQuestionPreview.tsx`

**Step 1: Add useEffect to fetch question data**

Add this useEffect before the return statement:

```typescript
  useEffect(() => {
    const fetchNextQuestion = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Determine which question to preview
        const coordinates = getNextQuestionCoordinates()
        if (!coordinates) {
          setNextQuestion(null)
          setIsLoading(false)
          return
        }

        const { roundIndex, questionNumber } = coordinates
        const round = rounds[roundIndex]

        // Fetch game_questions for this round
        const gameQuestions = await gameQuestionsService.getGameQuestions(round.id)

        if (gameQuestions.length === 0) {
          setError('No questions found for this round')
          setIsLoading(false)
          return
        }

        // Get the specific question
        const questionIndex = questionNumber - 1
        if (questionIndex >= gameQuestions.length) {
          setError('Question index out of range')
          setIsLoading(false)
          return
        }

        const gameQuestion = gameQuestions[questionIndex]

        // Fetch the full question details
        const questionDetails = await questionsService.getQuestionById(gameQuestion.question)

        // Shuffle answers using the secure key
        const shuffled = getShuffledAnswers(
          gameQuestion.key,
          questionDetails.answer_a,
          questionDetails.answer_b,
          questionDetails.answer_c,
          questionDetails.answer_d
        )

        // Get the correct answer label after shuffling
        const correctAnswerLabel = getCorrectAnswerLabel(gameQuestion.key)

        // Build the answer array
        const answers = [
          { label: 'A', text: shuffled.shuffledAnswers[0].text },
          { label: 'B', text: shuffled.shuffledAnswers[1].text },
          { label: 'C', text: shuffled.shuffledAnswers[2].text },
          { label: 'D', text: shuffled.shuffledAnswers[3].text }
        ]

        setNextQuestion({
          roundNumber: round.sequence_number,
          totalRounds: rounds.length,
          questionNumber: questionNumber,
          category: questionDetails.category,
          question: questionDetails.question,
          difficulty: questionDetails.difficulty,
          answers,
          correctAnswerLabel
        })
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch next question:', err)
        setError('Unable to load next question')
        setIsLoading(false)
      }
    }

    fetchNextQuestion()
  }, [gameData, rounds, gameId])
```

**Step 2: Commit fetching logic**

```bash
git add src/components/games/NextQuestionPreview.tsx
git commit -m "feat: add question fetching logic with answer shuffling"
```

---

## Task 4: Implement Component Rendering

**Files:**
- Modify: `src/components/games/NextQuestionPreview.tsx`

**Step 1: Replace return statement with complete UI**

Replace the `return null` with this complete rendering logic:

```typescript
  // Don't render if no next question
  if (!nextQuestion && !isLoading && !error) {
    return null
  }

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Next Question</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">Loading next question...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {nextQuestion && (
          <div>
            {/* Question Metadata */}
            <div className="mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                Round {nextQuestion.roundNumber} of {nextQuestion.totalRounds} - Question {nextQuestion.questionNumber}
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <Badge variant="secondary" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
                  Category: {nextQuestion.category}
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
                  Difficulty: {nextQuestion.difficulty}
                </Badge>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-base md:text-lg text-slate-900 dark:text-slate-100">
                {nextQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-2 md:space-y-3">
              {nextQuestion.answers.map((answer) => {
                const isCorrect = answer.label === nextQuestion.correctAnswerLabel

                // Correct answer styling (green)
                const answerClasses = isCorrect
                  ? 'p-3 md:p-4 rounded-lg border-2 bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200 flex justify-between items-start'
                  : 'p-3 md:p-4 rounded-lg border-2 bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 flex justify-between items-start'

                return (
                  <div key={answer.label} className={answerClasses}>
                    <div>
                      <span className="font-medium">{answer.label}.</span> {answer.text}
                    </div>
                    {isCorrect && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
```

**Step 2: Commit rendering implementation**

```bash
git add src/components/games/NextQuestionPreview.tsx
git commit -m "feat: add NextQuestionPreview rendering with answer highlighting"
```

---

## Task 5: Integrate Component into ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx`

**Step 1: Add import at top of file**

Add this import with the other component imports (around line 6):

```typescript
import NextQuestionPreview from '@/components/games/NextQuestionPreview'
```

**Step 2: Add component rendering after TeamDisplay**

Find the TeamDisplay section (around line 802-808). After the closing div of TeamDisplay, add the NextQuestionPreview component:

```typescript
        {/* Teams and Players Section */}
        {(!gameData || gameData.state === 'game-start') && (
          <TeamDisplay
            scoreboard={game?.scoreboard}
            isLoading={isLoading}
            className="mb-8"
          />
        )}

        {/* Next Question Preview - Show during gameplay */}
        {gameData && game && id && (
          <NextQuestionPreview
            gameId={id}
            gameData={gameData}
            rounds={rounds}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 3: Verify build passes**

Run: `npm run build`
Expected: Build completes successfully with no TypeScript errors

**Step 4: Commit integration**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: integrate NextQuestionPreview into controller page"
```

---

## Task 6: Manual Testing & Verification

**Files:**
- None (testing only)

**Step 1: Start development server**

Run: `npm run dev`
Expected: Dev server starts on port 5173 (or next available)

**Step 2: Test game-start state**

1. Navigate to `/host` and create a game
2. Navigate to controller page for that game
3. Verify "Next Question" section appears at bottom
4. Verify it shows "Round 1 of X - Question 1"
5. Verify question text and 4 answers are displayed
6. Verify one answer is highlighted in green with checkmark

**Step 3: Test round-play state**

1. Start the game and progress to first question
2. Verify "Next Question" section shows Question 2
3. Click "Reveal Answer" and "Next Question"
4. Verify section updates to show Question 3
5. Verify answers are shuffled differently for each question

**Step 4: Test cross-round transition**

1. Progress to last question of first round
2. Verify "Next Question" shows first question of Round 2
3. Complete round and move to round-end
4. Verify section still shows Round 2, Question 1

**Step 5: Test game-end hiding**

1. Complete all rounds to reach game-end state
2. Verify "Next Question" section disappears
3. Verify no errors in console

**Step 6: Test error states**

1. Open DevTools Network tab
2. Throttle network to simulate slow/failed requests
3. Verify loading state shows "Loading next question..."
4. Simulate error and verify error message displays

**Step 7: Test mobile responsiveness**

1. Open DevTools responsive mode
2. Test at 375px width (mobile)
3. Verify text sizes are readable
4. Verify badges wrap properly
5. Test at 768px (tablet) and 1024px (desktop)
6. Verify spacing increases on larger screens

---

## Task 7: Final Build & Documentation Update

**Files:**
- Modify: `CLAUDE.md` (if applicable)

**Step 1: Run final production build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No linting errors

**Step 3: Create final commit**

```bash
git add .
git commit -m "feat: complete next question preview implementation

Add NextQuestionPreview component to controller screen showing
upcoming question with shuffled answers and correct answer highlighted.

Features:
- Shows next question throughout game from start to end
- Handles cross-round transitions seamlessly
- Highlights correct answer in green
- Loading and error states
- Mobile responsive design
- Hides when no questions remain

Closes #[issue-number]"
```

---

## Success Criteria Checklist

- [ ] NextQuestionPreview component created with proper TypeScript types
- [ ] Component fetches and displays next question based on game state
- [ ] Answers are shuffled using answerShuffler (same as players see)
- [ ] Correct answer is highlighted in green with checkmark
- [ ] Section visible during game-start, round-start, round-play, round-end
- [ ] Section hidden at game-end, thanks, return-to-lobby
- [ ] Cross-round preview works (shows first Q of next round at round end)
- [ ] Loading state displays while fetching
- [ ] Error state displays on fetch failure
- [ ] UI matches RoundPlayDisplay styling
- [ ] Mobile responsive (375px, 768px, 1024px tested)
- [ ] No TypeScript errors
- [ ] No console errors during normal operation
- [ ] Build completes successfully

---

## Notes for Implementation

**Key Services:**
- `gameQuestionsService.getGameQuestions(roundId)`: Returns game_questions records with secure keys
- `questionsService.getQuestionById(questionId)`: Returns full question details
- `getShuffledAnswers(key, a, b, c, d)`: Shuffles answers using secure key
- `getCorrectAnswerLabel(key)`: Returns correct answer label ('A', 'B', 'C', or 'D') after shuffling

**Important:**
- Answer A in the original/unshuffled question is ALWAYS the correct answer
- The `key` from game_questions determines how answers are shuffled
- Use `getCorrectAnswerLabel()` to get the label AFTER shuffling
- This ensures the preview shows exactly what players will see

**Design Reference:**
- See `docs/plans/2025-11-02-next-question-preview-design.md` for full design rationale
- Match styling from `RoundPlayDisplay.tsx` for consistency
- Follow UI Style Guide at `docs/design/ui-style-guide.md`
