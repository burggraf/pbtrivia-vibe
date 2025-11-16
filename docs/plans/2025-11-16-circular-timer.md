# Circular Timer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace horizontal progress bar timer with circular countdown timer positioned in lower-right corner across all screens.

**Architecture:** Create new shadcn-style CircularTimer component with SVG-based circular progress ring. Replace existing GameTimer usage in play screen, controller screen, and display app. Keep existing timer state management and PocketBase subscription logic unchanged.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, SVG for circle rendering

---

## Task 1: Create CircularTimer Base Component

**Files:**
- Create: `src/components/ui/circular-timer.tsx`

### Step 1: Write failing test structure

Create test file to verify component existence and basic rendering:

```bash
# We'll skip formal tests for UI components following project patterns
# Manual testing will be done via dev server
```

### Step 2: Create base CircularTimer component with SVG circle

Create `src/components/ui/circular-timer.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularTimerProps {
  remainingSeconds: number
  totalSeconds: number
  isPaused: boolean
  className?: string
}

const CircularTimer = React.forwardRef<
  HTMLDivElement,
  CircularTimerProps
>(({ remainingSeconds, totalSeconds, isPaused, className }, ref) => {
  // Calculate percentage for circle progress (0-100)
  const percentage = totalSeconds > 0
    ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
    : 0

  // SVG circle parameters
  const size = 72 // 72px diameter
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate stroke-dashoffset based on percentage remaining
  // Start at top (12 o'clock) and go clockwise
  const offset = circumference - (percentage / 100) * circumference

  // Format display text
  const displayText = remainingSeconds > 999 ? "999+" : remainingSeconds.toString()

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>

      {/* Center text/icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isPaused ? (
          // Pause icon (two vertical bars)
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-foreground"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        ) : (
          // Countdown number
          <span className="text-lg font-semibold text-foreground tabular-nums">
            {displayText}
          </span>
        )}
      </div>
    </div>
  )
})

CircularTimer.displayName = "CircularTimer"

export { CircularTimer }
export type { CircularTimerProps }
```

### Step 3: Verify component builds without errors

Run build to ensure TypeScript compilation succeeds:

```bash
pnpm run build
```

Expected: Build completes successfully without TypeScript errors

### Step 4: Commit base component

```bash
git add src/components/ui/circular-timer.tsx
git commit -m "feat(ui): add circular timer base component

Add SVG-based circular timer with progress ring and center display.
Supports pause state with icon display. Theme-aware colors via
Tailwind classes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create CircularTimerFixed Positioning Wrapper

**Files:**
- Modify: `src/components/ui/circular-timer.tsx`

### Step 1: Add fixed positioning wrapper component

Add to `src/components/ui/circular-timer.tsx` (append to file):

```typescript
interface CircularTimerFixedProps extends CircularTimerProps {
  onFadeOutComplete?: () => void
}

const CircularTimerFixed = React.forwardRef<
  HTMLDivElement,
  CircularTimerFixedProps
>(({ onFadeOutComplete, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true)

  // Handle fade-out when timer reaches zero
  React.useEffect(() => {
    if (props.remainingSeconds <= 0) {
      // Start fade-out
      setIsVisible(false)

      // Notify parent after fade-out animation completes
      const timer = setTimeout(() => {
        onFadeOutComplete?.()
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [props.remainingSeconds, onFadeOutComplete])

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <CircularTimer {...props} />
    </div>
  )
})

CircularTimerFixed.displayName = "CircularTimerFixed"

export { CircularTimer, CircularTimerFixed }
export type { CircularTimerProps, CircularTimerFixedProps }
```

### Step 2: Verify build succeeds

```bash
pnpm run build
```

Expected: Build completes successfully

### Step 3: Commit positioning wrapper

```bash
git add src/components/ui/circular-timer.tsx
git commit -m "feat(ui): add fixed positioning wrapper for circular timer

Add CircularTimerFixed wrapper that handles lower-right positioning
and fade-out animation when timer reaches zero.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Update GamePage to Use CircularTimer

**Files:**
- Modify: `src/pages/GamePage.tsx`

### Step 1: Update imports and timer rendering

Replace GameTimer import and usage in `src/pages/GamePage.tsx`:

**Old code (around line 8):**
```typescript
import GameTimer from '@/components/games/GameTimer'
```

**New code:**
```typescript
import { CircularTimerFixed } from '@/components/ui/circular-timer'
```

**Old code (around line 435):**
```typescript
      {/* Timer Display - Fixed to bottom when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}
```

**New code:**
```typescript
      {/* Timer Display - Fixed to bottom-right when active */}
      {gameData?.timer && !gameData.timer.showAsNotification && (
        <CircularTimerFixed
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
```

### Step 2: Add state for timer countdown updates

Add state and effect for timer updates (around line 23, after other state declarations):

```typescript
  const [timerKey, setTimerKey] = React.useState(0)
```

Add effect to force re-renders for timer countdown (before the return statement):

```typescript
  // Update timer display every second
  React.useEffect(() => {
    if (!gameData?.timer || gameData.timer.isPaused) return

    const interval = setInterval(() => {
      setTimerKey(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [gameData?.timer, gameData?.timer?.isPaused])
```

Update the timer rendering to use timerKey:

```typescript
      {/* Timer Display - Fixed to bottom-right when active */}
      {gameData?.timer && !gameData.timer.showAsNotification && (
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
```

### Step 3: Add React import if missing

Ensure React is imported at the top of the file:

```typescript
import { useState, useEffect } from 'react'
import * as React from 'react'
```

### Step 4: Verify build succeeds

```bash
pnpm run build
```

Expected: Build completes successfully

### Step 5: Test in development server

```bash
# In separate terminal, start development environment
./dev.sh
```

Manual testing checklist:
- [ ] Navigate to a game with active timer
- [ ] Verify circular timer appears in lower-right corner
- [ ] Verify timer counts down each second
- [ ] Verify timer displays pause icon when paused
- [ ] Verify timer fades out when reaching zero
- [ ] Verify timer works in both light and dark mode

### Step 6: Commit GamePage updates

```bash
git add src/pages/GamePage.tsx
git commit -m "feat(game): replace progress bar with circular timer

Replace horizontal GameTimer with new CircularTimerFixed component
on play screen. Timer now appears as circle in lower-right corner.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update ControllerPage to Use CircularTimer

**Files:**
- Modify: `src/pages/ControllerPage.tsx`

### Step 1: Read current ControllerPage implementation

```bash
# Check where GameTimer is used
grep -n "GameTimer" src/pages/ControllerPage.tsx
```

### Step 2: Update imports

Replace GameTimer import with CircularTimerFixed:

**Find:**
```typescript
import GameTimer from '@/components/games/GameTimer'
```

**Replace with:**
```typescript
import { CircularTimerFixed } from '@/components/ui/circular-timer'
```

### Step 3: Update timer rendering

Find the GameTimer usage and replace with CircularTimerFixed using same pattern as GamePage:

**Find:**
```typescript
{gameData?.timer && <GameTimer timer={gameData.timer} />}
```

**Replace with:**
```typescript
{gameData?.timer && !gameData.timer.showAsNotification && (
  <CircularTimerFixed
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
```

### Step 4: Add timer update state and effect

Add state near other state declarations:

```typescript
const [timerKey, setTimerKey] = React.useState(0)
```

Add effect for timer updates:

```typescript
// Update timer display every second
React.useEffect(() => {
  if (!gameData?.timer || gameData.timer.isPaused) return

  const interval = setInterval(() => {
    setTimerKey(prev => prev + 1)
  }, 1000)

  return () => clearInterval(interval)
}, [gameData?.timer, gameData?.timer?.isPaused])
```

Update timer rendering to use key:

```typescript
<CircularTimerFixed
  key={timerKey}
  remainingSeconds={...}
  ...
/>
```

### Step 5: Ensure React import exists

Add if missing:

```typescript
import * as React from 'react'
```

### Step 6: Verify build succeeds

```bash
pnpm run build
```

Expected: Build completes successfully

### Step 7: Manual testing

Test in development server:
- [ ] Navigate to controller screen with active timer
- [ ] Verify circular timer in lower-right corner
- [ ] Verify countdown works correctly
- [ ] Verify pause state displays icon
- [ ] Verify theme switching works

### Step 8: Commit ControllerPage updates

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat(controller): replace progress bar with circular timer

Replace horizontal GameTimer with new CircularTimerFixed component
on controller screen. Matches play screen implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create CircularTimer in Display App

**Files:**
- Create: `trivia-party-display/src/components/ui/circular-timer.tsx`

### Step 1: Create UI components directory if needed

```bash
mkdir -p trivia-party-display/src/components/ui
```

### Step 2: Copy component to display app

Copy the circular-timer component from main app:

```bash
cp src/components/ui/circular-timer.tsx trivia-party-display/src/components/ui/circular-timer.tsx
```

### Step 3: Verify utils file exists in display app

```bash
ls -la trivia-party-display/src/lib/utils.ts
```

If it doesn't exist, create it:

Create `trivia-party-display/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 4: Add comment linking to main app version

Add comment at top of `trivia-party-display/src/components/ui/circular-timer.tsx`:

```typescript
/**
 * Circular Timer Component
 *
 * This file is duplicated from: src/components/ui/circular-timer.tsx
 * Keep both versions in sync when making changes.
 */
```

### Step 5: Verify display app builds

```bash
cd trivia-party-display && pnpm run build
```

Expected: Build completes successfully

### Step 6: Commit display app component

```bash
git add trivia-party-display/src/components/ui/circular-timer.tsx
git add trivia-party-display/src/lib/utils.ts  # if created
cd .. && git commit -m "feat(display): add circular timer component

Add CircularTimer and CircularTimerFixed components to display app.
Duplicated from main app to maintain consistency across platforms.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Update Display App GameTimer Usage

**Files:**
- Modify: `trivia-party-display/src/components/GameDisplay.tsx` (or wherever GameTimer is used)

### Step 1: Find GameTimer usage in display app

```bash
grep -r "GameTimer" trivia-party-display/src/components/ --include="*.tsx"
```

### Step 2: Update GameDisplay.tsx (or identified file)

Replace GameTimer import:

**Find:**
```typescript
import GameTimer from './GameTimer'
```

**Replace with:**
```typescript
import { CircularTimerFixed } from '@/components/ui/circular-timer'
```

### Step 3: Update timer rendering

Replace GameTimer usage with CircularTimerFixed using same pattern as web app.

### Step 4: Add timer state and effects

Add the timerKey state and useEffect for updates (same as web app).

### Step 5: Verify display app builds

```bash
cd trivia-party-display && pnpm run build
```

Expected: Build completes successfully

### Step 6: Test on macOS

```bash
cd trivia-party-display && pnpm tauri:dev
```

Manual testing:
- [ ] Circular timer appears in lower-right corner
- [ ] Timer counts down correctly
- [ ] Pause state shows icon
- [ ] Timer fades out at zero
- [ ] Works in fullscreen mode

### Step 7: Commit display app updates

```bash
cd .. && git add trivia-party-display/
git commit -m "feat(display): replace progress bar with circular timer

Replace horizontal GameTimer with CircularTimerFixed in display app.
Timer now appears as circle in lower-right corner matching web app.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Remove Old GameTimer Component

**Files:**
- Delete: `src/components/games/GameTimer.tsx`
- Delete: `trivia-party-display/src/components/GameTimer.tsx`

### Step 1: Verify no remaining usages

```bash
# Check main app
grep -r "GameTimer" src/ --include="*.tsx" --include="*.ts"

# Check display app
grep -r "GameTimer" trivia-party-display/src/ --include="*.tsx" --include="*.ts"
```

Expected: No results (all usages replaced)

### Step 2: Remove old component files

```bash
git rm src/components/games/GameTimer.tsx
git rm trivia-party-display/src/components/GameTimer.tsx
```

### Step 3: Verify builds still succeed

```bash
# Main app
pnpm run build

# Display app
cd trivia-party-display && pnpm run build && cd ..
```

Expected: Both builds complete successfully

### Step 4: Commit removal

```bash
git commit -m "refactor: remove old GameTimer component

Remove deprecated horizontal progress bar GameTimer component.
Fully replaced by CircularTimerFixed across all screens.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Final Testing and Documentation

**Files:**
- Modify: `docs/plans/2025-11-16-circular-timer.md` (update success criteria)

### Step 1: Comprehensive manual testing

Test all screens with timer:

**Play Screen (`/play`):**
- [ ] Circular timer in lower-right corner
- [ ] Countdown updates every second
- [ ] Timer maintains position when scrolling
- [ ] Pause icon displays when timer paused
- [ ] Timer fades out smoothly at zero
- [ ] Works on mobile viewport (375px width)
- [ ] Works in dark mode
- [ ] Works in light mode

**Controller Screen (`/controller`):**
- [ ] Same checklist as play screen
- [ ] Timer doesn't overlap with controller UI
- [ ] Responsive on tablet sizes

**Display App:**
- [ ] Circular timer in lower-right corner
- [ ] Countdown accurate and smooth
- [ ] Works in fullscreen mode
- [ ] Works in windowed mode
- [ ] Theme-aware colors
- [ ] Position correct on different resolutions

**Android TV (if available):**
- [ ] Timer visible and readable from distance
- [ ] Proper positioning on TV screen
- [ ] No UI overlap issues

### Step 2: Test edge cases

- [ ] Very long timer (999+ seconds) - shows "999+"
- [ ] Timer reaching exactly 0
- [ ] Rapid pause/unpause
- [ ] Timer state persists across page refresh
- [ ] Multiple timers in sequence
- [ ] Theme switching while timer active

### Step 3: Update design document success criteria

Update `docs/plans/2025-11-16-circular-timer-design.md` success criteria section with test results.

### Step 4: Take screenshots for documentation

Capture screenshots of:
- Circular timer on play screen (light mode)
- Circular timer on play screen (dark mode)
- Circular timer showing pause state
- Timer on display app

### Step 5: Final commit

```bash
git add docs/
git commit -m "docs: update circular timer design with test results

Document successful implementation and testing of circular timer
across all platforms. Include screenshots and edge case verification.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Implementation Complete

**Files Created:**
- `src/components/ui/circular-timer.tsx`
- `trivia-party-display/src/components/ui/circular-timer.tsx`
- `trivia-party-display/src/lib/utils.ts` (if needed)

**Files Modified:**
- `src/pages/GamePage.tsx`
- `src/pages/ControllerPage.tsx`
- `trivia-party-display/src/components/GameDisplay.tsx`
- `docs/plans/2025-11-16-circular-timer-design.md`

**Files Removed:**
- `src/components/games/GameTimer.tsx`
- `trivia-party-display/src/components/GameTimer.tsx`

**Commits:** 8 focused commits following conventional commit format

**Next Steps:**
- Consider adding color-coded warnings (green → yellow → red)
- Consider making timer clickable for host controls
- Consider adaptive positioning to avoid UI overlaps
- Test on actual Android TV device if available
