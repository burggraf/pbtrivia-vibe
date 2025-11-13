# Game Timers Editing Design

**Date:** 2025-11-13
**Status:** Approved

## Overview

Enable hosts to edit game timers after initial game creation, supporting timer adjustments during setup, ready, and in-progress game states.

## Requirements

### Functional Requirements
- Timer editing available for games in `setup`, `ready`, and `in-progress` states
- No warnings or confirmations needed when editing timers
- Timer values persist to `games.metadata` field in PocketBase
- UI reuses existing CreateGameDialog timer component approach

### Non-Functional Requirements
- Backwards compatible with existing games
- No database migrations required
- Consistent UI with game creation flow

## Architecture

### Component Structure

**New Component: TimersAccordion**
- Location: `src/components/games/TimersAccordion.tsx`
- Reusable accordion component containing 6 timer inputs
- Accepts timer values as props, exposes onChange callback
- Uses shadcn/ui Accordion component for consistency

**Component Interface:**
```typescript
interface TimersAccordionProps {
  timers: {
    question?: number | null;
    answer?: number | null;
    game_start?: number | null;
    round_start?: number | null;
    game_end?: number | null;
    thanks?: number | null;
  };
  onTimersChange: (timers: TimersAccordionProps['timers']) => void;
}
```

### Integration Points

**CreateGameDialog Refactoring:**
- Extract existing inline timers accordion JSX
- Replace with `<TimersAccordion>` component
- Pass `formData.metadata` timers to component
- Wire onChange handler to update formData state

**GameEditModal Enhancement:**
- Add timer state initialization from `game.metadata`
- Include `<TimersAccordion>` component in modal
- Update PocketBase update call to save metadata field
- Merge timer updates into metadata object on save

## Data Flow

1. **Component Mount:**
   - CreateGameDialog: Initialize timers from formData (defaults to null)
   - GameEditModal: Initialize timers from game.metadata (defaults to null if missing)

2. **User Interaction:**
   - User changes timer value in TimersAccordion input
   - Component calls `onTimersChange(updatedTimers)`
   - Parent component updates state

3. **Persistence:**
   - CreateGameDialog: Saves metadata on game creation
   - GameEditModal: Updates game.metadata field via PocketBase

## Validation & Error Handling

### Input Validation
- Timer values must be positive integers or null/empty
- Empty/null values represent "no time limit"
- Invalid inputs show inline validation errors
- Form submission blocked if validation fails

### Edge Cases
- **No metadata field:** Initialize with all timers as null
- **Legacy games:** Default missing timer fields to null
- **Concurrent edits:** PocketBase optimistic locking handles conflicts
- **Network failures:** Standard error toast, no partial updates

### Backwards Compatibility
- Existing games without timer metadata continue working
- Null timers treated as "no limit" (current behavior)
- No database migration needed (metadata field exists)

## Testing Strategy

### Manual Testing Checklist
- [ ] Create new game with timers - verify values save
- [ ] Edit game in setup status - verify timer changes persist
- [ ] Edit game in ready status - verify timer changes persist
- [ ] Edit game in in-progress status - verify timer changes persist
- [ ] Edit game without metadata - verify defaults to null
- [ ] Set timer to empty/null - verify saves as "no limit"
- [ ] Enter invalid timer value - verify validation error
- [ ] Verify CreateGameDialog still works after refactor

### Integration Points to Verify
- TimersAccordion renders correctly in both modals
- Timer state updates propagate to parent components
- PocketBase saves metadata correctly
- Game list displays correctly after timer edits

## Implementation Notes

### File Changes
- **New:** `src/components/games/TimersAccordion.tsx`
- **Modified:** `src/components/games/CreateGameDialog.tsx`
- **Modified:** `src/components/games/GameEditModal.tsx`

### Development Approach
1. Extract TimersAccordion component from CreateGameDialog
2. Refactor CreateGameDialog to use extracted component
3. Test CreateGameDialog still works
4. Add timer support to GameEditModal
5. Test timer editing in all game states

## Future Considerations

- Timer enforcement implementation (currently data capture only)
- Timer presets or templates
- Different timer permissions based on game state
- Timer change history/audit trail
