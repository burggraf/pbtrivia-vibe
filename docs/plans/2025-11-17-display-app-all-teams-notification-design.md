# Display App: All Teams Answered Notification Design

**Date:** 2025-11-17
**Status:** Approved
**Author:** Claude Code

## Overview

Add the "All teams have answered" notification to the trivia-party-display app to match the behavior and styling already present in the `/game` and `/controller` screens.

## Requirements

### Functional Requirements

1. **Visual Parity**: Display app shows identical notification as `/game` and `/controller` screens
2. **Trigger Condition**: Notification appears when `gameData.timer?.showAsNotification` is true
3. **Styling Match**: Same position (bottom-center), colors (blue), animations (slideDown + pulse)
4. **Accessibility**: Include ARIA attributes for screen reader support

### User Experience

**When all teams answer (with auto-reveal enabled):**
- Controller triggers 3-second notification timer
- Display app, `/game`, and `/controller` all show "All teams have answered." notification
- Blue box appears at bottom-center with slide-down and pulse animations
- After 3 seconds, answer is automatically revealed across all screens

**Current Gap:**
- Display app only shows circular timer, missing the notification
- Creates inconsistency between display screen and other views

## Architecture

### Approach: Inline Implementation

**Rationale:**
- Matches existing pattern in GamePage.tsx and ControllerPage.tsx
- Minimal code changes (no new components)
- Simple, maintainable solution
- Consistent with codebase conventions

**Rejected Alternatives:**
1. **Shared component**: Unnecessary abstraction for a simple notification
2. **Display-specific component**: Adds complexity without clear benefit

## Data Model

### Type Updates

**File:** `trivia-party-display/src/types/games.ts`

```typescript
export interface GameData {
  state: GameState
  round?: { ... }
  question?: { ... }
  timer?: {
    startedAt: string
    duration: number
    expiresAt: string
    isEarlyAdvance?: boolean
    isPaused?: boolean
    pausedAt?: string
    pausedRemaining?: number
    showAsNotification?: boolean  // NEW - indicates notification display mode
  }
}
```

**Purpose:** The `showAsNotification` flag tells the display app to show the notification instead of (or alongside) the regular circular timer.

**Set by:** ControllerPage.tsx when all teams answer (see `handleAllTeamsAnswered` around line 354)

## Components

### GameDisplay Component Update

**Location:** `trivia-party-display/src/components/GameDisplay.tsx`

**Change:** Add notification JSX after the circular timer section (after line 106)

**Implementation:**

```tsx
{/* Timer Display - Fixed to bottom-right when active */}
{gameData?.timer && (
  <CircularTimerFixed
    key={timerKey}
    remainingSeconds={(() => {
      const timer = gameData.timer
      if (timer.isPaused) {
        return timer.pausedRemaining || 0
      }
      const now = Date.now()
      const expiresAt = new Date(timer.expiresAt).getTime()
      const remainingMs = Math.max(0, expiresAt - now)
      return Math.ceil(remainingMs / 1000)
    })()}
    totalSeconds={gameData.timer.duration}
    isPaused={gameData.timer.isPaused || false}
  />
)}

{/* NEW: Early Answer Notification - Show when all teams have answered */}
{gameData?.timer?.showAsNotification && (
  <div
    role="status"
    aria-live="polite"
    className="
      fixed bottom-20 left-1/2 -translate-x-1/2 z-50
      bg-blue-500 dark:bg-blue-600 text-white
      px-6 py-3 rounded-lg shadow-lg
      animate-[slideDown_0.5s_ease-out,pulse_2s_ease-in-out_0.5s_infinite]
    "
  >
    <div className="text-center font-medium">
      All teams have answered.
    </div>
  </div>
)}
```

**Styling Breakdown:**
- `fixed bottom-20`: Positioned 5rem (80px) from bottom
- `left-1/2 -translate-x-1/2`: Horizontally centered
- `z-50`: High z-index to appear above game content
- `bg-blue-500 dark:bg-blue-600`: Blue background with dark mode variant
- `text-white`: White text for contrast
- `px-6 py-3`: Padding for comfortable spacing
- `rounded-lg shadow-lg`: Rounded corners with prominent shadow
- `animate-[slideDown_0.5s_ease-out,pulse_2s_ease-in-out_0.5s_infinite]`:
  - First animation: slideDown (0.5s entrance)
  - Second animation: pulse (infinite, starting after 0.5s delay)

**Accessibility:**
- `role="status"`: Indicates status update to assistive technologies
- `aria-live="polite"`: Announces to screen readers without interrupting

## Implementation Steps

1. **Update TypeScript types**
   - Add `showAsNotification?: boolean` to timer interface in `trivia-party-display/src/types/games.ts`

2. **Update GameDisplay component**
   - Add notification JSX in `trivia-party-display/src/components/GameDisplay.tsx` after line 106
   - Use exact styling from GamePage.tsx (lines 478-492)

## Testing Strategy

### Manual Testing Scenarios

1. **Baseline: No notification**:
   - Start game without auto-reveal enabled
   - All teams answer
   - Expected: Display app shows circular timer only (no notification)

2. **With auto-reveal enabled**:
   - Enable "Automatically reveal answer when all teams have answered" in game settings
   - Start game, navigate to question
   - Have all teams answer
   - Expected: Display app shows blue notification at bottom-center
   - Expected: Notification has slideDown entrance animation
   - Expected: Notification pulses after 0.5s
   - Expected: After 3 seconds, answer is revealed

3. **Visual consistency**:
   - Compare display app notification side-by-side with `/controller` screen
   - Expected: Identical position, colors, size, animations

4. **Dark mode**:
   - Repeat test #2 with dark mode enabled
   - Expected: Notification uses `bg-blue-600` (darker blue)

5. **Multi-platform** (display app specific):
   - Test on macOS app
   - Test on Android TV app
   - Expected: Notification appears correctly on both platforms

## Success Criteria

- ✅ TypeScript types include `showAsNotification` property
- ✅ Display app shows notification when `showAsNotification` is true
- ✅ Notification uses identical styling to `/game` and `/controller` screens
- ✅ Notification positioned at bottom-center (fixed bottom-20)
- ✅ SlideDown and pulse animations work correctly
- ✅ Dark mode styling applies correctly
- ✅ Accessibility attributes present (`role="status"`, `aria-live="polite"`)
- ✅ No console errors or TypeScript warnings

## Future Enhancements

- Consider making notification position configurable for different display sizes
- Add option to customize notification duration (currently hardcoded to 3 seconds in ControllerPage)
- Add sound/haptic feedback when notification appears (display app specific)
