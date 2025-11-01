import { GameScoreboard, ScoreboardTeam } from '@/types/games'

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

  return (
    <div className="text-center py-12">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        End of Round {currentRound}
      </h2>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Current Scoreboard
        </h3>
        {scoreboard && Object.keys(scoreboard.teams).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(scoreboard.teams)
              .filter(([teamId, teamData]) => teamId !== 'no-team' && teamData.players.length > 0)
              .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
              .map(([teamId, teamData]: [string, ScoreboardTeam]) => (
              <div
                key={teamId}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full text-xl font-bold">
                    {teamData.score || 0}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {teamData.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {teamData.players.length} player{teamData.players.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    This round: {teamData.roundScores?.[currentRound] || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No teams yet</p>
        )}
      </div>
    </div>
  )
}
