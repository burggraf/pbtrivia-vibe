# Trivia Party Display App Design

**Date:** 2025-11-09
**Status:** Approved
**Author:** Design Session with User

## Overview

The Trivia Party Display App is a standalone application for displaying trivia game content on large screens (TVs, projectors) for all players and spectators to view. The initial implementation targets Android TV, with future support for Apple TV, macOS, and Windows.

## Goals

1. **Multi-Platform Display**: Create cross-platform TV display app starting with Android TV
2. **Code Reuse**: Maximize code sharing between web and display apps through monorepo structure
3. **Secure Pairing**: Implement secure, host-controlled display pairing with flexible reconnection policies
4. **Synchronized Experience**: Display real-time game state matching the /controller view
5. **Easy Management**: Enable hosts to connect/disconnect displays on-the-fly during games

## Technology Decisions

### Display App Stack
- **React Native for TV** (react-native-tvos): Cross-platform support for Android TV, Apple TV
- **Expo**: Simplified builds and deployment across platforms
- **PocketBase React Native SDK**: Backend communication and real-time subscriptions
- **Shared Context API**: State management reused from shared package

**Rationale:** React Native provides cross-platform support while allowing significant code reuse with the existing React web app. Expo simplifies the build process for TV platforms.

### Architecture Pattern
- **Monorepo with pnpm workspaces**: Three packages (web, display, shared)
- **Shared logic package**: Extract PocketBase services, game logic, and types
- **Independent UI layers**: Platform-specific components in web/display packages

**Rationale:** Monorepo maximizes code reuse for business logic while maintaining platform-specific UI flexibility. Already using pnpm makes workspace setup straightforward.

## Architecture

### Folder Structure

```
pbtrivia-vibe/
├── packages/
│   ├── web/                 # Existing React web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── ...
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── display/             # React Native TV app
│   │   ├── src/
│   │   │   ├── screens/     # TV screens (Pairing, Game, etc.)
│   │   │   ├── components/  # TV-specific components
│   │   │   └── App.tsx
│   │   ├── android/         # Android TV native code
│   │   ├── ios/             # Apple TV native code (future)
│   │   ├── app.json         # Expo configuration
│   │   └── package.json
│   └── shared/              # Shared game logic
│       ├── src/
│       │   ├── services/    # PocketBase client, game/round/team logic
│       │   ├── types/       # TypeScript type definitions
│       │   └── utils/       # Shared utilities
│       ├── package.json
│       └── tsconfig.json
├── pb_migrations/           # PocketBase migrations (existing)
├── pb_data/                 # PocketBase database (existing)
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root workspace scripts
└── ...
```

### Package Dependencies

```
web → shared
display → shared
shared → (standalone, no internal dependencies)
```

## Database Schema

### New Collection: displays

```typescript
displays {
  id: string (auto)
  code: string (unique, indexed)              // 6-digit pairing code
  game: relation (games, nullable)            // Connected game
  paired_at: datetime (nullable)              // When host paired
  paired_by: relation (users)                 // Host who paired
  display_name: string (default: "Display")   // Friendly name
  status: string                              // "waiting" | "paired" | "disconnected"
  connection_policy: string                   // "locked" | "auto_reconnect" | "require_repairing"
  last_seen: datetime                         // Heartbeat timestamp
  metadata: json                              // {deviceInfo, resolution, appVersion}
  created: datetime (auto)
  updated: datetime (auto)
}
```

### Access Control Rules

**displays collection:**
- **Create:** Anyone (display creates its own record)
- **Read:**
  - Display reads own record via `@request.auth.id`
  - Host reads displays where `game.host.id = @request.auth.id`
- **Update:**
  - Display updates own `last_seen`, `status`, `metadata`
  - Host updates `game`, `display_name`, `connection_policy` for displays paired to their games
- **Delete:**
  - Display deletes own record (when game ends)
  - Host deletes displays they paired (`paired_by.id = @request.auth.id`)

**games/rounds/teams collections:**
- Add read rule: `@request.auth.id ?= displays_via_game.id` (displays linked to game can read)

## Display App Flows

### 1. Launch Flow (Unpaired State)

```
App Launch
  ↓
Generate random 6-digit code
  ↓
Create displays record in PocketBase
  ↓
Authenticate as display user (email: display-{code}@internal)
  ↓
Show Pairing Screen:
  - Large 6-digit code
  - QR code (JSON: {code: "123456", type: "display"})
  - Connection instructions
  - Network status indicator
  ↓
Wait for pairing...
```

### 2. Pairing Flow

```
Host Side:                          Display Side:
  ↓                                    ↓
Click display icon in game          Wait in pairing screen
  ↓                                    ↓
Enter 6-digit code (or scan QR)     Subscribe to own displays record
  ↓                                    ↓
Call pairDisplay(gameId, code)      Receive record update (game linked)
  ↓                                    ↓
Update displays record:             Transition to Game Screen
  - game = gameId                    Subscribe to game, rounds, teams
  - paired_by = host                 Start 30s heartbeat
  - connection_policy = default      Show game content + metadata overlay
  ↓
Show display in connected list
```

### 3. Game Display Flow

**Display subscribes to:**
- `games` record (game status, metadata)
- `rounds` collection (filtered by game)
- `game_teams` collection (for scoreboard)
- `round_questions` collection (for current question)

**Display shows:**
- Primary: Game screens mirroring /controller UI
  - Question display with answers
  - Scoreboard between rounds
  - Winner announcement
- Secondary: Metadata overlay (subtle, top corners)
  - Game name
  - Round number (e.g., "Round 3 of 5")
  - Connection status indicator
- Heartbeat: Update `last_seen` every 30 seconds

### 4. Game End Flow

```
Game status → "completed"
  ↓
Show "Game Complete" screen (10 seconds)
  ↓
Delete displays record from PocketBase
  ↓
Clear local state
  ↓
Return to Launch Flow (generate new code)
```

### 5. Disconnection & Reconnection

**Connection Policies:**

| Policy | Behavior on Disconnect | Reconnection |
|--------|----------------------|--------------|
| `locked` | Display shows "Disconnected" | Cannot reconnect - must get new code and re-pair |
| `auto_reconnect` | Display auto-reconnects | Uses same code/auth, restores game connection |
| `require_repairing` | Display returns to pairing screen | Shows new code, host must re-pair |

**Disconnection Detection:**
- Host checks `last_seen` timestamp
- If `last_seen > 60s ago`, mark as disconnected
- Show warning badge in display list

**Reconnection Flow:**
```
Network restored
  ↓
Check connection_policy
  ↓
If "auto_reconnect":
  - Reestablish PocketBase connection
  - Verify game still active
  - Resume subscriptions
If "locked":
  - Show "Cannot reconnect - display locked by host"
If "require_repairing":
  - Generate new code
  - Return to pairing screen
```

## Host App Integration

### Display Management UI

**Display Icon Button:**
- Location: Floating action button (FAB) in top-right of game screen
- Visual: Display icon with badge showing connected count (e.g., "2")
- States:
  - Green badge: All displays connected
  - Red badge: One or more disconnected
  - Gray: No displays connected
- Click: Opens Display Management Dialog

**Display Management Dialog:**

```
┌─────────────────────────────────────┐
│ Manage Displays                  [×]│
├─────────────────────────────────────┤
│ Connect New Display                 │
│ ┌─────────────────┐                 │
│ │ Enter Code: ___ │  [Scan QR]      │
│ └─────────────────┘  [Connect]      │
├─────────────────────────────────────┤
│ Connected Displays (2)              │
│                                     │
│ ● Living Room TV (123456)           │
│   Status: Connected • 5s ago        │
│   Policy: Auto Reconnect ▼          │
│   [Rename] [Disconnect]             │
│                                     │
│ ○ Projector (789012)                │
│   Status: Disconnected • 2m ago     │
│   Policy: Locked ▼                  │
│   [Rename] [Remove]                 │
├─────────────────────────────────────┤
│ [Disconnect All]  [Lock All]        │
└─────────────────────────────────────┘
```

### Display Service API

**New file:** `packages/shared/src/services/displays.ts`

```typescript
export async function pairDisplay(
  gameId: string,
  code: string,
  policy: ConnectionPolicy = 'auto_reconnect'
): Promise<Display> {
  // 1. Find display by code
  const display = await pb.collection('displays')
    .getFirstListItem(`code="${code}" && game=null`)

  // 2. Update display record
  return await pb.collection('displays').update(display.id, {
    game: gameId,
    paired_by: pb.authStore.model?.id,
    paired_at: new Date().toISOString(),
    connection_policy: policy,
    status: 'paired'
  })
}

export async function disconnectDisplay(displayId: string): Promise<void> {
  await pb.collection('displays').update(displayId, {
    game: null,
    status: 'disconnected'
  })
}

export async function updateDisplayPolicy(
  displayId: string,
  policy: ConnectionPolicy
): Promise<Display> {
  return await pb.collection('displays').update(displayId, {
    connection_policy: policy
  })
}

export function useGameDisplays(gameId: string) {
  const [displays, setDisplays] = useState<Display[]>([])

  useEffect(() => {
    // Subscribe to displays for this game
    pb.collection('displays').subscribe('*', (e) => {
      if (e.record.game === gameId) {
        // Update displays list
      }
    })

    // Initial fetch
    pb.collection('displays').getFullList({
      filter: `game="${gameId}"`
    }).then(setDisplays)

    return () => pb.collection('displays').unsubscribe()
  }, [gameId])

  return displays
}
```

## Shared Package Structure

### Exports

```typescript
// @pbtrivia/shared/services
export { pb, initPocketBase } from './services/pocketbase'
export { useGame, useGameSubscription } from './services/games'
export { useRounds, useRoundSubscription } from './services/rounds'
export { useTeams, useTeamSubscription } from './services/teams'
export {
  pairDisplay,
  disconnectDisplay,
  updateDisplayPolicy,
  useGameDisplays
} from './services/displays'

// @pbtrivia/shared/types
export type {
  Game,
  Round,
  Question,
  Team,
  Player,
  Display,
  ConnectionPolicy
} from './types'

// @pbtrivia/shared/utils
export { generateDisplayCode, validateDisplayCode } from './utils/display-codes'
export { formatGameTime, calculateScores } from './utils/game-logic'
```

### Migration Strategy

1. **Create monorepo structure:**
   - Add `pnpm-workspace.yaml`
   - Create `packages/` directory
   - Update root `package.json` with workspace scripts

2. **Move web app:**
   - Move current `src/`, `public/`, `index.html` to `packages/web/`
   - Move `vite.config.ts`, `.env` to `packages/web/`
   - Update `package.json` to `packages/web/package.json`

3. **Extract shared package:**
   - Create `packages/shared/`
   - Move `src/lib/pocketbase.ts` → `shared/src/services/pocketbase.ts`
   - Move `src/lib/games.ts` → `shared/src/services/games.ts`
   - Move `src/lib/rounds.ts` → `shared/src/services/rounds.ts`
   - Move `src/types/` → `shared/src/types/`
   - Create barrel exports in `shared/src/index.ts`

4. **Update web app imports:**
   - Replace `@/lib/*` with `@pbtrivia/shared/services/*`
   - Replace `@/types/*` with `@pbtrivia/shared/types/*`
   - Update `tsconfig.json` paths

5. **Create display app:**
   - Initialize React Native project in `packages/display/`
   - Add `@pbtrivia/shared` dependency
   - Build display UI using shared services

## Display App Screens

### 1. Pairing Screen

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│      PB TRIVIA PARTY DISPLAY        │
│                                     │
│      Enter this code in your        │
│         trivia game host:           │
│                                     │
│          ┌─────────┐                │
│          │ 1 2 3   │                │
│          │ 4 5 6   │                │
│          └─────────┘                │
│                                     │
│      Or scan this QR code:          │
│          ┌─────────┐                │
│          │ [QR]    │                │
│          └─────────┘                │
│                                     │
│   📶 Connected to: 192.168.1.100    │
│   v1.0.0                            │
└─────────────────────────────────────┘
```

### 2. Game Screen

**Layout:**
```
┌─────────────────────────────────────┐
│ Trivia Night        Round 2 of 5  ● │ ← Metadata overlay
├─────────────────────────────────────┤
│                                     │
│    [Game Content - mirrors          │
│     /controller screens]            │
│                                     │
│    - Question Display               │
│    - Answer Choices                 │
│    - Scoreboard                     │
│    - Winner Announcement            │
│                                     │
└─────────────────────────────────────┘
```

**Metadata Overlay:**
- Top-left: Game name
- Top-right: Round number + connection indicator
- Subtle, semi-transparent background
- Auto-hides during critical moments (e.g., showing answers)

### 3. Disconnected Screen

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│            ⚠️                        │
│                                     │
│      Connection Lost                │
│                                     │
│      Reconnecting...                │
│                                     │
│   (For "locked" policy:)            │
│   Display locked by host.           │
│   Please get a new pairing code.    │
│                                     │
└─────────────────────────────────────┘
```

## Multi-Display Behavior

**All displays show identical content** (simple mirroring). This enables:
- Multiple viewing angles in same room
- Display in multiple rooms
- Redundancy (backup displays)

Future enhancement could support display roles (main game, scoreboard, stats), but v1 keeps it simple.

## Testing Strategy

### Unit Tests
- **Shared package:** Test all services, utilities independently
- Display code generation/validation
- Game state transformation logic
- PocketBase client mocking

### Integration Tests
- **Pairing flow:** Display creates record → host pairs → display receives update
- **Game sync:** Game state changes → display UI updates
- **Reconnection:** Network drop → policy enforcement → reconnection logic

### E2E Tests
1. Display launches → shows pairing code
2. Host pairs display → display transitions to game screen
3. Game progresses → display shows synchronized content
4. Game ends → display returns to pairing screen with new code
5. Network drop → display reconnects based on policy

### Manual Testing Checklist
- [ ] Android TV app installs and launches
- [ ] QR code scan works from mobile device
- [ ] Display shows on TV with correct aspect ratio
- [ ] Game content is readable from 10 feet away
- [ ] Multiple displays stay synchronized
- [ ] TV remote navigation works (if applicable)

## Implementation Phases

### Phase 1: Monorepo Setup
- Create workspace structure
- Extract shared package
- Update web app to use shared package
- Verify web app still works

### Phase 2: Display Collection & Backend
- Create displays collection migration
- Implement display service API
- Add access control rules
- Unit tests for display logic

### Phase 3: Host Display Management
- Add display icon button to game screen
- Build display management dialog
- Implement pairing UI (code input + QR scanner)
- Test pairing flow end-to-end

### Phase 4: Display App Scaffold
- Initialize React Native project
- Set up Expo for Android TV
- Build pairing screen UI
- Test display record creation

### Phase 5: Display Game Sync
- Implement PocketBase subscriptions in display app
- Build game content screens (mirror /controller)
- Add metadata overlay
- Test real-time synchronization

### Phase 6: Connection Management
- Implement heartbeat mechanism
- Add disconnection detection
- Build reconnection logic with policy enforcement
- Test all connection policies

### Phase 7: Polish & Testing
- Refine TV UI/UX (fonts, spacing, colors)
- Add loading states and error handling
- Comprehensive testing on Android TV device
- Performance optimization

## Open Questions & Future Enhancements

### Open Questions
- Should display app support offline mode (cache last game state)?
- Should displays have audio output (e.g., sound effects)?
- What happens if host tries to pair already-paired display?

### Future Enhancements
- **Display Roles:** Configure displays to show different content (main/scoreboard/stats)
- **Display Groups:** Group displays by room, control groups independently
- **Display Analytics:** Track which displays are most used, uptime stats
- **Custom Branding:** Allow host to upload logo/colors for display screens
- **Apple TV Support:** Add iOS target to React Native app
- **Desktop Apps:** macOS/Windows builds via Electron or Tauri
- **Display Templates:** Pre-built themes for different display sizes/orientations

## Success Criteria

1. ✅ Display app runs on Android TV emulator and device
2. ✅ Host can pair display using 6-digit code or QR scan in <10 seconds
3. ✅ Display shows synchronized game content with <1 second lag
4. ✅ Multiple displays (2+) can connect to same game
5. ✅ Display automatically reconnects after brief network interruption
6. ✅ Game content is readable from 10 feet on 50" TV
7. ✅ Display app returns to pairing screen when game ends
8. ✅ Zero PocketBase auth errors in normal operation
9. ✅ Shared package successfully used by both web and display apps
10. ✅ No code duplication between web and display for game logic
