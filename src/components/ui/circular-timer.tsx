/**
 * Circular Timer Component
 *
 * This file is duplicated to: trivia-party-display/src/components/ui/circular-timer.tsx
 * Keep both versions in sync when making changes.
 */
import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularTimerProps {
  remainingSeconds: number
  totalSeconds: number
  isPaused: boolean
  className?: string
}

const CircularTimer = React.forwardRef<
  HTMLDivElement,
  CircularTimerProps
>(({ remainingSeconds, totalSeconds, isPaused, className }, ref) => {
  // Calculate percentage for circle progress (0-100)
  const percentage = totalSeconds > 0
    ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
    : 0

  // SVG circle parameters
  const size = 72 // 72px diameter
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate stroke-dashoffset based on percentage remaining
  // Start at top (12 o'clock) and go clockwise
  const offset = circumference - (percentage / 100) * circumference

  // Format display text
  const displayText = remainingSeconds > 999 ? "999+" : remainingSeconds.toString()

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>

      {/* Center text/icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isPaused ? (
          // Pause icon (two vertical bars)
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-foreground"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        ) : (
          // Countdown number
          <span className="text-lg font-semibold text-foreground tabular-nums">
            {displayText}
          </span>
        )}
      </div>
    </div>
  )
})

CircularTimer.displayName = "CircularTimer"

interface CircularTimerFixedProps extends CircularTimerProps {
  onFadeOutComplete?: () => void
}

const CircularTimerFixed = React.forwardRef<
  HTMLDivElement,
  CircularTimerFixedProps
>(({ onFadeOutComplete, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true)

  // Handle fade-out when timer reaches zero
  React.useEffect(() => {
    if (props.remainingSeconds <= 0) {
      // Start fade-out
      setIsVisible(false)

      // Notify parent after fade-out animation completes
      const timer = setTimeout(() => {
        onFadeOutComplete?.()
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [props.remainingSeconds, onFadeOutComplete])

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 z-[70]",
        "transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      <CircularTimer {...props} />
    </div>
  )
})

CircularTimerFixed.displayName = "CircularTimerFixed"

export { CircularTimer, CircularTimerFixed }
export type { CircularTimerProps, CircularTimerFixedProps }
