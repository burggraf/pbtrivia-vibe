# Player Presence Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement real-time player presence tracking to monitor which players are actively focused on the game page, enabling hosts to detect potential cheating and see who is online.

**Architecture:** Client-side presence tracking using React hook (`usePresenceTracking`) with Page Visibility API, 5-second heartbeat updates, PocketBase realtime subscriptions, and sendBeacon cleanup. Host views real-time status via accordion panel on controller page.

**Tech Stack:** React hooks, TypeScript, PocketBase realtime subscriptions, Page Visibility API, sendBeacon API, Radix UI Accordion

---

## Task 1: Add TypeScript Types for Online Collection

**Files:**
- Modify: `src/types/games.ts` (append to end of file)

**Step 1: Add types for Online collection**

Add these interfaces to the end of `src/types/games.ts`:

```typescript
export interface OnlinePlayer {
  id: string;
  player: string; // FK to users collection
  game: string; // FK to games collection
  active: boolean;
  created: string;
  updated: string;
}

export interface OnlinePlayerExpanded extends OnlinePlayer {
  expand?: {
    player?: {
      id: string;
      name: string;
      avatar: string;
    };
  };
}
```

**Step 2: Verify types compile**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/types/games.ts
git commit -m "feat: add TypeScript types for online presence tracking"
```

---

## Task 2: Create usePresenceTracking Hook

**Files:**
- Create: `src/hooks/usePresenceTracking.ts`

**Step 1: Create hook file with basic structure**

Create `src/hooks/usePresenceTracking.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import pb from '@/lib/pocketbase'

export interface UsePresenceTrackingParams {
  gameId: string | null
  userId: string
  enabled: boolean
}

export interface UsePresenceTrackingReturn {
  isTracking: boolean
  connectionStatus: 'connected' | 'disconnected'
}

export function usePresenceTracking({
  gameId,
  userId,
  enabled
}: UsePresenceTrackingParams): UsePresenceTrackingReturn {
  const [presenceRecordId, setPresenceRecordId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupSentRef = useRef(false)
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Upsert presence record
  const upsertPresence = useCallback(async (isVisible: boolean) => {
    if (!enabled || !gameId || !userId) return

    try {
      console.log('🟢 Upserting presence record:', { gameId, userId, active: isVisible })

      // Try to find existing record first
      const existingRecords = await pb.collection('online').getFullList({
        filter: `player = "${userId}" && game = "${gameId}"`
      })

      let recordId: string

      if (existingRecords.length > 0) {
        // Update existing record
        const updated = await pb.collection('online').update(existingRecords[0].id, {
          active: isVisible,
          updated: new Date().toISOString()
        })
        recordId = updated.id
      } else {
        // Create new record
        const created = await pb.collection('online').create({
          player: userId,
          game: gameId,
          active: isVisible,
          updated: new Date().toISOString()
        })
        recordId = created.id
      }

      setPresenceRecordId(recordId)
      setIsTracking(true)
      console.log('✅ Presence record upserted:', recordId)
    } catch (error) {
      console.error('❌ Failed to upsert presence:', error)
    }
  }, [enabled, gameId, userId])

  // Update presence record
  const updatePresence = useCallback(async (updates: { active?: boolean }) => {
    if (!presenceRecordId) return

    try {
      await pb.collection('online').update(presenceRecordId, {
        ...updates,
        updated: new Date().toISOString()
      })
      console.log('🔄 Presence updated:', updates)
    } catch (error) {
      console.error('❌ Failed to update presence:', error)
    }
  }, [presenceRecordId])

  // Heartbeat update (just timestamp)
  const sendHeartbeat = useCallback(async () => {
    if (!presenceRecordId || !document.hidden) {
      await updatePresence({})
    }
  }, [presenceRecordId, updatePresence])

  // Cleanup handler using sendBeacon
  const cleanup = useCallback(() => {
    if (!presenceRecordId || cleanupSentRef.current) return

    cleanupSentRef.current = true
    console.log('🧹 Cleaning up presence with sendBeacon')

    try {
      const data = new URLSearchParams({
        active: 'false',
        updated: new Date().toISOString()
      })

      const url = `${pb.baseUrl}/api/collections/online/records/${presenceRecordId}`
      const sent = navigator.sendBeacon(url, data)

      if (!sent) {
        console.warn('⚠️ sendBeacon failed, attempting regular update')
        // Fallback to regular update
        pb.collection('online').update(presenceRecordId, {
          active: false,
          updated: new Date().toISOString()
        }).catch(console.error)
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
    }
  }, [presenceRecordId])

  // Initialize presence on mount
  useEffect(() => {
    if (!enabled || !gameId || !userId) return

    const isVisible = document.visibilityState === 'visible'
    upsertPresence(isVisible)

    return () => {
      // Cleanup on unmount
      if (presenceRecordId && !cleanupSentRef.current) {
        updatePresence({ active: false })
      }
    }
  }, [enabled, gameId, userId, upsertPresence, presenceRecordId, updatePresence])

  // Set up heartbeat interval
  useEffect(() => {
    if (!isTracking || !presenceRecordId) return

    // Start heartbeat every 5 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }, 5000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }
  }, [isTracking, presenceRecordId, sendHeartbeat])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Debounce rapid changes
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current)
      }

      visibilityDebounceRef.current = setTimeout(() => {
        const isVisible = document.visibilityState === 'visible'
        console.log('👁️ Visibility changed:', isVisible ? 'visible' : 'hidden')
        updatePresence({ active: isVisible })
      }, 200)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current)
      }
    }
  }, [updatePresence])

  // Handle page unload with sendBeacon
  useEffect(() => {
    const handlePageHide = () => {
      cleanup()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [cleanup])

  // Monitor PocketBase connection (simplified - just assume connected for now)
  useEffect(() => {
    // PocketBase doesn't expose connection events directly in the client SDK
    // We'll rely on error handling in the upsert/update functions
    // For now, always show connected
    setConnectionStatus('connected')
  }, [])

  return {
    isTracking,
    connectionStatus
  }
}
```

**Step 2: Verify hook compiles**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/hooks/usePresenceTracking.ts
git commit -m "feat: create usePresenceTracking hook for player presence monitoring"
```

---

## Task 3: Integrate Hook into GamePage

**Files:**
- Modify: `src/pages/GamePage.tsx:1-15` (imports section)
- Modify: `src/pages/GamePage.tsx:15-26` (state declarations after line 25)

**Step 1: Add import for usePresenceTracking**

At the top of `src/pages/GamePage.tsx`, after the existing imports (around line 12), add:

```typescript
import { usePresenceTracking } from '@/hooks/usePresenceTracking'
```

**Step 2: Add presence tracking to GamePage component**

Inside the `GamePage` component function, after the `timerKey` state declaration (around line 25), add:

```typescript
  // Track player presence when on game page
  usePresenceTracking({
    gameId: id || null,
    userId: pb.authStore.model?.id || '',
    enabled: !!id && !!pb.authStore.model?.id
  })
```

**Step 3: Test presence tracking manually**

1. Run: `./dev.sh` (if not already running)
2. Open browser to `http://localhost:5176`
3. Log in and join a game
4. Navigate to game page
5. Open PocketBase admin panel at `http://localhost:8090/_/`
6. Navigate to Collections → online
7. Verify presence record is created with `active: true`
8. Switch to a different tab
9. Verify `active` changes to `false` after ~200ms
10. Switch back to game tab
11. Verify `active` changes back to `true`
12. Observe `updated` timestamp updating every ~5 seconds

**Step 4: Commit**

```bash
git add src/pages/GamePage.tsx
git commit -m "feat: integrate presence tracking into game page"
```

---

## Task 4: Create OnlinePlayersPanel Component

**Files:**
- Create: `src/components/games/OnlinePlayersPanel.tsx`

**Step 1: Create component file**

Create `src/components/games/OnlinePlayersPanel.tsx`:

```typescript
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase'
import { OnlinePlayerExpanded } from '@/types/games'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface OnlinePlayersPanelProps {
  gameId: string
}

interface PlayerStatus {
  id: string
  name: string
  status: 'active' | 'stale' | 'inactive'
  lastSeen: string
  updated: Date
}

export default function OnlinePlayersPanel({ gameId }: OnlinePlayersPanelProps) {
  const [players, setPlayers] = useState<PlayerStatus[]>([])

  // Helper to determine player status
  const getPlayerStatus = (record: OnlinePlayerExpanded): PlayerStatus => {
    const updated = new Date(record.updated)
    const now = new Date()
    const secondsSinceUpdate = (now.getTime() - updated.getTime()) / 1000

    let status: 'active' | 'stale' | 'inactive'
    if (!record.active) {
      status = 'inactive'
    } else if (secondsSinceUpdate > 15) {
      status = 'stale'
    } else {
      status = 'active'
    }

    // Format last seen time
    let lastSeen: string
    if (secondsSinceUpdate < 5) {
      lastSeen = 'Active now'
    } else if (secondsSinceUpdate < 60) {
      lastSeen = `${Math.floor(secondsSinceUpdate)} seconds ago`
    } else {
      const minutes = Math.floor(secondsSinceUpdate / 60)
      lastSeen = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    }

    return {
      id: record.id,
      name: record.expand?.player?.name || 'Unknown Player',
      status,
      lastSeen,
      updated
    }
  }

  // Fetch and subscribe to online players
  useEffect(() => {
    if (!gameId) return

    console.log('🔔 Setting up online players subscription for game:', gameId)

    // Fetch initial data
    const fetchPlayers = async () => {
      try {
        const records = await pb.collection('online').getFullList<OnlinePlayerExpanded>({
          filter: `game = "${gameId}"`,
          expand: 'player',
          sort: '-updated'
        })

        const statuses = records.map(getPlayerStatus)
        setPlayers(statuses)
      } catch (error) {
        console.error('Failed to fetch online players:', error)
      }
    }

    fetchPlayers()

    // Subscribe to real-time updates
    const unsubscribe = pb.collection('online').subscribe<OnlinePlayerExpanded>(
      '*',
      (e) => {
        if (e.record.game !== gameId) return

        console.log('🔄 Online player update:', e.action, e.record)

        if (e.action === 'create' || e.action === 'update') {
          // Fetch the record with expanded player data
          pb.collection('online').getOne<OnlinePlayerExpanded>(e.record.id, {
            expand: 'player'
          }).then(record => {
            const status = getPlayerStatus(record)

            setPlayers(prev => {
              const filtered = prev.filter(p => p.id !== e.record.id)
              return [...filtered, status].sort((a, b) => {
                // Sort by status priority (active > stale > inactive)
                const statusPriority = { active: 0, stale: 1, inactive: 2 }
                if (statusPriority[a.status] !== statusPriority[b.status]) {
                  return statusPriority[a.status] - statusPriority[b.status]
                }
                // Then by most recent update
                return b.updated.getTime() - a.updated.getTime()
              })
            })
          })
        } else if (e.action === 'delete') {
          setPlayers(prev => prev.filter(p => p.id !== e.record.id))
        }
      },
      { filter: `game = "${gameId}"`, expand: 'player' }
    )

    // Update "last seen" times every second
    const interval = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        const secondsSinceUpdate = (new Date().getTime() - player.updated.getTime()) / 1000

        let lastSeen: string
        if (secondsSinceUpdate < 5) {
          lastSeen = 'Active now'
        } else if (secondsSinceUpdate < 60) {
          lastSeen = `${Math.floor(secondsSinceUpdate)} seconds ago`
        } else {
          const minutes = Math.floor(secondsSinceUpdate / 60)
          lastSeen = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        }

        // Re-evaluate status based on current time
        let status: 'active' | 'stale' | 'inactive'
        if (!player.status || player.status === 'inactive') {
          status = 'inactive'
        } else if (secondsSinceUpdate > 15) {
          status = 'stale'
        } else {
          status = 'active'
        }

        return { ...player, lastSeen, status }
      }))
    }, 1000)

    return () => {
      console.log('🧹 Cleaning up online players subscription')
      unsubscribe.then(unsub => unsub())
      clearInterval(interval)
    }
  }, [gameId])

  // Count active players
  const activeCount = players.filter(p => p.status === 'active').length
  const totalCount = players.length

  // Status indicator dot
  const StatusDot = ({ status }: { status: 'active' | 'stale' | 'inactive' }) => {
    const colors = {
      active: 'bg-green-500',
      stale: 'bg-yellow-500',
      inactive: 'bg-gray-400'
    }
    return (
      <span className={`inline-block w-2 h-2 rounded-full ${colors[status]} mr-2`} />
    )
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="online-players" className="border rounded-lg bg-white dark:bg-slate-800 px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Online Players ({activeCount}/{totalCount})
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-2">
            {players.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-2">
                No players online
              </div>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-700/50"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={player.status} />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {player.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {player.lastSeen}
                  </span>
                </div>
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

**Step 2: Verify component compiles**

Run: `pnpm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/components/games/OnlinePlayersPanel.tsx
git commit -m "feat: create OnlinePlayersPanel component for controller page"
```

---

## Task 5: Integrate OnlinePlayersPanel into ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:1-23` (imports section)
- Modify: `src/pages/ControllerPage.tsx` (find the ControllerGrid section and add panel)

**Step 1: Add import for OnlinePlayersPanel**

At the top of `src/pages/ControllerPage.tsx`, after the existing imports (around line 23), add:

```typescript
import OnlinePlayersPanel from '@/components/games/OnlinePlayersPanel'
```

**Step 2: Find insertion point in ControllerGrid**

Search for the `<ControllerGrid>` component usage in ControllerPage. You'll need to add the OnlinePlayersPanel as a new grid item.

Look for a pattern like this (the exact line numbers may vary):
```typescript
<ControllerGrid>
  {/* Existing grid items like QrCodeCard, TeamCard, DisplayManagement, etc. */}
</ControllerGrid>
```

**Step 3: Add OnlinePlayersPanel to the grid**

Add the OnlinePlayersPanel as a new grid item. Place it after the existing cards but before the closing `</ControllerGrid>` tag:

```typescript
          {/* Online Players Panel */}
          {game && (
            <div className="w-full">
              <OnlinePlayersPanel gameId={game.id} />
            </div>
          )}
```

**Step 4: Test the integration**

1. Run: `./dev.sh` (if not already running)
2. Open browser to `http://localhost:5176`
3. Log in as host and create/join a game
4. Navigate to controller page
5. Verify "Online Players (0/0)" accordion appears
6. In a separate browser/incognito window, log in as a player and join the same game
7. Verify controller page shows "Online Players (1/1)"
8. Verify player name appears with green dot and "Active now"
9. Switch player's browser tab away from game
10. Verify player status changes to gray dot and shows "X seconds ago"
11. Switch back to game tab
12. Verify player status changes back to green dot

**Step 5: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: integrate OnlinePlayersPanel into controller page"
```

---

## Task 6: Final Verification and Cleanup

**Step 1: Run full build**

Run: `pnpm run build`
Expected: Clean build with no errors

**Step 2: Run linter**

Run: `pnpm run lint`
Expected: No linting errors (or only pre-existing warnings)

**Step 3: Manual end-to-end test**

Test the complete flow:

1. Start dev server: `./dev.sh`
2. Host creates game and opens controller page
3. Multiple players (2-3) join game from different browsers/devices
4. Host verifies all players appear in "Online Players" panel with green dots
5. One player switches to different tab → verify shows inactive (gray dot)
6. Player switches back → verify shows active again (green dot)
7. One player closes browser → verify shows stale timestamp after 15s
8. Observe heartbeat updates (timestamps update every ~5 seconds)
9. Verify "last seen" times update in real-time (every second)

**Step 4: Create final commit if needed**

If any minor fixes were made during testing:

```bash
git add .
git commit -m "test: verify presence tracking end-to-end functionality"
```

**Step 5: Review implementation against design doc**

Compare implementation with `docs/plans/2025-11-16-player-presence-tracking-design.md`:

- ✅ Presence tracking uses Page Visibility API
- ✅ 5-second heartbeat interval
- ✅ Immediate updates on visibility changes (200ms debounce)
- ✅ sendBeacon cleanup on page unload
- ✅ Real-time subscription for controller display
- ✅ Status indicators (green/yellow/gray dots)
- ✅ Relative timestamps ("Active now", "X seconds ago")
- ✅ Sorted by status priority (active > stale > inactive)

---

## Success Criteria

- [ ] TypeScript types added for Online collection
- [ ] usePresenceTracking hook created and working
- [ ] Hook integrated into GamePage
- [ ] OnlinePlayersPanel component created
- [ ] Panel integrated into ControllerPage
- [ ] Presence records created when players join game
- [ ] Active status updates immediately on tab focus/blur
- [ ] Heartbeat updates timestamp every 5 seconds
- [ ] sendBeacon cleanup on page close
- [ ] Controller displays all players with correct status
- [ ] Status dots show correct colors (green/yellow/gray)
- [ ] "Last seen" times update every second
- [ ] Players sorted by status priority
- [ ] No TypeScript compilation errors
- [ ] No linting errors

---

## Notes

- This implementation focuses on the core presence tracking functionality
- No automated tests are included (would require mocking PocketBase, timers, and browser APIs)
- Manual testing is critical to verify real-time behavior
- The PocketBase `online` collection must be created with the correct fields (id, player FK, game FK, active boolean, created, updated)
- Collection access rules should allow players to create/update their own records and hosts to read records for their games

---

## Future Enhancements (Not in This Plan)

- Server-side timeout detection for automatic cleanup
- Idle detection based on mouse/keyboard activity
- Single-tab coordination using localStorage
- Manual "kick player" button for hosts
- Analytics tracking (session duration, focus time percentage)
- Notifications when players go inactive during critical moments
