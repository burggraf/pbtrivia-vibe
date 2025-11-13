# Auto-Reveal on All Teams Answered Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add game setting to control automatic answer reveal when all teams have answered, independent of timer configuration.

**Architecture:** Add boolean field to game metadata, expose via Switch control in TimersAccordion, integrate with GameEditModal form state, and replace hasTimersConfigured check in ControllerPage with new setting.

**Tech Stack:** TypeScript, React, shadcn/ui Switch component, PocketBase metadata JSON field

**Design Document:** See `docs/plans/2025-11-13-auto-reveal-on-all-answered-design.md` for full design details

---

## Task 1: Update GameMetadata Type Definition

**Files:**
- Modify: `src/types/games.ts` (GameMetadata interface)

**Step 1: Add auto_reveal_on_all_answered field to GameMetadata interface**

Open `src/types/games.ts` and locate the `GameMetadata` interface. Add the new field:

```typescript
export interface GameMetadata {
  question_timer?: number | null
  answer_timer?: number | null
  game_start_timer?: number | null
  round_start_timer?: number | null
  round_end_timer?: number | null
  game_end_timer?: number | null
  thanks_timer?: number | null
  auto_reveal_on_all_answered?: boolean  // NEW
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: TypeScript compilation succeeds with no errors related to GameMetadata

**Step 3: Commit**

```bash
git add src/types/games.ts
git commit -m "feat: add auto_reveal_on_all_answered to GameMetadata type"
```

---

## Task 2: Update TimersAccordion Component

**Files:**
- Modify: `src/components/games/TimersAccordion.tsx`

**Step 1: Add field to TimerValues interface**

Locate the `TimerValues` interface at the top of the file and add the new field:

```typescript
export interface TimerValues {
  question_timer?: number | null;
  answer_timer?: number | null;
  game_start_timer?: number | null;
  round_start_timer?: number | null;
  round_end_timer?: number | null;
  game_end_timer?: number | null;
  thanks_timer?: number | null;
  auto_reveal_on_all_answered?: boolean;  // NEW
}
```

**Step 2: Add required imports**

At the top of the file, add Switch import from shadcn/ui:

```typescript
import { Switch } from '@/components/ui/switch'
```

**Step 3: Add Switch UI control**

Inside the `AccordionContent`, add the new switch control BEFORE the existing timer input grid:

```tsx
<AccordionContent>
  <div className="grid gap-4 pt-4">
    {/* NEW: Auto-reveal setting - appears first */}
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
      <div className="flex-1">
        <Label htmlFor="auto_reveal" className="text-sm font-medium cursor-pointer">
          Automatically reveal answer when all teams have answered
        </Label>
        <p className="text-xs text-slate-500 mt-1">
          Shows 3-second notification then advances to answer reveal
        </p>
      </div>
      <Switch
        id="auto_reveal"
        checked={timers.auto_reveal_on_all_answered ?? false}
        onCheckedChange={(checked) => {
          onTimersChange({
            ...timers,
            auto_reveal_on_all_answered: checked
          })
        }}
      />
    </div>

    {/* Existing timer input grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Question Timer */}
      <div className="space-y-2">
        ...existing timer inputs...
```

**Step 4: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: TypeScript compilation succeeds, no errors

**Step 5: Manual UI test (optional but recommended)**

Run: `pnpm run dev`

Navigate to Create Game dialog → Timers section

Expected:
- Switch control appears at top with label and help text
- Switch is OFF by default
- Clicking switch toggles state
- Background is highlighted (light grey in light mode, darker in dark mode)

**Step 6: Commit**

```bash
git add src/components/games/TimersAccordion.tsx
git commit -m "feat: add auto-reveal switch to TimersAccordion UI"
```

---

## Task 3: Update GameEditModal Form Integration

**Files:**
- Modify: `src/components/games/GameEditModal.tsx`

**Step 1: Extend form state type**

Locate the `useState` declaration for `formData` (around line 28) and add the new field to the type definition:

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
  auto_reveal_on_all_answered?: boolean;  // NEW
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
  thanks_timer: null,
  auto_reveal_on_all_answered: false  // NEW: default to false
})
```

**Step 2: Load from game in edit mode**

Locate the `useEffect` hook that loads game data (around line 59). Update the edit mode branch:

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
      thanks_timer: game.metadata?.thanks_timer || null,
      auto_reveal_on_all_answered: game.metadata?.auto_reveal_on_all_answered ?? false  // NEW
    })
  } else {
    // Create mode defaults remain unchanged (already includes auto_reveal_on_all_answered: false)
    ...existing create mode logic...
  }
}, [game])
```

**Step 3: Update handleCopyTimersFromPreviousGame**

Locate the `handleCopyTimersFromPreviousGame` function (around line 190) and add the new field to the copy logic:

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
  thanks_timer: previousGameWithTimers.metadata?.thanks_timer || null,
  auto_reveal_on_all_answered: previousGameWithTimers.metadata?.auto_reveal_on_all_answered ?? false  // NEW
}))
```

**Step 4: Include in metadata on submit**

Locate the `handleSubmit` function (around line 119) and add the new field to the metadata object:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Convert empty/zero values to null for timers
  const metadata: GameMetadata = {
    question_timer: ('question_timer' in formData ? formData.question_timer : null) || null,
    answer_timer: ('answer_timer' in formData ? formData.answer_timer : null) || null,
    game_start_timer: ('game_start_timer' in formData ? formData.game_start_timer : null) || null,
    round_start_timer: ('round_start_timer' in formData ? formData.round_start_timer : null) || null,
    round_end_timer: ('round_end_timer' in formData ? formData.round_end_timer : null) || null,
    game_end_timer: ('game_end_timer' in formData ? formData.game_end_timer : null) || null,
    thanks_timer: ('thanks_timer' in formData ? formData.thanks_timer : null) || null,
    auto_reveal_on_all_answered: ('auto_reveal_on_all_answered' in formData ? formData.auto_reveal_on_all_answered : false)  // NEW
  }

  const submitData = {
    ...formData,
    metadata,
    startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
  }

  await onSave(submitData)
  onClose()
}
```

**Step 5: Pass to TimersAccordion component**

Locate the `<TimersAccordion>` component usage (around line 417) and add the new field:

```tsx
<TimersAccordion
  timers={{
    question_timer: 'question_timer' in formData ? formData.question_timer : null,
    answer_timer: 'answer_timer' in formData ? formData.answer_timer : null,
    game_start_timer: 'game_start_timer' in formData ? formData.game_start_timer : null,
    round_start_timer: 'round_start_timer' in formData ? formData.round_start_timer : null,
    round_end_timer: 'round_end_timer' in formData ? formData.round_end_timer : null,
    game_end_timer: 'game_end_timer' in formData ? formData.game_end_timer : null,
    thanks_timer: 'thanks_timer' in formData ? formData.thanks_timer : null,
    auto_reveal_on_all_answered: 'auto_reveal_on_all_answered' in formData ? formData.auto_reveal_on_all_answered : false  // NEW
  }}
  onTimersChange={(timers) => {
    setFormData(prev => ({ ...prev, ...timers }))
  }}
  onCopyFromPrevious={handleCopyTimersFromPreviousGame}
/>
```

**Step 6: Update handleInputChange type signature**

Locate the `handleInputChange` function (around line 143) and add the new field to the type union:

```typescript
const handleInputChange = (
  field: keyof (UpdateGameData | CreateGameData) | 'rounds' | 'questionsPerRound' | 'categories' |
         'question_timer' | 'answer_timer' | 'game_start_timer' | 'round_start_timer' | 'round_end_timer' | 'game_end_timer' | 'thanks_timer' |
         'auto_reveal_on_all_answered',  // NEW
  value: string | number | string[] | null | undefined | boolean  // Add boolean to value type
) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

**Step 7: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: TypeScript compilation succeeds, no errors

**Step 8: Manual form test (optional but recommended)**

Run: `pnpm run dev`

Test scenarios:
1. Create new game → Toggle switch ON → Save → Edit game → Verify switch is ON
2. Create game with switch ON → Create another game → Click "Copy from Previous Game" → Verify switch copies to ON
3. Edit existing game → Toggle switch → Save → Reload page → Verify persists

**Step 9: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: integrate auto-reveal setting in GameEditModal form"
```

---

## Task 4: Update ControllerPage Logic

**Files:**
- Modify: `src/pages/ControllerPage.tsx` (early-advance subscription logic around line 316-355)

**Step 1: Replace hasTimersConfigured check with auto_reveal_on_all_answered**

Locate the early-advance logic in the game_answers subscription handler (around line 316). Replace the existing logic:

**BEFORE (lines 316-355):**
```typescript
// If all answered and no early-advance timer exists yet and timer not paused
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  // Only trigger early advance if timers are configured
  const hasTimersConfigured = game?.metadata && (
    (game.metadata.question_timer && game.metadata.question_timer > 0) ||
    (game.metadata.answer_timer && game.metadata.answer_timer > 0)
  )

  if (hasTimersConfigured) {
    // Check remaining time on question timer
    const questionTimerExpiresAt = gameData.timer?.expiresAt
    const remainingMs = questionTimerExpiresAt
      ? new Date(questionTimerExpiresAt).getTime() - Date.now()
      : Infinity

    // Only trigger 3-second early advance if >3 seconds remain
    if (remainingMs > 3000) {
      console.log('🎉 All teams answered! Triggering notification for 3 seconds')

      // Create 3-second early-advance timer WITH notification flag
      const timer = {
        startedAt: new Date().toISOString(),
        duration: 3,
        expiresAt: new Date(Date.now() + 3000).toISOString(),
        isEarlyAdvance: true,
        showAsNotification: true
      }

      await updateGameDataClean({
        ...gameData,
        timer
      })
    } else {
      // Let existing question timer expire naturally
      console.log('👥 All teams answered with ≤3s remaining, letting timer expire naturally')
    }
  } else {
    console.log('🎉 All teams answered! Waiting for manual advance (no timers configured)')
  }
}
```

**AFTER:**
```typescript
// If all answered and no early-advance timer exists yet and timer not paused
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  // Check if auto-reveal setting is enabled
  const autoRevealEnabled = game?.metadata?.auto_reveal_on_all_answered ?? false

  if (autoRevealEnabled) {
    // Check remaining time on question timer
    const questionTimerExpiresAt = gameData.timer?.expiresAt
    const remainingMs = questionTimerExpiresAt
      ? new Date(questionTimerExpiresAt).getTime() - Date.now()
      : Infinity

    // Only trigger 3-second early advance if >3 seconds remain
    if (remainingMs > 3000) {
      console.log('🎉 All teams answered! Triggering notification for 3 seconds')

      // Create 3-second early-advance timer WITH notification flag
      const timer = {
        startedAt: new Date().toISOString(),
        duration: 3,
        expiresAt: new Date(Date.now() + 3000).toISOString(),
        isEarlyAdvance: true,
        showAsNotification: true
      }

      await updateGameDataClean({
        ...gameData,
        timer
      })
    } else {
      // Let existing question timer expire naturally
      console.log('👥 All teams answered with ≤3s remaining, letting timer expire naturally')
    }
  } else {
    console.log('👥 All teams answered! Waiting for manual advance (auto-reveal disabled)')
  }
}
```

**Key changes:**
- Line ~319: Remove `hasTimersConfigured` calculation (8 lines)
- Line ~324: Replace `if (hasTimersConfigured)` with `if (autoRevealEnabled)`
- Line ~318: Add `const autoRevealEnabled = game?.metadata?.auto_reveal_on_all_answered ?? false`
- Line ~353: Update console.log message from "no timers configured" to "auto-reveal disabled"

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: TypeScript compilation succeeds, no errors

**Step 3: Manual integration test**

This requires a full game flow test. Run: `pnpm run dev`

Test scenarios:

**Scenario 1: Setting disabled (default)**
1. Create game with auto-reveal toggle OFF
2. Start game with 2 teams
3. Start question with 10-second timer
4. Have all teams answer
5. Expected: No notification, no auto-advance (manual "Reveal Answer" required)

**Scenario 2: Setting enabled with timer >3s**
1. Create game with auto-reveal toggle ON, 10-second question timer
2. Start game with 2 teams
3. Start question
4. Have all teams answer within first 5 seconds
5. Expected: "All teams have answered" notification appears, auto-advances after 3s

**Scenario 3: Setting enabled with timer ≤3s**
1. Create game with auto-reveal toggle ON, 10-second question timer
2. Start game with 2 teams
3. Start question
4. Wait 7+ seconds
5. Have all teams answer (≤3s remaining)
6. Expected: No notification, timer expires naturally, then auto-advances

**Scenario 4: Setting enabled in manual mode (no timer)**
1. Create game with auto-reveal toggle ON, NO question timer
2. Start game with 2 teams
3. Start question manually
4. Have all teams answer
5. Expected: "All teams have answered" notification appears, auto-advances after 3s

**Step 4: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: replace hasTimersConfigured check with auto_reveal_on_all_answered setting"
```

---

## Task 5: Final Verification and Documentation

**Step 1: Run full build**

Run: `pnpm run build`

Expected: Clean build with no TypeScript errors

**Step 2: Test backwards compatibility**

If you have access to a game created before this feature:
1. Load the game
2. Expected: Toggle appears as OFF (defaults to false)
3. Can toggle ON and save
4. Behavior changes correctly

**Step 3: Verify all test scenarios**

Run through all test scenarios from Task 4, Step 3 one more time to ensure everything works end-to-end.

**Step 4: Final commit (if any cleanup needed)**

If you made any minor fixes during testing:

```bash
git add .
git commit -m "chore: final cleanup for auto-reveal feature"
```

**Step 5: Update implementation plan status**

Add completion note to this plan:

```markdown
## Implementation Status

✅ **Completed:** [DATE]
- All tasks implemented and tested
- Backwards compatibility verified
- Manual testing scenarios passed
```

---

## Testing Checklist

Use this checklist to verify the implementation:

- [ ] TypeScript compilation succeeds (`pnpm run build`)
- [ ] Switch appears in Timers section with correct styling
- [ ] Default value is OFF for new games
- [ ] Toggle persists when saving/editing games
- [ ] "Copy from Previous Game" includes the setting
- [ ] Auto-advance works when enabled (with timer >3s)
- [ ] Auto-advance skipped when ≤3s remaining
- [ ] Auto-advance works in manual mode (no timer)
- [ ] No auto-advance when setting disabled
- [ ] Backwards compatibility (old games default to OFF)
- [ ] Console logs show correct messages
- [ ] Pause state still prevents auto-advance

---

## Rollback Plan

If issues are discovered after merging:

1. **Quick disable:** Set default to `false` everywhere
2. **Full rollback:**
   ```bash
   git revert <commit-sha-task-4>
   git revert <commit-sha-task-3>
   git revert <commit-sha-task-2>
   git revert <commit-sha-task-1>
   ```

---

## Future Enhancements

See design document for future enhancement ideas:
- Configurable notification duration
- Configurable threshold (≤3s)
- Immediate advance option (no 3s delay)
- Sound/haptic feedback
- Usage analytics
