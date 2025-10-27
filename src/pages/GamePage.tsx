import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import GameStateRenderer from '@/components/games/GameStateRenderer'
import { gamesService } from '@/lib/games'
import { gameAnswersService } from '@/lib/gameAnswers'
import { isCorrectAnswer } from '@/lib/answerShuffler'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const handleAnswerSubmit = async (selectedLabel: string) => {
    if (!id || !gameData?.question || !currentTeamId || isSubmittingAnswer) return

    setIsSubmittingAnswer(true)

    try {
      // For now, use a simpler approach - just use the question ID directly
      // This assumes the question ID can be used as game_questions_id
      const questionId = gameData.question?.id

      console.log('Submitting answer with question ID:', questionId, 'selected label:', selectedLabel)

      if (!questionId) {
        console.error('No question ID found in game data')
        return
      }

      // Determine if the selected answer is correct
      const isCorrect = isCorrectAnswer(questionId, selectedLabel as 'A' | 'B' | 'C' | 'D')

      // The database expects the actual correct answer (always 'A' since answer_a is correct)
      // But we want to store what the user actually selected for scoring
      const translatedAnswer = isCorrect ? 'A' : selectedLabel

      // Submit answer using question ID directly as game_questions_id
      // This is a simplified approach - in a full implementation,
      // you'd need proper round_questions record creation/management
      await gameAnswersService.submitTeamAnswer(
        id,
        questionId, // Using question ID directly for now
        currentTeamId,
        translatedAnswer,
        'A' // The correct answer is always 'A' in the database
      )

      // Update the game data to reflect that this team has submitted
      setGameData((prev: any) => ({
        ...prev,
        submittedAnswers: {
          ...prev.submittedAnswers,
          [currentTeamId]: selectedLabel // Store what the user actually selected
        }
      }))

      console.log(`Answer ${selectedLabel} (${isCorrect ? 'CORRECT' : 'INCORRECT'}) submitted for team ${currentTeamId}`)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  // Fetch game data
  const fetchGameData = async () => {
    if (!id) return

    // Debug authentication state
    console.log('=== GAME PAGE AUTH DEBUG ===')
    console.log('pb.authStore.isValid:', pb.authStore.isValid)
    console.log('pb.authStore.token:', pb.authStore.token ? 'PRESENT' : 'MISSING')
    console.log('pb.authStore.model:', pb.authStore.model)
    console.log('Current user ID:', pb.authStore.model?.id)
    console.log('Game ID being requested:', id)

    // Check if user is authenticated before making the request
    if (!pb.authStore.isValid || !pb.authStore.token) {
      console.error('❌ User is not authenticated - cannot fetch game data')
      console.error('Token missing:', !pb.authStore.token)
      console.error('Invalid auth store:', !pb.authStore.isValid)
      setIsLoading(false)
      return
    }

    console.log('✅ User appears authenticated, attempting to fetch game...')

    try {
      // Get game data (includes scoreboard)
      const gameData = await gamesService.getGame(id)
      console.log('✅ Successfully fetched game data:', gameData)
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
      console.error('❌ Failed to fetch game data:', error)
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        url: error?.url,
        isAbort: error?.name === 'AbortError',
        isNetwork: error?.name === 'NetworkError' || error?.message?.includes('fetch'),
        data: error?.data
      })

      // Check if it's an authentication error
      if (error?.status === 401 || error?.message?.includes('unauthorized')) {
        console.error('🔐 Authentication error detected - redirecting to login')
        // Clear invalid auth state and redirect
        pb.authStore.clear()
        window.location.href = '/'
      } else if (error?.status === 403 || error?.message?.includes('forbidden')) {
        console.error('🚫 Access forbidden - user does not have permission')
      } else if (error?.status === 404) {
        console.error('🔍 Game not found - ID:', id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Set up realtime subscription for game changes
  useEffect(() => {
    if (!id) return

    console.log('🎮 GamePage useEffect triggered for game ID:', id)
    console.log('🎮 Auth state at useEffect:', {
      isValid: pb.authStore.isValid,
      hasToken: !!pb.authStore.token,
      userId: pb.authStore.model?.id
    })

    // Add a small delay to ensure auth state is fully loaded
    const timeoutId = setTimeout(() => {
      console.log('🎮 Delayed fetchGameData call')
      fetchGameData()
    }, 100)

    // Subscribe to real-time updates for games (includes scoreboard changes)
    const unsubscribeGame = pb.collection('games').subscribe('*', (e) => {
      console.log('🔄 GamePage subscription event received:', {
        action: e.action,
        recordId: e.record.id,
        targetId: id,
        isMatching: e.record.id === id,
        timestamp: new Date().toISOString()
      })

      if (e.action === 'update' && e.record.id === id) {
        console.log('📝 GamePage processing game update:', {
          gameId: e.record.id,
          gameName: (e.record as any).name,
          gameStatus: (e.record as any).status,
          hasGameData: !!(e.record as any).data,
          rawData: (e.record as any).data
        })

        const updatedGame = e.record as unknown as Game
        setGame(updatedGame)

        // Parse updated game data
        if (updatedGame.data) {
          console.log('📊 GamePage parsing updated game data:', {
            dataType: typeof updatedGame.data,
            dataLength: typeof updatedGame.data === 'string' ? updatedGame.data.length : 'N/A',
            dataPreview: typeof updatedGame.data === 'string' ? updatedGame.data.substring(0, 200) + '...' : 'Object data'
          })

          try {
            const parsedData = typeof updatedGame.data === 'string' ? JSON.parse(updatedGame.data) : updatedGame.data
            console.log('✅ GamePage successfully parsed game data:', {
              state: parsedData.state,
              hasQuestion: !!parsedData.question,
              questionId: parsedData.question?.id,
              showAnswer: parsedData.showAnswer,
              correctAnswer: parsedData.question?.correct_answer,
              fullData: parsedData
            })
            setGameData(parsedData)
          } catch (error) {
            console.error('❌ GamePage failed to parse game data:', {
              error,
              rawData: updatedGame.data,
              dataType: typeof updatedGame.data
            })
          }
        } else {
          console.log('⚠️ GamePage received update with no game data')
        }
      }
    })

    // Also refresh data when page becomes visible (focus change, tab switch, etc.)
    const handleVisibilityChange = () => {
      console.log('👁️ GamePage visibility change detected, refreshing data...')
      fetchGameData()
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    // Cleanup subscriptions and listeners on unmount
    return () => {
      clearTimeout(timeoutId)
      unsubscribeGame.then((unsub) => unsub())
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
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
          gameId={game?.id}
          scoreboard={game?.scoreboard}
          isLoading={isLoading}
          onAnswerSubmit={handleAnswerSubmit}
        />

        {/* Game End Navigation - Show when game is in game-end state */}
        {gameData?.state === 'game-end' && (
          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/lobby')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              Return to Lobby →
            </Button>
          </div>
        )}

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