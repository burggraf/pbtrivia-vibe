# Round Question Regeneration Design

**Date:** 2025-10-28
**Status:** Approved

## Overview

When editing an existing round's question count or categories, the questions assigned to that round may become out of sync with the round's metadata. This design adds a confirmation dialog that allows users to regenerate questions when saving changes to a round.

## User Flow

1. User opens "Edit Round" dialog for an existing round
2. User modifies question count and/or selected categories
3. User clicks "Save Changes"
4. System shows confirmation dialog: "Replace Round Questions?"
   - Message: "This will delete all existing questions for this round and generate new questions based on the selected categories and question count."
   - Buttons: "Cancel" (returns to edit dialog) | "Replace Questions" (proceeds)
5. If "Replace Questions":
   - Delete all game_questions for this round
   - Update round metadata
   - Generate new questions based on updated settings
   - Close both dialogs
6. If "Cancel":
   - Close confirmation dialog
   - Keep edit dialog open for further modifications

## Scope

- **In scope:** Edit mode only (existing rounds)
- **Out of scope:** Create mode (questions don't exist yet)

## Technical Implementation

### Component Changes

**RoundEditModal.tsx:**
- Add `showReplaceConfirm` state
- Modify `handleSubmit` to intercept save in edit mode and show confirmation
- Add `handleReplaceConfirm` to proceed with save when confirmed
- Add `handleReplaceCancel` to dismiss confirmation and keep edit dialog open
- Add confirmation dialog JSX (similar to existing delete confirmation pattern)
- Update `onSave` callback signature to accept optional `shouldReplaceQuestions` boolean

**HostPage.tsx:**
- Update `handleSaveRound` signature: `async (data: UpdateRoundData, shouldReplaceQuestions?: boolean)`
- In edit mode branch, check `shouldReplaceQuestions` flag
- If true:
  1. Call `gameQuestionsService.deleteGameQuestions(editingRound.id)`
  2. Update round with `roundsService.updateRound(editingRound.id, data)`
  3. Generate new questions using same logic as create mode

### Data Flow

```
User clicks "Save Changes"
  ↓
handleSubmit checks: isCreateMode?
  ↓ (edit mode)
setShowReplaceConfirm(true)
  ↓
User sees confirmation dialog
  ↓
User clicks "Replace Questions"
  ↓
handleReplaceConfirm()
  ↓
onSave(formData, true)  // shouldReplaceQuestions = true
  ↓
HostPage.handleSaveRound()
  ↓
deleteGameQuestions(roundId)
  ↓
updateRound(roundId, data)
  ↓
Generate new questions (questionsService.getRandomQuestionsFromCategories)
  ↓
createGameQuestionsBatch()
  ↓
fetchGames() to refresh UI
```

## Existing Services Used

- `gameQuestionsService.deleteGameQuestions(roundId)` - Deletes all game_questions for a round
- `questionsService.getRandomQuestionsFromCategories(categories, count, hostId)` - Gets random questions
- `gameQuestionsService.createGameQuestionsBatch(roundId, questions)` - Creates game_questions entries
- `roundsService.updateRound(id, data)` - Updates round metadata

## Error Handling

- Question generation errors are logged but don't prevent round update (existing pattern)
- If no questions available for selected categories, logs warning but round update succeeds
- All errors caught and logged in handleSaveRound try/catch block

## UI/UX Considerations

- Confirmation dialog prevents accidental question loss
- "Cancel" keeps edit dialog open for user to reconsider changes
- No change detection needed - simple, predictable behavior
- Reuses existing confirmation dialog pattern for consistency

## Testing Considerations

- Test edit mode shows confirmation
- Test create mode skips confirmation
- Test "Cancel" keeps edit dialog open
- Test "Replace Questions" deletes old and creates new questions
- Test with valid categories (questions exist)
- Test with categories that have no available questions
