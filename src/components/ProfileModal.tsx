import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Upload, X } from 'lucide-react'
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const getAvatarUrl = () => {
    if (avatarPreview) {
      return avatarPreview
    }
    if (pb.authStore.model?.avatar) {
      return pb.files.getUrl(pb.authStore.model, pb.authStore.model.avatar)
    }
    return null
  }

  const avatarUrl = getAvatarUrl()

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

      const formData = new FormData()
      formData.append('name', name.trim())

      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      await pb.collection('users').update(pb.authStore.model.id, formData)

      // Clear preview and file after successful save
      setAvatarFile(null)
      setAvatarPreview(null)

      console.log('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setAvatarFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveAvatar = async () => {
    if (!pb.authStore.model?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await pb.collection('users').update(pb.authStore.model.id, {
        avatar: null
      })

      // Clear local state
      setAvatarFile(null)
      setAvatarPreview(null)

      console.log('Avatar removed successfully')
    } catch (error) {
      console.error('Failed to remove avatar:', error)
      setError('Failed to remove avatar. Please try again.')
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
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
              {avatarUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Email and Status (read-only) */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Email
              </label>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {pb.authStore.model?.email}
              </div>
            </div>
            <div className="flex flex-col items-end">
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </DialogContent>
    </Dialog>
  )
}
