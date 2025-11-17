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

export function TeamRoster() {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  return (
    <div className="text-slate-200">
      {teams.length} team(s) ready
    </div>
  )
}
