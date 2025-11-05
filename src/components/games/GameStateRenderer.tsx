import GameStart from './states/GameStart'
import RoundStart from './states/RoundStart'
import RoundPlay from './states/RoundPlay'
import RoundEnd from './states/RoundEnd'
import GameEnd from './states/GameEnd'
import Thanks from './states/Thanks'
import WaitingState from './states/WaitingState'
import TeamDisplay from './TeamDisplay'
import { GameScoreboard } from '@/types/games'

interface GameStateRendererProps {
  gameData: any
  gameId?: string
  scoreboard?: GameScoreboard
  isLoading?: boolean
  onAnswerSubmit?: (answer: string) => void
  gameStatus?: 'setup' | 'ready' | 'in-progress' | 'completed'
  currentTeamId?: string | null
  onChangeTeam?: () => void
}

export default function GameStateRenderer({ gameData, gameId, scoreboard, isLoading, onAnswerSubmit, gameStatus, currentTeamId, onChangeTeam }: GameStateRendererProps) {
  const renderStateContent = () => {
    // Handle game-start state
    if (gameData?.state === 'game-start') {
      return <GameStart gameData={gameData} gameId={gameId} gameStatus={gameStatus} currentTeamId={currentTeamId} onChangeTeam={onChangeTeam} />
    }

    // Handle round-start state
    if (gameData?.state === 'round-start') {
      return <RoundStart gameData={gameData} />
    }

    // Handle round-play state
    if (gameData?.state === 'round-play') {
      return <RoundPlay gameData={gameData} onAnswerSubmit={onAnswerSubmit} />
    }

    // Handle round-end state
    if (gameData?.state === 'round-end') {
      return <RoundEnd gameData={{...gameData, gameId}} scoreboard={scoreboard} />
    }

    // Handle game-end state
    if (gameData?.state === 'game-end') {
      return <GameEnd gameData={{...gameData, gameId}} scoreboard={scoreboard} />
    }

    // Handle thanks state
    if (gameData?.state === 'thanks') {
      return <Thanks />
    }

    // Handle waiting state (no game data or not started)
    return <WaitingState />
  }

  return (
    <>
      {/* State Content */}
      {renderStateContent()}

      {/* Teams and Players Section */}
      {(!gameData || gameData.state === 'game-start') && (
        <TeamDisplay
          scoreboard={scoreboard}
          isLoading={isLoading}
          className="mb-8"
        />
      )}
    </>
  )
}