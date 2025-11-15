import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
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
import { useControllerSettings } from '@/hooks/useControllerSettings'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ControllerHeader from '@/components/games/ControllerHeader'
import ControllerStatsLine from '@/components/games/ControllerStatsLine'
import ControllerGrid from '@/components/games/ControllerGrid'
import QrCodeCard from '@/components/games/QrCodeCard'
import TeamCard from '@/components/games/TeamCard'
import FloatingActionBar from '@/components/games/FloatingActionBar'

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
    showAsNotification?: boolean  // NEW: Display as notification instead of timer bar
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
  const [rounds, setRounds] = useState<any[]>([])
  const [gameData, setGameData] = useState<GameData | null>(null)

  const handleBackToHost = () => {
    navigate('/host')
  }

  // Controller settings
  const {
    showQrCode,
    showJoinLink,
    toggleQrCode,
    toggleJoinLink
  } = useControllerSettings()

  // Calculate stats for stats line
  const teamCount = game?.scoreboard ? Object.keys(game.scoreboard.teams).length : 0
  const roundCount = rounds.length
  const totalQuestions = rounds.reduce((sum, round) => sum + round.question_count, 0)

  // Helper to get next button label
  const getNextButtonLabel = (): string => {
    if (!gameData) return 'Next'
    const isAnswerRevealed = !!gameData.question?.correct_answer
    if (gameData.state === 'round-play' && !isAnswerRevealed) return 'Reveal'
    if (gameData.state === 'round-play' && isAnswerRevealed) return 'Next'
    if (gameData.state === 'game-end') return 'Thanks'
    if (gameData.state === 'thanks') return 'End'
    return 'Next'
  }

  const getBackButtonLabel = (): string => {
    if (!gameData) return 'Back'
    if (gameData.state === 'round-play' && !!gameData.question?.correct_answer) return 'Question'
    if (gameData.state === 'round-play' && !gameData.question?.correct_answer) {
      return `Q${Math.max(1, (gameData.question?.question_number || 1) - 1)}`
    }
    return 'Back'
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
        // Check if auto-reveal setting is enabled
        const autoRevealEnabled = game?.metadata?.auto_reveal_on_all_answered ?? false

        if (autoRevealEnabled) {
          // Check remaining time on question timer
          const questionTimerExpiresAt = gameData.timer?.expiresAt
          const remainingMs = questionTimerExpiresAt
            ? new Date(questionTimerExpiresAt).getTime() - Date.now()
            : Infinity

          // Only trigger 3-second early advance if >3 seconds remain
          if (remainingMs > 3000) {
            console.log('🎉 All teams answered! Triggering notification for 3 seconds')

            // Create 3-second early-advance timer WITH notification flag
            const timer = {
              startedAt: new Date().toISOString(),
              duration: 3,
              expiresAt: new Date(Date.now() + 3000).toISOString(),
              isEarlyAdvance: true,
              showAsNotification: true
            }

            await updateGameDataClean({
              ...gameData,
              timer
            })
          } else {
            // Let existing question timer expire naturally
            console.log('👥 All teams answered with ≤3s remaining, letting timer expire naturally')
          }
        } else {
          console.log('👥 All teams answered! Waiting for manual advance (auto-reveal disabled)')
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
          // Add timer if configured
          const timer = createTimerForState('round-end', false, game?.metadata)
          if (timer) newGameData.timer = timer

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

  // Keyboard shortcuts (after all event handlers are defined)
  useKeyboardShortcuts({
    onNext: handleNextState,
    onBack: handlePreviousState,
    onPause: handleTogglePause,
    enabled: !!gameData && !!game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0
  })

  // Build join URL for QR code
  const joinUrl = game?.code ? `${window.location.origin}/join?code=${game.code}` : ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <ControllerHeader
        gameName={game?.name || 'Controller'}
        gameCode={game?.code || ''}
        showQrCode={showQrCode}
        showJoinLink={showJoinLink}
        onToggleQrCode={toggleQrCode}
        onToggleJoinLink={toggleJoinLink}
        onBack={handleBackToHost}
      />

      {/* Stats Line */}
      <ControllerStatsLine
        teamCount={teamCount}
        roundCount={roundCount}
        questionCount={totalQuestions}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Game State Display (for non-game-start states) */}
        {gameData && gameData.state !== 'game-start' && game && (
          <div className="mb-6">
            <GameStateDisplay
              gameData={gameData}
              rounds={rounds}
              game={game}
            />
          </div>
        )}

        {/* Dashboard Grid */}
        <ControllerGrid>
          {/* QR Code Card - only if showQrCode is true */}
          {showQrCode && game?.code && (
            <QrCodeCard
              gameCode={game.code}
              joinUrl={joinUrl}
              showJoinLink={showJoinLink}
            />
          )}

          {/* Team Cards - only show at game-start or when no gameData */}
          {(!gameData || gameData.state === 'game-start') && game?.scoreboard && (
            <>
              {Object.entries(game.scoreboard.teams)
                .filter(([_, teamData]) => teamData.players.length > 0)
                .map(([teamId, teamData]) => (
                  <TeamCard
                    key={teamId}
                    teamId={teamId}
                    teamName={teamData.name}
                    players={teamData.players}
                  />
                ))}
            </>
          )}

          {/* Display Management Card */}
          {id && <DisplayManagement gameId={id} />}

          {/* Next Question Preview Card */}
          {gameData && game && id && (
            <NextQuestionPreview
              gameId={id}
              gameData={gameData}
              rounds={rounds}
            />
          )}
        </ControllerGrid>
      </div>

      {/* Floating Action Bar - only show when game has teams */}
      {game?.scoreboard && Object.keys(game.scoreboard.teams).length > 0 && gameData && (
        <FloatingActionBar
          onNext={handleNextState}
          onBack={handlePreviousState}
          onPause={handleTogglePause}
          isPaused={gameData.timer?.isPaused || false}
          canGoBack={GAME_STATES.indexOf(gameData.state) > 0}
          nextLabel={getNextButtonLabel()}
          backLabel={getBackButtonLabel()}
        />
      )}

      {/* Timer Display - Fixed to top when active */}
      {gameData?.timer && <GameTimer timer={gameData.timer} />}
    </div>
  )
}