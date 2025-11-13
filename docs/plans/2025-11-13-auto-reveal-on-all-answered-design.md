# Auto-Reveal on All Teams Answered Design

**Date:** 2025-11-13
**Status:** Approved
**Author:** Claude Code

## Overview

Add a game setting to control automatic answer reveal when all teams have answered, decoupling this behavior from timer configuration. This allows the auto-advance feature to work independently of whether question timers are configured.

## Requirements

### Functional Requirements

1. **New Game Setting**: Add toggle switch "Automatically reveal answer when all teams have answered?"
2. **Timer Independence**: Auto-advance works with or without question timer configured
3. **Consistent Behavior**: Maintains existing 3-second notification delay and threshold logic
4. **Smart Defaults**: Default to false initially, then copy from most recent game
5. **UI Placement**: Toggle appears in Timers section of game setup
6. **Backwards Compatible**: Existing games without setting default to false (manual advance)

### User Experience

**When setting is enabled:**
- All teams answer → Show "All teams have answered." notification
- Wait 3 seconds → Auto-advance to reveal answer
- Works regardless of whether question timer is active

**When setting is disabled (default):**
- All teams answer → No automatic action
- Host must manually click "Reveal Answer"
- Same behavior as current games without timer configuration

**Threshold logic (same as current):**
- If question timer has ≤3 seconds remaining when all teams answer
- Let timer expire naturally (no notification, no early advance)
- Only applies when question timer is active

## Architecture

### Approach: Flat Metadata Field

**Rationale:**
- Consistent with existing timer duration fields
- Minimal code changes (no restructuring needed)
- Clear separation: durations vs. behavioral settings
- No migration required for existing games

**Rejected Alternatives:**
1. **Nested timer_settings object**: Would require restructuring all timer metadata access
2. **Keep gated by hasTimersConfigured**: Doesn't allow auto-advance without timers

## Data Model

### GameMetadata Interface

```typescript
// src/types/games.ts

export interface GameMetadata {
  // Existing timer duration fields
  question_timer?: number | null
  answer_timer?: number | null
  game_start_timer?: number | null
  round_start_timer?: number | null
  round_end_timer?: number | null
  game_end_timer?: number | null
  thanks_timer?: number | null

  // NEW: Auto-reveal behavioral setting
  auto_reveal_on_all_answered?: boolean
}
```

**Storage:** JSON field in `games.metadata`

**Default Values:**
- `false` for first game (safe default, explicit opt-in)
- Copy from most recent game for subsequent games (same as timer values)

**Type:** Optional boolean (`undefined` treated as `false`)

## Components

### 1. TimersAccordion UI

**Location:** `src/components/games/TimersAccordion.tsx`

**Interface Extension:**

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

**UI Addition:**

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

    {/* Existing timer input grid unchanged */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ...
    </div>
  </div>
</AccordionContent>
```

**Design Decisions:**
- **Highlighted box**: Visually distinct from duration inputs
- **Switch control**: Binary yes/no setting (not checkbox)
- **Positioned first**: Visible without scrolling, logical before timer durations
- **Help text**: Explains what happens when enabled

### 2. GameEditModal Integration

**Location:** `src/components/games/GameEditModal.tsx`

**Form State Extension:**

```typescript
const [formData, setFormData] = useState<UpdateGameData | CreateGameData & {
  // ... existing fields
  auto_reveal_on_all_answered?: boolean;  // NEW
}>({
  // ... existing defaults
  auto_reveal_on_all_answered: false  // NEW: default for create mode
})
```

**Load from Game (Edit Mode):**

```typescript
useEffect(() => {
  if (game) {
    setFormData({
      // ... existing fields
      auto_reveal_on_all_answered: game.metadata?.auto_reveal_on_all_answered ?? false
    })
  } else {
    // Create mode - defaults to false initially
    setFormData({
      // ... existing defaults
      auto_reveal_on_all_answered: false
    })
  }
}, [game])
```

**Copy from Previous Game:**

```typescript
const handleCopyTimersFromPreviousGame = async () => {
  // ... existing logic to fetch previousGameWithTimers

  setFormData(prev => ({
    ...prev,
    question_timer: previousGameWithTimers.metadata?.question_timer || null,
    // ... other timer fields
    auto_reveal_on_all_answered: previousGameWithTimers.metadata?.auto_reveal_on_all_answered ?? false  // NEW
  }))
}
```

**Submit to Metadata:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const metadata: GameMetadata = {
    question_timer: ('question_timer' in formData ? formData.question_timer : null) || null,
    // ... other timer fields
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

**Pass to TimersAccordion:**

```tsx
<TimersAccordion
  timers={{
    question_timer: 'question_timer' in formData ? formData.question_timer : null,
    // ... other timer fields
    auto_reveal_on_all_answered: 'auto_reveal_on_all_answered' in formData ? formData.auto_reveal_on_all_answered : false
  }}
  onTimersChange={(timers) => {
    setFormData(prev => ({ ...prev, ...timers }))
  }}
  onCopyFromPrevious={handleCopyTimersFromPreviousGame}
/>
```

### 3. Controller Logic

**Location:** `src/pages/ControllerPage.tsx` (around line 316-355)

**Current Logic:**

```typescript
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  const hasTimersConfigured = game?.metadata && (
    (game.metadata.question_timer && game.metadata.question_timer > 0) ||
    (game.metadata.answer_timer && game.metadata.answer_timer > 0)
  )

  if (hasTimersConfigured) {
    // Early advance logic...
  }
}
```

**New Logic:**

```typescript
if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
  // CHANGED: Check auto-reveal setting instead of hasTimersConfigured
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

**Key Changes:**
1. Replace `hasTimersConfigured` check with `auto_reveal_on_all_answered` check
2. Default to `false` if undefined (backwards compatible)
3. Maintain all existing logic (3-second threshold, notification, pause checks)

## Behavior Matrix

| Question Timer | auto_reveal_on_all_answered | Remaining Time | Result |
|---|---|---|---|
| Active (10s) | `true` | >3s | Show notification → auto-advance after 3s |
| Active (10s) | `true` | ≤3s | Let timer expire naturally (no notification) |
| Active (10s) | `false` | Any | Wait for manual advance |
| None (manual) | `true` | N/A | Show notification → auto-advance after 3s |
| None (manual) | `false` | N/A | Wait for manual advance |
| Paused | `true` | N/A | Wait for manual advance (pause prevents auto) |

**Key Insights:**
- Setting works independently of timer configuration
- Threshold logic (≤3s) only applies when question timer is active
- Pause state always prevents automatic advance (existing behavior)
- Defaults to `false` for safety (explicit opt-in)

## Edge Cases

### 1. Game Without Setting (Backwards Compatibility)

**Scenario:** Existing game created before this feature, `metadata.auto_reveal_on_all_answered` is `undefined`.

**Behavior:** `auto_reveal_on_all_answered ?? false` evaluates to `false` → Manual advance required.

**Rationale:** Safe default, no behavior change for existing games.

### 2. Manual Mode (No Question Timer)

**Scenario:** `auto_reveal_on_all_answered = true`, no question timer configured (manual mode).

**Calculation:** `remainingMs = Infinity` (no expiresAt)

**Behavior:** `Infinity > 3000` → Show notification, auto-advance after 3s.

**Rationale:** Setting explicitly enables auto-advance, works as expected without timer.

### 3. Timer Paused When All Teams Answer

**Scenario:** Question timer paused, all teams answer, setting is `true`.

**Behavior:** No auto-advance (existing check: `!gameData.timer?.isPaused`).

**Rationale:** Pause state prevents automatic transitions (existing safeguard).

### 4. Exactly 3 Seconds Remaining

**Scenario:** Question timer has exactly 3000ms remaining, all teams answer, setting is `true`.

**Behavior:** `3000 > 3000` → false → Let timer expire naturally.

**Rationale:** Clean boundary, avoids overlapping timers.

### 5. Team Changes Answer During Notification

**Scenario:** Notification showing, team changes answer (teamsAnswered drops below threshold).

**Behavior:** Notification continues (timer already has `isEarlyAdvance: true` flag).

**Rationale:** Simple, predictable (same as current behavior). Not worth added complexity to cancel.

### 6. Copy Timers from Game Without Setting

**Scenario:** User clicks "Copy from Previous Game", that game has no `auto_reveal_on_all_answered`.

**Behavior:** `previousGameWithTimers.metadata?.auto_reveal_on_all_answered ?? false` → Copies `false`.

**Rationale:** Safe fallback, consistent with backwards compatibility.

## Implementation Steps

1. **Update TypeScript types**
   - Add `auto_reveal_on_all_answered?: boolean` to `GameMetadata` interface in `src/types/games.ts`

2. **Extend TimersAccordion component**
   - Add field to `TimerValues` interface
   - Add Switch UI control with descriptive label and help text
   - Position at top of accordion content with highlighted background

3. **Update GameEditModal**
   - Extend form state with new field (default `false`)
   - Load from game metadata in edit mode
   - Include in `handleCopyTimersFromPreviousGame`
   - Add to metadata object in `handleSubmit`
   - Pass to TimersAccordion component

4. **Modify ControllerPage logic**
   - Replace `hasTimersConfigured` check with `auto_reveal_on_all_answered ?? false`
   - Update console logs for clarity
   - No changes to threshold logic or notification behavior

## Testing Strategy

### Manual Testing Scenarios

1. **First game (default false)**:
   - Create new game, verify toggle is OFF by default
   - All teams answer → Verify no auto-advance (manual required)

2. **Enable setting**:
   - Create game with toggle ON
   - Start question with 10-second timer
   - All teams answer at 8 seconds remaining
   - Verify notification appears, auto-advance after 3s

3. **Manual mode with setting enabled**:
   - Create game with toggle ON, no question timer
   - Start question manually
   - All teams answer
   - Verify notification appears, auto-advance after 3s

4. **Threshold logic (≤3s remaining)**:
   - Create game with toggle ON, 10-second timer
   - Wait 7+ seconds
   - All teams answer (≤3s remaining)
   - Verify no notification, timer expires naturally

5. **Copy from previous game**:
   - Create game with toggle ON
   - Create second game, click "Copy from Previous Game"
   - Verify toggle copies to ON in new game

6. **Edit existing game**:
   - Edit game, toggle setting ON, save
   - Verify setting persists after save
   - Edit again, toggle OFF, save
   - Verify change persists

7. **Backwards compatibility**:
   - Load game created before this feature
   - Verify toggle appears as OFF (default)
   - Enable toggle, save, verify works

8. **Paused timer**:
   - Create game with toggle ON, 10-second timer
   - Pause timer, all teams answer
   - Verify no auto-advance (pause prevents it)

## Success Criteria

- ✅ Toggle switch appears in Timers section with clear label and help text
- ✅ Defaults to false for first game, copies from previous game thereafter
- ✅ Auto-advance works when enabled, regardless of timer configuration
- ✅ Maintains existing 3-second notification and threshold logic (≤3s)
- ✅ Pause state prevents auto-advance (existing safeguard)
- ✅ Backwards compatible (existing games default to false)
- ✅ "Copy from Previous Game" includes the new setting
- ✅ Setting persists correctly when creating/editing games

## Future Enhancements

- Make notification duration configurable (currently hardcoded to 3 seconds)
- Make threshold configurable (currently hardcoded to ≤3 seconds remaining)
- Add separate setting for "immediate advance" (no 3-second delay)
- Add sound/haptic feedback when notification appears
- Add analytics to track how often hosts use this feature
