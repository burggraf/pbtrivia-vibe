# Round-End Timer Design

**Date:** 2025-11-11
**Status:** Approved
**Type:** Feature Addition

## Overview

Add a configurable timer for the `round-end` game state, following the established pattern used by the other 6 game state timers (game-start, round-start, round-play question/answer, game-end, thanks).

## Requirements

- Timer should be configurable in the Create Game dialog
- Default value: null (no timer, manual advance)
- Timer should auto-advance from round-end to the next round (or game-end if final round)
- No changes to display content - only implement timer advancement logic

## Architecture

### Type Definition Changes

**File:** `src/types/games.ts`

Add `round_end_timer` field to the `GameMetadata` interface:

```typescript
export interface GameMetadata {
  // Key timers (descriptive names for primary gameplay)
  question_timer?: number | null;        // round-play state
  answer_timer?: number | null;          // round-play state (after reveal)

  // Transition timers (state-based names)
  game_start_timer?: number | null;      // game-start state
  round_start_timer?: number | null;     // round-start state
  round_end_timer?: number | null;       // round-end state  <-- NEW
  game_end_timer?: number | null;        // game-end state
  thanks_timer?: number | null;          // thanks state
}
```

### Controller Logic Changes

**File:** `src/pages/ControllerPage.tsx`

#### Change 1: Update `createTimerForState()` function (lines 65-103)

Add case for `'round-end'` state:

```typescript
switch (state) {
  case 'game-start':
    timerSeconds = metadata.game_start_timer
    break
  case 'round-start':
    timerSeconds = metadata.round_start_timer
    break
  case 'round-play':
    timerSeconds = isAnswerRevealed ? metadata.answer_timer : metadata.question_timer
    break
  case 'round-end':  // <-- ADD THIS CASE
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

#### Change 2: Update round-end transition (around line 580-587)

Modify the transition to include timer:

```typescript
// End of round
console.log('🔍 DEBUG: Ending round')
const newGameData: GameData = {
  state: 'round-end',
  round: gameData.round
}
// Add timer if configured  <-- ADD THIS
const timer = createTimerForState('round-end', false, game?.metadata)
if (timer) newGameData.timer = timer

await updateGameDataClean(newGameData)
return
```

### UI Changes

**File:** `src/components/games/GameEditModal.tsx`

#### Change 1: Add to formData type (lines 31-36)
```typescript
round_end_timer?: number | null;
```

#### Change 2: Initialize in edit mode useEffect (lines 66-71)
```typescript
round_end_timer: game.metadata?.round_end_timer || null
```

#### Change 3: Initialize in create mode reset (lines 96-100+)
```typescript
round_end_timer: null
```

#### Change 4: Add timer input field (after line 493, before Game End Timer)

```tsx
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
```

#### Change 5: Update "Copy from Previous Game" function

Update filter (line 195-196):
```typescript
g.metadata?.round_end_timer !== undefined
```

Update copy operation (around line 221):
```typescript
round_end_timer: previousGameWithTimers.metadata?.round_end_timer || null
```

#### Bonus Fix: Correct existing comment error (line 470)
Change from `(round-end state)` to `(round-play state after reveal)` for the answer_timer field.

## Database Changes

**None required.** The `metadata` field is a flexible JSON field that already accepts any properties. No schema migration needed.

## Testing Plan

1. **Create game with round-end timer:**
   - Set round-end timer to 10 seconds
   - Play through a round
   - Verify timer appears at round-end state
   - Verify auto-advance to next round after 10 seconds

2. **Create game without round-end timer:**
   - Leave round-end timer blank
   - Play through a round
   - Verify no timer appears at round-end state
   - Verify manual "Next" button works

3. **Copy timers from previous game:**
   - Create game A with round-end timer set to 15 seconds
   - Create game B and use "Copy from Previous Game"
   - Verify round-end timer is copied to game B

4. **Final round behavior:**
   - Play through to final round
   - Verify timer at round-end advances to game-end state (not next round)

## Implementation Order

1. Update type definition (`src/types/games.ts`)
2. Update controller logic (`src/pages/ControllerPage.tsx`)
3. Update UI form (`src/components/games/GameEditModal.tsx`)
4. Test all scenarios
5. Commit and push

## Success Criteria

- Round-end timer can be configured in Create Game dialog
- Timer follows same pattern as all other game state timers
- Timer correctly auto-advances when configured
- Manual advance still works when timer is not configured
- No regressions to existing timer functionality
