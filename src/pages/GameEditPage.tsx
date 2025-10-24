import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'
import { gamesService } from '@/lib/games'
import { Game, UpdateGameData } from '@/types/games'
import GameForm from '@/components/games/GameForm'
import GameRounds from '@/components/rounds/GameRounds'

export default function GameEditPage() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (gameId) {
      loadGame(gameId)
    }
  }, [gameId])

  const loadGame = async (id: string) => {
    try {
      setLoading(true)
      const gameData = await gamesService.getGame(id)
      setGame(gameData)
    } catch (error) {
      console.error('Failed to load game:', error)
      navigate('/host')
    } finally {
      setLoading(false)
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

  const handleSaveGame = async (data: UpdateGameData) => {
    if (!game) return

    try {
      setSaving(true)
      await gamesService.updateGame(game.id, data)
      await loadGame(game.id)
    } catch (error) {
      console.error('Failed to save game:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!game) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${game.name}"? This action cannot be undone and will also delete all rounds associated with this game.`
    )

    if (confirmed) {
      try {
        await gamesService.deleteGame(game.id)
        navigate('/host')
      } catch (error) {
        console.error('Failed to delete game:', error)
        alert('Failed to delete game. Please try again.')
      }
    }
  }

  const handleBackToGames = () => {
    navigate('/host')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600 dark:text-slate-400">Loading game...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600 dark:text-slate-400">Game not found</div>
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
              onClick={handleBackToGames}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              ← Back to Games
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Edit Game</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{game.name}</p>
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
              Game Details
            </TabsTrigger>
            <TabsTrigger
              isActive={activeTab === 'rounds'}
              onClick={() => setActiveTab('rounds')}
            >
              Rounds
            </TabsTrigger>
          </TabsList>

          <TabsContent isActive={activeTab === 'details'} className="space-y-6">
            <GameForm
              game={game}
              onSave={handleSaveGame}
              onCancel={handleBackToGames}
              isLoading={saving}
            />

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Irreversible actions for this game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-slate-100">Delete Game</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Once you delete a game, there is no going back. This will also delete all rounds associated with this game.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteGame}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                  >
                    Delete Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent isActive={activeTab === 'rounds'}>
            <GameRounds gameId={game.id} />
          </TabsContent>
        </div>
      </div>
    </div>
  )
}