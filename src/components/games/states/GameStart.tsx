import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { gamePlayersService } from '@/lib/games'
import pb from '@/lib/pocketbase'

interface GameStartProps {
  gameData: {
    state: 'game-start'
  }
  gameId?: string
  gameStatus?: 'setup' | 'ready' | 'in-progress' | 'completed'
  currentTeamId?: string | null
  onChangeTeam?: () => void
}

export default function GameStart({ gameData: _gameData, gameId, gameStatus, currentTeamId, onChangeTeam }: GameStartProps) {
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
      <p className="text-lg text-slate-600 dark:text-slate-400 font-medium mb-4">
        Get ready to play!
      </p>

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