import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameScoreboard } from '@/types/games'

interface TeamDisplayProps {
  scoreboard?: GameScoreboard
  isLoading?: boolean
  className?: string
}

export default function TeamDisplay({ scoreboard, isLoading = false, className = "" }: TeamDisplayProps) {
  if (isLoading) {
    return (
      <div className={`text-center py-8 md:py-12 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Loading team data...</p>
      </div>
    )
  }

  if (!scoreboard || Object.keys(scoreboard.teams).length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            No teams have been created yet. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  // Filter teams to only include those with players
  const teamsWithPlayers = Object.entries(scoreboard.teams).filter(([_, teamData]) => teamData.players.length > 0)

  if (teamsWithPlayers.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 md:p-6 lg:p-8">
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            No players have joined teams yet. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 ${className}`}>
      {teamsWithPlayers.map(([teamId, teamData]) => (
        <Card key={teamId} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">
              {teamData.name}
            </CardTitle>
            <CardDescription>
              {teamData.players.length === 1 ? '1 player' : `${teamData.players.length} players`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 md:space-y-2">
              {teamData.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-1.5 md:p-2 rounded bg-slate-50 dark:bg-slate-700"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {player.avatar}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}