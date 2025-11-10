# Display Application Testing Guide

## Prerequisites

1. PocketBase running on port 8090
2. Main Trivia Party app running (for host functionality)
3. Display app running on port 5174

## Setup

### Terminal 1: Start PocketBase
```bash
cd /Users/markb/dev/trivia-party
pocketbase serve --dev --http 0.0.0.0:8090
```

### Terminal 2: Start Main App
```bash
cd /Users/markb/dev/trivia-party
pnpm run dev
```

### Terminal 3: Start Display App
```bash
cd /Users/markb/dev/trivia-party/trivia-party-display
pnpm run dev
```

## Test Scenarios

### 1. First Launch (New Display)

1. Open `http://localhost:5174` in browser
2. **Expected:** Display shows 6-digit code in large text
3. **Expected:** QR code shown below instructions
4. **Expected:** Display ID shown in bottom left
5. **Expected:** Version shown in bottom right
6. **Verify:** LocalStorage has `displayId` and `displayPassword`

### 2. Subsequent Launch (Existing Display)

1. Refresh the page (`http://localhost:5174`)
2. **Expected:** New 6-digit code generated (different from before)
3. **Expected:** Same display ID in bottom left
4. **Verify:** LocalStorage still has same `displayId` and `displayPassword`

### 3. Claim Display Flow

1. In main app, login as host (http://localhost:5173)
2. Create a new game
3. Navigate to controller page (`/controller`)
4. Scroll to "Display Management" section
5. Enter the 6-digit code from display app
6. Click "Claim Display"
7. **Expected:** Alert shows "Display claimed successfully"
8. **Expected:** Display appears in claimed list with green "Connected" indicator
9. **Expected:** Display app switches to game screen

### 4. Game Display Synchronization

1. With display claimed, advance game through states:
   - Click "Start Game" → Display shows game-start screen
   - Click "Next" → Display shows round-start screen
   - Click "Next" → Display shows round-play screen with question
   - Click "Next" → Display shows round-end screen with scores
   - Continue through game states
2. **Expected:** Display updates in real-time with each state change
3. **Expected:** All game content visible and readable from distance

### 5. Game Completion Flow

1. Advance game to completion (status = "completed")
2. **Expected:** Display returns to code screen automatically
3. **Expected:** New 6-digit code generated
4. **Expected:** Display removed from host's claimed list
5. **Expected:** Display available=true in database

### 6. Manual Release Flow

1. Claim display again (follow step 3)
2. In host UI, click "Release" button for the display
3. **Expected:** Display returns to code screen immediately
4. **Expected:** New 6-digit code generated
5. **Expected:** Display removed from claimed list
6. **Expected:** Display available=true in database

### 7. Race Condition Test (Simultaneous Claim)

1. Open display app in two different browsers/tabs
2. Note both codes
3. Try to claim the same display from two different host accounts simultaneously
4. **Expected:** Only one claim succeeds
5. **Expected:** Other claim shows error "Display already claimed or not found"

### 8. Connection Loss Handling

1. Claim display and start game
2. Stop PocketBase (Ctrl+C in Terminal 1)
3. **Expected:** Display shows error banner "Failed to initialize display. Retrying..."
4. Restart PocketBase
5. **Expected:** Banner disappears, connection restored
6. **Expected:** If game ended during downtime, returns to code screen

### 9. Multiple Displays

1. Open display app in 3 different browsers/tabs
2. Note all three codes
3. Claim all three displays from same host
4. **Expected:** All three displays shown in claimed list
5. **Expected:** All three update with game state changes
6. Release one display
7. **Expected:** That display returns to code screen
8. **Expected:** Other two displays continue showing game

## Database Verification

Check displays collection in PocketBase admin (http://localhost:8090/_/):

**After first launch:**
- Record exists with display_user, code, available=true

**After claim:**
- available=false, host=userId, game=gameId

**After release:**
- available=true, host=null, game=null, new code

**After game completion:**
- available=true, host=null, game=null, new code

## Known Limitations

1. IP address not available in browser (shows "N/A")
2. Connection status based on PocketBase subscription (not heartbeat)
3. beforeunload not reliable for crashes/power loss

## Troubleshooting

### Display shows "Initializing..." forever
- Check PocketBase is running on port 8090
- Check browser console for errors
- Verify displays collection exists in PocketBase

### Code claim fails with "Display not found"
- Verify code is exactly 6 digits
- Check display available=true in database
- Try refreshing display app to get new code

### Display doesn't update with game state
- Check PocketBase subscription is active (browser console)
- Verify game.data field contains state information
- Check display game field matches current game ID

## Development Notes

- Display app runs on port 5174 to avoid conflict with main app (5173)
- Both apps use same PocketBase instance on port 8090
- Display credentials stored in localStorage (persist across sessions)
- Display users have email format: `{displayId}@trivia-party-displays.com`
