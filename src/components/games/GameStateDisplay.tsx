import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Clock, Users, Star, ChevronRight, PartyPopper } from 'lucide-react'
import { GameScoreboard, ScoreboardTeam } from '@/types/games'
import RoundStartDisplay from './RoundStartDisplay'
import RoundPlayDisplay from './RoundPlayDisplay'
import QRCode from 'react-qr-code'
import { getPublicUrl } from '@/lib/networkUrl'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

interface GameData {
  state: GameState
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
    categories: string[]
  }
  question?: {
    id: string
    question_number: number
    category: string
    question: string
    difficulty: string
    a: string
    b: string
    c: string
    d: string
    correct_answer?: string
    submitted_answer?: string
  }
}

interface GameStateDisplayProps {
  gameData: GameData | null
  rounds: any[]
  game: {
    id: string
    code: string
    scoreboard?: GameScoreboard
  }
}

export default function GameStateDisplay({ gameData, rounds, game }: GameStateDisplayProps) {
  if (!gameData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Game not started yet</p>
      </div>
    )
  }

  const renderStateContent = () => {
    switch (gameData.state) {
      case 'game-start':
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Welcome to the Game!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 mb-6">
                Game Code: <span className="font-mono font-bold">{game?.code}</span>
              </p>
              <div className="flex justify-center">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm inline-block">
                  <QRCode
                    value={`${getPublicUrl()}/join?code=${game?.code}`}
                    size={200}
                    level="M"
                    aria-label={`QR code to join game ${game?.code}`}
                  />
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-3">
                    Scan to join
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <Users className="h-12 w-12 mx-auto text-blue-500" />
                  <CardTitle className="text-lg">Teams Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {game?.scoreboard ? Object.keys(game.scoreboard.teams).length : 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Clock className="h-12 w-12 mx-auto text-green-500" />
                  <CardTitle className="text-lg">Rounds</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {rounds.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <Star className="h-12 w-12 mx-auto text-yellow-500" />
                  <CardTitle className="text-lg">Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {rounds.reduce((total, round) => total + (round.question_count || 0), 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'round-start':
        return (
          <div className="py-12">
            <RoundStartDisplay round={gameData.round} rounds={rounds} />
          </div>
        )

      case 'round-play':
        return (
          <div className="py-12">
            <RoundPlayDisplay
              gameData={gameData as any}
              mode="controller"
              gameId={game.id}
              scoreboard={game.scoreboard}
            />
          </div>
        )

      case 'round-end':
        return (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              End of Round {gameData.round?.round_number || 1}
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Current Scoreboard
              </h3>
              {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(game.scoreboard.teams)
                    .filter(([teamId]) => teamId !== 'no-team')
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
                          This round: {teamData.roundScores?.[gameData.round?.round_number || 1] || 0}
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

      case 'game-end':
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
              {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(game.scoreboard.teams)
                    .filter(([teamId]) => teamId !== 'no-team')
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

      case 'thanks':
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <PartyPopper className="h-16 w-16 mx-auto text-purple-500 mb-4" />
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Thanks for Playing!
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                We hope you enjoyed the trivia game
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <p className="text-slate-700 dark:text-slate-200">
                Your feedback helps us improve future games!
              </p>
            </div>
          </div>
        )

      case 'return-to-lobby':
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <ChevronRight className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Returning to Lobby
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Redirecting you back to the host dashboard...
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Unknown game state</p>
          </div>
        )
    }
  }

  return (
    <div className="mb-8">
      {renderStateContent()}
    </div>
  )
}