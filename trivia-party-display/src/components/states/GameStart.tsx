import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { gamePlayersService } from '@/lib/games'
import pb from '@/lib/pocketbase'
import QRCode from 'react-qr-code'
import { getMainAppUrl } from '@/lib/networkUrl'

interface GameStartProps {
  gameData: {
    state: 'game-start'
  }
  gameId?: string
  gameStatus?: 'setup' | 'ready' | 'in-progress' | 'completed'
  currentTeamId?: string | null
  onChangeTeam?: () => void
  gameCode?: string
}

export default function GameStart({ gameData: _gameData, gameId, gameStatus, currentTeamId, onChangeTeam, gameCode }: GameStartProps) {
  const [isChangingTeam, setIsChangingTeam] = useState(false)

  const handleChangeTeam = async () => {
    if (!gameId) {
      console.error('No game ID provided')
      return
    }

    const currentUserId = pb.authStore.model?.id
    if (!currentUserId) {
      console.error('No current user ID')
      return
    }

    setIsChangingTeam(true)

    try {
      // Remove the current user from the game
      await gamePlayersService.removePlayerFromGame(gameId, currentUserId)
      console.log('Successfully removed from team, opening team selection modal')

      // Open the team selection modal immediately
      if (onChangeTeam) {
        onChangeTeam()
      }
    } catch (error) {
      console.error('Failed to leave team:', error)
      alert('Failed to leave team. Please try again.')
    } finally {
      setIsChangingTeam(false)
    }
  }

  // Only show the Change Team button if:
  // 1. Game status is "ready"
  // 2. User has a current team
  const showChangeTeamButton = gameStatus === 'ready' && currentTeamId

  return (
    <div className="text-center mb-4 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Welcome to Trivia!
      </h2>
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium mb-3">
        Get ready to play!
      </p>

      {gameCode && (
        <div className="mb-6">
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-4">
            Game Code: <span className="font-mono font-bold text-xl md:text-2xl">{gameCode}</span>
          </p>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <QRCode
                value={`${getMainAppUrl()}/join?code=${gameCode}`}
                size={256}
                level="M"
                aria-label={`QR code to join game ${gameCode}`}
              />
              <p className="text-center text-base text-slate-600 dark:text-slate-700 mt-3">
                Scan to join
              </p>
            </div>
          </div>
        </div>
      )}

      {showChangeTeamButton && (
        <Button
          onClick={handleChangeTeam}
          disabled={isChangingTeam}
          variant="outline"
          className="h-[44px] min-h-[44px] px-6"
        >
          {isChangingTeam ? 'Leaving...' : 'Change My Team'}
        </Button>
      )}
    </div>
  )
}