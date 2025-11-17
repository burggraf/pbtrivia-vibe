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
  teamId: string | null
  teamName: string | null
  status: 'active' | 'stale' | 'inactive'
  lastSeen: string
  updated: Date
  active: boolean
}

interface TeamGroup {
  teamId: string
  teamName: string
  players: PlayerStatus[]
  activeCount: number
  totalCount: number
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
      teamId: record.team_id,
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

  // Group players by team
  const groupPlayersByTeam = (): TeamGroup[] => {
    const teamMap = new Map<string, TeamGroup>()

    // Group players by team
    players.forEach(player => {
      const teamId = player.teamId || 'no-team'
      const teamName = player.teamName || 'No Team'

      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          teamId,
          teamName,
          players: [],
          activeCount: 0,
          totalCount: 0
        })
      }

      const team = teamMap.get(teamId)!
      team.players.push(player)
      team.totalCount++
      if (player.status === 'active') {
        team.activeCount++
      }
    })

    // Sort players within each team by name
    teamMap.forEach(team => {
      team.players.sort((a, b) => a.name.localeCompare(b.name))
    })

    // Convert map to array and sort by team_name + team_id
    return Array.from(teamMap.values()).sort((a, b) => {
      const nameCompare = a.teamName.localeCompare(b.teamName)
      if (nameCompare !== 0) return nameCompare
      return a.teamId.localeCompare(b.teamId)
    })
  }

  const teamGroups = groupPlayersByTeam()

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
            {teamGroups.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-2">
                No players online
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {teamGroups.map((team) => (
                  <AccordionItem
                    key={team.teamId}
                    value={team.teamId}
                    className="border rounded-md bg-slate-50 dark:bg-slate-700/50"
                  >
                    <AccordionTrigger className="hover:no-underline px-3 py-2">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {team.teamName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {team.activeCount}/{team.totalCount} active
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 px-3 pb-2">
                        {team.players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-white dark:bg-slate-600/50"
                          >
                            <div className="flex items-center gap-2">
                              <StatusDot status={player.status} />
                              <span className="text-sm text-slate-900 dark:text-slate-100">
                                {player.name}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {player.lastSeen}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
