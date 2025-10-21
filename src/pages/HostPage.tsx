import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'
import { gamesService } from '@/lib/games'
import { Game, CreateGameData, UpdateGameData } from '@/types/games'
import GameForm from '@/components/games/GameForm'
import GamesList from '@/components/games/GamesList'
import GameRounds from '@/components/rounds/GameRounds'

export default function HostPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'rounds'>('list')
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const fetchGames = async () => {
    try {
      setLoading(true)
      const gamesData = await gamesService.getGames()
      setGames(gamesData)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCreateGame = () => {
    setCurrentView('create')
    setEditingGame(null)
  }

  const handleEditGame = (game: Game) => {
    setCurrentView('edit')
    setEditingGame(game)
  }

  const handleSaveGame = async (data: CreateGameData | UpdateGameData) => {
    try {
      setSaving(true)

      if (editingGame) {
        await gamesService.updateGame(editingGame.id, data as UpdateGameData)
      } else {
        await gamesService.createGame(data as CreateGameData)
      }

      await fetchGames()
      setCurrentView('list')
      setEditingGame(null)
    } catch (error) {
      console.error('Failed to save game:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGame = async (game: Game) => {
    try {
      await gamesService.deleteGame(game.id)
      await fetchGames()
    } catch (error) {
      console.error('Failed to delete game:', error)
    }
  }

  const handleCancel = () => {
    setCurrentView('list')
    setEditingGame(null)
    setSelectedGame(null)
  }

  const handleManageRounds = (game: Game) => {
    setCurrentView('rounds')
    setSelectedGame(game)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Host Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your trivia games here</p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            {currentView === 'list' && (
              <Button
                onClick={handleCreateGame}
                className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
              >
                Create New Game
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {currentView === 'list' && <GamesList games={games} onEdit={handleEditGame} onDelete={handleDeleteGame} onManageRounds={handleManageRounds} isLoading={loading} />}

        {(currentView === 'create' || currentView === 'edit') && (
          <GameForm
            game={editingGame || undefined}
            onSave={handleSaveGame}
            onCancel={handleCancel}
            isLoading={saving}
          />
        )}

        {currentView === 'rounds' && selectedGame && (
          <GameRounds
            gameId={selectedGame.id}
            onBack={handleCancel}
          />
        )}
      </div>
    </div>
  )
}