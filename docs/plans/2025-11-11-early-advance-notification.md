# Early Advance Notification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace 3-second timer bar with notification popover when all teams answer, and skip delay when ≤3 seconds remain on question timer.

**Architecture:** Add `showAsNotification` flag to timer interface. ControllerPage checks remaining time before creating early-advance timer. GameTimer conditionally renders notification popover instead of timer bar.

**Tech Stack:** React, TypeScript, Tailwind CSS, PocketBase

---

## Task 1: Update Timer Interface in Main App

**Files:**
- Modify: `src/pages/ControllerPage.tsx:49-58` (GameData interface)
- Modify: `src/components/games/GameTimer.tsx:4-14` (GameTimerProps interface)

**Step 1: Add showAsNotification field to GameData timer interface**

In `src/pages/ControllerPage.tsx`, update the timer interface:

```typescript
timer?: {
  startedAt: string
  duration: number
  expiresAt: string
  isEarlyAdvance?: boolean
  isPaused?: boolean         // NEW: Whether timer is currently paused
  pausedAt?: string          // NEW: ISO timestamp when paused
  pausedRemaining?: number   // NEW: Seconds remaining when paused
  showAsNotification?: boolean  // NEW: Display as notification instead of timer bar
}
```

**Step 2: Add showAsNotification field to GameTimer props interface**

In `src/components/games/GameTimer.tsx`, update the timer interface:

```typescript
interface GameTimerProps {
  timer: {
    startedAt: string
    duration: number
    expiresAt: string
    isEarlyAdvance?: boolean
    isPaused?: boolean
    pausedAt?: string
    pausedRemaining?: number
    showAsNotification?: boolean  // NEW
  }
}
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds (no type errors)

**Step 4: Commit**

```bash
git add src/pages/ControllerPage.tsx src/components/games/GameTimer.tsx
git commit -m "feat: add showAsNotification to timer interface

Adds optional showAsNotification field to timer type for
displaying notification popover instead of timer bar.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Update Timer Interface in Display App

**Files:**
- Modify: `trivia-party-display/src/components/GameTimer.tsx:4-14`

**Step 1: Add showAsNotification field to display app GameTimer**

In `trivia-party-display/src/components/GameTimer.tsx`, update the timer interface:

```typescript
interface GameTimerProps {
  timer: {
    startedAt: string
    duration: number
    expiresAt: string
    isEarlyAdvance?: boolean
    isPaused?: boolean
    pausedAt?: string
    pausedRemaining?: number
    showAsNotification?: boolean  // NEW
  }
}
```

**Step 2: Verify TypeScript compilation in display app**

Run: `cd trivia-party-display && pnpm run build && cd ..`
Expected: Build succeeds (no type errors)

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/GameTimer.tsx
git commit -m "feat(display): add showAsNotification to timer interface

Syncs timer type with main app to support notification display.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Remaining Time Check to Early Advance Logic

**Files:**
- Modify: `src/pages/ControllerPage.tsx:315-341`

**Step 1: Add remaining time calculation and conditional logic**

In `src/pages/ControllerPage.tsx`, replace the early advance timer creation logic (around line 315-341):

Replace this:
```typescript
      // If all answered and no early-advance timer exists yet and timer not paused
      if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
        // Only trigger early advance if timers are configured
        const hasTimersConfigured = game?.metadata && (
          (game.metadata.question_timer && game.metadata.question_timer > 0) ||
          (game.metadata.answer_timer && game.metadata.answer_timer > 0)
        )

        if (hasTimersConfigured) {
          console.log('🎉 All teams answered! Triggering early advance in 3 seconds')

          // Create 3-second early-advance timer
          const timer = {
            startedAt: new Date().toISOString(),
            duration: 3,
            expiresAt: new Date(Date.now() + 3000).toISOString(),
            isEarlyAdvance: true
          }

          await updateGameDataClean({
            ...gameData,
            timer
          })
        } else {
          console.log('🎉 All teams answered! Waiting for manual advance (no timers configured)')
        }
      }
```

With this:
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

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds (no type errors)

**Step 3: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add time-aware early advance logic

Check remaining time before creating early advance timer:
- If >3s remain: Create notification timer
- If ≤3s remain: Let question timer expire naturally

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Notification Display to Main App GameTimer

**Files:**
- Modify: `src/components/games/GameTimer.tsx:60-74`

**Step 1: Add conditional notification rendering**

In `src/components/games/GameTimer.tsx`, add notification rendering before the existing return statement:

```typescript
export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  const updateTimer = useCallback(() => {
    if (!timer) return

    // If paused, use stored remaining time
    if (timer.isPaused) {
      const remaining = timer.pausedRemaining || 0
      setRemainingSeconds(remaining)

      // Calculate progress from paused remaining
      const percentage = Math.max(0, Math.min(100, (remaining / timer.duration) * 100))
      setProgressValue(percentage)
      return
    }

    // Normal countdown logic (existing)
    const now = Date.now()
    const expiresAt = new Date(timer.expiresAt).getTime()
    const remainingMs = Math.max(0, expiresAt - now)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    setRemainingSeconds(remainingSeconds)

    // Calculate progress percentage from milliseconds for smooth animation
    const totalMs = timer.duration * 1000
    const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
    setProgressValue(percentage)
  }, [timer])

  useEffect(() => {
    // Initial update
    updateTimer()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [updateTimer])

  const secondsText = remainingSeconds === 1 ? 'second' : 'seconds'

  // Render notification popover for early-advance
  if (timer.showAsNotification) {
    return (
      <div
        className="
          fixed bottom-20 left-1/2 -translate-x-1/2 z-50
          bg-blue-500 dark:bg-blue-600 text-white
          px-6 py-3 rounded-lg shadow-lg
          transition-opacity duration-300 opacity-100
        "
      >
        <div className="text-center font-medium">
          All teams have answered.
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
          {timer.isPaused && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              PAUSED
            </span>
          )}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds (no type errors)

**Step 3: Commit**

```bash
git add src/components/games/GameTimer.tsx
git commit -m "feat: add notification display to GameTimer

When showAsNotification flag is set, render notification popover
instead of timer bar. Notification appears bottom-center with
fade animation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Notification Display to Display App GameTimer

**Files:**
- Modify: `trivia-party-display/src/components/GameTimer.tsx:60-74`

**Step 1: Add conditional notification rendering**

In `trivia-party-display/src/components/GameTimer.tsx`, add the same notification rendering as Task 4:

```typescript
export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  const updateTimer = useCallback(() => {
    if (!timer) return

    // If paused, use stored remaining time
    if (timer.isPaused) {
      const remaining = timer.pausedRemaining || 0
      setRemainingSeconds(remaining)

      // Calculate progress from paused remaining
      const percentage = Math.max(0, Math.min(100, (remaining / timer.duration) * 100))
      setProgressValue(percentage)
      return
    }

    // Normal countdown logic (existing)
    const now = Date.now()
    const expiresAt = new Date(timer.expiresAt).getTime()
    const remainingMs = Math.max(0, expiresAt - now)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    setRemainingSeconds(remainingSeconds)

    // Calculate progress percentage from milliseconds for smooth animation
    const totalMs = timer.duration * 1000
    const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
    setProgressValue(percentage)
  }, [timer])

  useEffect(() => {
    // Initial update
    updateTimer()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [updateTimer])

  const secondsText = remainingSeconds === 1 ? 'second' : 'seconds'

  // Render notification popover for early-advance
  if (timer.showAsNotification) {
    return (
      <div
        className="
          fixed bottom-20 left-1/2 -translate-x-1/2 z-50
          bg-blue-500 dark:bg-blue-600 text-white
          px-6 py-3 rounded-lg shadow-lg
          transition-opacity duration-300 opacity-100
        "
      >
        <div className="text-center font-medium">
          All teams have answered.
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
          {timer.isPaused && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              PAUSED
            </span>
          )}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compilation in display app**

Run: `cd trivia-party-display && pnpm run build && cd ..`
Expected: Build succeeds (no type errors)

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/GameTimer.tsx
git commit -m "feat(display): add notification display to GameTimer

Syncs notification display with main app. Shows popover when
showAsNotification flag is set.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Final Build Verification

**Step 1: Build both apps**

Run: `pnpm run build && cd trivia-party-display && pnpm run build && cd ..`
Expected: Both builds succeed with no errors

**Step 2: Visual inspection checklist**

Start dev environment: `cd ../.. && ./dev.sh`

**Test Scenarios:**

1. **Basic notification (>3s remaining):**
   - Create game with 10-second question timer
   - Start question
   - Have all teams answer within first 3 seconds
   - Expected: Blue notification appears bottom-center saying "All teams have answered."
   - Expected: Auto-advance after 3 seconds

2. **Natural expiration (≤3s remaining):**
   - Create game with 10-second question timer
   - Start question
   - Wait 7+ seconds
   - Have all teams answer
   - Expected: No notification
   - Expected: Question timer continues counting down
   - Expected: Auto-advance when original timer reaches zero

3. **Boundary test (exactly 3s):**
   - Create game with 10-second question timer
   - Start question
   - Wait exactly 7 seconds
   - Have all teams answer
   - Expected: Natural expiration (no notification)

4. **No timer active:**
   - Create game without question timer
   - Start question
   - Have all teams answer
   - Expected: Notification appears
   - Expected: Auto-advance after 3 seconds

5. **Multi-location consistency:**
   - Test scenarios 1 and 2 while viewing:
     - Controller page (/controller)
     - Player page (/game)
     - Display app (on different device/window)
   - Expected: All show same behavior

**Step 3: Document test results**

If all tests pass, proceed to final commit. If issues found, document them and fix before proceeding.

---

## Task 7: Final Commit and Cleanup

**Step 1: Verify git status**

Run: `git status`
Expected: Working tree clean (all changes committed)

**Step 2: View commit log**

Run: `git log --oneline -7`
Expected: 5 feature commits visible

**Step 3: Push branch (optional)**

If ready to create PR:
```bash
git push -u origin feature/early-advance-notification
```

**Step 4: Return to main workspace**

```bash
cd ../..
```

**Completion:** Feature implementation complete. Use superpowers:finishing-a-development-branch to decide next steps (merge, PR, or cleanup).

---

## Testing Notes

**Manual Testing Required:**
- This feature requires running PocketBase + frontend with multiple clients
- No automated E2E tests exist for timer behavior
- Focus on visual verification and timing accuracy
- Test in real game scenario with multiple teams

**Key Behaviors to Verify:**
- Notification appears at correct position (bottom-center, above normal timer)
- Fade animation is smooth
- No notification when ≤3s remain
- Auto-advance timing is accurate (3 seconds)
- Behavior consistent across all three views (controller, game, display)

**Edge Cases Covered by Design:**
- Timer paused when all teams answer (no early advance)
- No question timer active (show notification)
- Exactly 3 seconds remaining (natural expiration)
- Manual advance during notification (works as expected)

---

## Reference Documents

- Design: `docs/plans/2025-11-11-early-advance-notification-design.md`
- Previous early advance design: `docs/plans/2025-11-08-early-advance-on-all-answers-design.md`
- Timer configuration: `docs/plans/2025-11-08-game-timer-configuration-design.md`
