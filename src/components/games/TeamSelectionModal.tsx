import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GameTeam } from '@/types/games'
import { gameTeamsService } from '@/lib/games'

interface TeamSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  onTeamSelected: (teamId: string | null, newTeamName?: string) => void
}

export default function TeamSelectionModal({
  isOpen,
  onClose,
  gameId,
  onTeamSelected,
}: TeamSelectionModalProps) {
  const [teams, setTeams] = useState<GameTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [newTeamName, setNewTeamName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createNewTeam, setCreateNewTeam] = useState(false)

  useEffect(() => {
    if (isOpen && gameId) {
      loadTeams()
    }
  }, [isOpen, gameId])

  const loadTeams = async () => {
    try {
      setIsLoading(true)
      const gameTeams = await gameTeamsService.getTeamsByGame(gameId)
      setTeams(gameTeams)
      if (gameTeams.length > 0) {
        setSelectedTeam(gameTeams[0].id)
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGame = () => {
    if (createNewTeam) {
      if (newTeamName.trim()) {
        onTeamSelected(null, newTeamName.trim())
      }
    } else {
      if (selectedTeam) {
        onTeamSelected(selectedTeam)
      }
    }
  }

  const isFormValid = createNewTeam ? newTeamName.trim().length > 0 : selectedTeam.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Game</DialogTitle>
          <DialogDescription>
            Select an existing team or create a new team to join the game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading teams...</p>
            </div>
          ) : (
            <>
              {teams.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Existing Team</Label>
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={team.id}
                          name="team"
                          value={team.id}
                          checked={selectedTeam === team.id && !createNewTeam}
                          onChange={() => {
                            setSelectedTeam(team.id)
                            setCreateNewTeam(false)
                          }}
                          disabled={createNewTeam}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={team.id} className="text-sm font-normal">
                          {team.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="createNew"
                    checked={createNewTeam}
                    onChange={(e) => {
                      setCreateNewTeam(e.target.checked)
                      setSelectedTeam('')
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="createNew" className="text-sm font-medium">
                    Create New Team
                  </Label>
                </div>

                {createNewTeam && (
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-sm">
                      Team Name
                    </Label>
                    <Input
                      id="teamName"
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      maxLength={30}
                      className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinGame}
            disabled={!isFormValid || isLoading}
            className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
          >
            Join Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}