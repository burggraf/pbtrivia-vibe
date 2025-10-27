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
  name?: string
  rounds?: number
  currentRound?: number
  currentQuestion?: number
  questions?: number
  categories?: string[]
  showAnswer?: boolean
  gameName?: string
  totalRounds?: number
  roundScores?: { [teamId: string]: number }
  playerTeam?: string
  submittedAnswers?: { [key: string]: string }
  // New round-play structure
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

      // Initialize game data
      await updateGameData({
        state: 'game-start',
        name: game.name,
        rounds: rounds.length,
        currentRound: 0 // Initialize to first round
      })
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  // Navigate to next state
  const handleNextState = async () => {
    if (!gameData) return

    // Handle special question progression within round-play state
    if (gameData.state === 'round-play') {
      const currentRoundIndex = gameData.currentRound || 0
      const currentRound = rounds[currentRoundIndex]

      if (!currentRound) return

      // If showing answer, move to next question or end round
      const isAnswerRevealed = gameData.showAnswer || !!gameData.question?.correct_answer
      if (isAnswerRevealed) {
        const nextQuestionNumber = (gameData.question?.question_number || 1) + 1

        // Check if there are more questions in this round
        if (nextQuestionNumber <= currentRound.question_count) {
          // Fetch next question
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          if (gameQuestions.length >= nextQuestionNumber) {
            const nextQuestion = await questionsService.getQuestionById(gameQuestions[nextQuestionNumber - 1].question)

            // Move to next question
            await updateGameDataClean({
              state: 'round-play',
              currentRound: currentRoundIndex, // Preserve the round index
              round: gameData.round,
              question: {
                id: gameQuestions[nextQuestionNumber - 1].id,
                question_number: nextQuestionNumber,
                category: nextQuestion.category,
                question: nextQuestion.question,
                difficulty: nextQuestion.difficulty,
                a: nextQuestion.answer_a,
                b: nextQuestion.answer_b,
                c: nextQuestion.answer_c,
                d: nextQuestion.answer_d
                // correct_answer and submitted_answer will be added when answer is revealed
              }
            } as GameData)
          }
          return
        } else {
          // End of round, move to round-end state
          const currentStateIndex = GAME_STATES.indexOf('round-play')
          const nextState = GAME_STATES[currentStateIndex + 1]
          if (nextState === 'round-end') {
            await updateGameData({
              state: 'round-end',
              currentRound: currentRoundIndex, // Preserve the round index
              round: currentRound
            })
            return
          }
        }
      } else {
        // Show the answer for current question (add correct_answer to question data)
        if (gameData.question) {
          // Get the correct answer label for this question
          const correctAnswerLabel = getCorrectAnswerLabel(gameData.question.id)

          const questionWithAnswer = gameData.question

          // Add correct_answer when revealing - use the shuffled correct answer label
          console.log('Reveal answer clicked in controller, current question:', gameData.question)
          await updateGameDataClean({
            state: 'round-play',
            round: gameData.round,
            question: {
              ...questionWithAnswer,
              correct_answer: correctAnswerLabel
            }
          } as GameData)
          console.log('Updated game data with correct answer:', correctAnswerLabel)
        }
        return
      }
    }

    const currentStateIndex = GAME_STATES.indexOf(gameData.state)
    const nextStateIndex = currentStateIndex + 1
    const nextState = GAME_STATES[nextStateIndex]

    console.log(`🎮 State transition: ${gameData.state} -> ${nextState} (currentRound: ${gameData.currentRound})`)

    if (nextStateIndex < GAME_STATES.length) {

      // Handle special logic for state transitions
      if (nextState === 'return-to-lobby') {
        navigate('/host')
        return
      }

      // Handle round-start state with specific data structure
      if (nextState === 'round-start') {
        const currentRoundIndex = gameData.currentRound || 0
        const currentRound = rounds[currentRoundIndex]

        // Update game status to in-progress when first round starts
        if (game && currentRoundIndex === 0) {
          await gamesService.updateGame(game.id, { status: 'in-progress' })
          console.log('🎮 Game status updated to in-progress')
        }

        if (currentRound) {
          await updateGameData({
            state: 'round-start',
            name: currentRound.title,
            round: currentRound.sequence_number,
            rounds: rounds.length,
            questions: currentRound.question_count,
            categories: currentRound.categories || []
          })
        }
        return
      }

      // Handle round-play state with first question
      if (nextState === 'round-play') {
        const currentRoundIndex = gameData.currentRound || 0
        const currentRound = rounds[currentRoundIndex]

        if (currentRound) {
          // Fetch the first question for this round
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          if (gameQuestions.length > 0) {
            const firstQuestion = await questionsService.getQuestionById(gameQuestions[0].question)

            await updateGameDataClean({
              state: 'round-play',
              round: {
                round_number: currentRound.sequence_number,
                rounds: rounds.length,
                question_count: currentRound.question_count,
                title: currentRound.title
              },
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
                // correct_answer and submitted_answer will be added when answer is revealed
              }
            } as GameData)
          }
        }
        return
      }

      // Handle round-end state
      if (nextState === 'round-end') {
        const currentRoundIndex = gameData.currentRound || 0
        const currentRound = rounds[currentRoundIndex]

        if (currentRound) {
          await updateGameData({
            state: 'round-end',
            round: currentRound
          })
        }
        return
      }

      // Handle game-end state
      if (nextState === 'game-end') {
        // Update game status to completed when game ends
        if (game) {
          await gamesService.updateGame(game.id, { status: 'completed' })
          console.log('🏁 Game status updated to completed')
        }

        await updateGameData({
          state: 'game-end',
          gameName: game?.name,
          totalRounds: rounds.length
        })
        return
      }

      // Handle thanks state
      if (nextState === 'thanks') {
        await updateGameData({
          state: 'thanks',
          gameName: game?.name
        })
        return
      }

      // Handle special round progression logic
      if (gameData.state === 'round-end' && nextState === 'round-start') {
        const currentRoundIndex = gameData.currentRound || 0
        const nextRoundIndex = currentRoundIndex + 1

        console.log(`🔄 Round progression check: current=${currentRoundIndex}, next=${nextRoundIndex}, total=${rounds.length}`)

        // Check if there are more rounds
        if (nextRoundIndex < rounds.length) {
          // Start next round
          const nextRound = rounds[nextRoundIndex]
          if (nextRound) {
            await updateGameData({
              state: 'round-start',
              currentRound: nextRoundIndex, // Increment the round index
              name: nextRound.title,
              round: nextRound.sequence_number,
              rounds: rounds.length,
              questions: nextRound.question_count,
              categories: nextRound.categories || []
            })
            console.log(`🎯 Starting round ${nextRoundIndex + 1}: ${nextRound.title}`)
          }
        } else {
          // All rounds completed, go to game-end
          if (game) {
            await gamesService.updateGame(game.id, { status: 'completed' })
            console.log('🏁 All rounds completed, transitioning to game-end')
          }

          await updateGameData({
            state: 'game-end',
            currentRound: currentRoundIndex,
            gameName: game?.name,
            totalRounds: rounds.length
          })
        }
        return
      }

      await updateGameData({ state: nextState })
    }
  }

  // Navigate to previous state
  const handlePreviousState = async () => {
    if (!gameData) return

    // Handle special question progression within round-play state
    if (gameData.state === 'round-play') {
      // If showing answer, hide it and go back to question
      if (gameData.showAnswer) {
        // Remove correct_answer when going back to question
        if (gameData.question) {
          const questionWithoutAnswer = { ...gameData.question }
          delete questionWithoutAnswer.correct_answer

          await updateGameDataClean({
            state: 'round-play',
            round: gameData.round,
            question: questionWithoutAnswer
          } as GameData)
        }
        return
      } else {
        // Go to previous question if not on first question
        const prevQuestionNumber = (gameData.question?.question_number || 1) - 1
        if (prevQuestionNumber >= 1) {
          const currentRoundIndex = gameData.currentRound || 0
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
              } as GameData)
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
                    {gameData.state === 'round-play' && !gameData.showAnswer
                      ? `← Q${Math.max(1, (gameData.currentQuestion || 1) - 1)}`
                      : gameData.state === 'round-play' && gameData.showAnswer
                      ? '← Question'
                      : '← Back'}
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                    onClick={handleNextState}
                    disabled={gameData.state === 'return-to-lobby'}
                  >
                    {(() => {
                      const isAnswerRevealed = gameData.showAnswer || !!gameData.question?.correct_answer
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
      </div>
    </div>
  )
}