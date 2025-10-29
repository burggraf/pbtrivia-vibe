import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import TeamDisplay from '@/components/games/TeamDisplay'
import GameStateDisplay from '@/components/games/GameStateDisplay'
import { gamesService } from '@/lib/games'
import { roundsService } from '@/lib/rounds'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { questionsService } from '@/lib/questions'
import { getCorrectAnswerLabel } from '@/lib/answerShuffler'
import pb from '@/lib/pocketbase'
import { Game } from '@/types/games'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

interface GameData {
  state: GameState
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
  }
  question?: {
    id: string
    question_number: number
    category: string
    question: string
    difficulty: string
    a: string
    b: string
    c: string
    d: string
    correct_answer?: string
    submitted_answer?: string
  }
}

const GAME_STATES: GameState[] = [
  'game-start',
  'round-start',
  'round-play',
  'round-end',
  'game-end',
  'thanks',
  'return-to-lobby'
]

export default function ControllerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rounds, setRounds] = useState<any[]>([])
  const [gameData, setGameData] = useState<GameData | null>(null)

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleBackToHost = () => {
    navigate('/host')
  }

  // Fetch game data
  const fetchGameData = async () => {
    if (!id) return

    try {
      // Get game data (includes scoreboard)
      const gameData = await gamesService.getGame(id)
      setGame(gameData)

      // Get rounds data
      const roundsData = await roundsService.getRounds(id)
      setRounds(roundsData.sort((a, b) => a.sequence_number - b.sequence_number))

      // Parse game data if exists
      if (gameData.data) {
        try {
          const parsedData = typeof gameData.data === 'string' ? JSON.parse(gameData.data) : gameData.data
          setGameData(parsedData)
        } catch (error) {
          console.error('Failed to parse game data:', error)
          setGameData(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch game data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update game data
  const updateGameData = async (newGameData: Partial<GameData>) => {
    if (!id) return

    try {
      const updatedData = { ...gameData, ...newGameData }
      await pb.collection('games').update(id, {
        data: JSON.stringify(updatedData)
      })
      setGameData(updatedData as GameData)
    } catch (error) {
      console.error('Failed to update game data:', error)
    }
  }

  const updateGameDataClean = async (cleanGameData: GameData) => {
    if (!id) return

    try {
      await pb.collection('games').update(id, {
        data: JSON.stringify(cleanGameData)
      })
      setGameData(cleanGameData)
    } catch (error) {
      console.error('Failed to update game data:', error)
    }
  }

  // Start game functionality
  const handleStartGame = async () => {
    if (!game) return

    try {
      // Update game status to in-progress
      await gamesService.updateGame(game.id, { status: 'in-progress' })

      // Initialize game data with clean state
      await updateGameData({
        state: 'game-start'
      })
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  // Navigate to next state - CLEAN STATE MACHINE
  const handleNextState = async () => {
    if (!gameData) return

    console.log(`🎮 State transition from: ${gameData.state}`)

    // Helper to get current round index from gameData
    const getCurrentRoundIndex = (): number => {
      if (!gameData.round) return 0
      // Find the round by round_number
      return rounds.findIndex(r => r.sequence_number === gameData.round?.round_number)
    }

    // Helper to create round object for a given round index
    const createRoundObject = (roundIndex: number) => {
      const round = rounds[roundIndex]
      if (!round) return undefined
      return {
        round_number: round.sequence_number,
        rounds: rounds.length,
        question_count: round.question_count,
        title: round.title
      }
    }

    // Handle question progression within round-play
    if (gameData.state === 'round-play') {
      const currentRoundIndex = getCurrentRoundIndex()
      const currentRound = rounds[currentRoundIndex]
      if (!currentRound) return

      const isAnswerRevealed = !!gameData.question?.correct_answer

      console.log('🔍 DEBUG: round-play logic', {
        questionNumber: gameData.question?.question_number,
        hasCorrectAnswer: !!gameData.question?.correct_answer,
        isAnswerRevealed,
        questionText: gameData.question?.question?.substring(0, 30)
      })

      if (!isAnswerRevealed) {
        // Reveal answer
        console.log('🔍 DEBUG: Revealing answer')
        if (gameData.question) {
          const correctAnswerLabel = getCorrectAnswerLabel(gameData.question.id)
          await updateGameDataClean({
            state: 'round-play',
            round: gameData.round,
            question: {
              ...gameData.question,
              correct_answer: correctAnswerLabel
            }
          })
        }
        return
      } else {
        // Move to next question or end round
        const currentQuestionNumber = gameData.question?.question_number || 1
        const nextQuestionNumber = currentQuestionNumber + 1

        console.log('🔍 DEBUG: Moving to next question', {
          currentQuestionNumber,
          nextQuestionNumber,
          questionCount: currentRound.question_count
        })

        if (nextQuestionNumber <= currentRound.question_count) {
          // Load next question
          console.log('🔍 DEBUG: Loading next question', nextQuestionNumber)
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          const nextQuestionIndex = nextQuestionNumber - 1
          if (gameQuestions.length > nextQuestionIndex) {
            const nextQuestion = await questionsService.getQuestionById(gameQuestions[nextQuestionIndex].question)
            await updateGameDataClean({
              state: 'round-play',
              round: gameData.round,
              question: {
                id: gameQuestions[nextQuestionIndex].id,
                question_number: nextQuestionNumber,
                category: nextQuestion.category,
                question: nextQuestion.question,
                difficulty: nextQuestion.difficulty,
                a: nextQuestion.answer_a,
                b: nextQuestion.answer_b,
                c: nextQuestion.answer_c,
                d: nextQuestion.answer_d
              }
            })
            console.log('🔍 DEBUG: Next question loaded successfully')
          }
          return
        } else {
          // End of round
          console.log('🔍 DEBUG: Ending round')
          await updateGameDataClean({
            state: 'round-end',
            round: gameData.round
          })
          return
        }
      }
    }

    // Handle state transitions
    switch (gameData.state) {
      case 'game-start':
        // Move to first round
        const firstRound = createRoundObject(0)
        if (firstRound) {
          await updateGameDataClean({
            state: 'round-start',
            round: firstRound
          })
          // Update game status to in-progress
          if (game) {
            await gamesService.updateGame(game.id, { status: 'in-progress' })
            console.log('🎮 Game status updated to in-progress')
          }
        }
        break

      case 'round-start':
        // Load first question
        const currentRoundIndex = getCurrentRoundIndex()
        const currentRound = rounds[currentRoundIndex]
        if (currentRound) {
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          if (gameQuestions.length > 0) {
            const firstQuestion = await questionsService.getQuestionById(gameQuestions[0].question)
            await updateGameDataClean({
              state: 'round-play',
              round: gameData.round,
              question: {
                id: gameQuestions[0].id,
                question_number: 1,
                category: firstQuestion.category,
                question: firstQuestion.question,
                difficulty: firstQuestion.difficulty,
                a: firstQuestion.answer_a,
                b: firstQuestion.answer_b,
                c: firstQuestion.answer_c,
                d: firstQuestion.answer_d
              }
            })
          }
        }
        break

      case 'round-end':
        // Check if there are more rounds
        const nextRoundIndex = getCurrentRoundIndex() + 1
        if (nextRoundIndex < rounds.length) {
          // Start next round
          const nextRound = createRoundObject(nextRoundIndex)
          if (nextRound) {
            await updateGameDataClean({
              state: 'round-start',
              round: nextRound
            })
          }
        } else {
          // All rounds completed, go to game-end
          await updateGameDataClean({
            state: 'game-end'
          })
          // Update game status to completed
          if (game) {
            await gamesService.updateGame(game.id, { status: 'completed' })
            console.log('🏁 Game status updated to completed')
          }
        }
        break

      case 'game-end':
        await updateGameDataClean({
          state: 'thanks'
        })
        break

      case 'thanks':
        await updateGameDataClean({
          state: 'return-to-lobby'
        })
        break

      case 'return-to-lobby':
        navigate('/host')
        break

      default:
        console.error(`Unknown game state: ${gameData.state}`)
    }
  }

  // Navigate to previous state
  const handlePreviousState = async () => {
    if (!gameData) return

    // Helper to get current round index from gameData
    const getCurrentRoundIndex = (): number => {
      if (!gameData.round) return 0
      return rounds.findIndex(r => r.sequence_number === gameData.round?.round_number)
    }

    // Handle special question progression within round-play state
    if (gameData.state === 'round-play') {
      const isAnswerRevealed = !!gameData.question?.correct_answer

      // If showing answer, hide it and go back to question
      if (isAnswerRevealed) {
        // Remove correct_answer when going back to question
        if (gameData.question) {
          const questionWithoutAnswer = { ...gameData.question }
          delete questionWithoutAnswer.correct_answer

          await updateGameDataClean({
            state: 'round-play',
            round: gameData.round,
            question: questionWithoutAnswer
          })
        }
        return
      } else {
        // Go to previous question if not on first question
        const prevQuestionNumber = (gameData.question?.question_number || 1) - 1
        if (prevQuestionNumber >= 1) {
          const currentRoundIndex = getCurrentRoundIndex()
          const currentRound = rounds[currentRoundIndex]

          if (currentRound) {
            // Fetch previous question
            const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
            if (gameQuestions.length >= prevQuestionNumber) {
              const prevQuestion = await questionsService.getQuestionById(gameQuestions[prevQuestionNumber - 1].question)

              await updateGameDataClean({
                state: 'round-play',
                round: gameData.round,
                question: {
                  id: gameQuestions[prevQuestionNumber - 1].id,
                  question_number: prevQuestionNumber,
                  category: prevQuestion.category,
                  question: prevQuestion.question,
                  difficulty: prevQuestion.difficulty,
                  a: prevQuestion.answer_a,
                  b: prevQuestion.answer_b,
                  c: prevQuestion.answer_c,
                  d: prevQuestion.answer_d
                }
              })
            }
          }
          return
        }
      }
    }

    const currentStateIndex = GAME_STATES.indexOf(gameData.state)
    const previousStateIndex = currentStateIndex - 1

    if (previousStateIndex >= 0) {
      const previousState = GAME_STATES[previousStateIndex]
      await updateGameData({ state: previousState })
    }
  }

  // Set up realtime subscription for game changes
  useEffect(() => {
    if (!id) return

    // Initial data fetch
    fetchGameData()

    // Subscribe to real-time updates for games (includes scoreboard changes)
    const unsubscribeGame = pb.collection('games').subscribe('*', (e) => {
      if (e.action === 'update' && e.record.id === id) {
        const updatedGame = e.record as unknown as Game
        setGame(updatedGame)

        // Parse updated game data
        if (updatedGame.data) {
          try {
            const parsedData = typeof updatedGame.data === 'string' ? JSON.parse(updatedGame.data) : updatedGame.data
            setGameData(parsedData)
          } catch (error) {
            console.error('Failed to parse game data:', error)
          }
        }
      }
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeGame.then((unsub) => unsub())
    }
  }, [id, navigate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Game Controller</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Game ID: {id} {game && `- ${game.name}`}
            </p>
            {game && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  game.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  game.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  game.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {game.status.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleBackToHost}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Back to Host
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Controller Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Game Controller
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your game from here. Teams and players are displayed in real-time.
          </p>
        </div>

        {/* Game State Display */}
        {gameData && game && (
          <GameStateDisplay
            gameData={gameData}
            rounds={rounds}
            game={game}
          />
        )}

        {/* Teams and Players Section */}
        {(!gameData || gameData.state === 'game-start') && (
          <TeamDisplay
            scoreboard={game?.scoreboard}
            isLoading={isLoading}
            className="mb-8"
          />
        )}

        {/* Control Buttons */}
        {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && (
          <div className="text-center">
            <div className="mb-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Game State: <span className="font-medium">{gameData?.state || 'Not Started'}</span>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              {game?.status === 'ready' && (
                <Button
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                  onClick={handleStartGame}
                >
                  Start Game
                </Button>
              )}
              {gameData && (
                <>
                  <Button
                    variant="outline"
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={handlePreviousState}
                    disabled={GAME_STATES.indexOf(gameData.state) === 0}
                  >
                    {gameData.state === 'round-play' && !!gameData.question?.correct_answer
                      ? '← Question'
                      : gameData.state === 'round-play' && !gameData.question?.correct_answer
                      ? `← Q${Math.max(1, (gameData.question?.question_number || 1) - 1)}`
                      : '← Back'}
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                    onClick={handleNextState}
                    disabled={gameData.state === 'return-to-lobby'}
                  >
                    {(() => {
                      const isAnswerRevealed = !!gameData.question?.correct_answer
                      return gameData.state === 'round-play' && !isAnswerRevealed
                        ? 'Reveal Answer'
                        : gameData.state === 'round-play' && isAnswerRevealed
                        ? `Next Question →`
                        : gameData.state === 'game-end'
                        ? 'Thanks →'
                        : gameData.state === 'thanks'
                        ? 'Return to Lobby →'
                        : 'Next →'
                    })()}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Debug State Display */}
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Debug: Current Game State
          </h3>
          <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-auto">
            {JSON.stringify(gameData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}