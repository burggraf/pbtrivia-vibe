import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppHeader from '@/components/ui/AppHeader'
import GameStateRenderer from '@/components/games/GameStateRenderer'
import TeamSelectionModal from '@/components/games/TeamSelectionModal'
import { CircularTimerFixed } from '@/components/ui/circular-timer'
import { gamesService, gameTeamsService, gamePlayersService } from '@/lib/games'
import { gameAnswersService } from '@/lib/gameAnswers'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'
import { usePresenceTracking } from '@/hooks/usePresenceTracking'

export default function GamePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [gameData, setGameData] = useState<any>(null)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
  const [teamAnswer, setTeamAnswer] = useState<{ answer: string, isCorrect?: boolean } | null>(null)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [timerKey, setTimerKey] = React.useState(0)

  // Track player presence when on game page
  usePresenceTracking({
    gameId: id || null,
    userId: pb.authStore.model?.id || '',
    playerName: pb.authStore.model?.name || 'Player',
    teamId: currentTeamId,
    teamName: currentTeamId && game?.scoreboard?.teams?.[currentTeamId]?.name || null,
    enabled: !!id && !!pb.authStore.model?.id
  })

  const handleAnswerSubmit = async (selectedLabel: string) => {
    if (!id || !gameData?.question || !currentTeamId || isSubmittingAnswer) return

    setIsSubmittingAnswer(true)

    try {
      const questionId = gameData.question?.id

      console.log('Submitting answer with question ID:', questionId, 'selected label:', selectedLabel)

      if (!questionId) {
        console.error('No question ID found in game data')
        return
      }

      // Submit the selected label (A, B, C, or D) that the user clicked
      // The host will grade this answer when revealing, using the secure key
      // Players cannot determine correctness without access to the key
      await gameAnswersService.submitTeamAnswer(
        id,
        questionId,
        currentTeamId,
        selectedLabel // Save the shuffled label the player selected
      )

      // Note: The subscription will automatically update teamAnswer state when the answer is saved
      console.log(`Answer ${selectedLabel} submitted for team ${currentTeamId}`)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handleChangeTeam = () => {
    // Clear current team and open team modal
    setCurrentTeamId(null)
    setShowTeamModal(true)
  }

  const handleTeamSelected = async (teamId: string | null, newTeamName?: string) => {
    if (!id || !pb.authStore.model?.id) return

    try {
      setIsLoading(true)
      setShowTeamModal(false)

      let finalTeamId = teamId

      // Create new team if needed
      if (!teamId && newTeamName) {
        const newTeam = await gameTeamsService.createTeam({
          game: id,
          name: newTeamName,
        }, game?.host)
        finalTeamId = newTeam.id
      }

      if (!finalTeamId) {
        console.error('No team selected or created')
        return
      }

      // Check if player already exists in game
      const existingPlayer = await gamePlayersService.findPlayerInGame(id, pb.authStore.model.id)

      if (existingPlayer) {
        // Update existing player with new team
        await gamePlayersService.updatePlayer(existingPlayer.id, {
          team: finalTeamId,
          name: pb.authStore.model.name,
          avatar: pb.authStore.model.avatar,
        })
      } else {
        // Create new player
        await gamePlayersService.createPlayer({
          game: id,
          player: pb.authStore.model.id,
          team: finalTeamId,
          name: pb.authStore.model.name,
          avatar: pb.authStore.model.avatar,
        }, game?.host)
      }

      // The page will refresh via subscriptions
      console.log('Team selected successfully, waiting for page refresh')
    } catch (error) {
      console.error('Failed to join team:', error)
      alert('Failed to join team. Please try again.')
      setShowTeamModal(true)
    } finally {
      setIsLoading(false)
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
    } catch (error: any) {
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

  // Set up realtime subscription for team answers on current question
  useEffect(() => {
    if (!id || !currentTeamId || !gameData?.question?.id) {
      // Clear team answer if no question
      setTeamAnswer(null)
      return
    }

    const questionId = gameData.question.id

    console.log('🔔 Setting up game_answers subscription:', {
      gameId: id,
      questionId,
      teamId: currentTeamId
    })

    // Fetch existing answer first
    const fetchExistingAnswer = async () => {
      try {
        const answers = await gameAnswersService.getTeamAnswersForQuestion(id, questionId)
        const teamAnswerRecord = answers.find(a => a.team === currentTeamId)

        if (teamAnswerRecord) {
          console.log('✅ Found existing team answer:', teamAnswerRecord)
          setTeamAnswer({
            answer: teamAnswerRecord.answer || '',
            isCorrect: teamAnswerRecord.is_correct
          })
        } else {
          console.log('ℹ️ No existing answer found for this question')
          setTeamAnswer(null)
        }
      } catch (error) {
        console.error('Failed to fetch existing answer:', error)
      }
    }

    fetchExistingAnswer()

    // Subscribe to real-time updates for this question's answers
    const unsubscribeAnswers = pb.collection('game_answers').subscribe('*', (e) => {
      console.log('🔄 game_answers subscription event:', {
        action: e.action,
        recordId: e.record.id,
        game: (e.record as any).game,
        gameQuestionsId: (e.record as any).game_questions_id,
        team: (e.record as any).team,
        answer: (e.record as any).answer
      })

      // Check if this answer is for our game, question, and team
      if ((e.record as any).game === id &&
          (e.record as any).game_questions_id === questionId &&
          (e.record as any).team === currentTeamId) {

        console.log('✅ Team answer updated in real-time:', e.record)

        if (e.action === 'create' || e.action === 'update') {
          setTeamAnswer({
            answer: (e.record as any).answer || '',
            isCorrect: (e.record as any).is_correct
          })
        } else if (e.action === 'delete') {
          setTeamAnswer(null)
        }
      }
    }, {
      // Filter to only subscribe to answers for this game and question
      filter: `game = "${id}" && game_questions_id = "${questionId}"`
    })

    // Cleanup subscription when question changes or component unmounts
    return () => {
      console.log('🧹 Cleaning up game_answers subscription for question:', questionId)
      unsubscribeAnswers.then((unsub) => unsub())
    }
  }, [id, currentTeamId, gameData?.question?.id])

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

        // Update current user's team from scoreboard
        if (updatedGame.scoreboard?.teams) {
          const currentUserId = pb.authStore.model?.id
          const userTeam = Object.entries(updatedGame.scoreboard.teams).find(([, team]: [string, any]) =>
            team.players.some((player: any) => player.id === currentUserId)
          )

          if (userTeam) {
            setCurrentTeamId(userTeam[0])
            console.log('Updated current user team ID from subscription:', userTeam[0])
          } else {
            // User is not in any team anymore
            setCurrentTeamId(null)
            console.log('User is not in any team')
          }
        }

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

  // Update timer display every second
  React.useEffect(() => {
    if (!gameData?.timer || gameData.timer.isPaused) return

    const interval = setInterval(() => {
      setTimerKey(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [gameData?.timer, gameData?.timer?.isPaused])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppHeader
        title={game?.name || 'Game'}
        leftButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/lobby')}
            className="h-[44px] w-[44px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Back to Lobby"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">

      {/* Game State Renderer */}
      <GameStateRenderer
          gameData={{
            ...gameData,
            playerTeam: currentTeamId,
            isSubmittingAnswer,
            teamAnswer: teamAnswer?.answer || null,
            teamAnswerIsCorrect: teamAnswer?.isCorrect
          }}
          gameId={game?.id}
          scoreboard={game?.scoreboard}
          isLoading={isLoading}
          onAnswerSubmit={handleAnswerSubmit}
          gameStatus={game?.status}
          currentTeamId={currentTeamId}
          onChangeTeam={handleChangeTeam}
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
      </div>

      {/* Timer Display - Fixed to bottom-right when active */}
      {gameData?.timer && !gameData.timer.showAsNotification && (
        <CircularTimerFixed
          key={timerKey}
          remainingSeconds={(() => {
            const timer = gameData.timer
            if (timer.isPaused) {
              return timer.pausedRemaining || 0
            }
            const now = Date.now()
            const expiresAt = new Date(timer.expiresAt).getTime()
            const remainingMs = Math.max(0, expiresAt - now)
            return Math.ceil(remainingMs / 1000)
          })()}
          totalSeconds={gameData.timer.duration}
          isPaused={gameData.timer.isPaused || false}
        />
      )}

      {/* Early Answer Notification - Show when all teams have answered */}
      {gameData?.timer?.showAsNotification && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed bottom-20 left-1/2 -translate-x-1/2 z-50
            bg-blue-500 dark:bg-blue-600 text-white
            px-6 py-3 rounded-lg shadow-lg
            animate-[slideDown_0.5s_ease-out,pulse_2s_ease-in-out_0.5s_infinite]
          "
        >
          <div className="text-center font-medium">
            All teams have answered.
          </div>
        </div>
      )}

      {/* Team Selection Modal */}
      {game && showTeamModal && (
        <TeamSelectionModal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          gameId={game.id}
          onTeamSelected={handleTeamSelected}
        />
      )}
    </div>
  )
}