# Trivia Party Display Application

## Overview

We need to create a trivia-party-display app, separate from the regular app. This will be kept in the same repo in a separate folder (`/trivia-party-display`). We'll be creating multiple versions of this app later (Android TV, macOS, Windows, maybe Apple TV) using Tauri, but for now just make it a web app. It'll be easier to get this working as a web app first to test the functionality.

**Architecture**: Completely standalone app with its own `package.json` and dependencies. No code sharing with the main app.

**Goal**: Duplicate the game display for projection on TVs/large screens for all players and spectators to see throughout the game. Use the display components from the `/controller` screen (not the `/game` screen).

---

## Technical Specifications

### Display ID Generation
- **Format**: 15-character lowercase alphanumeric string matching pattern `[a-z0-9]{15}`
- **Method**: Use `crypto.getRandomValues()` or equivalent secure random generation
- **Storage**: Store in localStorage as `displayId`

### Password Generation
- **Length**: 16 characters
- **Character set**: Alphanumeric (uppercase, lowercase, numbers)
- **Method**: Use `crypto.getRandomValues()` for secure random generation
- **Requirement**: Must meet PocketBase minimum (8+ characters) - 16 chars exceeds this
- **Storage**: Store in localStorage as `displayPassword`

### Code Generation
- **Format**: 6-digit numeric code
- **Method**: Use same algorithm as game code generation (reference: `lib/games.ts`)
- **Regeneration**: Generate NEW code on every app startup and after game completion (never reuse codes)

### PocketBase Connection
- **URL Discovery**: Use same auto-detection logic as main app
  - Development mode (port 5173/5176): Connect to `:8090` on same host
  - Production mode (port 80/443): Use same origin (Nginx reverse proxy)
- **Reference**: See `lib/pocketbase.ts` in main app for implementation

---

## Display App Lifecycle

### 1. App Startup

**On every startup, the app should:**

1. **Check localStorage** for `displayId` and `displayPassword`

2. **If credentials NOT found** (first time):
   - Generate random 15-character ID (format: `[a-z0-9]{15}`)
   - Generate random 16-character password
   - Register new user: `<id>@trivia-party-displays.com` with generated password
   - Store credentials in localStorage (`displayId`, `displayPassword`)

3. **If credentials exist**:
   - Login with existing credentials: `<displayId>@trivia-party-displays.com` / password

4. **After successful authentication**:
   - Query displays collection for record where `display_user = currentUserId`
   - **If record exists**: UPDATE it with:
     - `available = true`
     - `host = null`
     - `game = null`
     - `code = <new 6-digit code>`
   - **If record doesn't exist**: CREATE new record with:
     - `display_user = currentUserId`
     - `available = true`
     - `host = null`
     - `game = null`
     - `code = <new 6-digit code>`

5. **Display the Code Screen** (see UI specifications below)

### 2. Being Claimed by Host

**The display subscribes to its own displays record** (`displays.display_user = currentUserId`)

**When `displays.game` changes from null → gameId**:
- Switch from Code Display Screen to Game Display Screen
- Subscribe to the games record (ID = `displays.game`)
- Begin showing game content based on `games.data.state`

### 3. During Game

**Display shows game content in real-time** based on `games.data.state`:
- `game-start`: Welcome screen with game information
- `round-start`: Round introduction with title and categories
- `round-play`: Current question with answer choices
- `round-end`: Round scores
- `game-end`: Final results and winner announcement
- `thanks`: Thank you screen
- Any other states: Handle appropriately

**Uses data from**:
- `games.data` - Current game state and question
- `games.scoreboard` - Team scores
- `games.metadata` - Timer settings (if needed)
- `games.status` - Game status

### 4. Game Completion

**When `games.status` changes to "completed"**:
1. Unsubscribe from games record
2. Update displays record:
   - `host = null`
   - `game = null`
   - `available = true`
   - `code = <new 6-digit code>`
3. Return to Code Display Screen

### 5. Manual Release by Host

**When host manually releases/unclaims the display** (before game ends):
- Display detects `displays.game` changes from gameId → null
- Unsubscribe from games record
- Generate new 6-digit code
- Update displays record:
  - `code = <new 6-digit code>`
  - `available = true`
  - `host = null`
- Return to Code Display Screen

### 6. Connection Loss

**If display loses connection to PocketBase during game**:
- Show error banner: "Reconnecting to server..."
- Attempt reconnection every 5 seconds
- When reconnected: Resume game display (stay subscribed to same game)
- If game has ended during disconnection: Return to Code Display Screen

### 7. App Close/Shutdown

**On beforeunload event** (best effort):
- Set `displays.available = false`
- Note: This is not reliable for crashes/power loss, but attempt it anyway

---

## Host UI in Main App

### Location
Add a new **"Displays" accordion section** in the `/controller` screen (similar to the Timers section)

### Components

#### 1. Claim Display Section
- **Input field** for 6-digit code
- **"Claim Display" button**
- When clicked:
  - Query displays collection: `filter="code={enteredCode} && available=true"`
  - If found, attempt to update displays record:
    - `host = currentUserId`
    - `available = false`
    - `game = currentGameId`
  - If update succeeds: Add to claimed displays list
  - If update fails: Show error banner "Display already claimed or not found"

#### 2. Claimed Displays List
Show all displays where `host = currentUserId && game = currentGameId`

For each display, show:
- **Code** (e.g., "123456")
- **Connection Status**:
  - "Connected" (green indicator)
  - "Disconnected" (red indicator)
  - Determine by checking if display has recent activity (you'll need to track this)
- **"Release" button**:
  - When clicked, update displays record:
    - `host = null`
    - `game = null`
    - `available = true`
  - Display will automatically return to Code Display Screen

#### 3. Error Handling
- Show error banner for failed claim attempts
- Allow retry with same code

---

## Display App UI Specifications

### Code Display Screen

**When**: Display is available and waiting to be claimed

**Layout**: Full screen, centered content

**Show**:
1. **Large 6-digit code**
   - Font size: 120px or larger
   - Centered on screen
   - High contrast for visibility from distance

2. **Instructions text**
   - Below the code
   - "Enter this code on your host screen to claim this display"
   - Font size: 32px

3. **QR Code**
   - Below instructions
   - Encodes the claim information (code + any other needed data)
   - Size: 300x300px

4. **App version**
   - Bottom right corner
   - Small text (16px)
   - Format: "v1.0.0"

5. **Display ID** (for troubleshooting)
   - Bottom left corner
   - Very small text (12px)
   - Format: "ID: abc123xyz456789"

6. **Device info** (for debugging)
   - Top left corner, very small text (12px)
   - Show: IP address (if available), browser info
   - Example: "192.168.1.100 | Chrome 120"

### Game Display Screen

**When**: Display is claimed and showing game content

**Layout**: Match the layout from `/controller` screen components, optimized for 1920x1080 resolution

**Content varies by `games.data.state`**:
- Use existing controller components
- Show all game states (game-start, round-start, round-play, round-end, game-end, thanks)
- Ensure text is large enough for viewing from distance

**Additional UI Elements**:
- Small semi-transparent badge in corner showing connection status (optional, can be hidden during game)

### Error Display

**Error notification banner**:
- Position: Top of screen
- Semi-transparent red background
- White text
- Auto-dismiss after 5 seconds for non-critical errors
- Persistent for critical errors (with retry button)

**Error types**:
- "Failed to register display. Retrying..."
- "Connection lost. Reconnecting..."
- "Login failed. Clearing credentials and restarting..."

---

## Error Handling

### Registration Failure
- Show error banner: "Failed to register display. Retrying in 5 seconds..."
- Retry automatically up to 3 times
- If all retries fail: Show persistent error with manual retry button

### Login Failure
- Attempt to re-register (credentials may be invalid)
- If re-registration fails: Clear localStorage and start fresh (full reset)

### Claim Failure (Host Side)
- Show error banner on controller: "Display already claimed or not found"
- Allow host to retry with same code
- Clear input field after error

### Subscription Failure
- Log error to console
- Show error banner: "Failed to connect to game. Retrying..."
- Attempt to resubscribe every 10 seconds

### PocketBase Connection Failure
- Show error banner: "Connection lost. Reconnecting..."
- Attempt reconnection every 5 seconds
- Keep trying indefinitely

---

## Security & API Rules

### displays Collection Rules

**Current rules** (from migrations):
- `createRule`: `@request.auth.id = display_user`
- `deleteRule`: `@request.auth.id = display_user`
- `updateRule`: `@request.auth.id = display_user || available = true`
- `viewRule`: `` (open read access)

**Race Condition Handling**:
- Rely on PocketBase update rule checking `available = true`
- If two hosts try to claim simultaneously, only one will succeed
- The failed claim will return an error (record not found or update failed)
- Host UI shows error and allows retry

---

## Database Indexes

**Recommended indexes for displays collection**:
- `idx_displays_code` - For code lookups during claim
- `idx_displays_display_user` - For display record queries
- `idx_displays_host` - For listing displays by host
- `idx_displays_game` - For querying displays by game
- `idx_displays_available` - For finding available displays

(Note: These may already exist, check migrations)

---

## Folder Structure

```
/trivia-party-display/
├── package.json          # Separate dependencies
├── vite.config.ts        # Separate Vite config
├── tsconfig.json         # TypeScript config
├── index.html            # Entry point
├── src/
│   ├── main.tsx          # App entry
│   ├── App.tsx           # Root component
│   ├── lib/
│   │   └── pocketbase.ts # PocketBase client (copy/adapt from main app)
│   ├── components/
│   │   ├── CodeDisplay.tsx
│   │   ├── GameDisplay.tsx
│   │   └── ErrorBanner.tsx
│   └── types/
│       └── pocketbase-types.ts  # Type definitions (copy from main app)
└── README.md
```

---

## Implementation Notes

1. **Reference the main app** for:
   - PocketBase connection logic (`lib/pocketbase.ts`)
   - Game code generation algorithm (`lib/games.ts`)
   - Type definitions (`types/pocketbase-types.ts`)

2. **Copy but don't share**: Since this is a completely separate app, copy the necessary utilities rather than creating shared dependencies

3. **Testing**: Use same PocketBase instance as main app (localhost:8090 in dev)

4. **Deployment**: Can be deployed as static site alongside main app

---

## Development Commands

### Running the Display App
```bash
cd trivia-party-display
pnpm install
pnpm run dev
```

The display app should run on a different port than the main app (e.g., 5174 if main app is on 5173)

### Building for Production
```bash
cd trivia-party-display
pnpm run build
```

### Future: Tauri Conversion
Once the web app is working, we can add Tauri configuration to package it for:
- Android TV
- macOS
- Windows
- Apple TV (later)
