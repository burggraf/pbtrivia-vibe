import { useDisplay } from '@/contexts/DisplayContext'
import { pbUrl } from '@/lib/pocketbase'

export function CodeDisplay() {
  const { code, displayId } = useDisplay()

  // Get device info
  const browserInfo = navigator.userAgent.split(' ').slice(-2).join(' ')
  const ipAddress = 'N/A' // IP not available from browser

  if (!code || !displayId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">Initializing...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-8 relative">
      {/* Device info - top left */}
      <div className="absolute top-4 left-4 text-xs text-slate-500 dark:text-slate-600">
        {ipAddress} | {browserInfo}
      </div>

      {/* PocketBase URL - top right */}
      <div className="absolute top-4 right-4 text-xs text-slate-500 dark:text-slate-600">
        PB: {pbUrl}
      </div>

      {/* Main content - centered */}
      <div className="flex flex-col items-center gap-8">
        {/* Large code */}
        <div className="text-[60px] font-bold text-slate-900 dark:text-slate-100 tracking-wider">
          {code}
        </div>

        {/* Instructions */}
        <p className="text-[16px] text-slate-700 dark:text-slate-300 text-center max-w-3xl">
          Enter this code in the controller to connect to this display
        </p>
      </div>

      {/* Display ID - bottom left */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 dark:text-slate-600">
        ID: {displayId}
      </div>

      {/* App version - bottom right */}
      <div className="absolute bottom-4 right-4 text-base text-slate-500 dark:text-slate-600">
        v1.0.0
      </div>
    </div>
  )
}
