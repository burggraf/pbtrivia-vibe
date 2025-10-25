import { useState, useEffect } from 'react'
import { Game, CreateGameData, UpdateGameData } from '@/types/games'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GameEditModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateGameData | CreateGameData) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

export default function GameEditModal({ game, isOpen, onClose, onSave, onDelete, isLoading = false }: GameEditModalProps) {
  const isEdit = !!game
  const [formData, setFormData] = useState<UpdateGameData | CreateGameData>({
    name: '',
    startdate: '',
    duration: undefined,
    location: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        startdate: game.startdate ? new Date(game.startdate).toISOString().slice(0, 16) : '',
        duration: game.duration || undefined,
        location: game.location || ''
      })
    }
  }, [game])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
    }

    await onSave(submitData)
    onClose()
  }

  const handleInputChange = (field: keyof UpdateGameData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete()
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Game' : 'Create Game'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Make changes to game information here. Click save when you\'re done.'
                : 'Create a new trivia game. Fill in the details below.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startdate" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="startdate"
                  type="datetime-local"
                  value={formData.startdate}
                  onChange={(e) => handleInputChange('startdate', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration (min)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration || ''}
                  onChange={(e) => handleInputChange('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 w-full">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Game')}
                  </Button>
                </div>
                {isEdit && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                    disabled={isLoading}
                    className="sm:ml-auto"
                  >
                    Delete Game
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the game "{formData.name}"? This action cannot be undone and will also delete all rounds associated with this game.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete the game and all its rounds. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}