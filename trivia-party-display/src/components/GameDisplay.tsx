import { useDisplay } from '@/contexts/DisplayContext'
import GameStart from '@/components/states/GameStart'
import RoundStartDisplay from '@/components/RoundStartDisplay'
import RoundPlayDisplay from '@/components/RoundPlayDisplay'
import RoundEnd from '@/components/states/RoundEnd'
import GameEnd from '@/components/states/GameEnd'
import Thanks from '@/components/states/Thanks'
import { CircularTimerFixed } from '@/components/ui/circular-timer'
import { GameData } from '@/types/games'
import * as React from 'react'

export function GameDisplay() {
  const { gameRecord } = useDisplay()
  const [timerKey, setTimerKey] = React.useState(0)

  const gameData = gameRecord?.data as GameData | undefined

  // Update timer display every second
  React.useEffect(() => {
    if (!gameData?.timer || gameData.timer.isPaused) return

    const interval = setInterval(() => {
      setTimerKey(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [gameData?.timer, gameData?.timer?.isPaused])

  if (!gameRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">
          Loading game...
        </p>
      </div>
    )
  }

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

      {/* Timer Display - Fixed to bottom-right when active */}
      {gameData?.timer && (
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
    </>
  )
}
