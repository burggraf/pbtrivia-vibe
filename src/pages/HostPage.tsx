import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import ThemeToggle from '@/components/ThemeToggle'
import GameEditModal from '@/components/games/GameEditModal'
import GameStatusModal from '@/components/games/GameStatusModal'
import RoundEditModal from '@/components/games/RoundEditModal'
import QuestionsList from '@/components/games/QuestionsList'
import CategoryIcon, { getAvailableCategories } from '@/components/ui/CategoryIcon'
import { Info, Plus, Play, MoreVertical, Eye } from 'lucide-react'
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

  const handleSaveGame = async (data: UpdateGameData | CreateGameData & { rounds?: number; questionsPerRound?: number; categories?: string[] }) => {
    try {
      setSaving(true)
      if (isCreateMode) {
        // Create the game first
        const createdGame = await gamesService.createGame(data as CreateGameData)

        // If rounds > 0 and categories are specified, create rounds with questions
        if (data.rounds && data.rounds > 0 && data.categories && data.categories.length > 0) {
          try {
            const questionsPerRound = data.questionsPerRound || 10

            for (let i = 1; i <= data.rounds; i++) {
              // Create each round
              const roundData = {
                title: `Round ${i}`,
                question_count: questionsPerRound,
                categories: data.categories,
                sequence_number: i,
                game: createdGame.id
              }

              const createdRound = await roundsService.createRound(roundData as CreateRoundData)

              // Add random questions to the round
              try {
                const selectedQuestions = await questionsService.getRandomQuestionsFromCategories(
                  data.categories,
                  questionsPerRound,
                  pb.authStore.model?.id
                )

                if (selectedQuestions.length > 0) {
                  const questionsForRound = selectedQuestions.map((question, index) => ({
                    questionId: question.id,
                    sequence: index + 1,
                    categoryName: question.category
                  }))

                  await gameQuestionsService.createGameQuestionsBatch(createdRound.id, questionsForRound)
                  console.log(`Added ${selectedQuestions.length} questions to "Round ${i}"`)
                } else {
                  console.warn(`No available questions found for categories: ${data.categories.join(', ')}`)
                }
              } catch (questionError) {
                console.error(`Failed to add questions to Round ${i}:`, questionError)
              }
            }

            console.log(`Successfully created ${data.rounds} rounds with ${questionsPerRound} questions each for game "${createdGame.name}"`)
          } catch (roundError) {
            console.error('Failed to create rounds:', roundError)
          }
        } else if (data.rounds === 0) {
          console.log(`Created game "${createdGame.name}" with 0 rounds - rounds will be created manually later`)
        }
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

  const handleSaveRound = async (data: UpdateRoundData, shouldReplaceQuestions?: boolean) => {
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
        // If replacing questions, delete existing ones first
        if (shouldReplaceQuestions) {
          await gameQuestionsService.deleteGameQuestions(editingRound.id)
        }

        await roundsService.updateRound(editingRound.id, data)

        // If replacing questions, generate new ones
        if (shouldReplaceQuestions && data.categories && data.categories.length > 0 && data.question_count && data.question_count > 0) {
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

              await gameQuestionsService.createGameQuestionsBatch(editingRound.id, questionsForRound)
              console.log(`Replaced questions for round "${editingRound.title}" with ${selectedQuestions.length} new questions`)
            } else {
              console.warn(`No available questions found for categories: ${data.categories.join(', ')}`)
            }
          } catch (questionError) {
            console.error('Failed to add questions to round:', questionError)
            // Note: We don't throw here to allow the round update to succeed even if question assignment fails
          }
        }

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
      case 'setup': return 'bg-[#f5f5f5] dark:bg-slate-700 text-[#525252] dark:text-slate-300'
      case 'ready': return 'bg-[#ecfdf5] dark:bg-emerald-950/30 text-[#065f46] dark:text-emerald-400'
      case 'in-progress': return 'bg-[#eff6ff] dark:bg-blue-950/30 text-[#1e40af] dark:text-blue-400'
      case 'completed': return 'bg-[#f5f5f5] dark:bg-slate-700 text-[#737373] dark:text-slate-400'
      default: return 'bg-[#f5f5f5] dark:bg-slate-700 text-[#525252] dark:text-slate-300'
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 p-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#0a0a0a] dark:text-white">Host Dashboard</h1>
            <p className="text-[14px] text-[#737373] dark:text-slate-400">Manage your trivia games</p>
          </div>
          <div className="flex gap-2 items-center">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-[32px] px-3 text-[13px] font-medium border-[#e5e5e5] dark:border-slate-600 text-[#525252] dark:text-slate-300 hover:bg-[#fafafa] dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#e5e5e5] dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-slate-800">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#0a0a0a] dark:text-white">Games</h2>
              <Button
                onClick={handleCreateGame}
                className="h-[32px] px-3 text-[13px] font-medium bg-[#0a0a0a] dark:bg-white text-white dark:text-slate-900 hover:bg-[#262626] dark:hover:bg-slate-200 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New Game
              </Button>
            </div>
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-[14px] text-[#737373] dark:text-slate-500">Loading games...</div>
                </div>
              ) : games.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-[15px] font-medium text-[#0a0a0a] dark:text-white mb-1">No games found</p>
                    <p className="text-[13px] text-[#737373] dark:text-slate-500">Create your first game to get started</p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Table Headers */}
                  <div className="grid grid-cols-[2fr,1.2fr,3fr,1fr,1.5fr] gap-4 px-5 py-3 bg-[#fafafa] dark:bg-slate-800 border-b border-[#e5e5e5] dark:border-slate-800">
                    <div className="text-[12px] font-medium text-[#737373] dark:text-slate-500 uppercase tracking-wider">Name</div>
                    <div className="text-[12px] font-medium text-[#737373] dark:text-slate-500 uppercase tracking-wider">Status</div>
                    <div className="text-[12px] font-medium text-[#737373] dark:text-slate-500 uppercase tracking-wider">Details</div>
                    <div className="text-[12px] font-medium text-[#737373] dark:text-slate-500 uppercase tracking-wider">Rounds</div>
                    <div className="text-[12px] font-medium text-[#737373] dark:text-slate-500 uppercase tracking-wider text-right">Actions</div>
                  </div>

                  {/* Table Rows with Accordion */}
                  <Accordion type="multiple" className="divide-y divide-[#f5f5f5] dark:divide-slate-800">
                    {games.map((game) => (
                      <AccordionItem key={game.id} value={game.id} className="border-none">
                        <div className="hover:bg-[#fafafa] dark:hover:bg-slate-800 transition-colors">
                          <div className="grid grid-cols-[2fr,1.2fr,3fr,1fr,1.5fr] gap-4 items-center px-5 py-4">
                            {/* NAME Column */}
                            <AccordionTrigger className="hover:no-underline justify-start p-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-medium text-[14px] text-[#0a0a0a] dark:text-white">{game.name}</span>
                                <code className="px-2 py-0.5 bg-[#f5f5f5] dark:bg-slate-800 rounded text-[12px] font-mono text-[#525252] dark:text-slate-400 tracking-wider border border-transparent dark:border-slate-700">
                                  {game.code}
                                </code>
                              </div>
                            </AccordionTrigger>

                            {/* STATUS Column */}
                            <div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
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
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {formatGameStatus(game.status)}
                              </span>
                            </div>

                            {/* DETAILS Column */}
                            <div className="flex items-center gap-2 text-[13px] text-[#737373] dark:text-slate-500">
                              {[
                                game.startdate ? formatDateTime(new Date(game.startdate)) : null,
                                formatDuration(game.duration),
                                game.location
                              ]
                                .filter(Boolean)
                                .map((item, index, filtered) => (
                                  <span key={index} className="flex items-center gap-2">
                                    {item}
                                    {index < filtered.length - 1 && <span className="text-[#d4d4d4] dark:text-slate-700">·</span>}
                                  </span>
                                ))}
                            </div>

                            {/* ROUNDS Column */}
                            <div className="text-[13px] text-[#525252] dark:text-slate-400">
                              <span className="font-medium text-[#0a0a0a] dark:text-white">{rounds[game.id]?.length || 0}</span>
                              <span className="ml-1">rounds</span>
                            </div>

                            {/* ACTIONS Column */}
                            <div className="flex items-center justify-end gap-1.5">
                              {game.status === 'completed' ? (
                                <button
                                  className="w-8 h-8 flex items-center justify-center rounded-md border border-[#e5e5e5] dark:border-slate-700 text-[#737373] dark:text-slate-400 hover:bg-[#fafafa] dark:hover:bg-slate-800 hover:border-[#d4d4d4] dark:hover:border-slate-600 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // View results functionality
                                  }}
                                  title="View results"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : (game.status === 'ready' || game.status === 'in-progress') ? (
                                <button
                                  className="w-8 h-8 flex items-center justify-center rounded-md bg-[#0a0a0a] dark:bg-white text-white dark:text-slate-900 hover:bg-[#262626] dark:hover:bg-slate-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePlayGame(game.id)
                                  }}
                                  title="Start game controller"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              ) : null}
                              <button
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-[#e5e5e5] dark:border-slate-700 text-[#737373] dark:text-slate-400 hover:bg-[#fafafa] dark:hover:bg-slate-800 hover:border-[#d4d4d4] dark:hover:border-slate-600 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditGame(game)
                                }}
                                title="Edit game"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                              <button
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-[#e5e5e5] dark:border-slate-700 text-[#737373] dark:text-slate-400 hover:bg-[#fafafa] dark:hover:bg-slate-800 hover:border-[#d4d4d4] dark:hover:border-slate-600 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // More options functionality
                                }}
                                title="More options"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      <AccordionContent className="px-5 pb-6 pt-2">
                        <div className="bg-[#fafafa] dark:bg-slate-800 border border-[#e5e5e5] dark:border-slate-700 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5] dark:border-slate-700">
                            <h3 className="text-[14px] font-semibold text-[#0a0a0a] dark:text-white">Rounds</h3>
                            <Button
                              onClick={() => handleAddRound(game.id)}
                              className="h-[28px] px-2.5 text-[12px] font-medium bg-white dark:bg-slate-700 border border-[#e5e5e5] dark:border-slate-600 text-[#525252] dark:text-slate-400 hover:bg-[#fafafa] dark:hover:bg-slate-600 flex items-center gap-1.5"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Round
                            </Button>
                          </div>
                          {rounds[game.id] && rounds[game.id].length > 0 ? (
                            <Accordion type="multiple" className="divide-y divide-[#e5e5e5] dark:divide-slate-700">
                              {rounds[game.id].map((round) => (
                                <AccordionItem key={round.id} value={round.id} className="border-none">
                                  <div className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center px-4 py-3">
                                      <AccordionTrigger className="hover:no-underline flex-1 justify-start p-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className="font-medium text-[13px] text-[#0a0a0a] dark:text-white">{round.title}</span>
                                          <span className="text-[12px] text-[#737373] dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#e5e5e5] dark:border-slate-700">
                                            {round.question_count} questions
                                          </span>
                                          <div className="flex gap-1">
                                            {getAvailableCategories().map((category) => {
                                              const isUsed = round.categories && round.categories.includes(category)
                                              return (
                                                <div key={category} title={category}>
                                                  <CategoryIcon
                                                    category={category}
                                                    size={14}
                                                    className={`${isUsed
                                                      ? 'text-[#525252] dark:text-slate-300'
                                                      : 'text-[#d4d4d4] dark:text-slate-600'
                                                    }`}
                                                  />
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      </AccordionTrigger>
                                      <div className="flex items-center gap-2 ml-4">
                                        <span className="text-[12px] text-[#737373] dark:text-slate-500">
                                          Round {round.sequence_number}
                                        </span>
                                        <button
                                          className="w-7 h-7 flex items-center justify-center rounded-md border border-[#e5e5e5] dark:border-slate-700 text-[#737373] dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-[#d4d4d4] dark:hover:border-slate-600 hover:text-[#0a0a0a] dark:hover:text-white transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEditRound(round)
                                          }}
                                          title="Edit round"
                                        >
                                          <Info className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <AccordionContent className="px-4 pb-4">
                                    <div className="bg-white dark:bg-slate-900 border border-[#e5e5e5] dark:border-slate-700 rounded-lg overflow-hidden mt-2">
                                      <QuestionsList roundId={round.id} roundTitle={round.title} />
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <p className="text-[13px] text-[#737373] dark:text-slate-500">No rounds yet</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                </div>
              )}
            </div>
          </div>

        
  
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