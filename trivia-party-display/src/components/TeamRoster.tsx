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
