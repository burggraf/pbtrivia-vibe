import { useState, useEffect, useRef, useCallback } from 'react'
import pb from '@/lib/pocketbase'

export interface UsePresenceTrackingParams {
  gameId: string | null
  userId: string
  playerName: string
  teamId: string | null
  teamName: string | null
  enabled: boolean
}

export interface UsePresenceTrackingReturn {
  isTracking: boolean
  connectionStatus: 'connected' | 'disconnected'
}

export function usePresenceTracking({
  gameId,
  userId,
  playerName,
  teamId,
  teamName,
  enabled
}: UsePresenceTrackingParams): UsePresenceTrackingReturn {
  const [presenceRecordId, setPresenceRecordId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')
  const heartbeatIntervalRef = useRef<number | null>(null)
  const cleanupSentRef = useRef(false)
  const visibilityDebounceRef = useRef<number | null>(null)

  // Upsert presence record
  const upsertPresence = useCallback(async (isVisible: boolean) => {
    if (!enabled || !gameId || !userId) return

    try {
      console.log('🟢 Upserting presence record:', { gameId, userId, playerName, teamId, teamName, active: isVisible })

      // Try to find existing record for this player (regardless of game)
      // Note: There's a unique index on 'player', so each player can only have one record
      const existingRecords = await pb.collection('online').getFullList({
        filter: `player = "${userId}"`
      })

      let recordId: string

      if (existingRecords.length > 0) {
        // Update existing record with current game and team info
        const updated = await pb.collection('online').update(existingRecords[0].id, {
          game: gameId,
          player_name: playerName,
          team_id: teamId,
          team_name: teamName,
          active: isVisible,
          updated: new Date().toISOString()
        })
        recordId = updated.id
      } else {
        // Create new record
        const created = await pb.collection('online').create({
          player: userId,
          game: gameId,
          player_name: playerName,
          team_id: teamId,
          team_name: teamName,
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
  }, [enabled, gameId, userId, playerName, teamId, teamName])

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
    if (presenceRecordId && !document.hidden) {
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
