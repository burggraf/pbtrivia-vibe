import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Clock, Users, Star, ChevronRight, PartyPopper } from 'lucide-react'
import { GameScoreboard, ScoreboardTeam } from '@/types/games'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

interface GameData {
  state: GameState
  name?: string
  rounds?: number
  currentRound?: number
  currentQuestion?: number
  questions?: number
  categories?: string[]
  roundData?: any
  showAnswer?: boolean
  gameName?: string
  totalRounds?: number
  roundScores?: { [teamId: string]: number }
  playerTeam?: string
  submittedAnswers?: { [key: string]: string }
  // New round-play structure
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
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
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {gameData?.name}
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-500 mt-2">
                Game Code: <span className="font-mono font-bold">{game?.code}</span>
              </p>
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
                    {gameData?.rounds || rounds.length}
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
        const currentRound = rounds[gameData.currentRound || 0]
        return (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Round {currentRound?.sequence_number || 1}
            </h2>
            <h3 className="text-2xl text-slate-700 dark:text-slate-200 mb-6">
              {currentRound?.title || 'Loading round...'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {currentRound?.question_count || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentRound?.categories?.map((category: string) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    )) || <p className="text-slate-500">No categories</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'round-play':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Round {gameData.currentRound! + 1} - Question {gameData.currentQuestion! + 1}
            </h2>
            {gameData.question ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {gameData.question.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gameData.question && [
                      { key: 'A', text: gameData.question.a },
                      { key: 'B', text: gameData.question.b },
                      { key: 'C', text: gameData.question.c },
                      { key: 'D', text: gameData.question.d }
                    ].map((answer) => (
                      <div
                        key={answer.key}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          gameData.showAnswer && gameData.question?.correct_answer
                            ? answer.key === gameData.question.correct_answer
                              ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 dark:bg-blue-900'
                        }`}
                      >
                        <span className="font-medium">{answer.key}.</span> {answer.text}
                      </div>
                    ))}
                  </div>
                  {gameData.showAnswer && gameData.question?.correct_answer && (
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        Correct Answer: {gameData.question.correct_answer}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">Loading question...</p>
              </div>
            )}
          </div>
        )

      case 'round-end':
        return (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              End of Round {gameData.currentRound! + 1}
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
                Current Scoreboard
              </h3>
              {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(game.scoreboard.teams).map(([teamId, teamData]: [string, ScoreboardTeam]) => (
                    <div
                      key={teamId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {teamData.name}
                      </span>
                      <Badge variant="secondary">
                        {teamData.players.length} player{teamData.players.length !== 1 ? 's' : ''}
                      </Badge>
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
                <div className="space-y-3">
                  {Object.entries(game.scoreboard.teams).map(([teamId, teamData]: [string, ScoreboardTeam]) => (
                    <div
                      key={teamId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {teamData.name}
                      </span>
                      <Badge variant="secondary">
                        {teamData.players.length} player{teamData.players.length !== 1 ? 's' : ''}
                      </Badge>
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