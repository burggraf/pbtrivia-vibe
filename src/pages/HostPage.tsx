import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import GameEditModal from '@/components/games/GameEditModal'
import GameStatusModal from '@/components/games/GameStatusModal'
import RoundEditModal from '@/components/games/RoundEditModal'
import QuestionsList from '@/components/games/QuestionsList'
import CategoryIcon, { getAvailableCategories } from '@/components/ui/CategoryIcon'
import { Info, Plus, Play } from 'lucide-react'
import pb from '@/lib/pocketbase'
import { gamesService } from '@/lib/games'
import { roundsService } from '@/lib/rounds'
import { questionsService } from '@/lib/questions'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { Game, CreateGameData, UpdateGameData } from '@/types/games'
import { Round, UpdateRoundData, CreateRoundData } from '@/types/rounds'
import { formatDateTime } from '@/lib/utils'

export default function HostPage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [rounds, setRounds] = useState<{ [key: string]: Round[] }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [editingRound, setEditingRound] = useState<Round | null>(null)
  const [gameModalOpen, setGameModalOpen] = useState(false)
  const [roundModalOpen, setRoundModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusGame, setStatusGame] = useState<Game | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isRoundCreateMode, setIsRoundCreateMode] = useState(false)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  
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
    setIsCreateMode(true)
    setEditingGame(null)
    setGameModalOpen(true)
  }

  const handleEditGame = (game: Game) => {
    setIsCreateMode(false)
    setEditingGame(game)
    setGameModalOpen(true)
  }

  const handleEditRound = (round: Round) => {
    setEditingRound(round)
    setIsRoundCreateMode(false)
    setRoundModalOpen(true)
  }

  const handleAddRound = async (gameId: string) => {
    try {
      const nextSequenceNumber = await roundsService.getNextSequenceNumber(gameId)
      setCurrentGameId(gameId)
      setIsRoundCreateMode(true)
      setEditingRound({
        id: '',
        title: '',
        question_count: 10,
        categories: [],
        sequence_number: nextSequenceNumber,
        game: gameId,
        host: pb.authStore.model?.id || '',
        created: '',
        updated: ''
      })
      setRoundModalOpen(true)
    } catch (error) {
      console.error('Failed to get next sequence number:', error)
    }
  }

  const handleSaveGame = async (data: UpdateGameData | CreateGameData) => {
    try {
      setSaving(true)
      if (isCreateMode) {
        await gamesService.createGame(data as CreateGameData)
      } else if (editingGame) {
        await gamesService.updateGame(editingGame.id, data as UpdateGameData)
      }
      await fetchGames()
      setGameModalOpen(false)
      setIsCreateMode(false)
    } catch (error) {
      console.error('Failed to save game:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGame = async () => {
    if (editingGame) {
      try {
        setSaving(true)

        // First, get all rounds for this game
        const gameRounds = await roundsService.getRounds(editingGame.id)

        // Delete all associated game_questions and rounds first
        for (const round of gameRounds) {
          // Delete game_questions for this round first
          await gameQuestionsService.deleteGameQuestions(round.id)
          // Then delete the round itself
          await roundsService.deleteRound(round.id)
        }

        // Now delete the game
        await gamesService.deleteGame(editingGame.id)

        await fetchGames()
      } catch (error) {
        console.error('Failed to delete game:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSaveRound = async (data: UpdateRoundData) => {
    try {
      setSaving(true)
      if (isRoundCreateMode && currentGameId) {
        // Create the round first
        const createdRound = await roundsService.createRound({
          ...data,
          game: currentGameId
        } as CreateRoundData)

        // If categories and question count are specified, add questions to the round
        if (data.categories && data.categories.length > 0 && data.question_count && data.question_count > 0) {
          try {
            // Get random questions from the selected categories that haven't been used by this host
            const selectedQuestions = await questionsService.getRandomQuestionsFromCategories(
              data.categories,
              data.question_count,
              pb.authStore.model?.id
            )

            if (selectedQuestions.length > 0) {
              // Create game_questions entries
              const questionsForRound = selectedQuestions.map((question, index) => ({
                questionId: question.id,
                sequence: index + 1,
                categoryName: question.category
              }))

              await gameQuestionsService.createGameQuestionsBatch(createdRound.id, questionsForRound)
              console.log(`Added ${selectedQuestions.length} questions to round "${createdRound.title}"`)
            } else {
              console.warn(`No available questions found for categories: ${data.categories.join(', ')}`)
            }
          } catch (questionError) {
            console.error('Failed to add questions to round:', questionError)
            // Note: We don't throw here to allow the round creation to succeed even if question assignment fails
          }
        }

        await fetchGames()
      } else if (editingRound && !isRoundCreateMode) {
        await roundsService.updateRound(editingRound.id, data)
        await fetchGames()
      }
      setRoundModalOpen(false)
      setIsRoundCreateMode(false)
      setCurrentGameId(null)
    } catch (error) {
      console.error('Failed to save round:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRound = async () => {
    if (editingRound) {
      try {
        setSaving(true)

        // First, delete all game_questions associated with this round
        await gameQuestionsService.deleteGameQuestions(editingRound.id)

        // Then delete the round itself
        await roundsService.deleteRound(editingRound.id)

        await fetchGames()
      } catch (error) {
        console.error('Failed to delete round:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleStatusClick = (game: Game) => {
    if (game.status === 'setup' || game.status === 'ready') {
      if (rounds[game.id]?.length > 0) {
        setStatusGame(game)
        setStatusModalOpen(true)
      }
    }
  }

  const handleStatusChange = async (newStatus: 'setup' | 'ready') => {
    if (statusGame) {
      try {
        setSaving(true)
        await gamesService.updateGame(statusGame.id, { status: newStatus })
        await fetchGames()
        setStatusModalOpen(false)
        setStatusGame(null)
      } catch (error) {
        console.error('Failed to update game status:', error)
      } finally {
        setSaving(false)
      }
    }
  }

  const handlePlayGame = async (gameId: string) => {
    try {
      console.log('🎮 Starting game:', gameId)

      // Initialize game data with starting state
      await pb.collection('games').update(gameId, {
        data: {
          state: 'game-start',
          name: games.find(g => g.id === gameId)?.name || 'Trivia Game',
          currentRound: 0
        }
      })

      console.log('✅ Game initialized with starting state')
      navigate(`/controller/${gameId}`)
    } catch (error) {
      console.error('❌ Failed to start game:', error)
    }
  }

  
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'setup': return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
      case 'ready': return 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
      case 'in-progress': return 'text-foreground'
      case 'completed': return 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80'
      default: return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
    }
  }

  const formatGameStatus = (status: string) => {
    return status.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
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
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-800 dark:text-slate-100">My Games</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateGame}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  New Game
                </Button>
              </div>
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
                      <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <AccordionTrigger className="hover:no-underline flex-1 justify-start p-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-slate-800 dark:text-slate-100">{game.name}</span>
                            <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-800 dark:text-slate-100">
                              {game.code}
                            </code>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                (game.status === 'setup' || game.status === 'ready') && rounds[game.id]?.length > 0
                                  ? 'cursor-pointer hover:opacity-80'
                                  : 'cursor-not-allowed opacity-50'
                              } ${getStatusBadgeClasses(game.status)}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusClick(game)
                              }}
                              title={
                                (game.status === 'setup' || game.status === 'ready') && rounds[game.id]?.length === 0
                                  ? "Add rounds before changing status"
                                  : game.status !== 'setup' && game.status !== 'ready'
                                  ? "Status cannot be changed"
                                  : "Click to change game status"
                              }
                            >
                              {formatGameStatus(game.status)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2">
                          {(game.status === 'ready' || game.status === 'in-progress') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 h-6 px-2 text-xs border-green-600 text-green-700 dark:border-green-400 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlayGame(game.id)
                              }}
                              title="Start game controller"
                            >
                              <Play className="h-3 w-3" />
                              Play
                            </Button>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            {[
                              game.startdate ? formatDateTime(new Date(game.startdate)) : null,
                              formatDuration(game.duration),
                              game.location
                            ]
                              .filter(Boolean)
                              .map((item, index, filtered) => (
                                <span key={index}>
                                  {item}
                                  {index < filtered.length - 1 && <span className="mx-2">•</span>}
                                </span>
                              ))}
                            <div
                              className="h-8 w-8 p-0 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditGame(game)
                              }}
                            >
                              <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <AccordionContent>
                        <div className="border-l-4 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 -ml-4 pl-4 rounded-r-lg">
                          <div className="mb-4 pt-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Rounds</h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRound(game.id)}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                <Plus className="h-4 w-4" />
                                Add Round
                              </Button>
                            </div>
                          </div>
                          {rounds[game.id] && rounds[game.id].length > 0 ? (
                            <Accordion type="multiple" className="space-y-2">
                              {rounds[game.id].map((round) => (
                                <AccordionItem key={round.id} value={round.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg">
                                  <AccordionTrigger className="hover:no-underline px-2">
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                          <span className="font-medium text-slate-700 dark:text-slate-200">{round.title}</span>
                                          <Badge variant="outline">
                                            {round.question_count} questions
                                          </Badge>
                                          <div className="flex gap-1">
                                              {getAvailableCategories().map((category) => {
                                                const isUsed = round.categories && round.categories.includes(category)
                                                return (
                                                  <div key={category} title={category}>
                                                    <CategoryIcon
                                                      category={category}
                                                      size={16}
                                                      className={`${isUsed
                                                        ? 'text-slate-700 dark:text-slate-300'
                                                        : 'text-slate-300 dark:text-slate-600'
                                                      }`}
                                                    />
                                                  </div>
                                                )
                                              })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-slate-500 dark:text-slate-400">
                                            Round {round.sequence_number}
                                          </span>
                                          <div
                                            className="h-8 w-8 p-0 flex items-center justify-center rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditRound(round)
                                            }}
                                          >
                                            <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                          </div>
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="border-l-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 -ml-2 pl-2 mr-2 rounded-r-lg">
                                      <QuestionsList roundId={round.id} roundTitle={round.title} />
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

        
  
        {/* Modals */}
        <GameEditModal
          game={isCreateMode ? null : editingGame}
          isOpen={gameModalOpen}
          onClose={() => {
            setGameModalOpen(false)
            setIsCreateMode(false)
          }}
          onSave={handleSaveGame}
          onDelete={!isCreateMode ? handleDeleteGame : undefined}
          isLoading={saving}
        />

        <RoundEditModal
          round={editingRound}
          isOpen={roundModalOpen}
          onClose={() => {
            setRoundModalOpen(false)
            setIsRoundCreateMode(false)
            setCurrentGameId(null)
          }}
          onSave={handleSaveRound}
          onDelete={!isRoundCreateMode ? handleDeleteRound : undefined}
          isLoading={saving}
          isCreateMode={isRoundCreateMode}
        />

        <GameStatusModal
          game={statusGame}
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false)
            setStatusGame(null)
          }}
          onSave={handleStatusChange}
          isLoading={saving}
        />
      </div>
    </div>
  )
}