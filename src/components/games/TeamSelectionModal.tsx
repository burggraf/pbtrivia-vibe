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
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0">
        <DialogHeader className="text-center px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Join Game</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 pt-1">
            {teams.length > 0
              ? "Select your team"
              : "Create your team"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Loading teams...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.length > 0 && (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team.id)
                        setCreateNewTeam(false)
                      }}
                      className={`w-full p-5 rounded-xl border-2 text-lg font-semibold transition-all ${
                        selectedTeam === team.id && !createNewTeam
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}

                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-3 text-slate-500 dark:text-slate-400 font-medium">
                        Or
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {createNewTeam ? (
                <div className="space-y-3">
                  <div className="p-5 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                    <Input
                      id="teamName"
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      maxLength={30}
                      autoFocus
                      className="h-12 text-lg font-semibold border-0 bg-white dark:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCreateNewTeam(false)
                      setNewTeamName('')
                    }}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    ← Back to teams
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCreateNewTeam(true)
                    setSelectedTeam('')
                  }}
                  className="w-full p-5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-lg font-semibold text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                >
                  + Create New Team
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 px-6 pb-6 pt-0">
          <Button
            onClick={handleJoinGame}
            disabled={!isFormValid || isLoading}
            size="lg"
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Join Game
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-transparent"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}