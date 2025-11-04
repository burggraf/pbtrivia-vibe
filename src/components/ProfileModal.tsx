import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import pb from '@/lib/pocketbase'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(pb.authStore.model?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!pb.authStore.model?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await pb.collection('users').update(pb.authStore.model.id, {
        name: name.trim()
      })

      // Success - could add toast notification here
      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar section placeholder */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <User className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Email
            </label>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {pb.authStore.model?.email}
            </div>
          </div>

          {/* Verified status (read-only) */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Status
            </label>
            {pb.authStore.model?.verified ? (
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                ✓ Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                Unverified
              </Badge>
            )}
          </div>

          {/* Name (editable) - placeholder */}
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isLoading}
              onClick={handleSave}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoading}
            >
              Log Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
