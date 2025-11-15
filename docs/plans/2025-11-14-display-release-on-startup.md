# Display Release on Startup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically release display claims on app startup to prevent displays from being stuck on abandoned games.

**Architecture:** Simplify DisplayContext initialization by replacing conditional claim-preservation logic with unconditional release logic. Every startup treats the display as "fresh start" - clear any existing game/host claims, preserve the display code, and show code screen.

**Tech Stack:** React 18, TypeScript, PocketBase (real-time subscriptions), Tauri 2.0 (macOS + Android TV)

---

## Task 1: Modify Display Initialization Logic

**Files:**
- Modify: `trivia-party-display/src/contexts/DisplayContext.tsx:126-155`

**Step 1: Update existing display record handling**

Replace lines 127-155 (the conditional logic for handling existing display records) with unconditional release logic:

```typescript
if (records.length > 0) {
  // Update existing record - always release on startup
  console.log('📺 Existing display found, releasing any claims...')
  record = await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
    available: true,
    host: null,
    game: null,
    code: records[0].code || generateDisplayCode(),  // Keep existing code, generate if missing
    metadata: records[0].metadata || { theme: 'dark' },
  })
  console.log('✅ Display released and ready, code:', record.code)
} else {
  // Create new record (unchanged)
  console.log('📺 Creating new display record')
  const newCode = generateDisplayCode()
  record = await pb.collection('displays').create<DisplaysRecord>({
    display_user: authData.record.id,
    available: true,
    host: null,
    game: null,
    code: newCode,
    metadata: { theme: 'dark' },
  })
  console.log('✅ Display record created with code:', newCode)
}
```

**Key Changes:**
- Remove all conditional branches (`if (record.available && !record.game)`, `else if (record.game)`, etc.)
- Always perform update with release values: `available: true`, `host: null`, `game: null`
- Preserve existing code: `code: records[0].code || generateDisplayCode()`
- Preserve metadata: `metadata: records[0].metadata || { theme: 'dark' }`
- Update console logs to reflect "always release" behavior

**Step 2: Verify the code compiles**

Run: `cd trivia-party-display && pnpm run build`

Expected: TypeScript compilation and Vite build succeed with no errors

**Step 3: Commit the change**

```bash
git add trivia-party-display/src/contexts/DisplayContext.tsx
git commit -m "feat: automatically release display claims on startup

- Simplify DisplayContext initialization by removing conditional claim-preservation logic
- Always release display on startup (clear game/host, set available=true)
- Preserve existing display code across restarts
- Prevents displays from being stuck on abandoned games

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Manual Testing - Fresh Display Start

**Step 1: Start the display app for first time**

Run: `cd trivia-party-display && pnpm tauri:dev`

**Step 2: Verify behavior**

✓ Display shows code screen with 4-digit code
✓ Console logs show "Creating new display record"
✓ No errors in console

**Step 3: Check PocketBase admin**

Navigate to: `http://localhost:8090/_/` → displays collection

✓ Verify record exists with: `available: true`, `game: null`, `host: null`, `code: [4-digit-code]`

**Step 4: Note the display code for next test**

Write down the 4-digit code displayed on screen.

---

## Task 3: Manual Testing - Restart Unclaimed Display

**Step 1: Quit the display app**

Close the Tauri window or press Cmd+Q

**Step 2: Restart the display app**

Run: `cd trivia-party-display && pnpm tauri:dev`

**Step 3: Verify behavior**

✓ Display shows code screen
✓ Console logs show "Existing display found, releasing any claims..."
✓ Same 4-digit code is displayed (code preserved)
✓ No errors in console

**Step 4: Check PocketBase admin**

Navigate to: `http://localhost:8090/_/` → displays collection

✓ Verify record still has: `available: true`, `game: null`, `host: null`, same `code`

---

## Task 4: Manual Testing - Restart Claimed Display (Main Use Case)

**Prerequisites:**
- Display app running and showing code screen
- Main trivia-party host app running at `http://localhost:5173`

**Step 1: Claim the display from host app**

1. In host app, create a new game
2. Navigate to Display screen
3. Enter the 4-digit code from display app
4. Click "Connect Display"

**Step 2: Verify display is claimed**

✓ Display app switches from code screen to game screen
✓ Display shows game content
✓ PocketBase admin shows: `available: false`, `game: [game-id]`, `host: [host-id]`

**Step 3: Quit display app WITHOUT releasing from host**

Close the Tauri window (DO NOT click "Release Display" in host app)

**Step 4: Restart display app**

Run: `cd trivia-party-display && pnpm tauri:dev`

**Step 5: Verify release-on-startup behavior (CRITICAL)**

✓ Display shows code screen (NOT stuck on game)
✓ Console logs show "Existing display found, releasing any claims..."
✓ Same 4-digit code displayed
✓ No errors in console

**Step 6: Verify host app sees disconnection**

Check host app:
✓ Should show "Display disconnected" or similar feedback
✓ "Connect Display" button should be available again

**Step 7: Verify reconnection works**

1. In host app, enter the same 4-digit code
2. Click "Connect Display"
3. ✓ Display reconnects and shows current game state

**Step 8: Check PocketBase admin**

Navigate to: `http://localhost:8090/_/` → displays collection

✓ After restart: `available: true`, `game: null`, `host: null`, code preserved
✓ After reconnect: `available: false`, `game: [game-id]`, `host: [host-id]`

---

## Task 5: Manual Testing - Restart During Active Game

**Prerequisites:**
- Display connected to a game
- Game progressed to at least round 2

**Step 1: Start game and progress to round 2**

1. In host app with display connected, start the game
2. Play through round 1 completely
3. Advance to round 2

**Step 2: Verify display shows round 2**

✓ Display shows "Round 2" content

**Step 3: Restart display app while on round 2**

Close and restart: `cd trivia-party-display && pnpm tauri:dev`

**Step 4: Verify release behavior**

✓ Display shows code screen (not stuck on round 2)
✓ Same code displayed
✓ Console shows release message

**Step 5: Reconnect display using code**

1. In host app, enter the code
2. Click "Connect Display"

**Step 6: Verify sync to current game state**

✓ Display immediately syncs to round 2 (current game state)
✓ Not starting from beginning - picks up where game left off
✓ All game state preserved (scores, teams, progress)

---

## Task 6: Platform Testing - Android TV (Optional)

**Note:** Only perform if Android TV build environment is set up.

**Step 1: Build Android TV APK**

Run: `cd trivia-party-display && pnpm tauri:android:build`

Expected: APK builds successfully

**Step 2: Install on Android TV device/emulator**

Install the generated APK from `src-tauri/gen/android/app/build/outputs/apk/`

**Step 3: Repeat Test 4 (Restart Claimed Display) on Android TV**

Follow all steps from Task 4, using Android TV remote to navigate.

✓ Verify same behavior as macOS version
✓ Display releases on app restart
✓ Code preserved
✓ Reconnection works

---

## Task 7: Final Verification and Documentation

**Step 1: Run build to ensure no regressions**

Run: `pnpm run build`

Expected: Clean build with no errors

**Step 2: Review all changes**

Run: `git diff main --stat`

Expected: Only `trivia-party-display/src/contexts/DisplayContext.tsx` modified

**Step 3: Create final commit if any cleanup needed**

```bash
git add .
git commit -m "chore: final cleanup for display release on startup

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 4: Update BUILD.md with new behavior (optional)**

If `trivia-party-display/BUILD.md` mentions display claiming/restart behavior, update it to reflect the new "release on startup" behavior.

**Step 5: Push branch**

```bash
git push -u origin feature/display-release-on-startup
```

---

## Success Criteria

All of the following must be verified:

- ✓ Display apps restart cleanly showing code screen regardless of previous state
- ✓ Existing display codes are preserved across restarts
- ✓ Hosts can reconnect displays using the same code
- ✓ Display syncs to current game state when reconnected mid-game
- ✓ Both macOS and Android TV platforms behave identically (if tested)
- ✓ No console errors during startup or release
- ✓ PocketBase records show correct state transitions
- ✓ Build succeeds with no TypeScript errors
- ✓ No regressions in other display functionality

---

## Notes

**TDD Approach:** This change is to existing initialization logic without clear test infrastructure for Tauri apps. Manual testing is the primary verification method. If the project later adds E2E tests (e.g., Playwright + Tauri), this behavior should be covered.

**DRY:** The change removes duplicate conditional logic (three branches checking display state) and replaces it with a single update path.

**YAGNI:** Removed unnecessary complexity in state checking. The unconditional release is simpler and solves the actual problem without premature optimization.

**Frequent Commits:** Commit after the code change (Task 1), and after any documentation updates (Task 7).
