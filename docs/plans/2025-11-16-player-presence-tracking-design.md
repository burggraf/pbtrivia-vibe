# Player Presence Tracking Design

**Date:** 2025-11-16
**Status:** Approved

## Overview

Implement real-time player presence tracking to monitor which players are actively focused on the game page. This enables the host to detect potential cheating (players looking up answers elsewhere) and see who is online at all times.

## Requirements

### Functional Requirements
- Track when players join a game (set game ID, mark active)
- Detect when player's browser tab loses focus (mark inactive immediately)
- Detect when player's browser tab regains focus (mark active immediately)
- Update presence timestamp every 5-10 seconds via heartbeat
- Clean up presence state when player closes browser/tab
- Display real-time presence status to host on controller page
- Show "last seen" timestamps for all players

### Non-Functional Requirements
- **High accuracy:** 5-10 second heartbeat interval
- **Low latency:** Immediate updates on focus changes (no polling delay)
- **Reliable cleanup:** Use sendBeacon for browser close events
- **Connection resilient:** Handle PocketBase disconnections gracefully
- **Scalable:** Support 20+ concurrent players without rate limiting issues

### Design Constraints
- Only track page focus state (not mouse/keyboard idle detection)
- Mark inactive immediately when navigating away from /game page
- Use client-side cleanup with timeout fallback (no server-side timeout service)

## Architecture

### High-Level Design

```
┌─────────────┐         ┌──────────────────┐         ┌───────────────┐
│  /game page │────────>│ PocketBase       │────────>│  /controller  │
│             │ updates │ 'online'         │realtime │     page      │
│ usePresence │         │  collection      │subscribe│               │
│   Tracking  │         │                  │         │ OnlinePlayers │
│    Hook     │<────────│  - player (FK)   │         │     Panel     │
└─────────────┘connection│  - game (FK)     │         └───────────────┘
              monitoring│  - active (bool)  │
                        │  - created        │
                        │  - updated        │
                        └──────────────────┘
```

### Approach: Hybrid with Connection Monitoring

**Selected approach:** Combines immediate state changes on focus/blur events with regular heartbeat updates and PocketBase connection monitoring for maximum reliability.

**Key characteristics:**
- Immediate response to visibility changes (no delay)
- Background 5-second heartbeat to update timestamps
- Monitors PocketBase realtime connection state
- Auto-recovery on reconnection
- Multiple layers of reliability (event-driven + polling + connection awareness)

## Component Structure

### usePresenceTracking Hook

**Location:** `src/hooks/usePresenceTracking.ts`

**Interface:**
```typescript
interface UsePresenceTrackingParams {
  gameId: string | null;
  userId: string;
  enabled: boolean; // Only track on /game page
}

interface UsePresenceTrackingReturn {
  isTracking: boolean;
  connectionStatus: 'connected' | 'disconnected';
}

function usePresenceTracking(params: UsePresenceTrackingParams): UsePresenceTrackingReturn
```

**Internal State:**
- `presenceRecordId: string | null` - Current presence record ID
- `heartbeatIntervalId: number | null` - Interval timer reference
- `isVisible: boolean` - Current page visibility state
- `isConnected: boolean` - PocketBase connection state

**Effects:**

1. **Initialization Effect**
   - Triggers when: `enabled && gameId && userId` change
   - Action: Create or update presence record with `{ player: userId, game: gameId, active: true, updated: now() }`
   - Store returned record ID in state

2. **Visibility Effect**
   - Sets up Page Visibility API listener for `visibilitychange` events
   - On visibility change:
     - If visible: Update `active: true, updated: now()`, resume heartbeat
     - If hidden: Update `active: false, updated: now()`, pause heartbeat
   - Debounce rapid changes by 200ms to prevent update spam

3. **Heartbeat Effect**
   - Runs every 5 seconds when `isTracking && isVisible`
   - Action: `pb.collection('online').update(recordId, { updated: new Date().toISOString() })`
   - Pauses when tab not visible or disconnected

4. **Connection Monitoring Effect**
   - Subscribe to PocketBase realtime connection events
   - On disconnect: Pause heartbeat, set `connectionStatus: 'disconnected'`
   - On reconnect: Re-upsert presence record, resume heartbeat, set `connectionStatus: 'connected'`

5. **Cleanup Effect**
   - Register `pagehide` event listener (reliable for bfcache compatibility)
   - On pagehide: Use `navigator.sendBeacon()` to send cleanup request
   - Fallback on unmount: Attempt standard update to mark inactive
   - Prevent double-cleanup with internal flag

### OnlinePlayersPanel Component

**Location:** `src/components/games/OnlinePlayersPanel.tsx`

**Interface:**
```typescript
interface OnlinePlayersPanelProps {
  gameId: string;
}
```

**UI Structure:**
```
┌─ Collapsible ─────────────────────────────┐
│ [▼] Online Players (3/5)                  │
├───────────────────────────────────────────┤
│  ● Alice - Active now                     │
│  ● Bob - Active now                       │
│  ◐ Charlie - 8 seconds ago                │
│  ○ Diana - 2 minutes ago                  │
│  ○ Eve - 5 minutes ago                    │
└───────────────────────────────────────────┘
```

**Status Indicators:**
- **Green dot (●):** `active === true && updated <= 15s ago` - Player is actively focused
- **Yellow dot (◐):** `active === true && updated > 15s ago` - Stale heartbeat (connection issues)
- **Gray dot (○):** `active === false` - Player's tab not focused or disconnected

**Data Subscription:**
```typescript
pb.collection('online').subscribe('*', {
  filter: `game="${gameId}"`,
  expand: 'player'
})
```

**Display Logic:**
- Sort by: active first, then by most recent `updated` timestamp
- Show player name from expanded `player` relation
- Show relative timestamp: "Active now" (< 5s), "X seconds ago", "X minutes ago"
- Update in real-time as records change

## Data Flow

### Player Joins Game (/game page)

1. User navigates to `/game/:gameCode`
2. `usePresenceTracking` hook initializes with `gameId`, `userId`, `enabled: true`
3. Hook creates/upserts presence record:
   ```typescript
   pb.collection('online').upsert({
     player: userId,
     game: gameId,
     active: true,
     updated: new Date().toISOString()
   })
   ```
4. Store `presenceRecordId` in hook state
5. Start 5-second heartbeat interval
6. Host's `/controller` page receives realtime update, displays player as active

### Tab Loses Focus (Immediate)

1. Browser fires `visibilitychange` event (document becomes hidden)
2. Hook's visibility listener triggers
3. Update presence record:
   ```typescript
   pb.collection('online').update(presenceRecordId, {
     active: false,
     updated: new Date().toISOString()
   })
   ```
4. Pause heartbeat interval (don't waste API calls while hidden)
5. Host sees player status change to inactive (gray dot) immediately

### Tab Regains Focus (Immediate)

1. Browser fires `visibilitychange` event (document becomes visible)
2. Hook's visibility listener triggers
3. Update presence record:
   ```typescript
   pb.collection('online').update(presenceRecordId, {
     active: true,
     updated: new Date().toISOString()
   })
   ```
4. Resume 5-second heartbeat interval
5. Host sees player status change to active (green dot) immediately

### Active Gameplay Heartbeat (Every 5 Seconds)

1. Heartbeat interval timer fires
2. Update presence record with current timestamp:
   ```typescript
   pb.collection('online').update(presenceRecordId, {
     updated: new Date().toISOString()
   })
   ```
3. Keep `active` unchanged (still true)
4. Host sees "Active now" or "X seconds ago" update in real-time

### Player Closes Browser/Tab

1. Browser fires `pagehide` event (modern, reliable)
2. Hook's pagehide listener triggers
3. Send cleanup using `navigator.sendBeacon()`:
   ```typescript
   const data = new URLSearchParams({
     active: 'false',
     updated: new Date().toISOString()
   });
   navigator.sendBeacon(
     `${pb.baseUrl}/api/collections/online/records/${presenceRecordId}`,
     data
   );
   ```
4. Beacon completes even if page unloads immediately
5. Fallback: If pagehide doesn't fire, component unmount attempts standard update
6. If both fail: Host sees stale timestamp, interprets as disconnected

### Connection Loss & Recovery

1. **Disconnect detected:**
   - PocketBase realtime connection drops
   - Hook's connection listener sets `connectionStatus: 'disconnected'`
   - Pause heartbeat interval (avoid queuing failed requests)

2. **Reconnection:**
   - PocketBase realtime reconnects automatically
   - Hook's connection listener triggers
   - Re-upsert presence record to re-establish state:
     ```typescript
     pb.collection('online').upsert({
       player: userId,
       game: gameId,
       active: document.visibilityState === 'visible',
       updated: new Date().toISOString()
     })
     ```
   - Resume heartbeat interval
   - Host sees updated status

## Error Handling & Edge Cases

### Multiple Tabs/Windows

**Scenario:** Player opens game in multiple browser tabs/windows

**Behavior:** Each tab maintains its own presence record (PocketBase allows multiple records per player+game combination)

**Display:** Controller shows all instances - host can detect if player has multiple tabs open

**Rationale:** Simple implementation, and seeing multiple tabs is actually useful anti-cheat information

**Alternative (not implemented):** Use `localStorage` + `storage` event API to coordinate single record across tabs - adds significant complexity

### Race Conditions

**Rapid focus/blur events:**
- Debounce visibility changes with 200ms delay
- Prevents update spam if user rapidly switches tabs

**pagehide + unmount both firing:**
- Use internal flag `cleanupSent` to prevent double-cleanup
- Only send cleanup once

**Simultaneous heartbeat + visibility change:**
- Visibility change takes precedence
- Cancel pending heartbeat update if visibility change occurs

### Network Issues

**PocketBase rate limiting:**
- 5-second heartbeat = 720 updates/hour/player
- 20 players = 14,400 updates/hour
- Well within PocketBase limits (acceptable)
- If needed: increase interval to 10s (halves load)

**sendBeacon failures:**
- Some browsers may fail sendBeacon
- Acceptable: timeout detection handles it
- Controller displays stale timestamp
- Host interprets as "probably disconnected"

**Connection timeout:**
- If heartbeat fails for 3+ intervals (15+ seconds): yellow "stale" indicator
- If heartbeat fails for 60+ seconds: host assumes disconnected

### Cleanup Failures

**Browser force-quit:**
- No cleanup event fires
- Last `updated` timestamp stays frozen
- Host sees increasingly stale timestamp
- After 15+ seconds: yellow indicator
- After 60+ seconds: clearly stale

**Optional enhancement:** Add manual "Remove Player" button for host to clean up stale records

## Testing Strategy

### Unit Tests (Hook)
- Initialize hook with gameId → presence record created
- Tab loses focus → active set to false, heartbeat paused
- Tab regains focus → active set to true, heartbeat resumed
- Heartbeat updates timestamp every 5 seconds
- Connection loss → heartbeat paused
- Reconnection → presence re-established

### Integration Tests (E2E)
- Player joins game → host sees active status
- Player switches tabs → host sees inactive immediately
- Player returns → host sees active immediately
- Player disconnects → host sees stale timestamp after 15s
- Multiple players → all statuses shown correctly

### Manual Testing
- Test on mobile browsers (iOS Safari, Android Chrome)
- Test pagehide reliability on different browsers
- Test rapid tab switching (debounce works)
- Test network disconnection/reconnection
- Test multiple tabs scenario

## Performance Considerations

### Client-Side
- Heartbeat interval: 5 seconds (12 requests/minute/player)
- Visibility changes: immediate (< 100ms response time)
- Debounce: 200ms for rapid changes
- No polling - event-driven + timed heartbeat only

### Server-Side (PocketBase)
- 20 players × 720 updates/hour = 14,400 updates/hour
- Real-time subscriptions: 1 per host (filter by game)
- Database writes: simple UPDATE operations (fast)
- No complex queries or joins

### Network
- Heartbeat payload: ~50 bytes (just timestamp)
- Visibility change payload: ~100 bytes (active + timestamp)
- sendBeacon payload: ~100 bytes
- Total per player: ~600 bytes/minute (minimal)

## Security Considerations

### Access Control
- Players can only create/update their own presence records
- Host can read all presence records for their games
- Collection rules:
  ```javascript
  // Create rule
  @request.auth.id != "" && player = @request.auth.id

  // Update rule
  @request.auth.id != "" && player = @request.auth.id

  // List/view rule (for host)
  game.host = @request.auth.id || player = @request.auth.id
  ```

### Data Validation
- `player` field must be valid user ID
- `game` field must be valid game ID
- `active` field must be boolean
- `updated` field must be ISO timestamp

### Anti-Cheating Measures
- Immediate inactive marking prevents "background tab" cheating
- Stale timestamp detection catches connection manipulation
- Multiple tab detection (if each tab creates own record)
- Host has full visibility into all player states

## Future Enhancements

### Optional Improvements (Not in Initial Implementation)

1. **Idle detection:** Track mouse/keyboard activity, mark "idle" after X minutes of no interaction
2. **Single tab coordination:** Use localStorage to maintain one presence record across multiple tabs
3. **Server-side timeout:** Background job to mark stale records inactive after X seconds
4. **Manual host controls:** "Kick Player" button to clean up stale presence records
5. **Analytics:** Track average session duration, focus time percentage
6. **Notifications:** Alert host when player goes inactive during critical moments

## Implementation Files

### New Files
- `src/hooks/usePresenceTracking.ts` - React hook for presence management
- `src/components/games/OnlinePlayersPanel.tsx` - Controller UI component

### Modified Files
- `src/pages/GamePage.tsx` - Integrate `usePresenceTracking` hook
- `src/pages/ControllerPage.tsx` - Add `OnlinePlayersPanel` component

### Database
- PocketBase collection: `online` (already created by user)
  - Fields: `id`, `player` (FK to users), `game` (FK to games), `active` (boolean), `created`, `updated`

## Success Metrics

- **Accuracy:** Status changes reflected within 1 second of focus change
- **Reliability:** 95%+ cleanup success rate on browser close
- **Performance:** < 1% CPU usage per player
- **Scalability:** Support 50+ concurrent players without degradation
- **User Experience:** Host sees real-time updates, clear status indicators

## Conclusion

This design provides a robust, accurate presence tracking system using modern web APIs (Page Visibility, sendBeacon) combined with traditional heartbeat patterns. The hybrid approach with connection monitoring ensures reliability across various network conditions and browser behaviors.

The implementation prioritizes accuracy and anti-cheating effectiveness while maintaining good performance characteristics and developer experience.
