import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import GameEditModal from '@/components/games/GameEditModal'
import RoundEditModal from '@/components/games/RoundEditModal'
import QuestionsList from '@/components/games/QuestionsList'
import GameForm from '@/components/games/GameForm'
import { Info } from 'lucide-react'
import pb from '@/lib/pocketbase'
import { gamesService } from '@/lib/games'
import { roundsService } from '@/lib/rounds'
import { Game, CreateGameData, UpdateGameData } from '@/types/games'
import { Round, UpdateRoundData } from '@/types/rounds'
import { formatDateTime } from '@/lib/utils'

export default function HostPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [rounds, setRounds] = useState<{ [key: string]: Round[] }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list')
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [editingRound, setEditingRound] = useState<Round | null>(null)
  const [gameModalOpen, setGameModalOpen] = useState(false)
  const [roundModalOpen, setRoundModalOpen] = useState(false)
  
  const fetchGames = async () => {
    try {
      setLoading(true)
      const gamesData = await gamesService.getGames()
      setGames(gamesData)

      // Fetch rounds for each game
      const roundsData: { [key: string]: Round[] } = {}
      for (const game of gamesData) {
        try {
          const gameRounds = await roundsService.getRounds(game.id)
          roundsData[game.id] = gameRounds.sort((a, b) => a.sequence_number - b.sequence_number)
        } catch (error) {
          console.error('Failed to load rounds for game:', game.id)
          roundsData[game.id] = []
        }
      }
      setRounds(roundsData)
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
    setEditingGame(game)
    setGameModalOpen(true)
  }

  const handleEditRound = (round: Round) => {
    setEditingRound(round)
    setRoundModalOpen(true)
  }

  const handleSaveGame = async (data: UpdateGameData) => {
    try {
      setSaving(true)
      if (editingGame) {
        await gamesService.updateGame(editingGame.id, data)
        await fetchGames()
      }
    } catch (error) {
      console.error('Failed to save game:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRound = async (data: UpdateRoundData) => {
    try {
      setSaving(true)
      if (editingRound) {
        await roundsService.updateRound(editingRound.id, data)
        await fetchGames()
      }
    } catch (error) {
      console.error('Failed to save round:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNewGame = async (data: CreateGameData | UpdateGameData) => {
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

  
  const handleCancel = () => {
    setCurrentView('list')
    setEditingGame(null)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'setting-up': return 'secondary'
      case 'ready': return 'default'
      case 'in-progress': return 'outline'
      case 'completed': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatGameStatus = (status: string) => {
    return status.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
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

        {currentView === 'list' && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">My Games</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Manage your trivia games and rounds</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Loading games...</div>
                </div>
              ) : games.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">No games found</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Create your first game to get started</p>
                  </div>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {games.map((game) => (
                    <AccordionItem key={game.id} value={game.id} className="border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditGame(game)
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-800 dark:text-slate-100">{game.name}</span>
                              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-800 dark:text-slate-100">
                                {game.code}
                              </code>
                              <Badge variant={getStatusBadgeVariant(game.status)}>
                                {formatGameStatus(game.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <span>{game.startdate ? formatDateTime(new Date(game.startdate)) : 'Not set'}</span>
                              <span>•</span>
                              <span>{formatDuration(game.duration)}</span>
                              <span>•</span>
                              <span>{game.location || 'No location'}</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pl-12">
                        {rounds[game.id] && rounds[game.id].length > 0 ? (
                          <Accordion type="multiple" className="space-y-2">
                            {rounds[game.id].map((round) => (
                              <AccordionItem key={round.id} value={round.id} className="border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 pr-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditRound(round)
                                    }}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full mr-4">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{round.title}</span>
                                        <Badge variant="outline">
                                          {round.question_count} questions
                                        </Badge>
                                        {round.categories && round.categories.length > 0 && (
                                          <div className="flex gap-1">
                                            {round.categories.slice(0, 2).map((category, index) => (
                                              <Badge key={index} variant="secondary" className="text-xs">
                                                {category}
                                              </Badge>
                                            ))}
                                            {round.categories.length > 2 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{round.categories.length - 2}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Round {round.sequence_number}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                </div>
                                <AccordionContent className="pl-12">
                                  <QuestionsList roundTitle={round.title} />
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No rounds created yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => navigate(`/host/game/${game.id}`)}
                            >
                              Manage Rounds
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}

        {currentView === 'create' && (
          <GameForm
            game={editingGame || undefined}
            onSave={handleSaveNewGame}
            onCancel={handleCancel}
            isLoading={saving}
          />
        )}

        {/* Modals */}
        <GameEditModal
          game={editingGame}
          isOpen={gameModalOpen}
          onClose={() => setGameModalOpen(false)}
          onSave={handleSaveGame}
          isLoading={saving}
        />

        <RoundEditModal
          round={editingRound}
          isOpen={roundModalOpen}
          onClose={() => setRoundModalOpen(false)}
          onSave={handleSaveRound}
          isLoading={saving}
        />
      </div>
    </div>
  )
}