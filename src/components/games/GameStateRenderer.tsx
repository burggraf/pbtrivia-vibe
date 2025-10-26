import GameStart from './states/GameStart'
import RoundStart from './states/RoundStart'
import WaitingState from './states/WaitingState'
import TeamDisplay from './TeamDisplay'
import { GameScoreboard } from '@/types/games'

interface GameStateRendererProps {
  gameData: any
  scoreboard?: GameScoreboard
  isLoading?: boolean
}

export default function GameStateRenderer({ gameData, scoreboard, isLoading }: GameStateRendererProps) {
  const renderStateContent = () => {
    // Handle game-start state
    if (gameData?.state === 'game-start') {
      return <GameStart gameData={gameData} />
    }

    // Handle round-start state
    if (gameData?.state === 'round-start') {
      return <RoundStart gameData={gameData} />
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