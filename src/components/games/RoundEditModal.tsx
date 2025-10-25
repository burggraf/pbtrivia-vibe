import { useState, useEffect } from 'react'
import { Round, UpdateRoundData } from '@/types/rounds'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { getAvailableCategories } from '@/components/ui/CategoryIcon'
import CategoryIcon from '@/components/ui/CategoryIcon'

interface RoundEditModalProps {
  round: Round | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateRoundData) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
  isCreateMode?: boolean
}

export default function RoundEditModal({ round, isOpen, onClose, onSave, onDelete, isLoading = false, isCreateMode = false }: RoundEditModalProps) {
  const [formData, setFormData] = useState<UpdateRoundData>({
    title: '',
    question_count: 10,
    categories: [],
    sequence_number: 1
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (round) {
      setFormData({
        title: round.title || '',
        question_count: round.question_count || 10,
        categories: round.categories || [],
        sequence_number: round.sequence_number || 1
      })
    } else if (isCreateMode) {
      // Reset form for create mode
      setFormData({
        title: '',
        question_count: 10,
        categories: [],
        sequence_number: 1
      })
    }
  }, [round, isCreateMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!round && !isCreateMode) return

    await onSave(formData)
    onClose()
  }

  const handleInputChange = (field: keyof UpdateRoundData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const currentCategories = formData.categories || []
    if (checked) {
      handleInputChange('categories', [...currentCategories, category])
    } else {
      handleInputChange('categories', currentCategories.filter(cat => cat !== category))
    }
  }

  const handleToggleAllCategories = () => {
    if (isAllCategoriesSelected()) {
      handleInputChange('categories', [])
    } else {
      handleInputChange('categories', getAvailableCategories())
    }
  }

  const isAllCategoriesSelected = () => {
    const allCategories = getAvailableCategories()
    const currentCategories = formData.categories || []
    return allCategories.length > 0 && allCategories.every(category => currentCategories.includes(category))
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

  if (!round && !isCreateMode) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isCreateMode ? 'Add Round' : 'Edit Round'}</DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? 'Create a new round for your game. Click save when you\'re done.'
                : 'Make changes to round information here. Click save when you\'re done.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question_count" className="text-right">
                  Question Count
                </Label>
                <Input
                  id="question_count"
                  type="number"
                  min="1"
                  value={formData.question_count}
                  onChange={(e) => handleInputChange('question_count', parseInt(e.target.value))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sequence_number" className="text-right">
                  Sequence
                </Label>
                <Input
                  id="sequence_number"
                  type="number"
                  min="1"
                  value={formData.sequence_number}
                  onChange={(e) => handleInputChange('sequence_number', parseInt(e.target.value))}
                  className="col-span-3"
                  required
                />
              </div>
            </div>

            {/* Categories Section - Full Width at Bottom */}
            <div className="border-t pt-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Categories</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formData.categories?.length || 0} of {getAvailableCategories().length} selected
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleAllCategories}
                      className="text-xs h-7"
                    >
                      {isAllCategoriesSelected() ? 'Check None' : 'Check All'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableCategories().map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={formData.categories?.includes(category) || false}
                        onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                      />
                      <Label
                        htmlFor={category}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        <CategoryIcon category={category} size={14} />
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 w-full">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : (isCreateMode ? 'Add Round' : 'Save Changes')}
                  </Button>
                </div>
                {!isCreateMode && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                    disabled={isLoading}
                    className="sm:ml-auto"
                  >
                    Delete Round
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
            <DialogTitle>Delete Round</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the round "{formData.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This will permanently delete the round and all its associated data.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}