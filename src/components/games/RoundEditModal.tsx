import { useState, useEffect } from 'react'
import { Round, UpdateRoundData } from '@/types/rounds'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RoundEditModalProps {
  round: Round | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: UpdateRoundData) => Promise<void>
  isLoading?: boolean
}

export default function RoundEditModal({ round, isOpen, onClose, onSave, isLoading = false }: RoundEditModalProps) {
  const [formData, setFormData] = useState<UpdateRoundData>({
    title: '',
    question_count: 10,
    categories: [],
    sequence_number: 1
  })

  useEffect(() => {
    if (round) {
      setFormData({
        title: round.title || '',
        question_count: round.question_count || 10,
        categories: round.categories || [],
        sequence_number: round.sequence_number || 1
      })
    }
  }, [round])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!round) return

    await onSave(formData)
    onClose()
  }

  const handleInputChange = (field: keyof UpdateRoundData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoriesChange = (value: string) => {
    const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0)
    handleInputChange('categories', categories)
  }

  if (!round) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Round</DialogTitle>
          <DialogDescription>
            Make changes to round information here. Click save when you're done.
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categories" className="text-right">
                Categories
              </Label>
              <Input
                id="categories"
                value={formData.categories?.join(', ') || ''}
                onChange={(e) => handleCategoriesChange(e.target.value)}
                className="col-span-3"
                placeholder="Comma-separated categories"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}