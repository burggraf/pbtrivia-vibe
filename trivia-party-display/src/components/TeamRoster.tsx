import { useDisplay } from '@/contexts/DisplayContext'
import { getFileUrl } from '@/lib/pocketbase'
import type { ReactNode } from 'react'

interface ProcessedPlayer {
  id: string
  name: string
  avatar?: string
}

interface ProcessedTeam {
  id: string
  name: string
  players: ProcessedPlayer[]
}

function processScoreboardData(
  scoreboard: { teams: Record<string, any> } | undefined
): ProcessedTeam[] {
  if (!scoreboard?.teams) return []

  const teamsArray = Object.entries(scoreboard.teams)
    .map(([id, team]) => ({
      id,
      name: team.name,
      players: [...(team.players || [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }))
    // Filter out teams with no players
    .filter((team) => team.players.length > 0)

  return teamsArray.sort((a, b) =>
    (a.name + a.id).localeCompare(b.name + b.id)
  )
}

function calculateScale(teams: ProcessedTeam[]): number {
  if (teams.length === 0) return 1.0

  const teamCount = teams.length
  const maxPlayersPerTeam = Math.max(...teams.map((t) => t.players.length), 0)

  const teamScale = 8 / Math.max(teamCount, 1)
  const playerScale = 4 / Math.max(maxPlayersPerTeam, 1)

  return Math.max(0.6, Math.min(1.0, Math.min(teamScale, playerScale)))
}

function getAvatarColor(playerId: string): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal']
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

interface PlayerAvatarProps {
  player: ProcessedPlayer
}

function PlayerAvatar({ player }: PlayerAvatarProps) {
  const colorName = getAvatarColor(player.id)

  if (player.avatar) {
    const avatarUrl = getFileUrl('_pb_users_auth_', player.id, player.avatar, { thumb: '100x100' })
    return (
      <img
        src={avatarUrl}
        alt={player.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    )
  }

  // Map color names to Tailwind classes
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
  }

  const bgClass = colorClasses[colorName] || 'bg-slate-500'

  // Fallback: show first letter with colored background
  const initial = (player.name || '?').charAt(0).toUpperCase()

  return (
    <div
      className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center text-white font-medium text-sm`}
    >
      {initial}
    </div>
  )
}

interface PlayerItemProps {
  player: ProcessedPlayer
}

function PlayerItem({ player }: PlayerItemProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-700/50 rounded-md p-2">
      <PlayerAvatar player={player} />
      <span className="text-base text-slate-200 truncate">{player.name}</span>
    </div>
  )
}

interface TeamCardProps {
  team: ProcessedTeam
  scale: number
}

function TeamCard({ team, scale }: TeamCardProps) {
  return (
    <div
      className="border border-slate-700 bg-slate-800 rounded-lg p-3 transition-transform duration-200 ease-in-out"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top',
      }}
    >
      <h3 className="text-lg font-bold text-slate-100 mb-2">{team.name}</h3>
      <div className="space-y-2">
        {team.players.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}

interface TeamRosterProps {
  children: ReactNode
}

export function TeamRoster({ children }: TeamRosterProps) {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)
  const scale = calculateScale(teams)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  const midpoint = Math.ceil(teams.length / 2)
  const leftTeams = teams.slice(0, midpoint)
  const rightTeams = teams.slice(midpoint)

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 w-full">
      {/* Left Column */}
      <div className="flex flex-col gap-3">
        {leftTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>

      {/* Center Column - QR code content passed as children */}
      <div className="flex items-center justify-center">
        {children}
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-3">
        {rightTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>
    </div>
  )
}
