import { useState } from 'react'
// @ts-expect-error - Temporary: Import will be used in Task 10
import { Button } from '@/components/ui/button'
import { gamePlayersService } from '@/lib/games'
import pb from '@/lib/pocketbase'
// @ts-expect-error - Temporary: Import will be used in Task 10
import QRCode from 'react-qr-code'
// @ts-expect-error - Temporary: Import will be used in Task 10
import { getMainAppUrl } from '@/lib/networkUrl'
import { TeamRoster } from '@/components/TeamRoster'

interface GameStartProps {
  gameData: {
    state: 'game-start'
  }
  gameId?: string
  gameStatus?: 'setup' | 'ready' | 'in-progress' | 'completed'
  currentTeamId?: string | null
  onChangeTeam?: () => void
  gameCode?: string
  gameName?: string
}

export default function GameStart({ gameData: _gameData, gameId, gameStatus, currentTeamId, onChangeTeam, gameCode: _gameCode, gameName: _gameName }: GameStartProps) {
  // @ts-expect-error - Temporary: State will be used in Task 10
  const [isChangingTeam, setIsChangingTeam] = useState(false)

  // @ts-expect-error - Temporary: Function will be used in Task 10
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
  // @ts-expect-error - Temporary: Variable will be used in Task 10
  const showChangeTeamButton = gameStatus === 'ready' && currentTeamId

  return (
    <TeamRoster />
  )
}