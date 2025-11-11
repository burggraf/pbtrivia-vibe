import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppHeader from '@/components/ui/AppHeader'
import TeamDisplay from '@/components/games/TeamDisplay'
import GameStateDisplay from '@/components/games/GameStateDisplay'
import NextQuestionPreview from '@/components/games/NextQuestionPreview'
import GameTimer from '@/components/games/GameTimer'
import { gamesService } from '@/lib/games'
import { roundsService } from '@/lib/rounds'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { questionsService } from '@/lib/questions'
import { scoreboardService } from '@/lib/scoreboard'
import pb from '@/lib/pocketbase'
import { Game, GameMetadata } from '@/types/games'
import DisplayManagement from '@/components/games/DisplayManagement'

type GameState = 'game-start' | 'round-start' | 'round-play' | 'round-end' | 'game-end' | 'thanks' | 'return-to-lobby'

interface GameData {
  state: GameState
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
    categories: string[]
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
  timer?: {
    startedAt: string
    duration: number
    expiresAt: string
    isEarlyAdvance?: boolean
    isPaused?: boolean         // NEW: Whether timer is currently paused
    pausedAt?: string          // NEW: ISO timestamp when paused
    pausedRemaining?: number   // NEW: Seconds remaining when paused
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

// Helper function to create timer object from metadata
const createTimerForState = (state: GameState, isAnswerRevealed: boolean, metadata?: GameMetadata): GameData['timer'] | undefined => {
  if (!metadata) return undefined

  let timerSeconds: number | null | undefined

  // Map state to appropriate timer field
  switch (state) {
    case 'game-start':
      timerSeconds = metadata.game_start_timer
      break
    case 'round-start':
      timerSeconds = metadata.round_start_timer
      break
    case 'round-play':
      // Use question_timer before reveal, answer_timer after reveal
      timerSeconds = isAnswerRevealed ? metadata.answer_timer : metadata.question_timer
      break
    case 'round-end':
      timerSeconds = metadata.round_end_timer
      break
    case 'game-end':
      timerSeconds = metadata.game_end_timer
      break
    case 'thanks':
      timerSeconds = metadata.thanks_timer
      break
    default:
      return undefined
  }

  // Only create timer if value is positive
  if (!timerSeconds || timerSeconds <= 0) return undefined

  const startedAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + timerSeconds * 1000).toISOString()

  return {
    startedAt,
    duration: timerSeconds,
    expiresAt
  }
}

export default function ControllerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rounds, setRounds] = useState<any[]>([])
  const [gameData, setGameData] = useState<GameData | null>(null)

  const handleBackToHost = () => {
    navigate('/host')
  }

  // Rebuild scoreboard from database state
  const rebuildScoreboard = useCallback(async () => {
    if (!id) return

    console.log('=== REBUILDING SCOREBOARD FOR GAME:', id, ' ===')

    try {
      // Start with empty teams structure
      const teams: Record<string, { name: string; players: Array<{ id: string; name: string; avatar: string }> }> = {
        'no-team': {
          name: 'No Team',
          players: []
        }
      }

      // Get all teams for this game
      try {
        const teamsRecords = await pb.collection('game_teams').getFullList({
          filter: `game="${id}"`
        })
        console.log('Found', teamsRecords.length, 'teams for game')

        teamsRecords.forEach((team: any) => {
          teams[team.id] = {
            name: team.name || 'Unknown Team',
            players: []
          }
        })
      } catch (teamsError) {
        console.error('Error fetching teams:', teamsError)
      }

      // Get all players for this game
      try {
        const playersRecords = await pb.collection('game_players').getFullList({
          filter: `game="${id}"`
        })
        console.log('Found', playersRecords.length, 'player records for game')

        // Deduplicate players by user ID - keep the latest record for each user
        const uniquePlayers: Record<string, any> = {}
        playersRecords.forEach((player: any) => {
          const playerRef = player.player
          if (playerRef) {
            // If this user doesn't exist yet, or this record is newer, keep it
            if (!uniquePlayers[playerRef] || player.created > uniquePlayers[playerRef].created) {
              uniquePlayers[playerRef] = player
            }
          }
        })

        console.log('Found', Object.keys(uniquePlayers).length, 'unique players for game')

        // Assign players to teams using name/avatar from game_players record
        for (const player of Object.values(uniquePlayers)) {
          const playerRef = player.player
          const assignedTeamId = player.team || 'no-team'

          // Get player details directly from game_players record
          const playerInfo = {
            id: playerRef,
            name: player.name || '',
            avatar: player.avatar || ''
          }

          console.log('Added player', playerInfo.name || playerRef, 'to team', assignedTeamId)

          // Ensure the team exists
          if (!teams[assignedTeamId]) {
            teams[assignedTeamId] = {
              name: assignedTeamId === 'no-team' ? 'No Team' : 'Unknown Team',
              players: []
            }
          }

          // Add player to their team
          teams[assignedTeamId].players.push(playerInfo)
        }
      } catch (playersError) {
        console.error('Error fetching players:', playersError)
      }

      // Create the final scoreboard object
      const scoreboardData = {
        updated: new Date().toISOString(),
        teams: teams
      }

      // Save to game
      await pb.collection('games').update(id, {
        scoreboard: scoreboardData
      })

      console.log('Scoreboard rebuilt successfully with', Object.keys(teams).length, 'teams')
    } catch (error) {
      console.error('Error rebuilding scoreboard:', error)
    }
  }, [id])

  // Update game data (clean version that replaces entire data object)
  const updateGameDataClean = useCallback(async (cleanGameData: GameData) => {
    if (!id) return

    try {
      await pb.collection('games').update(id, {
        data: JSON.stringify(cleanGameData)
      })
      setGameData(cleanGameData)
    } catch (error) {
      console.error('Failed to update game data:', error)
    }
  }, [id])

  // Toggle timer pause/resume
  const handleTogglePause = useCallback(async () => {
    if (!gameData?.timer || !id) return

    if (gameData.timer.isPaused) {
      // Resume: calculate new expiresAt from remaining time
      const remaining = gameData.timer.pausedRemaining || 0
      const timer = {
        ...gameData.timer,
        expiresAt: new Date(Date.now() + remaining * 1000).toISOString(),
        isPaused: false,
        pausedAt: undefined,
        pausedRemaining: undefined
      }

      console.log('▶️ Resuming timer with', remaining, 'seconds remaining')
      await updateGameDataClean({ ...gameData, timer })
    } else {
      // Pause: calculate and store remaining time
      const now = Date.now()
      const expiresAt = new Date(gameData.timer.expiresAt).getTime()
      const remainingMs = Math.max(0, expiresAt - now)
      const remainingSeconds = Math.ceil(remainingMs / 1000)

      const timer = {
        ...gameData.timer,
        isPaused: true,
        pausedAt: new Date().toISOString(),
        pausedRemaining: remainingSeconds
      }

      console.log('⏸️ Pausing timer with', remainingSeconds, 'seconds remaining')
      await updateGameDataClean({ ...gameData, timer })
    }
  }, [gameData, id, updateGameDataClean])

  // Check if all teams have answered and trigger early advance
  useEffect(() => {
    // Only monitor when question is active (not revealed yet)
    if (!gameData?.question?.id || gameData.question.correct_answer || !id || !game?.scoreboard) return

    console.log('👥 Monitoring answers for early advance:', {
      questionId: gameData.question.id,
      gameId: id
    })

    const unsubscribe = pb.collection('game_answers').subscribe('*', async (e) => {
      // Filter to current question
      if ((e.record as any).game_questions_id !== gameData.question!.id) return
      if ((e.record as any).game !== id) return

      console.log('👥 Answer event detected:', {
        action: e.action,
        questionId: (e.record as any).game_questions_id,
        team: (e.record as any).team
      })

      // Count teams with players
      const teamsWithPlayers = Object.values(game.scoreboard?.teams || {})
        .filter(team => team.players && team.players.length > 0).length

      console.log('👥 Teams with players:', teamsWithPlayers)

      // If no teams with players, skip
      if (teamsWithPlayers === 0) {
        console.log('👥 No teams with players, skipping early advance check')
        return
      }

      // Get all answers for current question
      const { gameAnswersService } = await import('@/lib/gameAnswers')
      const answers = await gameAnswersService.getTeamAnswersForQuestion(id, gameData.question!.id)
      const teamsAnswered = answers.length

      console.log('👥 Teams answered:', teamsAnswered, 'of', teamsWithPlayers)

      // If all answered and no early-advance timer exists yet and timer not paused
      if (teamsAnswered >= teamsWithPlayers && !gameData.timer?.isEarlyAdvance && !gameData.timer?.isPaused) {
        // Only trigger early advance if timers are configured
        const hasTimersConfigured = game?.metadata && (
          (game.metadata.question_timer && game.metadata.question_timer > 0) ||
          (game.metadata.answer_timer && game.metadata.answer_timer > 0)
        )

        if (hasTimersConfigured) {
          console.log('🎉 All teams answered! Triggering early advance in 3 seconds')

          // Create 3-second early-advance timer
          const timer = {
            startedAt: new Date().toISOString(),
            duration: 3,
            expiresAt: new Date(Date.now() + 3000).toISOString(),
            isEarlyAdvance: true
          }

          await updateGameDataClean({
            ...gameData,
            timer
          })
        } else {
          console.log('🎉 All teams answered! Waiting for manual advance (no timers configured)')
        }
      }
    }, { filter: `game = "${id}"` })

    return () => {
      console.log('👥 Cleaning up answer subscription for question:', gameData.question?.id)
      unsubscribe.then(unsub => unsub())
    }
  }, [gameData?.question?.id, gameData?.question?.correct_answer, id, game?.scoreboard, game?.metadata, updateGameDataClean])

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

          // Reset status to 'ready' if we're at game-start (allows restarting completed games)
          if (parsedData.state === 'game-start' && gameData.status === 'completed') {
            await gamesService.updateGame(id, { status: 'ready' })
          }

          // Update status to 'in-progress' only if resuming actual gameplay (not at game-start)
          if (gameData.status === 'ready' && parsedData.state && parsedData.state !== 'game-start') {
            await gamesService.updateGame(id, { status: 'in-progress' })
          }
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

  // Navigate to next state - CLEAN STATE MACHINE
  const handleNextState = async () => {
    if (!gameData) return

    console.log('🎮 handleNextState called, current state:', gameData?.state)
    console.log(`🎮 State transition from: ${gameData.state}`)

    // Helper to get current round index from gameData
    const getCurrentRoundIndex = (): number => {
      if (!gameData.round) return 0
      // Find the round by round_number
      return rounds.findIndex(r => r.sequence_number === gameData.round?.round_number)
    }

    // Helper to create round object for a given round index
    const createRoundObject = async (roundIndex: number) => {
      const round = rounds[roundIndex]
      if (!round) return undefined

      // Get categories for this round
      let categories: string[] = []
      try {
        const gameQuestions = await gameQuestionsService.getGameQuestions(round.id)

        // Use category_name from game_questions (already stored) instead of fetching each question
        // This eliminates N API calls per round start
        const uniqueCategories = new Set<string>()
        for (const gameQuestion of gameQuestions) {
          uniqueCategories.add(gameQuestion.category_name)
        }

        categories = Array.from(uniqueCategories)
      } catch (error) {
        console.error('Failed to fetch categories for round:', error)
      }

      return {
        round_number: round.sequence_number,
        rounds: rounds.length,
        question_count: round.question_count,
        title: round.title,
        categories
      }
    }

    // Handle question progression within round-play
    if (gameData.state === 'round-play') {
      console.log('🎮 Processing round-play state')
      const currentRoundIndex = getCurrentRoundIndex()
      const currentRound = rounds[currentRoundIndex]
      if (!currentRound) return

      const isAnswerRevealed = !!gameData.question?.correct_answer
      console.log('🎮 isAnswerRevealed:', isAnswerRevealed, 'correct_answer:', gameData.question?.correct_answer)

      console.log('🔍 DEBUG: round-play logic', {
        questionNumber: gameData.question?.question_number,
        hasCorrectAnswer: !!gameData.question?.correct_answer,
        isAnswerRevealed,
        questionText: gameData.question?.question?.substring(0, 30)
      })

      if (!isAnswerRevealed) {
        console.log('🎮 ENTERING REVEAL AND GRADE BLOCK')
        // Reveal answer and grade all submissions
        console.log('🔍 DEBUG: Revealing answer and grading submissions')
        if (gameData.question && id) {
          console.log('🎮 gameData.question exists, id:', id)
          // Get the game_questions record to access the secure key
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          const gameQuestion = gameQuestions.find(gq => gq.id === gameData.question!.id)

          if (gameQuestion) {
            console.log('🎮 gameQuestion found:', gameQuestion.id)
            // Use the secure key to get the correct answer label
            const { getCorrectAnswerLabel, translateAnswerToOriginal, isTranslatedAnswerCorrect } = await import('@/lib/answerShuffler')
            const correctAnswerLabel = getCorrectAnswerLabel(gameQuestion.key)

            // Grade all submitted answers for this question
            const { gameAnswersService } = await import('@/lib/gameAnswers')
            const submittedAnswers = await gameAnswersService.getTeamAnswersForQuestion(id, gameData.question.id)

            console.log(`🎯 Grading ${submittedAnswers.length} submitted answers`)

            // Update each answer with translation and correctness
            for (const answer of submittedAnswers) {
              if (answer.answer) {
                try {
                  // Translate the shuffled answer to original position
                  const translatedAnswer = translateAnswerToOriginal(
                    gameQuestion.key,
                    answer.answer as 'A' | 'B' | 'C' | 'D'
                  )

                  // Check if the translated answer is correct (A is always correct)
                  const isCorrect = isTranslatedAnswerCorrect(translatedAnswer)

                  // Update the answer record with translation and correctness
                  await gameAnswersService.updateAnswer(answer.id, {
                    translated_answer: translatedAnswer,
                    is_correct: isCorrect
                  })

                  console.log(`✅ Graded answer for team ${answer.team}: ${answer.answer} → ${translatedAnswer} (${isCorrect ? 'CORRECT' : 'INCORRECT'})`)
                } catch (error) {
                  console.error(`❌ Failed to grade answer ${answer.id}:`, error)
                }
              }
            }

            // Update game data with correct answer
            const newGameData: GameData = {
              state: 'round-play',
              round: gameData.round,
              question: {
                ...gameData.question,
                correct_answer: correctAnswerLabel
              }
            }
            // Add timer if configured (answer timer, now revealed)
            const timer = createTimerForState('round-play', true, game?.metadata)
            if (timer) newGameData.timer = timer

            await updateGameDataClean(newGameData)

            console.log(`🎯 All answers graded. Correct answer: ${correctAnswerLabel}`)

            // Update scoreboard with latest scores
            console.log('🔴 BEFORE updateScoreboard call - Game ID:', id, 'Round:', gameData.round?.round_number)
            try {
              await scoreboardService.updateScoreboard(id, gameData.round?.round_number || 1)
              console.log('🟢 AFTER updateScoreboard call - Success!')
            } catch (error) {
              console.error('🔴 AFTER updateScoreboard call - Failed:', error)
              // Don't block game flow if scoreboard update fails
            }
          }
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
            const gameQuestion = gameQuestions[nextQuestionIndex]

            // Use the secure key to shuffle answers
            const { getShuffledAnswers } = await import('@/lib/answerShuffler')
            const shuffled = getShuffledAnswers(
              gameQuestion.key,
              nextQuestion.answer_a,
              nextQuestion.answer_b,
              nextQuestion.answer_c,
              nextQuestion.answer_d
            )

            const newGameData: GameData = {
              state: 'round-play',
              round: gameData.round,
              question: {
                id: gameQuestion.id,
                question_number: nextQuestionNumber,
                category: nextQuestion.category,
                question: nextQuestion.question,
                difficulty: nextQuestion.difficulty,
                a: shuffled.shuffledAnswers[0].text,
                b: shuffled.shuffledAnswers[1].text,
                c: shuffled.shuffledAnswers[2].text,
                d: shuffled.shuffledAnswers[3].text
              }
            }
            // Add timer if configured (question timer, not revealed yet)
            const timer = createTimerForState('round-play', false, game?.metadata)
            if (timer) newGameData.timer = timer

            await updateGameDataClean(newGameData)
            console.log('🔍 DEBUG: Next question loaded successfully')
          }
          return
        } else {
          // End of round
          console.log('🔍 DEBUG: Ending round')
          const newGameData: GameData = {
            state: 'round-end',
            round: gameData.round
          }
          // No timer for round-end state
          await updateGameDataClean(newGameData)
          return
        }
      }
    }

    // Handle state transitions
    switch (gameData.state) {
      case 'game-start': {
        // Move to first round
        const firstRound = await createRoundObject(0)
        if (firstRound) {
          const newGameData: GameData = {
            state: 'round-start',
            round: firstRound
          }
          // Add timer if configured
          const timer = createTimerForState('round-start', false, game?.metadata)
          if (timer) newGameData.timer = timer

          await updateGameDataClean(newGameData)
          // Update game status to in-progress
          if (game) {
            await gamesService.updateGame(game.id, { status: 'in-progress' })
            console.log('🎮 Game status updated to in-progress')
          }
        }
        break
      }

      case 'round-start': {
        // Load first question
        const currentRoundIndex = getCurrentRoundIndex()
        const currentRound = rounds[currentRoundIndex]
        if (currentRound) {
          const gameQuestions = await gameQuestionsService.getGameQuestions(currentRound.id)
          if (gameQuestions.length > 0) {
            const firstQuestion = await questionsService.getQuestionById(gameQuestions[0].question)
            const gameQuestion = gameQuestions[0]

            // Use the secure key to shuffle answers
            const { getShuffledAnswers } = await import('@/lib/answerShuffler')
            const shuffled = getShuffledAnswers(
              gameQuestion.key,
              firstQuestion.answer_a,
              firstQuestion.answer_b,
              firstQuestion.answer_c,
              firstQuestion.answer_d
            )

            const newGameData: GameData = {
              state: 'round-play',
              round: gameData.round,
              question: {
                id: gameQuestion.id,
                question_number: 1,
                category: firstQuestion.category,
                question: firstQuestion.question,
                difficulty: firstQuestion.difficulty,
                a: shuffled.shuffledAnswers[0].text,
                b: shuffled.shuffledAnswers[1].text,
                c: shuffled.shuffledAnswers[2].text,
                d: shuffled.shuffledAnswers[3].text
              }
            }
            // Add timer if configured (question timer, not revealed yet)
            const timer = createTimerForState('round-play', false, game?.metadata)
            if (timer) newGameData.timer = timer

            await updateGameDataClean(newGameData)
          }
        }
        break
      }

      case 'round-end': {
        // Check if there are more rounds
        const nextRoundIndex = getCurrentRoundIndex() + 1
        if (nextRoundIndex < rounds.length) {
          // Start next round
          const nextRound = await createRoundObject(nextRoundIndex)
          if (nextRound) {
            const newGameData: GameData = {
              state: 'round-start',
              round: nextRound
            }
            // Add timer if configured
            const timer = createTimerForState('round-start', false, game?.metadata)
            if (timer) newGameData.timer = timer

            await updateGameDataClean(newGameData)
          }
        } else {
          // All rounds completed, go to game-end
          const newGameData: GameData = {
            state: 'game-end'
          }
          // Add timer if configured
          const timer = createTimerForState('game-end', false, game?.metadata)
          if (timer) newGameData.timer = timer

          await updateGameDataClean(newGameData)
          // Don't set status='completed' yet - wait until after 'thanks' state
        }
        break
      }

      case 'game-end': {
        const newGameData: GameData = {
          state: 'thanks'
        }
        // Add timer if configured
        const timer = createTimerForState('thanks', false, game?.metadata)
        if (timer) newGameData.timer = timer

        await updateGameDataClean(newGameData)
        break
      }

      case 'thanks': {
        // Mark game as completed before returning to lobby
        if (game) {
          await gamesService.updateGame(game.id, { status: 'completed' })
          console.log('🏁 Game status updated to completed')
        }
        navigate('/host')
        return
      }

      case 'return-to-lobby': {
        // Mark game as completed before returning to lobby
        await gamesService.updateGame(id!, { status: 'completed' })
        navigate('/host')
        return
      }

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
              const gameQuestion = gameQuestions[prevQuestionNumber - 1]

              // Use the secure key to shuffle answers
              const { getShuffledAnswers } = await import('@/lib/answerShuffler')
              const shuffled = getShuffledAnswers(
                gameQuestion.key,
                prevQuestion.answer_a,
                prevQuestion.answer_b,
                prevQuestion.answer_c,
                prevQuestion.answer_d
              )

              await updateGameDataClean({
                state: 'round-play',
                round: gameData.round,
                question: {
                  id: gameQuestion.id,
                  question_number: prevQuestionNumber,
                  category: prevQuestion.category,
                  question: prevQuestion.question,
                  difficulty: prevQuestion.difficulty,
                  a: shuffled.shuffledAnswers[0].text,
                  b: shuffled.shuffledAnswers[1].text,
                  c: shuffled.shuffledAnswers[2].text,
                  d: shuffled.shuffledAnswers[3].text
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

  // Auto-advance when timer expires (host only)
  useEffect(() => {
    if (!gameData?.timer || gameData.timer.isPaused || !id) return

    console.log('⏰ Timer active:', {
      state: gameData.state,
      expiresAt: gameData.timer.expiresAt,
      duration: gameData.timer.duration
    })

    const checkTimer = setInterval(() => {
      const now = Date.now()
      const expiresAt = new Date(gameData.timer!.expiresAt).getTime()

      if (now >= expiresAt) {
        console.log('⏰ Timer expired! Auto-advancing from state:', gameData.state)
        clearInterval(checkTimer)
        handleNextState()
      }
    }, 100)

    return () => {
      clearInterval(checkTimer)
    }
  }, [gameData?.timer, id, handleNextState])

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

    // Subscribe to game_players changes to rebuild scoreboard
    const unsubscribePlayers = pb.collection('game_players').subscribe('*', (e) => {
      // Check if the player record belongs to this game
      if (e.record.game === id) {
        console.log(`=== PLAYER ${e.action.toUpperCase()} ===`)
        console.log('Player ID:', e.record.id)
        console.log('Game ID:', e.record.game)
        console.log('Team ID:', e.record.team)

        // Rebuild scoreboard on any player change
        rebuildScoreboard()
      }
    }, {
      filter: `game="${id}"`
    })

    // Subscribe to game_teams changes to rebuild scoreboard
    const unsubscribeTeams = pb.collection('game_teams').subscribe('*', (e) => {
      // Check if the team record belongs to this game
      if (e.record.game === id) {
        console.log(`=== TEAM ${e.action.toUpperCase()} ===`)
        console.log('Team ID:', e.record.id)
        console.log('Game ID:', e.record.game)

        // Rebuild scoreboard on any team change
        rebuildScoreboard()
      }
    }, {
      filter: `game="${id}"`
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeGame.then((unsub) => unsub())
      unsubscribePlayers.then((unsub) => unsub())
      unsubscribeTeams.then((unsub) => unsub())
    }
  }, [id, navigate, rebuildScoreboard])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Bar */}
      <AppHeader
        title={game?.name || 'Controller'}
        leftButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToHost}
            className="h-[44px] w-[44px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Back to Host"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        }
      />

      {/* Action Bar with Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-[60px]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-full">
          {/* Left: Back Navigation */}
          <div className="flex items-center gap-2 w-1/3">
            {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && gameData && (
              <Button
                variant="outline"
                className="h-[44px] border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={handlePreviousState}
                disabled={GAME_STATES.indexOf(gameData.state) === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {gameData.state === 'round-play' && !!gameData.question?.correct_answer
                  ? 'Question'
                  : gameData.state === 'round-play' && !gameData.question?.correct_answer
                  ? `Q${Math.max(1, (gameData.question?.question_number || 1) - 1)}`
                  : 'Back'}
              </Button>
            )}
          </div>

          {/* Center: Game Code */}
          <div className="flex items-center justify-center w-1/3">
            {game?.code && (
              <div className="text-base md:text-lg font-semibold tracking-widest text-slate-800 dark:text-slate-100">
                {game.code}
              </div>
            )}
          </div>

          {/* Right: Forward Navigation */}
          <div className="flex items-center justify-end gap-2 w-1/3">
            {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && gameData && (
              <>
                {gameData?.timer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePause}
                    className="flex items-center gap-2"
                  >
                    {gameData.timer.isPaused ? (
                      <>
                        <Play className="h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                )}

                <Button
                  className="h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
                  onClick={handleNextState}
                  disabled={gameData.state === 'return-to-lobby'}
                >
                  {(() => {
                    const isAnswerRevealed = !!gameData.question?.correct_answer
                    return gameData.state === 'round-play' && !isAnswerRevealed
                      ? 'Reveal'
                      : gameData.state === 'round-play' && isAnswerRevealed
                      ? 'Next'
                      : gameData.state === 'game-end'
                      ? 'Thanks'
                      : gameData.state === 'thanks'
                      ? 'End'
                      : 'Next'
                  })()}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
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
          <>
            <TeamDisplay
              scoreboard={game?.scoreboard}
              isLoading={isLoading}
              className="mb-8"
            />
            {id && (
              <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
                  Display Management
                </h2>
                <DisplayManagement gameId={id} />
              </div>
            )}
          </>
        )}

        {/* Next Question Preview - Show during gameplay */}
        {gameData && game && id && (
          <NextQuestionPreview
            gameId={id}
            gameData={gameData}
            rounds={rounds}
          />
        )}
      </div>

      {/* Timer Display - Fixed to bottom when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}
    </div>
  )
}