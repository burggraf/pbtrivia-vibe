import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppHeader from '@/components/ui/AppHeader'
import ControllerSettings from './ControllerSettings'

interface ControllerHeaderProps {
  gameName: string
  gameCode: string
  showQrCode: boolean
  showJoinLink: boolean
  onToggleQrCode: () => void
  onToggleJoinLink: () => void
  onBack: () => void
}

export default function ControllerHeader({
  gameName,
  gameCode,
  showQrCode,
  showJoinLink,
  onToggleQrCode,
  onToggleJoinLink,
  onBack
}: ControllerHeaderProps) {
  return (
    <AppHeader
      title={
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span>{gameName}</span>
          <span className="text-sm sm:text-base font-semibold tracking-widest text-slate-600 dark:text-slate-400">
            Code: {gameCode}
          </span>
        </div>
      }
      leftButton={
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-[44px] w-[44px]"
          aria-label="Back to Host"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      }
      rightButton={
        <ControllerSettings
          showQrCode={showQrCode}
          showJoinLink={showJoinLink}
          onToggleQrCode={onToggleQrCode}
          onToggleJoinLink={onToggleJoinLink}
        />
      }
    />
  )
}
