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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
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
