import { useState, useEffect } from 'react'
import { Game, CreateGameData, UpdateGameData } from '@/types/games'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { getAvailableCategories } from '@/components/ui/CategoryIcon'
import CategoryIcon from '@/components/ui/CategoryIcon'

interface GameEditModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateGameData | CreateGameData & { rounds?: number; questionsPerRound?: number; categories?: string[] }) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

export default function GameEditModal({ game, isOpen, onClose, onSave, onDelete, isLoading = false }: GameEditModalProps) {
  const isEdit = !!game
  const [formData, setFormData] = useState<UpdateGameData | CreateGameData & { rounds?: number; questionsPerRound?: number; categories?: string[] }>({
    name: '',
    startdate: '',
    duration: 120,
    location: '',
    rounds: 3,
    questionsPerRound: 10,
    categories: []
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const durationOptions = [0, 30, 60, 90, 120, 150, 180, 240]

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        startdate: game.startdate ? new Date(game.startdate).toISOString().slice(0, 16) : '',
        duration: game.duration || 120,
        location: game.location || '',
        rounds: 3,
        questionsPerRound: 10,
        categories: []
      })
    } else {
      // Calculate smart default start date/time
      const now = new Date()
      const currentHour = now.getHours()

      // If before 6 PM, use today at 6 PM, otherwise use tomorrow at 6 PM
      const defaultDate = new Date()
      if (currentHour >= 18) {
        // After 6 PM - set to tomorrow
        defaultDate.setDate(defaultDate.getDate() + 1)
      }
      // Set time to 6:00 PM (18:00)
      defaultDate.setHours(18, 0, 0, 0)

      // Format as datetime-local string (YYYY-MM-DDTHH:MM) in local time
      const year = defaultDate.getFullYear()
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0')
      const day = String(defaultDate.getDate()).padStart(2, '0')
      const hours = String(defaultDate.getHours()).padStart(2, '0')
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0')
      const defaultStartDate = `${year}-${month}-${day}T${hours}:${minutes}`

      // Reset form for create mode with defaults
      setFormData({
        name: '',
        startdate: defaultStartDate,
        duration: 120,
        location: '',
        rounds: 3,
        questionsPerRound: 10,
        categories: getAvailableCategories() // Default to all categories for new games
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

  const handleInputChange = (field: keyof (UpdateGameData | CreateGameData) | 'rounds' | 'questionsPerRound' | 'categories', value: string | number | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const currentCategories = formData.categories || []
    if (checked) {
      handleInputChange('categories', [...currentCategories, category])
    } else {
      handleInputChange('categories', currentCategories.filter((cat: string) => cat !== category))
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

              {/* Duration and Location on same line */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select
                    value={formData.duration?.toString() || '120'}
                    onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                  >
                    <SelectTrigger className="flex-1 bg-white dark:bg-slate-800 border-input">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border border-input">
                      {durationOptions.map((minutes) => (
                        <SelectItem key={minutes} value={minutes.toString()}>
                          {minutes === 0 ? 'No limit' : `${minutes} minutes`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center px-2 text-slate-500">/</div>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Location"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Start Date */}
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

              {/* Rounds and Questions - only show for create mode */}
              {!isEdit && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rounds" className="text-right">
                    Rounds
                  </Label>
                  <div className="col-span-3 flex gap-4 items-center">
                    <Input
                      id="rounds"
                      type="number"
                      min="0"
                      max="99"
                      value={formData.rounds || 3}
                      onChange={(e) => handleInputChange('rounds', parseInt(e.target.value) || 3)}
                      className="w-16 text-center"
                      required
                    />
                    <Label htmlFor="questionsPerRound" className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Questions
                    </Label>
                    <Input
                      id="questionsPerRound"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.questionsPerRound || 10}
                      onChange={(e) => handleInputChange('questionsPerRound', parseInt(e.target.value) || 10)}
                      className="w-16 text-center"
                      placeholder="per round"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Categories Section - only show for create mode */}
            {!isEdit && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">Categories</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-300">
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
                  <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
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
            )}
            <DialogFooter>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 w-full">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || (!isEdit && (formData.rounds || 0) > 0 && (!formData.categories || formData.categories.length === 0))}>
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