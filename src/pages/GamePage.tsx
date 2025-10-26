import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import TeamDisplay from '@/components/games/TeamDisplay'
import { gamesService } from '@/lib/games'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameData, setGameData] = useState<any>(null)

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Fetch game data
  const fetchGameData = async () => {
    if (!id) return

    try {
      // Get game data (includes scoreboard)
      const gameData = await gamesService.getGame(id)
      setGame(gameData)

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
  }, [id])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Game Room</h1>
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
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          {gameData?.state === 'game-start' ? (
            <>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Welcome to {gameData?.name || game?.name}!
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                There will be {gameData?.rounds || 0} rounds
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-500 font-medium">
                Get ready to play!
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Welcome to the Game!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Waiting for the game to start. Teams and players will appear here in real-time.
              </p>
            </>
          )}
        </div>

        {/* Teams and Players Section */}
        <TeamDisplay
          scoreboard={game?.scoreboard}
          isLoading={isLoading}
          className="mb-8"
        />

        {/* Start Game Button */}
        {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && (
          <div className="text-center">
            <Button className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              Start Game (Coming Soon)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}