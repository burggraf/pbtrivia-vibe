import { Trophy } from 'lucide-react'
import { GameScoreboard, ScoreboardTeam } from '@/types/games'

interface GameEndProps {
  gameData: {
    state: string
    gameId?: string
  }
  scoreboard?: GameScoreboard
}

export default function GameEnd({ scoreboard }: GameEndProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Game Over!
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Congratulations to all players!
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Final Results
        </h3>
        {scoreboard && Object.keys(scoreboard.teams).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(scoreboard.teams)
              .filter(([teamId, teamData]) => teamId !== 'no-team' && teamData.players.length > 0)
              .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
              .map(([teamId, teamData]: [string, ScoreboardTeam], index) => (
              <div
                key={teamId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500'
                    : 'bg-slate-50 dark:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold ${
                    index === 0
                      ? 'bg-yellow-500 text-white'
                      : index === 1
                      ? 'bg-slate-400 text-white'
                      : index === 2
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {teamData.score || 0}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {teamData.name}
                      </span>
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {teamData.players.length} player{teamData.players.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    #{index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No teams participated</p>
        )}
      </div>
    </div>
  )
}
