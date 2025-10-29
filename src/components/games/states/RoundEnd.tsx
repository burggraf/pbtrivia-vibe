import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'
import { GameScoreboard } from '@/types/games'
import { scoreboardService } from '@/lib/scoreboard'
import { useState, useEffect } from 'react'

interface RoundEndProps {
  gameData: {
    state: 'round-end'
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
    }
    gameId?: string // Add gameId for score calculation (passed separately by renderer)
  }
  scoreboard?: GameScoreboard
}

export default function RoundEnd({ gameData, scoreboard }: RoundEndProps) {
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
  const secondPlace = topTeams[1]
  const thirdPlace = topTeams[2]

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        End of Round {gameData.round?.round_number || 1}
      </h2>
      {gameData.round?.title && (
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
          {gameData.round.title}
        </p>
      )}

      {/* Podium Display */}
      {topTeams.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          {isLoadingScores && (
            <div className="text-center mb-4">
              <p className="text-slate-600 dark:text-slate-400">Calculating scores...</p>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                {secondPlace && (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(2)}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {secondPlace.name}
                    </h3>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {secondPlace.score} points
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {secondPlace.players} player{secondPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                {/* 1st Place */}
                {firstPlace && (
                  <div className="text-center p-6 bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-600">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(1)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                      {firstPlace.name}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {firstPlace.score} points
                    </p>
                    <Badge variant="default" className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                      {firstPlace.players} player{firstPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {thirdPlace && (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(3)}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {thirdPlace.name}
                    </h3>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      {thirdPlace.score} points
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {thirdPlace.players} player{thirdPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Full Team Rankings */}
              {topTeams.length > 3 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Full Rankings
                  </h4>
                  <div className="space-y-2">
                    {topTeams.slice(3).map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium text-slate-600 dark:text-slate-400 w-8">
                            #{index + 4}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {team.name}
                          </span>
                          <Badge variant="outline">
                            {team.players} player{team.players !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {team.score} points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Round Summary */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Great job everyone! Get ready for the next round.
              </p>
              {firstPlace && (
                <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {firstPlace.name}
                  </span>
                  {' '}is currently in the lead!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}