import { useDisplay } from '@/contexts/DisplayContext'
import { pbUrl } from '@/lib/pocketbase'
import { useState, useEffect } from 'react'
import { TestMode } from '@/components/TestMode'
import { Button } from '@/components/ui/button'

export function CodeDisplay() {
  const { code, displayId } = useDisplay()
  const [resolution, setResolution] = useState('')
  const [isTestMode, setIsTestMode] = useState(false)

  // Get screen resolution
  useEffect(() => {
    const updateResolution = () => {
      const screenRes = `${window.screen.width}x${window.screen.height}`
      const viewportRes = `${window.innerWidth}x${window.innerHeight}`
      const dpr = window.devicePixelRatio || 1
      const effectiveW = Math.round(window.innerWidth * dpr)
      const effectiveH = Math.round(window.innerHeight * dpr)
      const effectiveRes = `${effectiveW}x${effectiveH}`
      setResolution(`Screen: ${screenRes} | Viewport: ${viewportRes} | DPR: ${dpr} | Effective: ${effectiveRes}`)
    }

    updateResolution()
    window.addEventListener('resize', updateResolution)
    return () => window.removeEventListener('resize', updateResolution)
  }, [])

  if (!code || !displayId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">Initializing...</p>
      </div>
    )
  }

  // Show test mode if active
  if (isTestMode) {
    return <TestMode onComplete={() => setIsTestMode(false)} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-8 relative">
      {/* Screen resolution - top left */}
      <div className="absolute top-4 left-4 text-xs text-slate-500 dark:text-slate-600">
        {resolution}
      </div>

      {/* PocketBase URL - top right */}
      <div className="absolute top-4 right-4 text-xs text-slate-500 dark:text-slate-600">
        {pbUrl}
      </div>

      {/* Main content - centered */}
      <div className="flex flex-col items-center gap-8">
        {/* Large code */}
        <div className="text-[48px] font-bold text-slate-900 dark:text-slate-100 tracking-wider">
          {code}
        </div>

        {/* Instructions */}
        <p className="text-[14px] text-slate-700 dark:text-slate-300 text-center max-w-3xl">
          Enter this code in the controller to connect to this display
        </p>

        {/* Test Mode Button */}
        <Button
          onClick={() => setIsTestMode(true)}
          variant="outline"
          className="mt-4"
        >
          Test Display Screens
        </Button>
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
