import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
  onRetry?: () => void
  autoDismiss?: boolean
}

export function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  autoDismiss = true,
}: ErrorBannerProps) {
  useEffect(() => {
    if (autoDismiss && !onRetry) {
      const timer = setTimeout(onDismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onRetry, onDismiss])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 text-white px-6 py-4 flex items-center justify-center gap-4">
      <p className="text-lg">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="bg-white text-red-600 hover:bg-gray-100"
        >
          Retry
        </Button>
      )}
    </div>
  )
}
