# Round-End Timer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a configurable timer for the round-end game state that auto-advances to the next round or game-end.

**Architecture:** Follow the established pattern used by 6 existing game state timers (game-start, round-start, round-play question/answer, game-end, thanks). Add round_end_timer to GameMetadata type, extend createTimerForState() function, and add UI input in Create Game dialog.

**Tech Stack:** TypeScript, React, PocketBase (JSON metadata field - no migration needed)

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/types/games.ts:18-28`

**Step 1: Add round_end_timer to GameMetadata interface**

Open `src/types/games.ts` and locate the `GameMetadata` interface (around line 18-28). Add the `round_end_timer` field:

```typescript
export interface GameMetadata {
  // Key timers (descriptive names for primary gameplay)
  question_timer?: number | null;        // round-play state
  answer_timer?: number | null;          // round-play state (after reveal)

  // Transition timers (state-based names)
  game_start_timer?: number | null;      // game-start state
  round_start_timer?: number | null;     // round-start state
  round_end_timer?: number | null;       // round-end state
  game_end_timer?: number | null;        // game-end state
  thanks_timer?: number | null;          // thanks state
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/types/games.ts
git commit -m "feat(types): add round_end_timer to GameMetadata"
```

---

## Task 2: Update Controller - createTimerForState Function

**Files:**
- Modify: `src/pages/ControllerPage.tsx:65-103`

**Step 1: Add round-end case to createTimerForState switch statement**

Open `src/pages/ControllerPage.tsx` and locate the `createTimerForState` function (line 65). Find the switch statement (around line 71) and add the `'round-end'` case:

```typescript
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
  case 'round-end':
    timerSeconds = metadata.round_end_timer
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
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat(controller): add round-end timer support to createTimerForState"
```

---

## Task 3: Update Controller - Round-End Transition

**Files:**
- Modify: `src/pages/ControllerPage.tsx:578-587`

**Step 1: Add timer to round-end state transition**

In `src/pages/ControllerPage.tsx`, locate the `handleNextState` function. Find the section that transitions to `'round-end'` state (around line 578-587 in the else block after checking nextQuestionNumber).

Currently it looks like:
```typescript
} else {
  // End of round
  console.log('🔍 DEBUG: Ending round')
  const newGameData: GameData = {
    state: 'round-end',
    round: gameData.round
  }
  // No timer for round-end state
  await updateGameDataClean(newGameData)
  return
}
```

Update it to:
```typescript
} else {
  // End of round
  console.log('🔍 DEBUG: Ending round')
  const newGameData: GameData = {
    state: 'round-end',
    round: gameData.round
  }
  // Add timer if configured
  const timer = createTimerForState('round-end', false, game?.metadata)
  if (timer) newGameData.timer = timer

  await updateGameDataClean(newGameData)
  return
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat(controller): attach round-end timer to round-end state transition"
```

---

## Task 4: Update UI Form - FormData Type and Initialization

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:27-51` (formData state)
- Modify: `src/components/games/GameEditModal.tsx:56-72` (edit mode initialization)
- Modify: `src/components/games/GameEditModal.tsx:96-110` (create mode initialization)

**Step 1: Add round_end_timer to formData type definition**

In `src/components/games/GameEditModal.tsx`, locate the `useState` for `formData` (around line 27-51). Add `round_end_timer` to the type definition:

```typescript
const [formData, setFormData] = useState<UpdateGameData | CreateGameData & {
  rounds?: number;
  questionsPerRound?: number;
  categories?: string[];
  question_timer?: number | null;
  answer_timer?: number | null;
  game_start_timer?: number | null;
  round_start_timer?: number | null;
  round_end_timer?: number | null;
  game_end_timer?: number | null;
  thanks_timer?: number | null;
}>({
  name: '',
  startdate: '',
  duration: 120,
  location: '',
  rounds: 3,
  questionsPerRound: 10,
  categories: [],
  question_timer: null,
  answer_timer: null,
  game_start_timer: null,
  round_start_timer: null,
  round_end_timer: null,
  game_end_timer: null,
  thanks_timer: null
})
```

**Step 2: Add round_end_timer to edit mode initialization**

In the same file, locate the `useEffect` that initializes the form when editing (around line 56-72). Add `round_end_timer` initialization:

```typescript
useEffect(() => {
  if (game) {
    setFormData({
      name: game.name || '',
      startdate: game.startdate ? new Date(game.startdate).toISOString().slice(0, 16) : '',
      duration: game.duration || 120,
      location: game.location || '',
      rounds: 3,
      questionsPerRound: 10,
      categories: [],
      question_timer: game.metadata?.question_timer || null,
      answer_timer: game.metadata?.answer_timer || null,
      game_start_timer: game.metadata?.game_start_timer || null,
      round_start_timer: game.metadata?.round_start_timer || null,
      round_end_timer: game.metadata?.round_end_timer || null,
      game_end_timer: game.metadata?.game_end_timer || null,
      thanks_timer: game.metadata?.thanks_timer || null
    })
  } else {
    // ... rest of initialization
  }
}, [game, isOpen])
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat(ui): add round_end_timer to form data type and initialization"
```

---

## Task 5: Update UI Form - Add Input Component

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:473-514` (add input after Round Start Timer)

**Step 1: Add Round End Timer input field**

In `src/components/games/GameEditModal.tsx`, locate the "Timers" section accordion content (around line 430). Find the "Round Start Timer" input (around line 473-492) and add the new "Round End Timer" input immediately after it (before the "Game Start Timer"):

```tsx
{/* Round Start Timer */}
<div className="space-y-2">
  <Label htmlFor="round_start_timer" className="text-sm font-medium">
    Round Start Timer
  </Label>
  <div className="flex items-center gap-2">
    <Input
      id="round_start_timer"
      type="number"
      min="0"
      max="600"
      value={('round_start_timer' in formData ? formData.round_start_timer : null) ?? ''}
      onChange={(e) => handleInputChange('round_start_timer', e.target.value ? parseInt(e.target.value) : null)}
      placeholder="No limit"
      className="flex-1"
    />
    <span className="text-sm text-slate-500">seconds</span>
  </div>
  <p className="text-xs text-slate-500">(round-start state)</p>
</div>

{/* Round End Timer */}
<div className="space-y-2">
  <Label htmlFor="round_end_timer" className="text-sm font-medium">
    Round End Timer
  </Label>
  <div className="flex items-center gap-2">
    <Input
      id="round_end_timer"
      type="number"
      min="0"
      max="600"
      value={('round_end_timer' in formData ? formData.round_end_timer : null) ?? ''}
      onChange={(e) => handleInputChange('round_end_timer', e.target.value ? parseInt(e.target.value) : null)}
      placeholder="No limit"
      className="flex-1"
    />
    <span className="text-sm text-slate-500">seconds</span>
  </div>
  <p className="text-xs text-slate-500">(round-end state)</p>
</div>

{/* Game Start Timer */}
<div className="space-y-2">
  <Label htmlFor="game_start_timer" className="text-sm font-medium">
    Game Start Timer
  </Label>
  ...
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat(ui): add Round End Timer input to game creation form"
```

---

## Task 6: Update UI Form - Copy From Previous Game Function

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:190-196` (filter check)
- Modify: `src/components/games/GameEditModal.tsx:214-222` (copy operation)

**Step 1: Add round_end_timer to filter check**

In `src/components/games/GameEditModal.tsx`, locate the `handleCopyTimersFromPreviousGame` function (around line 184). Find the filter that checks for games with timers (around line 190-196):

```typescript
// Filter games that have timer metadata
const gamesWithTimers = games.filter(g =>
  g.metadata?.question_timer !== undefined ||
  g.metadata?.answer_timer !== undefined ||
  g.metadata?.game_start_timer !== undefined ||
  g.metadata?.round_start_timer !== undefined ||
  g.metadata?.round_end_timer !== undefined ||
  g.metadata?.game_end_timer !== undefined ||
  g.metadata?.thanks_timer !== undefined
)
```

**Step 2: Add round_end_timer to copy operation**

In the same function, find where timer values are copied to the form (around line 214-222):

```typescript
// Copy timer values to form
setFormData(prev => ({
  ...prev,
  question_timer: previousGameWithTimers.metadata?.question_timer || null,
  answer_timer: previousGameWithTimers.metadata?.answer_timer || null,
  game_start_timer: previousGameWithTimers.metadata?.game_start_timer || null,
  round_start_timer: previousGameWithTimers.metadata?.round_start_timer || null,
  round_end_timer: previousGameWithTimers.metadata?.round_end_timer || null,
  game_end_timer: previousGameWithTimers.metadata?.game_end_timer || null,
  thanks_timer: previousGameWithTimers.metadata?.thanks_timer || null
}))
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat(ui): include round_end_timer in copy from previous game"
```

---

## Task 7: Fix Existing Comment Error

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:470`

**Step 1: Correct answer_timer state comment**

In `src/components/games/GameEditModal.tsx`, locate the "Answer Display Timer" input (around line 452-471). The helper text currently says `(round-end state)` but should say `(round-play state after reveal)`:

```tsx
{/* Answer Display Timer */}
<div className="space-y-2">
  <Label htmlFor="answer_timer" className="text-sm font-medium">
    Answer Display Timer
  </Label>
  <div className="flex items-center gap-2">
    <Input
      id="answer_timer"
      type="number"
      min="0"
      max="600"
      value={('answer_timer' in formData ? formData.answer_timer : null) ?? ''}
      onChange={(e) => handleInputChange('answer_timer', e.target.value ? parseInt(e.target.value) : null)}
      placeholder="No limit"
      className="flex-1"
    />
    <span className="text-sm text-slate-500">seconds</span>
  </div>
  <p className="text-xs text-slate-500">(round-play state after reveal)</p>
</div>
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "fix(ui): correct answer_timer state comment in form"
```

---

## Task 8: Final Verification

**Files:**
- Test: All modified files

**Step 1: Run full build**

Run: `pnpm run build`

Expected: Build succeeds with no errors or new warnings

**Step 2: Run linter**

Run: `pnpm run lint`

Expected: No linting errors

**Step 3: Manual testing checklist**

After deploying/running locally, verify:

1. **Create game with round-end timer:**
   - Open Create Game dialog
   - Find "Round End Timer" field in Timers accordion
   - Set to 10 seconds
   - Create and start game
   - Play through a round
   - At round-end state, verify timer appears at bottom
   - Verify auto-advance to next round after 10 seconds

2. **Create game without round-end timer:**
   - Create new game
   - Leave round-end timer blank
   - Start and play through a round
   - At round-end state, verify no timer appears
   - Verify "Next" button works for manual advance

3. **Copy from previous game:**
   - Create game A with round-end timer = 15 seconds
   - Create game B
   - Click "Copy from Previous Game" button
   - Verify round-end timer is populated with 15 seconds

4. **Final round behavior:**
   - Create game with 2 rounds and round-end timer = 5 seconds
   - Play through to end of round 2
   - Verify timer at round-end advances to game-end (not round 3)

**Step 4: Document completion**

All tasks complete. Feature ready for code review and merge.

---

## Summary

**Total Tasks:** 8
**Estimated Time:** 30-40 minutes
**Files Modified:** 3
- `src/types/games.ts`
- `src/pages/ControllerPage.tsx`
- `src/components/games/GameEditModal.tsx`

**Testing:** Build verification after each task, manual testing checklist at end

**No database migration required** - metadata field is flexible JSON
