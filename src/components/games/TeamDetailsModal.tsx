import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getFileUrl } from '@/lib/pocketbase'

interface Player {
  id: string
  gamePlayerId?: string
  name: string
  avatar: string
}

interface TeamDetailsModalProps {
  teamName: string
  players: Player[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TeamDetailsModal({
  teamName,
  players,
  open,
  onOpenChange
}: TeamDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center text-2xl">{teamName}</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {players.map((player) => {
              const avatarUrl = player.avatar && player.id
                ? getFileUrl('_pb_users_auth_', player.id, player.avatar, { thumb: '400x400' })
                : ''

              return (
                <div
                  key={player.id}
                  className="flex flex-col items-center gap-3"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${player.name}'s avatar`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-green-500"></div>
                    </div>
                  )}
                  <p className="text-center text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                    {player.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
