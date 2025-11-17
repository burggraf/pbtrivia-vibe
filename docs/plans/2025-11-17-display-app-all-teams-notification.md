# Display App: All Teams Answered Notification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "All teams have answered" notification to the display app to match /game and /controller screens.

**Architecture:** Add `showAsNotification` flag to timer types, then render notification in GameDisplay when flag is true. Matches existing implementation pattern from GamePage.tsx and ControllerPage.tsx.

**Tech Stack:** React, TypeScript, Tailwind CSS, Tauri 2.0

---

## Task 1: Update Display App TypeScript Types

**Files:**
- Modify: `trivia-party-display/src/types/games.ts:154-162`

**Step 1: Add showAsNotification property to timer interface**

In `trivia-party-display/src/types/games.ts`, locate the `GameData` interface's timer property (lines 154-162) and add the new property:

```typescript
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
```

**Step 2: Verify TypeScript compilation**

Run: `cd trivia-party-display && pnpm run build`

Expected: TypeScript compiles without errors, no type warnings

**Step 3: Commit type changes**

```bash
git add trivia-party-display/src/types/games.ts
git commit -m "feat(display): add showAsNotification to timer types"
```

---

## Task 2: Add Notification to GameDisplay Component

**Files:**
- Modify: `trivia-party-display/src/components/GameDisplay.tsx:106`

**Step 1: Add notification JSX after circular timer**

In `trivia-party-display/src/components/GameDisplay.tsx`, locate the circular timer section (around line 106, after the closing `)}` of the timer conditional). Add the notification immediately after:

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

      {/* Early Answer Notification - Show when all teams have answered */}
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
    </>
```

**Implementation Notes:**
- Positioned at `bottom-20` (80px from bottom) to match GamePage/ControllerPage
- Uses `z-50` to appear above game content
- Blue background (`bg-blue-500`) with dark mode variant (`dark:bg-blue-600`)
- Two animations: `slideDown` (entrance) and `pulse` (infinite, after 0.5s delay)
- Accessibility: `role="status"` and `aria-live="polite"` for screen readers

**Step 2: Verify TypeScript compilation**

Run: `cd trivia-party-display && pnpm run build`

Expected: TypeScript compiles without errors, build succeeds

**Step 3: Commit notification implementation**

```bash
git add trivia-party-display/src/components/GameDisplay.tsx
git commit -m "feat(display): add all teams answered notification

Add notification box to display app matching /game and /controller
screens. Shows when gameData.timer.showAsNotification is true.

- Blue box at bottom-center with slideDown + pulse animations
- Displays 'All teams have answered.' message
- Includes ARIA attributes for accessibility"
```

---

## Task 3: Manual Testing

**No code changes - verification only**

**Test Scenario 1: Baseline (no notification)**

1. Start PocketBase: `pocketbase serve --dev --http 0.0.0.0:8090`
2. Start main app: `pnpm run dev` (from root)
3. Start display app: `cd trivia-party-display && pnpm tauri:dev`
4. Create game WITHOUT "auto-reveal on all answered" enabled
5. Start game, navigate to question
6. Have all teams answer
7. **Expected:** Display app shows circular timer only (NO notification)

**Test Scenario 2: With auto-reveal enabled**

1. Create game WITH "auto-reveal on all answered" toggle enabled
2. Configure question timer (e.g., 10 seconds)
3. Start game, navigate to question
4. Have all teams answer within first 5 seconds
5. **Expected on display app:**
   - Blue notification appears at bottom-center
   - Text reads "All teams have answered."
   - Notification slides down smoothly
   - Notification pulses after 0.5 seconds
   - After 3 seconds total, answer is revealed
6. **Visual comparison:** Open /controller screen side-by-side with display app
   - Notification should be identical in appearance
   - Position, colors, size, animations should match exactly

**Test Scenario 3: Dark mode**

1. Enable dark mode in display app settings
2. Repeat Test Scenario 2
3. **Expected:** Notification uses `bg-blue-600` (darker blue variant)

**Test Scenario 4: Manual mode (no question timer)**

1. Create game WITH "auto-reveal" enabled but NO question timer
2. Start game, navigate to question manually
3. Have all teams answer
4. **Expected:** Notification appears, auto-advances after 3 seconds

**Test Scenario 5: Multi-platform (if applicable)**

1. Test on macOS: `pnpm tauri:dev` or built .dmg
2. Test on Android TV (if available): `pnpm tauri:android:dev`
3. **Expected:** Notification appears correctly on both platforms

**Test Completion:**

If all scenarios pass, proceed to final commit. If any fail, investigate and fix before committing.

---

## Task 4: Final Build and Verification

**Step 1: Clean build from root**

Run: `cd /Users/markb/dev/trivia-party/.worktrees/display-app-notification && pnpm run build`

Expected: Main app builds successfully without errors or warnings

**Step 2: Build display app**

Run: `cd trivia-party-display && pnpm run build`

Expected: Display app builds successfully, no TypeScript errors

**Step 3: Verify no unintended changes**

Run: `git status`

Expected: Only modified files are:
- `trivia-party-display/src/types/games.ts`
- `trivia-party-display/src/components/GameDisplay.tsx`

**Step 4: Review commits**

Run: `git log --oneline -3`

Expected: See 2 feature commits from this implementation

---

## Success Criteria

- ✅ TypeScript types include `showAsNotification` property
- ✅ Display app shows notification when `showAsNotification` is true
- ✅ Notification uses identical styling to /game and /controller screens
- ✅ Notification positioned at bottom-center (fixed bottom-20)
- ✅ SlideDown and pulse animations work correctly
- ✅ Dark mode styling applies correctly (bg-blue-600)
- ✅ Accessibility attributes present (role="status", aria-live="polite")
- ✅ No console errors or TypeScript warnings
- ✅ Main app and display app both build successfully

---

## Rollback Plan

If issues are discovered after merging:

1. Revert commits: `git revert HEAD~2..HEAD`
2. Remove `showAsNotification` property from types
3. Remove notification JSX from GameDisplay
4. Submit rollback PR

---

## Related Documentation

- Design doc: `docs/plans/2025-11-17-display-app-all-teams-notification-design.md`
- Auto-reveal feature: `docs/plans/2025-11-13-auto-reveal-on-all-answered-design.md`
- Early advance notification: `docs/plans/2025-11-11-early-advance-notification-design.md`

---

## Notes

- This implementation matches the exact pattern from GamePage.tsx (lines 478-492) and ControllerPage.tsx (lines 1095-1106)
- The notification is triggered by ControllerPage setting `showAsNotification: true` on the timer when all teams answer (ControllerPage.tsx:354)
- The 3-second duration is hardcoded in ControllerPage, not configurable in this task
- No automated UI tests are included - this is purely visual verification
