import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Game } from '@/types/games'

interface GameStatusModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave: (newStatus: 'setup' | 'ready') => void
  isLoading?: boolean
}

export default function GameStatusModal({
  game,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}: GameStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'setup' | 'ready'>('setup')

  // Initialize selected status when game changes
  useEffect(() => {
    if (game && (game.status === 'setup' || game.status === 'ready')) {
      setSelectedStatus(game.status)
    }
  }, [game])

  const handleSave = () => {
    onSave(selectedStatus)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'setup': return 'secondary'
      case 'ready': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Game Status</DialogTitle>
          <DialogDescription>
            Change the status of "{game?.name}" between setup and ready modes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Select New Status:</h4>
              <div className="flex gap-3">
                <Button
                  variant={selectedStatus === 'setup' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('setup')}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Badge variant={getStatusBadgeVariant('setup')}>
                    Setup
                  </Badge>
                </Button>
                <Button
                  variant={selectedStatus === 'ready' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('ready')}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Badge variant={getStatusBadgeVariant('ready')}>
                    Ready
                  </Badge>
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Status meanings:</p>
              <ul className="space-y-1">
                <li>• <strong>Setup:</strong> Game is being configured and tested</li>
                <li>• <strong>Ready:</strong> Game is ready for players to join</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !game || selectedStatus === game.status}
          >
            {isLoading ? 'Saving...' : 'Change Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}