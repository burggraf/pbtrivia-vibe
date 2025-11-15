import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getFileUrl } from '@/lib/pocketbase'

interface PlayerDetailsModalProps {
  playerId: string
  playerName: string
  playerAvatar: string
  teamName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PlayerDetailsModal({
  playerId,
  playerName,
  playerAvatar,
  teamName,
  open,
  onOpenChange
}: PlayerDetailsModalProps) {
  const avatarUrl = playerAvatar && playerId
    ? getFileUrl('_pb_users_auth_', playerId, playerAvatar, { thumb: '400x400' })
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{playerName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${playerName}'s avatar`}
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-green-500"></div>
            </div>
          )}

          <div className="text-center space-y-2 w-full">
            <p className="text-lg text-slate-700 dark:text-slate-300">
              Team: {teamName}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
