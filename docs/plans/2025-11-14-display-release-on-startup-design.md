# Display Release on Startup Design

**Date:** 2024-11-14
**Status:** Approved
**Platforms:** Android TV, macOS

## Problem Statement

When a host starts a game and claims a display, then exits the game without properly releasing the display, the trivia-party-display app remains stuck on that game indefinitely. The display app currently preserves game claims across restarts (DisplayContext.tsx:140-143), which means restarting the app doesn't resolve the stuck state. This creates a poor user experience where the only recovery is manual intervention through the PocketBase admin panel or waiting for the host to return and properly release the display.

## Requirements

Based on stakeholder discussion:

1. **Behavior:** Always release display on startup (clear game claim, show code screen)
2. **Code Preservation:** Keep existing display code (don't regenerate)
3. **Timing:** Release after PocketBase connection established
4. **Scope:** Both Android TV and macOS platforms

## Design Overview

### Architecture Approach

Replace the conditional claim-preservation logic with unconditional release logic. Every display startup will be treated as a "fresh start" - the display clears any previous claims and shows its code screen, ready to be claimed by a host.

**Current problematic code** (DisplayContext.tsx:128-155):
```typescript
if (records.length > 0) {
  record = records[0]
  if (record.available && !record.game) {
    // Display is available and not claimed, just use it as-is
  } else if (record.game) {
    // Display is claimed - don't reset it! ⚠️ PROBLEM LINE
    console.log('📺 Display is already claimed, keeping claim')
  } else {
    // Display exists but is unavailable (not claimed) - reset it
  }
}
```

### Implementation

**Code Location:** `trivia-party-display/src/contexts/DisplayContext.tsx`
**Lines to Modify:** 126-155

**New logic:**
```typescript
if (records.length > 0) {
  // Update existing record - always release on startup
  console.log('📺 Existing display found, releasing any claims...')
  record = await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
    available: true,
    host: null,
    game: null,
    code: records[0].code,  // Keep existing code
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

**Key changes:**
1. Remove all conditional branches (available check, game check, unavailable check)
2. Always perform a single update operation with release values
3. Preserve existing code using `records[0].code`
4. Update console logs to reflect new "always release" behavior
5. Set `currentScreen` to 'code' and clear `gameId` state (lines 174-181 remain unchanged)

### Database Impact

- **Schema changes:** None required
- **Write operations:** One update per startup when existing record found (same as before for most cases)
- **Data integrity:** No impact - all fields are being set to valid release state values

## Error Handling & Edge Cases

### Edge Case 1: Missing Code Field

If `records[0].code` is null/undefined (defensive coding):
```typescript
code: records[0].code || generateDisplayCode()
```

### Edge Case 2: Host's Perspective

When a host has claimed a display and the display app restarts:
1. Display releases itself (game/host fields cleared)
2. Host's web app receives real-time update via PocketBase subscription (existing mechanism)
3. Host sees "Display disconnected" or similar UI feedback (already implemented in main app)
4. Host can re-claim the display using the same code

### Edge Case 3: Active Game in Progress

If a game is actively being played when display restarts:
1. Display releases itself and shows code screen
2. Game continues running on host's device (game state is independent of display)
3. Host can reconnect the display by entering the code again
4. Display will sync to current game state via existing subscription logic (DisplayContext.tsx:292-371)

### Edge Case 4: Concurrent Restarts

Multiple restarts in quick succession:
- Each restart triggers a DB update
- Updates are serialized by PocketBase
- Last update wins (all will have same release values anyway)
- No data corruption risk

### Error Handling

Existing try-catch block (DisplayContext.tsx:231-270) already handles update failures. If the update fails, the retry mechanism (line 269) will attempt initialization again after 5 seconds. No additional error handling needed.

## Testing & Verification

### Manual Testing Scenarios

1. **Fresh Display Start**
   - Start display app for first time
   - ✓ Verify: Shows code screen
   - ✓ Verify: Display is available in PocketBase

2. **Restart Unclaimed Display**
   - Start display, note the code
   - Quit display app
   - Restart display app
   - ✓ Verify: Shows same code
   - ✓ Verify: Still available

3. **Restart Claimed Display (Main Use Case)**
   - Start display, claim it from host app
   - Display shows game content
   - Quit display app WITHOUT releasing from host
   - Restart display app
   - ✓ Verify: Shows code screen (not stuck on game)
   - ✓ Verify: Same code displayed
   - ✓ Verify: Host app shows display as disconnected
   - ✓ Verify: Host can re-claim using same code

4. **Restart During Active Game**
   - Host starts game with display claimed
   - Game progresses to round 2
   - Restart display app
   - ✓ Verify: Shows code screen
   - Host re-claims display with code
   - ✓ Verify: Display syncs to current round 2 state

5. **Platform-Specific Testing**
   - Test on macOS (desktop app)
   - Test on Android TV (APK)
   - ✓ Verify: Same behavior on both platforms

### Verification Points

- Console logs show "releasing any claims" message
- PocketBase admin panel shows display record with `game: null`, `host: null`, `available: true`
- Code field remains unchanged across restarts
- No errors in browser/app console

## Benefits

1. **User Experience:** Displays can be "unstuck" by simply restarting the app
2. **Simplicity:** Removes complex conditional logic with three branches
3. **Predictability:** Every startup behaves the same way
4. **Code Preservation:** Users don't need to re-enter codes after restart
5. **Platform Consistency:** Same behavior on Android TV and macOS

## Trade-offs

**Accepted trade-off:** If a display app crashes during an active game, it won't automatically reconnect - the host must re-enter the code. This is acceptable because:
- Crashes should be rare
- Re-entering a 4-digit code is quick
- The benefit of being able to "unstuck" displays outweighs this inconvenience
- Preserving the code makes reconnection easier than generating a new one

## Implementation Scope

**Files to modify:**
- `trivia-party-display/src/contexts/DisplayContext.tsx` (lines 126-155)

**No changes required to:**
- Database schema
- PocketBase migrations
- Host web application
- Display UI components
- Subscription logic

## Success Criteria

- Display apps restart cleanly showing code screen regardless of previous state
- Existing display codes are preserved across restarts
- Hosts can reconnect displays using the same code
- Both Android TV and macOS platforms behave identically
- No new errors or crashes introduced
