import { useDisplay } from '@/contexts/DisplayContext'
import GameStart from '@/components/states/GameStart'
import RoundStartDisplay from '@/components/RoundStartDisplay'
import RoundPlayDisplay from '@/components/RoundPlayDisplay'
import RoundEnd from '@/components/states/RoundEnd'
import GameEnd from '@/components/states/GameEnd'
import Thanks from '@/components/states/Thanks'
import GameTimer from '@/components/GameTimer'
import { GameData } from '@/types/games'

export function GameDisplay() {
  const { gameRecord } = useDisplay()

  if (!gameRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">
          Loading game...
        </p>
      </div>
    )
  }

  const gameData = gameRecord.data as GameData | undefined
  const state = gameData?.state

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">
          Waiting for game to start...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        {state === 'game-start' && (
          <GameStart
            gameData={{ state: 'game-start' }}
            gameId={gameRecord.id}
            gameStatus={gameRecord.status}
            gameCode={gameRecord.code}
            gameName={gameRecord.name}
          />
        )}
        {state === 'round-start' && (
          <RoundStartDisplay
            round={gameData?.round}
          />
        )}
        {state === 'round-play' && (
          <RoundPlayDisplay
            gameData={gameData as any}
            gameId={gameRecord.id}
          />
        )}
        {state === 'round-end' && (
          <RoundEnd
            gameData={gameData as any}
            scoreboard={gameRecord.scoreboard as any}
          />
        )}
        {state === 'game-end' && (
          <GameEnd
            gameData={gameData as any}
            scoreboard={gameRecord.scoreboard as any}
          />
        )}
        {state === 'thanks' && <Thanks />}
      </div>

      {/* Timer Display - Fixed to bottom when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}
    </>
  )
}
