import { useState, useEffect } from 'react'
import { Game, CreateGameData, UpdateGameData, GameMetadata } from '@/types/games'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { gamesService } from '@/lib/games'
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
  const { toast } = useToast()
  const [formData, setFormData] = useState<UpdateGameData | CreateGameData & {
    rounds?: number;
    questionsPerRound?: number;
    categories?: string[];
    question_timer?: number | null;
    answer_timer?: number | null;
    game_start_timer?: number | null;
    round_start_timer?: number | null;
    round_end_timer?: number | null;
    game_end_timer?: number | null;
    thanks_timer?: number | null;
  }>({
    name: '',
    startdate: '',
    duration: 120,
    location: '',
    rounds: 3,
    questionsPerRound: 10,
    categories: [],
    question_timer: null,
    answer_timer: null,
    game_start_timer: null,
    round_start_timer: null,
    round_end_timer: null,
    game_end_timer: null,
    thanks_timer: null
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
        categories: [],
        question_timer: game.metadata?.question_timer || null,
        answer_timer: game.metadata?.answer_timer || null,
        game_start_timer: game.metadata?.game_start_timer || null,
        round_start_timer: game.metadata?.round_start_timer || null,
        round_end_timer: game.metadata?.round_end_timer || null,
        game_end_timer: game.metadata?.game_end_timer || null,
        thanks_timer: game.metadata?.thanks_timer || null
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
        categories: getAvailableCategories(), // Default to all categories for new games
        question_timer: null,
        answer_timer: null,
        game_start_timer: null,
        round_start_timer: null,
        round_end_timer: null,
        game_end_timer: null,
        thanks_timer: null
      })
    }
  }, [game])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Convert empty/zero values to null for timers
    const metadata: GameMetadata = {
      question_timer: ('question_timer' in formData ? formData.question_timer : null) || null,
      answer_timer: ('answer_timer' in formData ? formData.answer_timer : null) || null,
      game_start_timer: ('game_start_timer' in formData ? formData.game_start_timer : null) || null,
      round_start_timer: ('round_start_timer' in formData ? formData.round_start_timer : null) || null,
      round_end_timer: ('round_end_timer' in formData ? formData.round_end_timer : null) || null,
      game_end_timer: ('game_end_timer' in formData ? formData.game_end_timer : null) || null,
      thanks_timer: ('thanks_timer' in formData ? formData.thanks_timer : null) || null
    }

    const submitData = {
      ...formData,
      metadata,
      startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
    }

    await onSave(submitData)
    onClose()
  }

  const handleInputChange = (
    field: keyof (UpdateGameData | CreateGameData) | 'rounds' | 'questionsPerRound' | 'categories' |
           'question_timer' | 'answer_timer' | 'game_start_timer' | 'round_start_timer' | 'round_end_timer' | 'game_end_timer' | 'thanks_timer',
    value: string | number | string[] | null | undefined
  ) => {
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

  const handleCopyTimersFromPreviousGame = async () => {
    try {
      // Fetch recent games
      const games = await gamesService.getGames()

      // Filter games that have timer metadata
      const gamesWithTimers = games.filter(g =>
        g.metadata?.question_timer !== undefined ||
        g.metadata?.answer_timer !== undefined ||
        g.metadata?.game_start_timer !== undefined ||
        g.metadata?.round_start_timer !== undefined ||
        g.metadata?.game_end_timer !== undefined ||
        g.metadata?.thanks_timer !== undefined
      )

      if (gamesWithTimers.length === 0) {
        toast({
          title: "No Previous Timers",
          description: "No previous games with timer configuration found.",
          variant: "destructive"
        })
        return
      }

      // Explicitly get the most recent by sorting by updated timestamp
      const previousGameWithTimers = gamesWithTimers.sort((a, b) =>
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      )[0]

      // Copy timer values to form
      setFormData(prev => ({
        ...prev,
        question_timer: previousGameWithTimers.metadata?.question_timer || null,
        answer_timer: previousGameWithTimers.metadata?.answer_timer || null,
        game_start_timer: previousGameWithTimers.metadata?.game_start_timer || null,
        round_start_timer: previousGameWithTimers.metadata?.round_start_timer || null,
        game_end_timer: previousGameWithTimers.metadata?.game_end_timer || null,
        thanks_timer: previousGameWithTimers.metadata?.thanks_timer || null
      }))

      toast({
        title: "Timers Copied",
        description: `Copied timer settings from "${previousGameWithTimers.name}"`,
      })
    } catch (error) {
      console.error('Failed to copy timers:', error)
      toast({
        title: "Error",
        description: "Failed to load previous game timers.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Game' : 'Create Game'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Make changes to game information here. Click save when you\'re done.'
                : 'Create a new trivia game. Fill in the details below.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="overflow-y-auto px-6 py-4">
              <Accordion type="single" collapsible defaultValue="basic-info" className="w-full">
                {/* Basic Info Section */}
                <AccordionItem value="basic-info">
                  <AccordionTrigger className="text-base font-semibold">
                    Basic Game Info
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 pt-4">
                      {/* Name */}
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Game Structure Section - Create mode only */}
                {!isEdit && (
                  <AccordionItem value="game-structure">
                    <AccordionTrigger className="text-base font-semibold">
                      Game Structure
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 pt-4">
                        {/* Rounds and Questions */}
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

                        {/* Categories */}
                        <div className="border-t pt-4">
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
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Timers Section - Create mode only */}
                {!isEdit && (
                  <AccordionItem value="timers">
                    <AccordionTrigger className="text-base font-semibold">
                      Timers
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 pt-4">
                        {/* Copy from Previous Game Button */}
                        <div className="flex justify-end mb-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyTimersFromPreviousGame}
                            className="text-xs"
                          >
                            Copy from Previous Game
                          </Button>
                        </div>

                        {/* Timer Inputs - 2 columns on desktop, 1 on mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Question Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="question_timer" className="text-sm font-medium">
                              Question Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="question_timer"
                                type="number"
                                min="0"
                                max="300"
                                value={('question_timer' in formData ? formData.question_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('question_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-play state)</p>
                          </div>

                          {/* Answer Display Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="answer_timer" className="text-sm font-medium">
                              Answer Display Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="answer_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={('answer_timer' in formData ? formData.answer_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('answer_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-end state)</p>
                          </div>

                          {/* Round Start Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="round_start_timer" className="text-sm font-medium">
                              Round Start Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="round_start_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={('round_start_timer' in formData ? formData.round_start_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('round_start_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-start state)</p>
                          </div>

                          {/* Game Start Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="game_start_timer" className="text-sm font-medium">
                              Game Start Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="game_start_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={('game_start_timer' in formData ? formData.game_start_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('game_start_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(game-start state)</p>
                          </div>

                          {/* Game End Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="game_end_timer" className="text-sm font-medium">
                              Game End Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="game_end_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={('game_end_timer' in formData ? formData.game_end_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('game_end_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(game-end state)</p>
                          </div>

                          {/* Thanks Screen Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="thanks_timer" className="text-sm font-medium">
                              Thanks Screen Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="thanks_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={('thanks_timer' in formData ? formData.thanks_timer : null) ?? ''}
                                onChange={(e) => handleInputChange('thanks_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(thanks state)</p>
                          </div>
                        </div>

                        {/* Helper Note */}
                        <p className="text-xs text-slate-500 italic mt-2">
                          Leave blank or enter 0 for no time limit (manual advance)
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
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