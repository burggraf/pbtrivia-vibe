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
  teamName: string | null
  status: 'active' | 'stale' | 'inactive'
  lastSeen: string
  updated: Date
  active: boolean
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
      name: record.player_name || 'Unknown Player',
      teamName: record.team_name,
      status,
      lastSeen,
      updated,
      active: record.active
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
          // Use the record directly - no need to fetch with expand
          const status = getPlayerStatus(e.record as OnlinePlayerExpanded)

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
        } else if (e.action === 'delete') {
          setPlayers(prev => prev.filter(p => p.id !== e.record.id))
        }
      },
      { filter: `game = "${gameId}"` }
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
        if (!player.active) {
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
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {player.name}
                      </span>
                      {player.teamName && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {player.teamName}
                        </span>
                      )}
                    </div>
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
