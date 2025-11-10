# Trivia Party Display Application - Design Document

**Date:** 2025-11-10
**Status:** Approved
**Implementation Approach:** Both sides in parallel (display app + host UI)

## Overview

Create a standalone display application that duplicates game content for projection on TVs/large screens. The display app is claimed by hosts using 6-digit codes and shows real-time game state synchronized via PocketBase.

## Key Design Decisions

### Component Reuse Strategy
**Decision:** Copy components to display app
**Rationale:** Maintains "completely standalone" requirement from spec. No shared dependencies, simpler build process. Changes must be synced manually but adds no architectural complexity.

### State Management
**Decision:** React Context
**Rationale:** Built-in, no additional dependencies, sufficient for linear state flow (code screen → game screen). The display app has straightforward state transitions without complex interdependencies.

### QR Code Library
**Decision:** react-qr-code v2.0.18
**Rationale:** Same library already used in main app's controller screen. Proven to work, consistent approach.

## Architecture

### Two-App Structure

```
Repository Root
├── src/                          # Main app (unchanged)
├── trivia-party-display/         # NEW: Display app
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── lib/
│   │   │   ├── pocketbase.ts
│   │   │   ├── crypto.ts
│   │   │   └── utils.ts
│   │   ├── contexts/
│   │   │   └── DisplayContext.tsx
│   │   ├── components/
│   │   │   ├── ui/               # Copied from main app
│   │   │   ├── CodeDisplay.tsx
│   │   │   ├── GameDisplay.tsx
│   │   │   ├── ErrorBanner.tsx
│   │   │   └── states/           # Copied from main app
│   │   └── types/
│   │       └── pocketbase-types.ts
│   └── README.md
└── pb_migrations/                # Shared PocketBase
```

### Display App Dependencies

Core dependencies:
- React 18 + TypeScript
- Vite (build tool, dev server on port 5174)
- PocketBase JS SDK
- Tailwind CSS + PostCSS
- shadcn/ui components
- react-qr-code ^2.0.18

Both apps connect to same PocketBase instance (localhost:8090 in dev).

## State Management

### DisplayContext Structure

```typescript
interface DisplayState {
  // Auth & Identity
  displayId: string | null          // 15-char ID from localStorage
  displayPassword: string | null    // 16-char password from localStorage
  isAuthenticated: boolean
  userId: string | null

  // Display Record
  displayRecord: DisplayRecord | null
  code: string | null               // Current 6-digit code

  // Game Connection
  gameId: string | null
  gameRecord: GameRecord | null

  // UI State
  currentScreen: 'code' | 'game' | 'error'
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  error: string | null
}
```

### State Transitions

1. **App Startup**
   - Check localStorage for credentials
   - Register (if new) or Login (if exists)
   - Create/Update display record
   - Show code screen

2. **Display Claimed** (displays.game: null → gameId)
   - Switch to game screen
   - Subscribe to games record
   - Display real-time game content

3. **Game Active**
   - Update UI based on games.data.state
   - Show appropriate component for each state

4. **Game Ends** (games.status → "completed")
   - Unsubscribe from games
   - Update display record (host=null, game=null, new code)
   - Return to code screen

5. **Manual Release** (displays.game: gameId → null)
   - Unsubscribe from games
   - Generate new code
   - Return to code screen

### Subscription Strategy

**Active Subscriptions:**
- Always: `displays` record where `display_user = currentUserId`
- During game: `games` record by ID from displays.game field

**Reconnection:**
- Use PocketBase automatic reconnection
- Show reconnecting banner during connection loss
- Resume subscriptions after reconnect

## Crypto & ID Generation

### Display ID (15 characters)

```typescript
export function generateDisplayId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(15)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}
```

Format: `[a-z0-9]{15}`
Example: `k3j9x2m5p8r1w4q`

### Password (16 characters)

```typescript
export function generateDisplayPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}
```

Character set: Alphanumeric (upper, lower, digits)
Meets PocketBase minimum (8+ chars)

### 6-Digit Code

```typescript
export function generateDisplayCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (array[0] % 900000 + 100000).toString()
  return code
}
```

Range: 100000-999999 (always 6 digits)
Algorithm: Same as main app's game code generation

### Email Construction

```typescript
export function getDisplayEmail(displayId: string): string {
  return `${displayId}@trivia-party-displays.com`
}
```

### LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  DISPLAY_ID: 'displayId',
  DISPLAY_PASSWORD: 'displayPassword'
}
```

## Authentication Flow

### First Launch (No Credentials)

1. Generate displayId (15 chars)
2. Generate displayPassword (16 chars)
3. Register user: `{displayId}@trivia-party-displays.com` with password
4. Store credentials in localStorage
5. Query displays collection for `display_user = currentUserId`
6. If record exists: UPDATE with available=true, host=null, game=null, new code
7. If not exists: CREATE record with display_user, available=true, new code

### Subsequent Launches (Credentials Exist)

1. Login with stored credentials
2. Query displays collection for `display_user = currentUserId`
3. UPDATE record with available=true, host=null, game=null, new code
4. Show code screen

### Error Handling

- **Registration failure:** Retry up to 3 times, then show manual retry button
- **Login failure:** Attempt re-registration; if fails, clear localStorage and restart
- **Connection loss:** Show reconnecting banner, retry every 5 seconds indefinitely

## Display App UI Components

### CodeDisplay Component

**Full-screen centered layout showing:**

1. **Large 6-digit code**
   - Font size: 120px
   - Centered on screen
   - High contrast for distance visibility

2. **Instructions text**
   - Below code
   - "Enter this code on your host screen to claim this display"
   - Font size: 32px

3. **QR Code**
   - Using react-qr-code
   - Size: 300x300px
   - Value: The 6-digit code (simple encoding)

4. **App version**
   - Bottom right corner
   - Font size: 16px
   - Format: "v1.0.0"

5. **Display ID** (troubleshooting)
   - Bottom left corner
   - Font size: 12px
   - Format: "ID: abc123xyz456789"

6. **Device info** (debugging)
   - Top left corner
   - Font size: 12px
   - Shows: IP address (if available), browser info
   - Example: "192.168.1.100 | Chrome 120"

### GameDisplay Component

**Shows game content based on games.data.state:**

Components copied from main app's controller:
- GameStart.tsx
- RoundStartDisplay.tsx
- RoundPlayDisplay.tsx
- RoundEnd.tsx
- GameEnd.tsx
- Thanks.tsx

**Layout:**
- Optimized for 1920x1080 resolution
- Text sized for viewing from distance
- Optional: Small connection status badge in corner

**State handling:**
- Same logic as GameStateDisplay.tsx from main app
- Real-time updates via PocketBase subscription

### ErrorBanner Component

**Positioned at top of screen:**

- Semi-transparent red background (#dc2626, 90% opacity)
- White text, centered
- Auto-dismiss after 5 seconds (non-critical errors)
- Persistent with retry button (critical errors)

**Error types:**
- "Failed to register display. Retrying..."
- "Connection lost. Reconnecting..."
- "Login failed. Clearing credentials and restarting..."

### Styling Standards

- Tailwind CSS (same config as main app)
- Dark mode support via theme context
- Responsive but optimized for large screens
- High contrast for visibility from distance

## Host UI Integration

### Location

Add new "Displays" accordion section in `/controller` screen (src/pages/ControllerPage.tsx), similar to existing Timers section.

### Accordion Structure

```tsx
<AccordionItem value="displays">
  <AccordionTrigger>Displays</AccordionTrigger>
  <AccordionContent>
    <DisplayManagement gameId={game.id} />
  </AccordionContent>
</AccordionItem>
```

### DisplayManagement Component

**New component:** `components/games/DisplayManagement.tsx`

#### Section 1: Claim Display

- Input field for 6-digit code (numeric only, maxLength=6)
- "Claim Display" button

**On click:**
1. Query displays collection: `filter="code={code} && available=true"`
2. If found: Update displays record
   - `host = currentUserId`
   - `available = false`
   - `game = currentGameId`
3. Success: Display added to claimed list
4. Error: Show banner "Display already claimed or not found"

#### Section 2: Claimed Displays List

**Subscribe to:** displays where `host=currentUserId && game=currentGameId`

**For each display show:**
- Code (e.g., "123456")
- Connection status:
  - Green dot + "Connected"
  - Red dot + "Disconnected"
  - Determined by last update timestamp or heartbeat
- "Release" button:
  - Updates displays record: `host=null, game=null, available=true`
  - Display automatically returns to code screen

#### Section 3: Empty State

When no displays claimed:
- "No displays claimed. Enter a code above to claim a display."

### Error Handling

- Toast notifications for claim success/failure
- Allow retry with same code after error
- Clear input field after successful claim

## Lifecycle Details

### App Startup

Every time the display app starts:
1. Check localStorage for credentials
2. Register/Login as needed
3. Ensure display record exists and is available
4. Generate new 6-digit code
5. Display code screen

### Being Claimed by Host

1. Display subscribes to own displays record
2. When `displays.game` changes from null → gameId:
   - Switch to game screen
   - Subscribe to games record
   - Begin showing game content

### During Game

Display shows content based on `games.data.state`:
- game-start
- round-start
- round-play
- round-end
- game-end
- thanks

Uses data from:
- games.data (current state and question)
- games.scoreboard (team scores)
- games.metadata (timer settings if needed)

### Game Completion

When `games.status` changes to "completed":
1. Unsubscribe from games record
2. Update displays record: host=null, game=null, available=true, new code
3. Return to code screen

### Manual Release by Host

When host releases display before game ends:
1. Display detects `displays.game` changes from gameId → null
2. Unsubscribe from games record
3. Generate new 6-digit code
4. Update displays record: code=newCode, available=true, host=null
5. Return to code screen

### Connection Loss

If PocketBase connection lost during game:
1. Show error banner: "Reconnecting to server..."
2. Attempt reconnection every 5 seconds
3. When reconnected: Resume game display (same subscriptions)
4. If game ended during disconnection: Return to code screen

### App Close/Shutdown

On beforeunload event (best effort):
- Set `displays.available = false`
- Note: Not reliable for crashes/power loss, but attempt anyway

## Security & Race Conditions

### displays Collection Rules

From migrations:
- `createRule`: `@request.auth.id = display_user`
- `deleteRule`: `@request.auth.id = display_user`
- `updateRule`: `@request.auth.id = display_user || available = true`
- `viewRule`: `` (open read access)

### Race Condition Handling

When two hosts try to claim same display simultaneously:
- Only one update succeeds (PocketBase checks `available = true`)
- Failed claim returns error
- Host UI shows: "Display already claimed or not found"
- Host can retry with same or different code

## Testing Strategy

### Automated Tests (Critical Paths)

**Display App:**
- lib/crypto.ts:
  - Display ID generation (format, uniqueness)
  - Password generation (length, character set, uniqueness)
  - Display code generation (6 digits, range validation)
- State transitions:
  - Startup flow (register → auth → display record)
  - Claim detection (game field changes)
  - Release detection (game field → null)
  - Game completion handling

**Host UI:**
- Claim display:
  - Valid code handling
  - Invalid code handling
  - Race condition (already claimed)
- Release display:
  - Successful release
  - Display record update verification

### Manual Testing

- Full lifecycle: Start display → Claim → Play game → Complete/Release
- Connection loss scenarios (disconnect WiFi, kill PocketBase)
- Multiple displays claimed by same host
- Simultaneous claim attempts (race conditions)
- Different screen resolutions (especially 1920x1080)

## Development Commands

### Running Display App

```bash
cd trivia-party-display
pnpm install
pnpm run dev
```

Display app runs on port 5174 (main app on 5173)

### Building for Production

```bash
cd trivia-party-display
pnpm run build
```

### Testing Both Apps

1. Terminal 1: Start PocketBase (`pocketbase serve --dev --http 0.0.0.0:8090`)
2. Terminal 2: Start main app (`pnpm run dev`)
3. Terminal 3: Start display app (`cd trivia-party-display && pnpm run dev`)

## Implementation Notes

1. **Copy, don't share:** Copy necessary utilities from main app rather than creating shared dependencies
2. **Reference main app for:**
   - PocketBase connection logic (lib/pocketbase.ts)
   - Game code generation algorithm (lib/games.ts)
   - Type definitions (types/pocketbase-types.ts)
   - Controller display components (components/games/states/)
3. **Testing:** Use same PocketBase instance as main app
4. **Deployment:** Can be deployed as static site alongside main app

## Future: Tauri Conversion

Once web app is working, add Tauri configuration for:
- Android TV
- macOS
- Windows
- Apple TV (later)

## Database Indexes

Recommended indexes for displays collection (may already exist):
- `idx_displays_code` - For code lookups during claim
- `idx_displays_display_user` - For display record queries
- `idx_displays_host` - For listing displays by host
- `idx_displays_game` - For querying displays by game
- `idx_displays_available` - For finding available displays
