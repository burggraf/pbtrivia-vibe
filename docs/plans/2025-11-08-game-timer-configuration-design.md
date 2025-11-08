# Game Timer Configuration Design

**Date:** 2025-11-08
**Status:** Approved
**Scope:** UI-only implementation (timer configuration, no enforcement)

## Overview

Add timer configuration to the game creation flow, allowing hosts to set time limits for each game state. Timers are stored in `games.metadata` but not yet enforced during gameplay - this is purely a data capture feature for future use.

## Requirements

- Add timer inputs for all 6 game states to Create Game dialog
- Store timer values in existing `games.metadata` JSON field
- Make dialog scrollable with accordion organization
- Provide "Copy from Previous Game" quick-fill option
- Support null/0 values meaning "no time limit"
- Mobile-responsive layout

## Data Model

### Game States & Timer Mapping

The application has these game play states:

| State | Timer Field Name | Purpose |
|-------|-----------------|---------|
| `game-start` | `game_start_timer` | Welcome screen with team display |
| `round-start` | `round_start_timer` | Beginning of round announcement |
| `round-play` | `question_timer` | Question answering period |
| `round-end` | `answer_timer` | Show correct answer and scores |
| `game-end` | `game_end_timer` | Final game results |
| `thanks` | `thanks_timer` | Thank you screen |

### Metadata Schema

```typescript
interface GameMetadata {
  // Key timers (descriptive names for primary gameplay)
  question_timer?: number | null;        // round-play state
  answer_timer?: number | null;          // round-end state

  // Transition timers (state-based names)
  game_start_timer?: number | null;      // game-start state
  round_start_timer?: number | null;     // round-start state
  game_end_timer?: number | null;        // game-end state
  thanks_timer?: number | null;          // thanks state
}
```

### Timer Value Semantics

- `null`, `undefined`, or `0` = no time limit (manual advance by host)
- Positive number = seconds to display that state before auto-advancing
- All values stored as seconds (not milliseconds)

### Type Updates Required

Update `src/types/games.ts`:

```typescript
export interface Game {
  // ... existing fields ...
  metadata?: GameMetadata;
}

export interface CreateGameData {
  // ... existing fields ...
  metadata?: GameMetadata;
}

export interface UpdateGameData {
  // ... existing fields ...
  metadata?: GameMetadata;
}
```

## UI Design

### GameEditModal Refactoring

Transform the existing single-form modal into an accordion-based layout:

#### Accordion Structure

1. **Basic Game Info** (accordion section)
   - Fields: Name, Start Date, Duration, Location
   - Default state: Expanded on first open, collapsed on subsequent opens
   - Always visible in both Create and Edit modes

2. **Game Structure** (accordion section)
   - Fields: Rounds, Questions per Round, Categories
   - Default state: Collapsed
   - Visibility: Create mode only (matches existing pattern)

3. **Timers** (accordion section)
   - Fields: All 6 timer inputs
   - "Copy from Previous Game" button
   - Default state: Expanded on first create
   - Visibility: Create mode only

#### Dialog Improvements

**Responsive Sizing:**
- Current: Fixed `sm:max-w-[425px]`
- New: `max-w-[600px]` for better desktop space

**Scrollability:**
- Add `max-h-[80vh] overflow-y-auto` to DialogContent wrapper
- Ensures all content accessible on smaller screens
- Accordion sections provide natural organization within scrollable area

### Timer Input Layout

```
┌─ Timers ──────────────────────────────────────┐
│                    [Copy from Previous Game]   │
│                                                │
│ Desktop: 2-column grid                         │
│ Mobile: 1-column stack                         │
│                                                │
│ Question Timer          Answer Display Timer   │
│ [____] seconds         [____] seconds         │
│ (round-play)           (round-end)            │
│                                                │
│ Round Start Timer      Game Start Timer       │
│ [____] seconds         [____] seconds         │
│                                                │
│ Game End Timer         Thanks Screen Timer    │
│ [____] seconds         [____] seconds         │
│                                                │
│ Note: Leave blank or enter 0 for no limit     │
└────────────────────────────────────────────────┘
```

### Timer Input Specifications

**Input Field Properties:**
- Type: `number`
- Min: 0
- Max: 300 for `question_timer`, 600 for others
- Placeholder: "No limit"
- Helper text: State name in parentheses for clarity
- Mobile: Minimum 44px height for touch targets

**Validation:**
- Empty string converts to `null` on submit
- "0" converts to `null` on submit
- Numbers 1-300/600 stored as-is
- Client-side validation prevents exceeding max
- No minimum enforced (allows 1 second if desired)

### Copy from Previous Game Feature

**Behavior:**
1. Fetches most recent game by the current host
2. Filters for games where `metadata` exists and has timer values
3. Populates all timer fields with values from that game
4. Shows toast notification: "Copied timers from [Game Name]"
5. Button disabled if no previous games with timers exist

**Implementation Notes:**
- Query: `getList` sorted by `created` descending, limit 50
- Filter client-side for games with `metadata.question_timer` (existence check)
- Use most recent match
- Non-destructive: Host can still modify values after copy

## Form Behavior

### Default Values

**Create Mode:**
- All timer fields start empty (`null` in state)
- No pre-populated defaults
- Host explicitly configures only the timers they need

**Edit Mode:**
- Timers section NOT displayed
- Existing metadata preserved but not editable
- Rationale: Timers are "set and forget" - changing mid-game could confuse players

### Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Convert empty/zero to null
  const metadata: GameMetadata = {
    question_timer: formData.question_timer || null,
    answer_timer: formData.answer_timer || null,
    game_start_timer: formData.game_start_timer || null,
    round_start_timer: formData.round_start_timer || null,
    game_end_timer: formData.game_end_timer || null,
    thanks_timer: formData.thanks_timer || null
  }

  const submitData = {
    ...formData,
    metadata: metadata,
    startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
  }

  await onSave(submitData)
  onClose()
}
```

### Validation Rules

- Timers are optional - form can be submitted with all blank
- Maximum values enforced client-side (HTML5 validation + visual feedback)
- No backend validation needed - database accepts any valid JSON

## Technical Implementation

### Components to Modify

1. **`src/components/games/GameEditModal.tsx`**
   - Add accordion structure using shadcn Accordion component
   - Add 6 timer input fields
   - Implement "Copy from Previous Game" functionality
   - Update form state to include timer fields
   - Adjust dialog sizing and scrollability

2. **`src/types/games.ts`**
   - Add `GameMetadata` interface
   - Update `Game`, `CreateGameData`, `UpdateGameData` interfaces

### New Imports Required

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
```

### Database

**No migration needed** - `games.metadata` field already exists (migration 1761921011).

## Implementation Scope

### In Scope ✅

- TypeScript type definitions for `GameMetadata`
- Accordion-based modal refactoring
- All 6 timer input fields with validation
- "Copy from Previous Game" functionality
- Scrollable dialog with responsive sizing
- Saving timer data to `games.metadata`
- Mobile-responsive layout

### Out of Scope ❌ (Future Work)

- Timer enforcement during gameplay
- Auto-advance between game states
- Countdown displays in player/host views
- Warning indicators when time is running low
- Timer pause/resume controls

This is purely a data capture feature. The timer values will be stored and ready for future implementation of timer enforcement logic.

## Testing Plan

### Manual Testing Checklist

**Create Game Flow:**
- [ ] Open Create Game dialog, verify accordion sections render
- [ ] Expand/collapse each accordion section
- [ ] Enter timer values, verify validation (max limits)
- [ ] Leave timers blank, create game successfully
- [ ] Verify metadata saved correctly in PocketBase admin
- [ ] Test "Copy from Previous Game" with no previous games (button disabled)
- [ ] Create game with timers, then create second game
- [ ] Test "Copy from Previous Game" successfully populates fields
- [ ] Verify toast notification appears

**Mobile Responsive:**
- [ ] Test on mobile viewport (375px width)
- [ ] Verify single-column timer layout
- [ ] Verify touch targets are 44px minimum height
- [ ] Test scrolling within dialog on small screens

**Edit Game Flow:**
- [ ] Open Edit Game dialog for existing game
- [ ] Verify Timers section NOT displayed
- [ ] Edit other fields, save successfully
- [ ] Verify metadata unchanged after edit

### Edge Cases

- [ ] Enter 0 in timer field - should save as null
- [ ] Enter empty string - should save as null
- [ ] Enter max value (300/600) - should accept
- [ ] Try to exceed max - should prevent input
- [ ] Multiple rapid clicks on "Copy from Previous Game"

## Design Decisions

### Why Not Show Timers in Edit Mode?

Following the existing pattern where Categories are only shown in Create mode. Rationale:
- Timers should be set before game starts
- Changing timers mid-game creates player confusion
- Keeps Edit dialog simpler and focused on metadata (name, date, location)

### Why No Preset Templates?

Starting with maximum flexibility - hosts can configure exactly what they need. Future enhancement could add presets like "Quick Game" or "Tournament Mode" if user feedback indicates this would be valuable.

### Why "Copy from Previous Game" Instead of "Save as Template"?

Simpler UX for MVP - no template management UI needed. Most hosts run similar games repeatedly, so copying from last game achieves 90% of the use case with minimal complexity.

### Why Separate question_timer vs game_start_timer Naming?

Hybrid approach balances clarity:
- Frequently-used timers get descriptive names (question, answer)
- Less-used transitions get state-based names
- Matches how hosts think about the game flow

## Future Enhancements

1. **Timer Enforcement** - Actually use timer values to auto-advance states
2. **Countdown UI** - Visual countdown in player/host views
3. **Timer Presets** - Quick-select templates for common game types
4. **Edit Mode Timers** - Allow editing with warnings about in-progress games
5. **Per-Round Timers** - Different timers for different rounds (advanced)
6. **Saved Templates** - Persistent timer configurations beyond previous game
