import { getFileUrl } from '@/lib/pocketbase'
import type { ScoreboardTeam } from '@/types/games'

interface TeamScoreCardProps {
  team: ScoreboardTeam
  score: number
  scale?: number
  highlight?: boolean
  badge?: React.ReactNode
}

interface Player {
  id: string
  name: string
  avatar?: string
}

function getAvatarColor(playerId: string): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal']
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function PlayerAvatar({ player }: { player: Player }) {
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

function PlayerItem({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 bg-slate-700/50 rounded-md p-2">
      <PlayerAvatar player={player} />
      <span className="text-base text-slate-200 truncate">{player.name}</span>
    </div>
  )
}

export function TeamScoreCard({ team, score, scale = 1.0, highlight = false, badge }: TeamScoreCardProps) {
  const sortedPlayers = [...(team.players || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <div
      className={`border rounded-lg p-3 transition-transform duration-200 ease-in-out ${
        highlight
          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 border-2'
          : 'bg-slate-800 border-slate-700'
      }`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top',
      }}
    >
      {/* Team name and score header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-100 truncate flex-1">{team.name}</h3>
        <div className="flex items-center gap-2 ml-2">
          {badge}
          <div
            className={`px-3 py-1 rounded-full font-bold ${
              highlight
                ? 'bg-yellow-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {score}
          </div>
        </div>
      </div>

      {/* Players list */}
      <div className="space-y-2">
        {sortedPlayers.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
