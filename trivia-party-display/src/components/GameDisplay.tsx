import { useDisplay } from '@/contexts/DisplayContext'
import GameStart from '@/components/states/GameStart'
import RoundStartDisplay from '@/components/RoundStartDisplay'
import RoundPlayDisplay from '@/components/RoundPlayDisplay'
import RoundEnd from '@/components/states/RoundEnd'
import GameEnd from '@/components/states/GameEnd'
import Thanks from '@/components/states/Thanks'

type GameState =
  | 'game-start'
  | 'round-start'
  | 'round-play'
  | 'round-end'
  | 'game-end'
  | 'thanks'

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

  const state = gameRecord.data?.state as GameState | undefined

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {state === 'game-start' && (
        <GameStart
          gameData={{ state: 'game-start' }}
          gameId={gameRecord.id}
          gameStatus={gameRecord.status}
        />
      )}
      {state === 'round-start' && (
        <RoundStartDisplay
          round={gameRecord.data?.round}
        />
      )}
      {state === 'round-play' && (
        <RoundPlayDisplay
          gameData={gameRecord.data as any}
          gameId={gameRecord.id}
        />
      )}
      {state === 'round-end' && (
        <RoundEnd
          gameData={gameRecord.data as any}
          scoreboard={gameRecord.scoreboard as any}
        />
      )}
      {state === 'game-end' && (
        <GameEnd
          gameData={gameRecord.data as any}
          scoreboard={gameRecord.scoreboard as any}
        />
      )}
      {state === 'thanks' && <Thanks />}
    </div>
  )
}
