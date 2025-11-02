# Next Question Preview Design

**Date:** 2025-11-02
**Status:** Design Approved
**Feature:** Controller Screen - Next Question Preview Section

## Overview

Add a "Next Question" preview section to the controller screen (/controller) that displays the upcoming question with its shuffled answers and correct answer indicator. This helps the host prepare for smooth transitions between questions.

## Requirements

### Core Requirements
- Display the next question that will be shown to players
- Show the question exactly as players will see it (with shuffled answers)
- Highlight which answer is correct
- Visible throughout the game (from game-start through round-end states)
- Hidden when no questions remain (game-end, thanks, return-to-lobby states)
- Support cross-round preview (show first question of next round when current round ends)

### User Experience Goals
- Help host prepare for upcoming questions
- Reduce transition delays between questions
- Provide clarity on correct answers before revealing to players
- Maintain consistent styling with existing game UI

## Design Decisions

### Visibility Rules
**Decision:** Show throughout entire game, hide only when no questions remain
**Rationale:** Provides continuous look-ahead for host preparation

**States where visible:**
- `game-start`: Shows Round 1, Question 1
- `round-start`: Shows Question 1 of current round
- `round-play`: Shows next question (or first question of next round if on last question)
- `round-end`: Shows Question 1 of next round

**States where hidden:**
- `game-end`, `thanks`, `return-to-lobby`: No questions remain

### Cross-Round Support
**Decision:** Show next question across round boundaries
**Rationale:** Provides seamless preview throughout entire game flow

When at the last question of a round, the preview shows the first question of the next round. Only hides when absolutely no questions remain.

### Correct Answer Display
**Decision:** Highlight correct answer in green within the answer list
**Rationale:** Visual consistency with revealed answer styling, clear at a glance

Uses the same green highlighting as RoundPlayDisplay's revealed answer state for immediate recognition.

## Architecture

### Component Structure
**Choice:** Create new `NextQuestionPreview` component
**Location:** `src/components/games/NextQuestionPreview.tsx`
**Placement:** Rendered in ControllerPage after TeamDisplay section

**Rationale:**
- Clean separation of concerns
- Reusable and testable
- Doesn't bloat existing components
- Easy to maintain and extend

### Props Interface
```typescript
interface NextQuestionPreviewProps {
  gameId: string
  gameData: GameData | null
  rounds: Array<{
    id: string
    sequence_number: number
    question_count: number
    title: string
  }>
}
```

### Question Lookup Logic

**Algorithm for determining "next" question:**

1. **game-start state**:
   - Next = Round 1, Question 1

2. **round-start state**:
   - Next = Question 1 of current round

3. **round-play state**:
   - If not last question: Next = current question number + 1
   - If last question of round: Next = Question 1 of next round (if exists)
   - Lookup is independent of whether answer is revealed

4. **round-end state**:
   - Next = Question 1 of next round (if exists)

5. **game-end, thanks, return-to-lobby**:
   - Return null (hide section)

### Data Fetching Strategy

**Services Used:**
- `gameQuestionsService.getGameQuestions(roundId)`: Get question list for a round
- `questionsService.getQuestionById(questionId)`: Fetch question details
- `answerShuffler.getShuffledAnswers(key, a, b, c, d)`: Shuffle answers using secure key
- `answerShuffler.getCorrectAnswerLabel(key)`: Determine correct answer label after shuffling

**Approach:**
- Component uses `useEffect` triggered by changes to `gameData` or `rounds`
- Fetches question data and caches in component state
- No real-time subscriptions needed (preview only)
- Answer A in original/unshuffled form is always correct

**Performance:**
- Only fetch when gameData changes (not on every render)
- Cache fetched question data to avoid redundant API calls

## UI Design

### Visual Layout

**Structure:**
```
Card
  CardHeader: "Next Question"
  CardContent:
    - Metadata badges (Round X of Y - Question Z, Category, Difficulty)
    - Question text
    - Answer options (4 answers A-D)
      - Correct answer: green background with checkmark
      - Other answers: neutral gray background
```

### Styling Consistency

**Match RoundPlayDisplay patterns:**
- Same Card structure and spacing
- Same Badge components for metadata
- Same answer option layout (div-based, non-clickable)

**Answer Styling:**
- **Correct answer:** `bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200` with ✓ icon
- **Other answers:** `bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400`

### Responsive Design

Follow UI Style Guide mobile-first patterns:
- Question title: `text-base md:text-xl`
- Metadata badges: `text-xs md:text-sm`
- Card padding: `px-3 md:px-6`
- Spacing: `mb-4 md:mb-6` for sections, `space-y-2 md:space-y-3` for answers

## Error Handling & Edge Cases

### Error Scenarios

1. **Question fetch fails:**
   - Show error message in card: "Unable to load next question"
   - Don't crash page, maintain layout

2. **Round doesn't exist:**
   - Component returns null (hide section)

3. **Service failures:**
   - Log error to console
   - Show graceful error message to host

### Edge Cases

1. **No rounds configured:**
   - Component returns null

2. **Last question of last round:**
   - Component returns null (section disappears)

3. **Round with no questions:**
   - Skip to next round or return null if no valid rounds remain

4. **Missing answer shuffle key:**
   - Log error to console
   - Show question but display "Unable to display answers" message

### Loading States

- Show loading skeleton/spinner while fetching
- Card displays with "Loading next question..." message
- Use React useState to track loading state

## Implementation Notes

### File Changes
- **New file:** `src/components/games/NextQuestionPreview.tsx`
- **Modified:** `src/pages/ControllerPage.tsx` (add component import and render)

### Integration Point
In ControllerPage.tsx, render after TeamDisplay section and GameStateDisplay:

```tsx
{/* Next Question Preview - Only show in controller mode */}
{gameData && game && (
  <NextQuestionPreview
    gameId={id}
    gameData={gameData}
    rounds={rounds}
  />
)}
```

### Dependencies
- Existing services: `gameQuestionsService`, `questionsService`
- Existing utilities: `answerShuffler` (getShuffledAnswers, getCorrectAnswerLabel)
- UI components: Card, CardHeader, CardTitle, CardContent, Badge

## Testing Considerations

### Test Cases
1. Verify correct question shown at game-start
2. Verify cross-round transitions (last question → next round's first question)
3. Verify section hides at game-end states
4. Verify correct answer highlighting matches shuffled answers
5. Test error states (missing questions, failed fetches)
6. Test loading states
7. Verify responsive behavior on mobile/tablet/desktop

### Manual Testing Flow
1. Start game → verify shows Round 1 Q1
2. Progress through questions → verify always shows next
3. Reach end of round → verify shows next round's Q1
4. Reach end of game → verify section disappears
5. Test with rounds of different lengths
6. Test with single-round games

## Success Criteria

- [ ] Host can see next question at all times during gameplay
- [ ] Answers are displayed exactly as players will see them (shuffled)
- [ ] Correct answer is clearly highlighted in green
- [ ] Section smoothly handles transitions between rounds
- [ ] Section hides appropriately when game ends
- [ ] UI matches existing component styling
- [ ] Mobile responsive design works correctly
- [ ] Error states handled gracefully
- [ ] No performance impact on controller page
