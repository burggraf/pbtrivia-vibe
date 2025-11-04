import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, Star, ChevronRight } from 'lucide-react'
import { GameScoreboard } from '@/types/games'
import RoundStartDisplay from './RoundStartDisplay'
import RoundPlayDisplay from './RoundPlayDisplay'
import RoundEnd from './states/RoundEnd'
import GameEnd from './states/GameEnd'
import Thanks from './states/Thanks'
import QRCode from 'react-qr-code'
import { getPublicUrl } from '@/lib/networkUrl'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'

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

  const handleCopyToClipboard = async () => {
    const url = `${getPublicUrl()}/join?code=${game?.code}`
    const result = await copyToClipboard(url)

    if (result.success) {
      toast.success('Link copied to clipboard!', {
        duration: 3000,
      })
    } else {
      toast.error(`Failed to copy link${result.error ? `: ${result.error}` : ''}`, {
        duration: 5000,
      })
    }
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
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  className="p-8 rounded-lg shadow-sm h-auto flex-col hover:scale-105 hover:shadow-lg transition-transform duration-200 focus-visible:ring-blue-500 active:scale-98"
                  aria-label="Click to copy game join link to clipboard"
                  type="button"
                >
                  <QRCode
                    value={`${getPublicUrl()}/join?code=${game?.code}`}
                    size={320}
                    level="M"
                    aria-label={`QR code to join game ${game?.code}`}
                  />
                  <p className="text-center text-base text-slate-600 dark:text-slate-400 mt-4">
                    Scan to join
                  </p>
                </Button>
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
        return <RoundEnd gameData={gameData} scoreboard={game?.scoreboard} />

      case 'game-end':
        return <GameEnd gameData={gameData} scoreboard={game?.scoreboard} />

      case 'thanks':
        return <Thanks />

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