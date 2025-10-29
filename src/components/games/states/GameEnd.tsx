import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react'
import { GameScoreboard } from '@/types/games'
import { scoreboardService } from '@/lib/scoreboard'
import { useState, useEffect } from 'react'

interface GameEndProps {
  gameData: {
    state: 'game-end'
    gameId?: string // Add gameId for score calculation (passed separately by renderer)
  }
  scoreboard?: GameScoreboard
}

export default function GameEnd({ gameData, scoreboard }: GameEndProps) {
  const [calculatedScores, setCalculatedScores] = useState<Record<string, number>>({})
  const [isLoadingScores, setIsLoadingScores] = useState(true)

  // Calculate scores from answers when component mounts
  useEffect(() => {
    const calculateScores = async () => {
      if (!gameData.gameId || !scoreboard?.teams) {
        setIsLoadingScores(false)
        return
      }

      try {
        setIsLoadingScores(true)
        const scores = await scoreboardService.calculateTeamScores(gameData.gameId, scoreboard.teams)
        setCalculatedScores(scores)
      } catch (error) {
        console.error('Failed to calculate scores:', error)
      } finally {
        setIsLoadingScores(false)
      }
    }

    calculateScores()
  }, [gameData.gameId, scoreboard?.teams])

  const getTopTeams = () => {
    if (!scoreboard?.teams) return []

    return Object.entries(scoreboard.teams)
      .map(([teamId, teamData]) => {
        // Use calculated score if available, otherwise fall back to scoreboard score
        const score = calculatedScores[teamId] ?? teamData.score ?? 0

        return {
          id: teamId,
          name: teamData.name,
          score: score,
          players: teamData.players.length
        }
      })
      .filter(team => team.players > 0) // Filter out teams with 0 players
      .sort((a, b) => b.score - a.score)
  }

  const topTeams = getTopTeams()
  const firstPlace = topTeams[0]

  const getWinnerIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500" />
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <Award className="h-6 w-6 text-slate-400" />
    }
  }

  return (
    <div className="text-center mb-8">
      {/* Loading State */}
      {isLoadingScores && (
        <div className="text-center mb-4">
          <p className="text-slate-600 dark:text-slate-400">Calculating final scores...</p>
        </div>
      )}

      {/* Winner Announcement */}
      <div className="mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Crown className="h-12 w-12 text-yellow-500" />
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            Game Over!
          </h1>
          <Crown className="h-12 w-12 text-yellow-500" />
        </div>

        <p className="text-lg text-slate-500 dark:text-slate-500">
          Congratulations to all teams!
        </p>
      </div>

      {/* Winner Display */}
      {firstPlace && (
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:via-yellow-800/30 dark:to-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center items-center gap-4 mb-4">
                {getWinnerIcon(1)}
                <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  🏆 Winner 🏆
                </h2>
                {getWinnerIcon(1)}
              </div>

              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {firstPlace.name}
              </h3>

              <div className="flex justify-center items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {firstPlace.score}
                </span>
                <span className="text-lg text-slate-600 dark:text-slate-400">
                  points
                </span>
              </div>

              <div className="flex justify-center gap-2 mb-4">
                {[...Array(Math.max(0, Math.min(5, Math.floor((firstPlace.score || 0) / 100))))].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>

              <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-lg px-4 py-2">
                {firstPlace.players} player{firstPlace.players !== 1 ? 's' : ''}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Final Rankings */}
      {topTeams.length > 1 && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Final Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700'
                        : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {getWinnerIcon(index + 1)}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          index === 0
                            ? 'text-lg text-yellow-700 dark:text-yellow-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          {team.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {team.players} player{team.players !== 1 ? 's' : ''}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                              Champion
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${
                        index === 0
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {team.score}
                      </span>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        points
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Game Statistics */}
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Game Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {topTeams.length}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Teams
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {topTeams.reduce((sum, team) => sum + team.players, 0)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Players
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {topTeams.reduce((sum, team) => sum + team.score, 0)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Total Points
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                      {firstPlace ? Math.round((firstPlace.score / topTeams.reduce((sum, team) => sum + team.score, 0)) * 100) : 0}%
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Winner Score Share
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}