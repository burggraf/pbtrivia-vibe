import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getFileUrl } from '@/lib/pocketbase'
import pb from '@/lib/pocketbase'

interface PlayerDetailsModalProps {
  playerId: string
  playerName: string
  playerAvatar: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserDetails {
  email: string
}

export default function PlayerDetailsModal({
  playerId,
  playerName,
  playerAvatar,
  open,
  onOpenChange
}: PlayerDetailsModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && playerId) {
      setLoading(true)
      pb.collection('users').getOne(playerId)
        .then((user: any) => {
          setUserDetails({
            email: user.email || ''
          })
        })
        .catch((error) => {
          console.error('Failed to fetch user details:', error)
          setUserDetails({ email: '' })
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, playerId])

  const avatarUrl = playerAvatar && playerId
    ? getFileUrl('_pb_users_auth_', playerId, playerAvatar, { thumb: '400x400' })
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Player Details</DialogTitle>
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
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {playerName}
            </h3>

            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading...
              </p>
            ) : userDetails?.email ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 break-all px-4">
                {userDetails.email}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No email available
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
