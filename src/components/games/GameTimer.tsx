import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'

interface GameTimerProps {
  timer: {
    startedAt: string
    duration: number
    expiresAt: string
  }
}

export default function GameTimer({ timer }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [progressValue, setProgressValue] = useState(100)

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const expiresAt = new Date(timer.expiresAt).getTime()
      const remainingMs = Math.max(0, expiresAt - now)
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      setRemainingSeconds(remainingSeconds)

      // Calculate progress percentage from milliseconds for smooth animation
      const totalMs = timer.duration * 1000
      const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100))
      setProgressValue(percentage)
    }

    // Initial update
    updateTimer()

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100)

    return () => clearInterval(interval)
  }, [timer])

  const secondsText = remainingSeconds === 1 ? 'second' : 'seconds'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {remainingSeconds} {secondsText}
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
    </div>
  )
}
