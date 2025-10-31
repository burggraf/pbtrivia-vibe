import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ThemeToggle from '@/components/ThemeToggle'
import TeamSelectionModal from '@/components/games/TeamSelectionModal'
import { gamesService, gameTeamsService, gamePlayersService } from '@/lib/games'
import pb from '@/lib/pocketbase'

export default function LobbyPage() {
  const navigate = useNavigate()
  const [gameCode, setGameCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      // Find game by code with status "ready"
      const game = await gamesService.findGameByCode(gameCode.trim().toUpperCase())

      if (!game) {
        setError('Game not found or not ready to join')
        return
      }

      // Check if player is already in this game
      if (pb.authStore.model?.id) {
        const existingPlayer = await gamePlayersService.findPlayerInGame(game.id, pb.authStore.model.id)

        if (existingPlayer) {
          // Player is already in the game
          if (existingPlayer.team) {
            // Player is on a team - go directly to game page
            console.log('Player already in game with team, redirecting to game page')
            navigate(`/game/${game.id}`)
            return
          } else {
            // Player is in game but not on a team - show team selection
            console.log('Player already in game but no team, showing team selection')
            setCurrentGame(game)
            setShowTeamModal(true)
            return
          }
        }
      }

      // New player - show team selection
      setCurrentGame(game)
      setShowTeamModal(true)
    } catch (error) {
      console.error('Failed to join game:', error)
      setError('Failed to join game. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
        }, currentGame.host) // Pass the game host ID
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
        console.log('Updated existing player with team assignment')
      } else {
        // Create new player record
        await gamePlayersService.createPlayer({
          game: currentGame.id,
          player: pb.authStore.model.id,
          team: finalTeamId || undefined,
          name: pb.authStore.model?.name || '',
          avatar: pb.authStore.model?.avatar || ''
        }, currentGame.host) // Pass the game host ID
        console.log('Created new player record')
      }

      // Redirect to game page
      navigate(`/game/${currentGame.id}`)
    } catch (error) {
      console.error('Failed to join team:', error)
      setError('Failed to join team. Please try again.')
      setShowTeamModal(true) // Show modal again on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 md:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-semibold text-slate-800 dark:text-slate-100 text-center sm:text-left">Lobby</h1>
          <div className="flex gap-2 justify-center sm:justify-end">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Join Game Section */}
        <Card className="mx-4 sm:mx-auto max-w-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Join a Game</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Enter your game code</p>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <Input
                  id="gameCode"
                  placeholder="ABC123"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
                  className="text-center text-2xl md:text-3xl font-bold tracking-widest w-full max-w-[200px] h-14 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                  maxLength={6}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleJoinGame}
                  disabled={isLoading || !gameCode.trim()}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold"
                >
                  {isLoading ? 'Joining...' : 'Join Game'}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      {/* Team Selection Modal */}
      <TeamSelectionModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        gameId={currentGame?.id || ''}
        onTeamSelected={handleTeamSelected}
      />
    </div>
  )
}