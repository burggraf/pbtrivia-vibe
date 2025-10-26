import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import TeamDisplay from '@/components/games/TeamDisplay'
import GameStateDisplay from '@/components/games/GameStateDisplay'
import { gamesService } from '@/lib/games'
import { roundsService } from '@/lib/rounds'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

interface GameData {
  state: GameState
  name?: string
  rounds?: number
  currentRound?: number
  currentQuestion?: number
  round?: any
  question?: any
  showAnswer?: boolean
}

const GAME_STATES: GameState[] = [
  'game-start',
  'round-start',
  'round-play',
  'round-end',
  'game-end',
  'thanks',
  'return-to-lobby'
]

export default function ControllerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rounds, setRounds] = useState<any[]>([])
  const [gameData, setGameData] = useState<GameData | null>(null)

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleBackToHost = () => {
    navigate('/host')
  }

  // Fetch game data
  const fetchGameData = async () => {
    if (!id) return

    try {
      // Get game data (includes scoreboard)
      const gameData = await gamesService.getGame(id)
      setGame(gameData)

      // Get rounds data
      const roundsData = await roundsService.getRounds(id)
      setRounds(roundsData.sort((a, b) => a.sequence_number - b.sequence_number))

      // Parse game data if exists
      if (gameData.data) {
        try {
          const parsedData = typeof gameData.data === 'string' ? JSON.parse(gameData.data) : gameData.data
          setGameData(parsedData)
        } catch (error) {
          console.error('Failed to parse game data:', error)
          setGameData(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch game data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update game data
  const updateGameData = async (newGameData: Partial<GameData>) => {
    if (!id) return

    try {
      const updatedData = { ...gameData, ...newGameData }
      await pb.collection('games').update(id, {
        data: JSON.stringify(updatedData)
      })
      setGameData(updatedData as GameData)
    } catch (error) {
      console.error('Failed to update game data:', error)
    }
  }

  // Start game functionality
  const handleStartGame = async () => {
    if (!game) return

    try {
      // Update game status to in-progress
      await gamesService.updateGame(game.id, { status: 'in-progress' })

      // Initialize game data
      await updateGameData({
        state: 'game-start',
        name: game.name,
        rounds: rounds.length
      })
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  // Navigate to next state
  const handleNextState = async () => {
    if (!gameData) return

    const currentStateIndex = GAME_STATES.indexOf(gameData.state)
    const nextStateIndex = currentStateIndex + 1

    if (nextStateIndex < GAME_STATES.length) {
      const nextState = GAME_STATES[nextStateIndex]

      // Handle special logic for state transitions
      if (nextState === 'return-to-lobby') {
        navigate('/host')
        return
      }

      await updateGameData({ state: nextState })
    }
  }

  // Navigate to previous state
  const handlePreviousState = async () => {
    if (!gameData) return

    const currentStateIndex = GAME_STATES.indexOf(gameData.state)
    const previousStateIndex = currentStateIndex - 1

    if (previousStateIndex >= 0) {
      const previousState = GAME_STATES[previousStateIndex]
      await updateGameData({ state: previousState })
    }
  }

  // Set up realtime subscription for game changes
  useEffect(() => {
    if (!id) return

    // Initial data fetch
    fetchGameData()

    // Subscribe to real-time updates for games (includes scoreboard changes)
    const unsubscribeGame = pb.collection('games').subscribe('*', (e) => {
      if (e.action === 'update' && e.record.id === id) {
        const updatedGame = e.record as unknown as Game
        setGame(updatedGame)

        // Parse updated game data
        if (updatedGame.data) {
          try {
            const parsedData = typeof updatedGame.data === 'string' ? JSON.parse(updatedGame.data) : updatedGame.data
            setGameData(parsedData)
          } catch (error) {
            console.error('Failed to parse game data:', error)
          }
        }
      }
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeGame.then((unsub) => unsub())
    }
  }, [id, navigate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Game Controller</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Game ID: {id} {game && `- ${game.name}`}
            </p>
            {game && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  game.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  game.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  game.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {game.status.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleBackToHost}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Back to Host
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Controller Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Game Controller
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your game from here. Teams and players are displayed in real-time.
          </p>
        </div>

        {/* Game State Display */}
        {gameData && (
          <GameStateDisplay
            gameData={gameData}
            rounds={rounds}
            game={game}
          />
        )}

        {/* Teams and Players Section */}
        {(!gameData || gameData.state === 'game-start') && (
          <TeamDisplay
            scoreboard={game?.scoreboard}
            isLoading={isLoading}
            className="mb-8"
          />
        )}

        {/* Control Buttons */}
        {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && (
          <div className="text-center">
            <div className="mb-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Game State: <span className="font-medium">{gameData?.state || 'Not Started'}</span>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              {game?.status === 'ready' && (
                <Button
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                  onClick={handleStartGame}
                >
                  Start Game
                </Button>
              )}
              {gameData && (
                <>
                  <Button
                    variant="outline"
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={handlePreviousState}
                    disabled={GAME_STATES.indexOf(gameData.state) === 0}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                    onClick={handleNextState}
                    disabled={gameData.state === 'return-to-lobby'}
                  >
                    Next →
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}