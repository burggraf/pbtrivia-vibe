import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ControllerSettingsProps {
  showQrCode: boolean
  showJoinLink: boolean
  onToggleQrCode: () => void
  onToggleJoinLink: () => void
}

export default function ControllerSettings({
  showQrCode,
  showJoinLink,
  onToggleQrCode,
  onToggleJoinLink
}: ControllerSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[44px] w-[44px]"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onToggleQrCode()
          }}
          className="flex items-center justify-between"
        >
          <Label htmlFor="qr-toggle" className="cursor-pointer">
            Show QR Code
          </Label>
          <Switch
            id="qr-toggle"
            checked={showQrCode}
            onCheckedChange={onToggleQrCode}
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onToggleJoinLink()
          }}
          className="flex items-center justify-between"
        >
          <Label htmlFor="link-toggle" className="cursor-pointer">
            Show Join Link
          </Label>
          <Switch
            id="link-toggle"
            checked={showJoinLink}
            onCheckedChange={onToggleJoinLink}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
