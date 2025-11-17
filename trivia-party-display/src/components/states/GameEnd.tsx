import { Trophy } from 'lucide-react'
import { GameScoreboard, ScoreboardTeam } from '@/types/games'
import { TeamScoreCard } from '@/components/TeamScoreCard'

interface GameEndProps {
  gameData: {
    state: string
    gameId?: string
  }
  scoreboard?: GameScoreboard
}

export default function GameEnd({ scoreboard }: GameEndProps) {
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
    <div className="text-center pb-6 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Final Results
          </h2>
        </div>
        {sortedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedTeams.map((team: ScoreboardTeam & { id: string }, index) => (
              <TeamScoreCard
                key={team.id}
                team={team}
                score={team.score || 0}
                scale={scale}
                highlight={index === 0}
                badge={
                  index === 0 ? (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No teams participated</p>
        )}
      </div>
    </div>
  )
}
