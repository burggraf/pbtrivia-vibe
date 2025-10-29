# Game Status Play Button Design

**Date**: 2025-10-29
**Status**: Approved

## Overview

Redesign the game status interaction on the Host page to make status read-only and move the game start action to the Actions panel via a Play button.

## Current Behavior

- Status badge for "Setup" and "Ready" games is clickable
- Clicking opens GameStatusModal to change status between "setup" and "ready"
- Play button only appears for "ready" and "in-progress" games
- "Completed" games have read-only status

## New Behavior

- Status badge is read-only for all game statuses (non-interactive)
- GameStatusModal component is removed entirely
- Play button appears for "setup", "ready", and "in-progress" games
- Play button for "setup" games:
  - Grayed out/disabled when no rounds exist
  - Enabled when rounds exist
  - Changes status from "setup" to "ready" before navigating to controller
- Play button for "ready"/"in-progress" games works as before

## Implementation Changes

### 1. Component Cleanup

**Remove:**
- `GameStatusModal` component import
- `statusModalOpen` state and setter
- `statusGame` state and setter
- `handleStatusClick` function
- `handleStatusChange` function
- `<GameStatusModal>` component instance

**Result:** ~60 lines of code removed

### 2. Status Badge Simplification

**Before (lines 463-485):**
- Conditional cursor classes (cursor-pointer, cursor-not-allowed)
- onClick handler calling handleStatusClick
- Conditional hover effects
- Complex tooltips explaining interactivity

**After:**
- Simple read-only display
- No onClick handler
- No cursor styling
- No tooltips

### 3. Actions Panel Extension

**Current Logic:**
```tsx
{game.status === 'completed' ? (
  <Eye button>
) : (game.status === 'ready' || game.status === 'in-progress') ? (
  <Play button>
) : null}
```

**New Logic:**
```tsx
{game.status === 'completed' ? (
  <Eye button>
) : (game.status === 'setup' || game.status === 'ready' || game.status === 'in-progress') ? (
  <Play button disabled={game.status === 'setup' && !rounds[game.id]?.length}>
) : null}
```

### 4. handlePlayGame Enhancement

**Current:**
1. Initialize game data
2. Navigate to controller

**New:**
1. Check if game status is 'setup'
2. If setup, update status to 'ready' and wait for completion
3. Initialize game data
4. Navigate to controller

## User Experience Flow

### Scenario 1: Setup game with no rounds
1. Host sees "Setup" status badge (read-only)
2. Play button in Actions is grayed out/disabled
3. Clicking does nothing (visual feedback only)
4. Host must add rounds before playing

### Scenario 2: Setup game with rounds
1. Host sees "Setup" status badge (read-only)
2. Play button in Actions is enabled
3. Click Play button:
   - Status updates to "Ready"
   - Game initializes
   - Navigates to /controller page

### Scenario 3: Ready/In-progress game
1. Behavior unchanged from current implementation
2. Play button works as before

## Testing Considerations

- Verify status badge is non-interactive for all statuses
- Verify Play button appears for setup games
- Verify Play button is disabled when rounds.length === 0
- Verify Play button is enabled when rounds.length > 0
- Verify clicking Play on setup game updates status to ready
- Verify navigation to /controller after status update
- Verify existing ready/in-progress behavior unchanged

## Files Modified

- `/src/pages/HostPage.tsx` - Main implementation
- `/src/components/games/GameStatusModal.tsx` - Delete this file (optional cleanup)
