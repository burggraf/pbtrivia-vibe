import { GameScoreboard, ScoreboardTeam } from '@/types/games'
import { TeamScoreCard } from '@/components/TeamScoreCard'

interface RoundEndProps {
  gameData: {
    state: string
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
    }
    gameId?: string
  }
  scoreboard?: GameScoreboard
}

export default function RoundEnd({ gameData, scoreboard }: RoundEndProps) {
  const currentRound = gameData.round?.round_number || 1

  // Get teams sorted by score
  const sortedTeams = scoreboard
    ? Object.entries(scoreboard.teams)
        .filter(([teamId, teamData]) => teamId !== 'no-team' && teamData.players.length > 0)
        .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
        .map(([teamId, teamData]) => ({ id: teamId, ...teamData }))
    : []

  // Calculate scale based on team/player density
  const teamCount = sortedTeams.length
  const maxPlayersPerTeam = Math.max(...sortedTeams.map((t) => t.players.length), 0)
  const scale = Math.max(0.7, Math.min(1.0, Math.min(12 / teamCount, 4 / maxPlayersPerTeam)))

  return (
    <div className="text-center pt-3 pb-6 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          End of Round {currentRound}
        </h2>
        {sortedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTeams.map((team: ScoreboardTeam & { id: string }) => (
              <TeamScoreCard
                key={team.id}
                team={team}
                score={team.score || 0}
                scale={scale}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No teams yet</p>
        )}
      </div>
    </div>
  )
}
