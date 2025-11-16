# Circular Timer Redesign

**Date:** 2025-11-16
**Status:** Design Approved
**Scope:** Replace horizontal progress bar timer with circular countdown timer across all screens

## Problem Statement

The current timer implementation uses a horizontal progress bar at the bottom of the screen that:
- Is not positioned correctly (not anchored to bottom of screen)
- Takes up horizontal space unnecessarily
- Doesn't provide clear visual feedback for remaining time
- Lacks consistency across different screens (/play, /controller, display app)

## Design Goals

1. Replace progress bar with intuitive circular countdown timer
2. Position consistently in lower-right corner across all screens
3. Maintain theme-aware styling (dark/light mode support)
4. Minimize performance impact with simple step-based updates
5. Ensure cross-platform consistency (web app, controller, Tauri display app)

## Design Decisions

### Visual Design

**Timer Type:** Circular countdown with depleting ring
- **Size:** 72px diameter (60-80px range) - small and unobtrusive
- **Position:** Fixed lower-right corner, 16px margin from edges
- **Style:** Theme-aware colors matching existing UI
  - Background ring: `stroke-muted-foreground/20`
  - Active ring: `stroke-primary`
  - Text/icon: `text-foreground`
- **Animation:** Step updates (no smooth animation) - updates once per second
- **Z-index:** `z-50` to float above content but below modals

**Display States:**
- **Active countdown:** Shows remaining seconds as number in center
- **Paused:** Shows pause icon (two vertical bars) instead of number
- **Zero reached:** Fades out over 300ms, then unmounts

**Visual Progression:**
- Circle depletes clockwise starting from top (12 o'clock position)
- Full circle = 100% time remaining
- 3/4 circle = 75% time remaining
- Empty circle = 0% time remaining

### Interaction Model

**Display-only:** No user interaction
- Timer is purely informational
- No click/tap handlers
- No hover states or tooltips
- Future: Could add host controls (pause/resume) on controller screen

### Component Architecture

**Implementation Pattern:** Shadcn-style component with composition

**Components:**
1. **CircularTimer** (base component)
   - Core SVG-based timer rendering
   - Props: `remainingSeconds`, `totalSeconds`, `isPaused`, `className`
   - Stateless - renders based on props
   - Location: `src/components/ui/circular-timer.tsx`

2. **CircularTimerFixed** (positioning wrapper)
   - Handles fixed positioning in lower-right corner
   - Manages fade-in/fade-out animations
   - Wraps `CircularTimer` with positioning classes

**SVG Structure:**
```
<svg viewBox="0 0 72 72">
  <circle /> <!-- Background ring -->
  <circle /> <!-- Active ring with stroke-dasharray/offset -->
  <text /> <!-- Center number or pause icon -->
</svg>
```

### Data Flow

**State Sources:**
- **Play Screen (`/play`)**: PocketBase real-time subscription on `rounds.current_timer`
- **Controller Screen (`/controller`)**: Same PocketBase subscription
- **Display App (`trivia-party-display`)**: Same PocketBase subscription

**Integration Pattern:**
Each screen:
1. Subscribes to timer state from PocketBase
2. Calculates `remainingSeconds` from timer start time and current time
3. Passes props to `<CircularTimerFixed>` component
4. Handles unmounting when `remainingSeconds` reaches 0

**Props Interface:**
```typescript
interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused: boolean;
  className?: string;
}
```

### Cross-Platform Implementation

**Code Sharing Strategy:** Duplicated components
- Main app: `src/components/ui/circular-timer.tsx`
- Display app: `trivia-party-display/src/components/ui/circular-timer.tsx`
- Components are identical React+SVG+Tailwind code
- Add comment at top of each file linking to the other
- Future: Consider shared package if more components need duplication

**Platform Adaptations:**
- **Web/Controller:** Standard React rendering with CSS fixed positioning
- **Tauri Display App:** Same React code, benefits from hardware acceleration
- **Android TV:** Touch-friendly size (72px exceeds 44px minimum)
- All platforms: Tailwind configuration already consistent

### Accessibility & Edge Cases

**Pause State:**
- Replace center number with SVG pause icon (two vertical bars)
- Freeze circle progress at current percentage
- Maintain theme-aware styling

**Edge Cases:**
- **Timer = 0:** Trigger fade-out animation, parent unmounts component
- **No timer active:** Component not rendered (parent returns null)
- **Very long durations:** Display up to 999 seconds, then "999+"
- **Negative values:** Clamp to 0 (defensive programming)

**Performance:**
- Step updates minimize re-renders (once per second)
- SVG rendering is hardware-accelerated
- No animation libraries needed - pure CSS transitions
- Parent component uses `setInterval`, cleans up on unmount

## Screens Affected

1. **Play Screen (`/play`):** Replace existing timer
2. **Controller Screen (`/controller`):** Replace existing timer
3. **Display App (`trivia-party-display`):** Replace existing timer

All three screens will have consistent timer appearance and behavior.

## Implementation Notes

- Remove existing progress bar timer components
- Create new `CircularTimer` and `CircularTimerFixed` components
- Update each screen to integrate new timer component
- Test theme switching (dark/light mode)
- Test pause state display
- Test fade-out animation at zero
- Verify positioning on different screen sizes
- Ensure Android TV display looks correct

## Out of Scope

- Host timer controls (pause/resume from timer UI) - may add later
- Click/tap interaction - keeping display-only for now
- Color-coded warnings (red when time running low) - may add later
- Smooth continuous animation - using step updates for performance
- Adaptive positioning based on content - always fixed lower-right

## Success Criteria

**Implementation Status:** COMPLETE - Ready for Manual Testing

All core implementation tasks have been completed:

- [x] CircularTimer base component created with SVG rendering
- [x] CircularTimerFixed positioning wrapper implemented
- [x] Play screen (`/play`) updated to use circular timer
- [x] Controller screen (`/controller`) updated to use circular timer
- [x] Display app (`trivia-party-display`) updated to use circular timer
- [x] Old GameTimer component removed
- [x] All builds pass (main app + display app)

**Manual Testing Checklist - Ready for User Testing:**

The following items need to be verified by the user in the dev server:

### Play Screen (`/play`)
- [ ] Timer displays as 72px circle in lower-right corner
- [ ] Circle depletes clockwise as time counts down
- [ ] Number in center shows remaining seconds
- [ ] Pause icon appears when timer is paused
- [ ] Timer fades out smoothly when reaching zero
- [ ] Theme-aware colors work in dark mode
- [ ] Theme-aware colors work in light mode
- [ ] Timer maintains position when scrolling
- [ ] Works on mobile viewport (375px width)

### Controller Screen (`/controller`)
- [ ] Timer displays as 72px circle in lower-right corner
- [ ] Circle depletes clockwise as time counts down
- [ ] Number in center shows remaining seconds
- [ ] Pause icon appears when timer is paused
- [ ] Timer fades out smoothly when reaching zero
- [ ] Theme-aware colors work in dark mode
- [ ] Theme-aware colors work in light mode
- [ ] Timer doesn't overlap with controller UI
- [ ] Responsive on tablet sizes

### Display App (Tauri)
- [ ] Timer displays as 72px circle in lower-right corner
- [ ] Circle depletes clockwise as time counts down
- [ ] Number in center shows remaining seconds
- [ ] Pause icon appears when timer is paused
- [ ] Timer fades out smoothly when reaching zero
- [ ] Works in fullscreen mode (Cmd+F)
- [ ] Works in windowed mode
- [ ] Theme-aware colors match web app
- [ ] Position correct on different resolutions

### Android TV (if available)
- [ ] Timer visible and readable from distance
- [ ] Proper positioning on TV screen (1920x1080)
- [ ] No UI overlap issues

### Edge Cases
- [ ] Very long timer (999+ seconds) shows "999+"
- [ ] Timer reaching exactly 0 triggers fade-out
- [ ] Rapid pause/unpause handled correctly
- [ ] Timer state persists across page refresh
- [ ] Multiple timers in sequence work correctly
- [ ] Theme switching while timer is active maintains appearance

**Performance Requirements:**
- [ ] No jank or stuttering during countdown
- [ ] Smooth 1-second step updates
- [ ] Fade-out animation at 300ms is smooth
