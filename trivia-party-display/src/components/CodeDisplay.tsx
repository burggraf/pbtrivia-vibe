import QRCode from 'react-qr-code'
import { useDisplay } from '@/contexts/DisplayContext'

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

      {/* Main content - centered */}
      <div className="flex flex-col items-center gap-8">
        {/* Large code */}
        <div className="text-[120px] font-bold text-slate-900 dark:text-slate-100 tracking-wider">
          {code}
        </div>

        {/* Instructions */}
        <p className="text-[32px] text-slate-700 dark:text-slate-300 text-center max-w-3xl">
          Enter this code on your host screen to claim this display
        </p>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <QRCode value={code} size={300} level="M" />
        </div>
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
