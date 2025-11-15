import { useState, useEffect, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'

interface GameTimerProps {
  timer: {
    startedAt: string
    duration: number
    expiresAt: string
    isEarlyAdvance?: boolean
    isPaused?: boolean
    pausedAt?: string
    pausedRemaining?: number
    showAsNotification?: boolean  // NEW
  }
}

export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  const updateTimer = useCallback(() => {
    if (!timer) return

    // If paused, use stored remaining time
    if (timer.isPaused) {
      const remaining = timer.pausedRemaining || 0
      setRemainingSeconds(remaining)

      // Calculate progress from paused remaining
      const percentage = Math.max(0, Math.min(100, (remaining / timer.duration) * 100))
      setProgressValue(percentage)
      return
    }

    // Normal countdown logic (existing)
    const now = Date.now()
    const expiresAt = new Date(timer.expiresAt).getTime()
    const remainingMs = Math.max(0, expiresAt - now)
    const remainingSeconds = Math.ceil(remainingMs / 1000)

    setRemainingSeconds(remainingSeconds)

    // Calculate progress percentage from milliseconds for smooth animation
    const totalMs = timer.duration * 1000
    const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
    setProgressValue(percentage)
  }, [timer])

  useEffect(() => {
    // Initial update
    updateTimer()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [updateTimer])

  const secondsText = remainingSeconds === 1 ? 'second' : 'seconds'

  // Render notification popover for early-advance
  if (timer.showAsNotification) {
    return (
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
    )
  }

  return (
    <div className="fixed bottom-[68px] left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
          {timer.isPaused && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-semibold">
              PAUSED
            </span>
          )}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
