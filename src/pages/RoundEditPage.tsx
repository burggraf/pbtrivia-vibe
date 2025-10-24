import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'
import { roundsService } from '@/lib/rounds'
import { gamesService } from '@/lib/games'
import { Round, UpdateRoundData } from '@/types/rounds'
import { Game } from '@/types/games'
import RoundForm from '@/components/rounds/RoundForm'

export default function RoundEditPage() {
  const navigate = useNavigate()
  const { gameId, roundId } = useParams<{ gameId: string; roundId: string }>()
  const [round, setRound] = useState<Round | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (gameId && roundId) {
      loadRound(roundId)
      loadGame(gameId)
    }
  }, [gameId, roundId])

  const loadRound = async (id: string) => {
    try {
      setLoading(true)
      const roundData = await roundsService.getRound(id)
      setRound(roundData)
    } catch (error) {
      console.error('Failed to load round:', error)
      navigate(`/host/game/${gameId}`)
    } finally {
      setLoading(false)
    }
  }

  const loadGame = async (id: string) => {
    try {
      const gameData = await gamesService.getGame(id)
      setGame(gameData)
    } catch (error) {
      console.error('Failed to load game:', error)
      navigate(`/host/game/${gameId}`)
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

  const handleSaveRound = async (data: UpdateRoundData) => {
    if (!round) return

    try {
      setSaving(true)
      await roundsService.updateRound(round.id, data)
      await loadRound(round.id)
    } catch (error) {
      console.error('Failed to save round:', error)
      alert('Failed to save round. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRound = async () => {
    if (!round) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${round.title}"? This action cannot be undone.`
    )

    if (confirmed) {
      try {
        await roundsService.deleteRound(round.id)
        navigate(`/host/game/${gameId}`)
      } catch (error) {
        console.error('Failed to delete round:', error)
        alert('Failed to delete round. Please try again.')
      }
    }
  }

  const handleBackToGame = () => {
    navigate(`/host/game/${gameId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600 dark:text-slate-400">Loading round...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!round || !game) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600 dark:text-slate-400">Round not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToGame}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              ← Back to Game
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Edit Round</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {game.name} → {round.title}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              isActive={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
            >
              Round Details
            </TabsTrigger>
            <TabsTrigger
              isActive={activeTab === 'questions'}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent isActive={activeTab === 'details'} className="space-y-6">
            <RoundForm
              round={round}
              gameId={game.id}
              onSave={handleSaveRound}
              onCancel={handleBackToGame}
              isLoading={saving}
            />

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Irreversible actions for this round
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-100">Delete Round</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Once you delete a round, there is no going back. This will remove the round from the game.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteRound}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                  >
                    Delete Round
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent isActive={activeTab === 'questions'} className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-100">Questions</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage questions for this round
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="text-slate-600 dark:text-slate-400 mb-4">
                    <h3 className="text-lg font-medium mb-2">Questions Management</h3>
                    <p>This is a placeholder for the questions management interface.</p>
                    <p className="text-sm mt-2">Features coming soon:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• View all questions in this round</li>
                      <li>• Add/remove questions manually</li>
                      <li>• Auto-select from categories</li>
                      <li>• Preview questions</li>
                    </ul>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 inline-block">
                    <div className="text-slate-600 dark:text-slate-300">
                      <p className="font-medium">Current Round Stats</p>
                      <p className="text-sm mt-2">Categories: {round.categories.join(', ')}</p>
                      <p className="text-sm">Question Count: {round.question_count}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </div>
  )
}