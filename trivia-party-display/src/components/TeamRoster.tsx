import { useDisplay } from '@/contexts/DisplayContext'

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

  const teamsArray = Object.entries(scoreboard.teams).map(([id, team]) => ({
    id,
    name: team.name,
    players: [...(team.players || [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }))

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
  const color = getAvatarColor(player.id)

  if (player.avatar) {
    return (
      <img
        src={player.avatar}
        alt={player.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    )
  }

  // Fallback: show first letter with colored background
  const initial = player.name.charAt(0).toUpperCase()

  return (
    <div
      className={`w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center text-white font-medium text-sm`}
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

// @ts-ignore - TS6133: Component will be used in Task 8
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

export function TeamRoster() {
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

  return (
    <div className="text-slate-200">
      {teams.length} team(s) ready (scale: {scale.toFixed(2)})
    </div>
  )
}
