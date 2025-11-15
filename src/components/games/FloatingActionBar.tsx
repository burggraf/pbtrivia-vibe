import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingActionBarProps {
  onNext: () => void
  onBack: () => void
  onPause: () => void
  isPaused: boolean
  canGoBack: boolean
  nextLabel: string
  backLabel: string
  hasTimer: boolean
}

export default function FloatingActionBar({
  onNext,
  onBack,
  onPause,
  isPaused,
  canGoBack,
  nextLabel,
  backLabel,
  hasTimer
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-2 md:gap-4">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
          className="h-[44px] border-slate-300 dark:border-slate-600"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{backLabel}</span>
          <span className="sm:hidden">Back</span>
        </Button>

        {/* Pause/Resume Button - only show if timer is running */}
        {hasTimer ? (
          <Button
            variant="outline"
            onClick={onPause}
            className="h-[44px] border-slate-300 dark:border-slate-600 flex items-center gap-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </Button>
        ) : (
          <div className="h-[44px] w-[44px] sm:w-[100px]" aria-hidden="true" />
        )}

        {/* Next Button */}
        <Button
          onClick={onNext}
          className="h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
