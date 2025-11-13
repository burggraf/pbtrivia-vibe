# Game Timers Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable timer editing in game edit modal for games in setup, ready, and in-progress states.

**Architecture:** Extract timer inputs from GameEditModal into reusable TimersAccordion component, remove edit-mode restriction to show timers in both create and edit modes.

**Tech Stack:** React 18, TypeScript, shadcn/ui (Accordion, Input, Label, Button), PocketBase

---

## Task 1: Extract TimersAccordion Component

**Files:**
- Create: `src/components/games/TimersAccordion.tsx`
- Reference: `src/components/games/GameEditModal.tsx:415-563`

**Step 1: Create TimersAccordion component file with TypeScript interface**

Create `src/components/games/TimersAccordion.tsx` with:

```typescript
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface TimerValues {
  question_timer?: number | null;
  answer_timer?: number | null;
  game_start_timer?: number | null;
  round_start_timer?: number | null;
  round_end_timer?: number | null;
  game_end_timer?: number | null;
  thanks_timer?: number | null;
}

interface TimersAccordionProps {
  timers: TimerValues;
  onTimersChange: (timers: TimerValues) => void;
  onCopyFromPrevious?: () => void;
}

export default function TimersAccordion({ timers, onTimersChange, onCopyFromPrevious }: TimersAccordionProps) {
  const handleTimerChange = (field: keyof TimerValues, value: string) => {
    onTimersChange({
      ...timers,
      [field]: value ? parseInt(value) : null
    })
  }

  return (
    <AccordionItem value="timers">
      <AccordionTrigger className="text-base font-semibold">
        Timers
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-4 pt-4">
          {/* Timer Inputs - 3 columns on large screens, 2 on medium, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Question Timer */}
            <div className="space-y-2">
              <Label htmlFor="question_timer" className="text-sm font-medium">
                Question
              </Label>
              <Input
                id="question_timer"
                type="number"
                min="0"
                max="300"
                value={timers.question_timer ?? ''}
                onChange={(e) => handleTimerChange('question_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Answer Display Timer */}
            <div className="space-y-2">
              <Label htmlFor="answer_timer" className="text-sm font-medium">
                Answer Display
              </Label>
              <Input
                id="answer_timer"
                type="number"
                min="0"
                max="600"
                value={timers.answer_timer ?? ''}
                onChange={(e) => handleTimerChange('answer_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Round Start Timer */}
            <div className="space-y-2">
              <Label htmlFor="round_start_timer" className="text-sm font-medium">
                Round Start
              </Label>
              <Input
                id="round_start_timer"
                type="number"
                min="0"
                max="600"
                value={timers.round_start_timer ?? ''}
                onChange={(e) => handleTimerChange('round_start_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Round End Timer */}
            <div className="space-y-2">
              <Label htmlFor="round_end_timer" className="text-sm font-medium">
                Round End
              </Label>
              <Input
                id="round_end_timer"
                type="number"
                min="0"
                max="600"
                value={timers.round_end_timer ?? ''}
                onChange={(e) => handleTimerChange('round_end_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Game Start Timer */}
            <div className="space-y-2">
              <Label htmlFor="game_start_timer" className="text-sm font-medium">
                Game Start
              </Label>
              <Input
                id="game_start_timer"
                type="number"
                min="0"
                max="600"
                value={timers.game_start_timer ?? ''}
                onChange={(e) => handleTimerChange('game_start_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Game End Timer */}
            <div className="space-y-2">
              <Label htmlFor="game_end_timer" className="text-sm font-medium">
                Game End
              </Label>
              <Input
                id="game_end_timer"
                type="number"
                min="0"
                max="600"
                value={timers.game_end_timer ?? ''}
                onChange={(e) => handleTimerChange('game_end_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Thanks Screen Timer */}
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="thanks_timer" className="text-sm font-medium">
                Thanks Screen
              </Label>
              <div className="flex items-center gap-2 lg:grid lg:grid-cols-3 lg:gap-4">
                <Input
                  id="thanks_timer"
                  type="number"
                  min="0"
                  max="600"
                  value={timers.thanks_timer ?? ''}
                  onChange={(e) => handleTimerChange('thanks_timer', e.target.value)}
                  placeholder="No limit"
                  className="w-32"
                />
                {onCopyFromPrevious && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCopyFromPrevious}
                    className="text-xs whitespace-nowrap lg:col-start-2"
                  >
                    Copy from Previous Game
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Helper Note */}
          <p className="text-xs text-slate-500 italic mt-2">
            Leave blank or enter 0 for no time limit (manual advance)
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
```

**Step 2: Verify component compiles**

Run: `pnpm run build`
Expected: TypeScript compilation succeeds (component not yet used)

**Step 3: Commit**

```bash
git add src/components/games/TimersAccordion.tsx
git commit -m "feat: extract TimersAccordion component

Extract timer inputs into reusable component for use in both
create and edit game modes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Refactor GameEditModal to Use TimersAccordion

**Files:**
- Modify: `src/components/games/GameEditModal.tsx`

**Step 1: Import TimersAccordion and remove inline timer section**

At top of file (after line 13), add:
```typescript
import TimersAccordion, { TimerValues } from './TimersAccordion'
```

Remove lines 415-563 (entire Timers AccordionItem section).

**Step 2: Replace removed section with TimersAccordion component**

After the Game Structure AccordionItem (around line 413), add:

```typescript
                {/* Timers Section - Create mode only */}
                {!isEdit && (
                  <TimersAccordion
                    timers={{
                      question_timer: formData.question_timer,
                      answer_timer: formData.answer_timer,
                      game_start_timer: formData.game_start_timer,
                      round_start_timer: formData.round_start_timer,
                      round_end_timer: formData.round_end_timer,
                      game_end_timer: formData.game_end_timer,
                      thanks_timer: formData.thanks_timer
                    }}
                    onTimersChange={(timers) => {
                      setFormData(prev => ({ ...prev, ...timers }))
                    }}
                    onCopyFromPrevious={handleCopyTimersFromPreviousGame}
                  />
                )}
```

**Step 3: Verify application builds and create mode works**

Run: `pnpm run build`
Expected: Build succeeds

Run: `pnpm run dev`
Open browser to dev server
Click "Create Game" button
Verify: Timers accordion appears and functions correctly
Expected: Timer inputs work, copy from previous game works

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "refactor: use TimersAccordion in create mode

Replace inline timer inputs with extracted TimersAccordion component.
No functional changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Enable Timer Editing in Edit Mode

**Files:**
- Modify: `src/components/games/GameEditModal.tsx`

**Step 1: Remove edit mode restriction from Timers section**

Find the TimersAccordion usage (should be around line 415 after previous changes).

Change from:
```typescript
                {/* Timers Section - Create mode only */}
                {!isEdit && (
                  <TimersAccordion
```

To:
```typescript
                {/* Timers Section */}
                <TimersAccordion
```

Remove the closing `)}` for the conditional.

**Step 2: Update comment to reflect edit mode availability**

Change comment from `{/* Timers Section - Create mode only */}` to `{/* Timers Section */}`

**Step 3: Verify timer editing works in edit mode**

Run: `pnpm run build`
Expected: Build succeeds

Run: `pnpm run dev`
- Create a test game with some timer values
- Click edit on the game
- Verify: Timers accordion appears in edit modal
- Change a timer value and save
- Verify: Timer value persists to database
- Edit game again
- Verify: Updated timer value appears

**Step 4: Test timer editing across game states**

- Create game (status: setup) - verify timers editable
- Change game to ready state - verify timers editable
- Change game to in-progress state - verify timers editable
- Verify: All timer changes save correctly

**Step 5: Test edge cases**

- Edit game with no metadata - verify defaults to null
- Set timer to empty/null - verify saves as null
- Enter invalid value (negative, non-number) - verify validation
- Copy from previous game in edit mode - verify works

**Step 6: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: enable timer editing in edit mode

Allow editing game timers for games in setup, ready, and
in-progress states. Timer changes save to games.metadata field.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Final Verification and Cleanup

**Files:**
- Verify: All game modal functionality

**Step 1: Run full build and verify no errors**

Run: `pnpm run build`
Expected: Build succeeds with no errors or warnings related to our changes

**Step 2: Verify complete feature functionality**

Test create mode:
- Open create game dialog
- Verify all 3 accordions present (Basic Info, Game Structure, Timers)
- Enter timer values
- Create game
- Verify timers saved to database

Test edit mode (setup state):
- Click edit on setup game
- Verify 2 accordions present (Basic Info, Timers)
- Modify timers
- Save
- Verify changes persisted

Test edit mode (ready state):
- Create game and mark as ready
- Click edit
- Verify timers editable
- Save changes
- Verify persisted

Test edit mode (in-progress state):
- Start a game (in-progress)
- Click edit
- Verify timers editable
- Save changes
- Verify persisted

Test backwards compatibility:
- Edit game created before timer feature
- Verify defaults to null values
- Add timer values
- Verify saves correctly

**Step 3: Verify no regressions**

- Delete game functionality still works
- Category selection (create mode) still works
- All existing game edit features work
- Timer copy from previous game still works

**Step 4: Final commit if any cleanup needed**

```bash
git status
# If any cleanup or fixes needed, commit them
git add .
git commit -m "chore: final cleanup for timer editing feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Implementation Notes

### Key Points
- TimersAccordion is a reusable component with clean interface
- GameEditModal already has all timer state management
- Only change needed is removing `!isEdit &&` restriction
- All timer persistence logic already exists (lines 118-140)
- Backwards compatible - null timers handled correctly

### Testing Checklist
- [ ] Timer inputs render in create mode
- [ ] Timer inputs render in edit mode
- [ ] Timer values save to database
- [ ] Timer values load from database
- [ ] Empty/null timers handled correctly
- [ ] Copy from previous game works
- [ ] Game deletion still works
- [ ] All game states (setup/ready/in-progress) allow editing
- [ ] Build completes without errors

### Files Changed
1. `src/components/games/TimersAccordion.tsx` - New component
2. `src/components/games/GameEditModal.tsx` - Refactored to use component

### Related Documentation
- Design: `docs/plans/2025-11-13-game-timers-editing-design.md`
- UI Guide: `docs/design/ui-style-guide.md`
- Project: `CLAUDE.md`
