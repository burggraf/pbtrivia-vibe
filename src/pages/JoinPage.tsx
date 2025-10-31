import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import TeamSelectionModal from '@/components/games/TeamSelectionModal'
import { gamesService, gameTeamsService, gamePlayersService } from '@/lib/games'
import pb from '@/lib/pocketbase'

export default function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [currentGame, setCurrentGame] = useState<any>(null)

  const code = searchParams.get('code')

  useEffect(() => {
    const handleJoin = async () => {
      // Validate code format
      if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
        setError('Invalid game code format')
        setIsLoading(false)
        return
      }

      // Check authentication
      if (!pb.authStore.isValid) {
        // Redirect to auth page with return URL
        const returnUrl = encodeURIComponent(`/join?code=${code}`)
        navigate(`/?returnTo=${returnUrl}`)
        return
      }

      // User is authenticated, lookup game
      try {
        const game = await gamesService.findGameByCode(code)

        if (!game) {
          setError('Game not found or not available to join')
          setIsLoading(false)
          return
        }

        if (game.status === 'completed') {
          setError('This game has ended and is no longer accepting players')
          setIsLoading(false)
          return
        }

        // Check if player is already in this game
        const existingPlayer = await gamePlayersService.findPlayerInGame(game.id, pb.authStore.model!.id)

        if (existingPlayer && existingPlayer.team) {
          // Player is already in game with team - go directly to game page
          navigate(`/game/${game.id}`)
          return
        }

        // Show team selection modal
        setCurrentGame(game)
        setShowTeamModal(true)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Failed to join game:', err)
        setError('Unable to connect. Please check your connection and try again.')
        setIsLoading(false)
      }
    }

    handleJoin()
  }, [code, navigate])

  const handleRetry = () => {
    setIsLoading(true)
    setError('')
    window.location.reload()
  }

  const handleTryAnother = () => {
    navigate('/lobby')
  }

  const handleTeamSelected = async (teamId: string | null, newTeamName?: string) => {
    if (!currentGame || !pb.authStore.model?.id) return

    try {
      setIsLoading(true)
      setShowTeamModal(false)

      let finalTeamId = teamId

      // Create new team if needed
      if (!teamId && newTeamName) {
        const newTeam = await gameTeamsService.createTeam({
          game: currentGame.id,
          name: newTeamName
        }, currentGame.host)
        finalTeamId = newTeam.id
      }

      // Check if player already exists in this game
      const existingPlayer = await gamePlayersService.findPlayerInGame(currentGame.id, pb.authStore.model.id)

      if (existingPlayer) {
        // Update existing player record with team assignment
        await gamePlayersService.updatePlayer(existingPlayer.id, {
          team: finalTeamId || undefined,
          name: pb.authStore.model?.name || '',
          avatar: pb.authStore.model?.avatar || ''
        })
      } else {
        // Create new player record
        await gamePlayersService.createPlayer({
          game: currentGame.id,
          player: pb.authStore.model.id,
          team: finalTeamId || undefined,
          name: pb.authStore.model?.name || '',
          avatar: pb.authStore.model?.avatar || ''
        }, currentGame.host)
      }

      // Redirect to game page
      navigate(`/game/${currentGame.id}`)
    } catch (error) {
      console.error('Failed to join team:', error)
      setError('Failed to join team. Please try again.')
      setShowTeamModal(true)
      setIsLoading(false)
    }
  }

  if (isLoading && !showTeamModal) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Joining game...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 md:p-6 lg:p-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                Unable to Join Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300 text-center">
                  {error}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {error.includes('connection') && (
                  <Button
                    onClick={handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Retry
                  </Button>
                )}
                <Button
                  onClick={handleTryAnother}
                  variant="outline"
                  className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Try Another Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render team selection modal when ready
  return (
    <>
      <TeamSelectionModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        gameId={currentGame?.id || ''}
        onTeamSelected={handleTeamSelected}
      />
    </>
  )
}
