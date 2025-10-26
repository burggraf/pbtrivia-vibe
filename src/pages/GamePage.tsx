import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import GameStateRenderer from '@/components/games/GameStateRenderer'
import { gamesService } from '@/lib/games'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { gameAnswersService } from '@/lib/gameAnswers'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameData, setGameData] = useState<any>(null)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleAnswerSubmit = async (answer: string) => {
    if (!id || !gameData?.question || !currentTeamId || isSubmittingAnswer) return

    setIsSubmittingAnswer(true)

    try {
      // For now, use a simpler approach - just use the question ID directly
      // This assumes the question ID can be used as game_questions_id
      const questionId = gameData.question?.id

      console.log('Submitting answer with question ID:', questionId)

      if (!questionId) {
        console.error('No question ID found in game data')
        return
      }

      // Submit answer using question ID directly as game_questions_id
      // This is a simplified approach - in a full implementation,
      // you'd need proper round_questions record creation/management
      await gameAnswersService.submitTeamAnswer(
        id,
        questionId, // Using question ID directly for now
        currentTeamId,
        answer,
        gameData.question.correct_answer
      )

      // Update the game data to reflect that this team has submitted
      setGameData((prev: any) => ({
        ...prev,
        submittedAnswers: {
          ...prev.submittedAnswers,
          [currentTeamId]: answer
        }
      }))

      console.log(`Answer ${answer} submitted for team ${currentTeamId}`)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmittingAnswer(false)
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

      // Determine current user's team from scoreboard
      if (gameData.scoreboard?.teams) {
        const currentUserId = pb.authStore.model?.id
        const userTeam = Object.entries(gameData.scoreboard.teams).find(([, team]: [string, any]) =>
          team.players.some((player: any) => player.id === currentUserId)
        )

        if (userTeam) {
          setCurrentTeamId(userTeam[0])
          console.log('Current user team ID:', userTeam[0])
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

        {/* Game State Renderer */}
        <GameStateRenderer
          gameData={{
            ...gameData,
            playerTeam: currentTeamId,
            isSubmittingAnswer
          }}
          scoreboard={game?.scoreboard}
          isLoading={isLoading}
          onAnswerSubmit={handleAnswerSubmit}
        />

        {/* Start Game Button - Only show when game is ready and not started */}
        {game?.status === 'ready' && game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && (
          <div className="text-center">
            <Button className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              Start Game
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}