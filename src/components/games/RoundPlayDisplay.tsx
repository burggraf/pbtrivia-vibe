import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import pb from '@/lib/pocketbase'
import { gameAnswersService } from '@/lib/gameAnswers'
import { GameScoreboard, ScoreboardPlayer } from '@/types/games'
import { useTextSize } from '@/contexts/TextSizeContext'
import TeamDetailsModal from './TeamDetailsModal'

interface RoundPlayDisplayProps {
  gameData: {
    state: 'round-play'
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
    // These are added by GamePage for player interaction
    playerTeam?: string
    isSubmittingAnswer?: boolean
    teamAnswer?: string | null  // The answer from game_answers subscription
    teamAnswerIsCorrect?: boolean  // Whether the team's answer is correct
  }
  mode?: 'controller' | 'player'  // Different display modes for controller vs game screen
  onAnswerSubmit?: (answer: string) => void  // Only used in player mode
  gameId?: string  // Added for controller mode to track answers
  scoreboard?: GameScoreboard  // Added for controller mode to show teams
}

export default function RoundPlayDisplay({ gameData, mode = 'controller', onAnswerSubmit, gameId, scoreboard }: RoundPlayDisplayProps) {
  const [teamAnswerStatus, setTeamAnswerStatus] = useState<Map<string, { answered: boolean, isCorrect?: boolean }>>(new Map()) // Track which teams have answered and their correctness
  const { textSize } = useTextSize()
  const [selectedTeam, setSelectedTeam] = useState<{ name: string; players: ScoreboardPlayer[] } | null>(null)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [showEmptyTeams, setShowEmptyTeams] = useState(false)

  const handleTeamClick = (teamName: string, players: ScoreboardPlayer[]) => {
    setSelectedTeam({ name: teamName, players })
    setTeamModalOpen(true)
  }

  // Get text size classes based on the current text size setting
  const getTextSizeClasses = () => {
    switch (textSize) {
      case 'small':
        return {
          question: 'text-base md:text-xl',
          answer: 'text-sm md:text-base'
        }
      case 'medium':
        return {
          question: 'text-lg md:text-2xl',
          answer: 'text-base md:text-lg'
        }
      case 'large':
        return {
          question: 'text-xl md:text-3xl',
          answer: 'text-lg md:text-xl'
        }
      case 'xlarge':
        return {
          question: 'text-2xl md:text-4xl',
          answer: 'text-xl md:text-2xl'
        }
    }
  }

  const textSizeClasses = getTextSizeClasses()

  // Reset team answer status when question changes
  useEffect(() => {
    console.log('🔄 RoundPlayDisplay: Question changed', {
      newQuestionId: gameData.question?.id,
      newQuestionNumber: gameData.question?.question_number,
      teamAnswer: gameData.teamAnswer,
      mode
    })
    setTeamAnswerStatus(new Map()) // Reset team answer status for new question
  }, [gameData.question?.id, gameData.question?.question_number, mode])

  // Track team answers in realtime (controller mode only)
  useEffect(() => {
    if (mode !== 'controller' || !gameId || !gameData.question?.id) return

    const questionId = gameData.question.id

    // Fetch existing answers for this question
    const fetchExistingAnswers = async () => {
      try {
        const answers = await gameAnswersService.getTeamAnswersForQuestion(gameId, questionId)
        const answeredTeamsMap = new Map(
          answers.map(a => [a.team, { answered: true, isCorrect: a.is_correct }])
        )
        setTeamAnswerStatus(answeredTeamsMap)
        console.log('📊 Loaded existing answers for', answeredTeamsMap.size, 'teams')
      } catch (error) {
        console.error('Failed to fetch existing answers:', error)
      }
    }

    fetchExistingAnswers()

    // Subscribe to realtime answer updates
    const unsubscribe = pb.collection('game_answers').subscribe('*', (e) => {
      // Check if this answer is for our game and question
      if ((e.record as any).game === gameId && (e.record as any).game_questions_id === questionId) {
        const teamId = (e.record as any).team
        const isCorrect = (e.record as any).is_correct

        setTeamAnswerStatus(prev => {
          const newMap = new Map(prev)
          if (e.action === 'create' || e.action === 'update') {
            newMap.set(teamId, { answered: true, isCorrect })
            console.log('✅ Team', teamId, 'has answered. Correct:', isCorrect)
          } else if (e.action === 'delete') {
            newMap.delete(teamId)
          }
          return newMap
        })
      }
    }, {
      filter: `game = "${gameId}" && game_questions_id = "${questionId}"`
    })

    return () => {
      unsubscribe.then(unsub => unsub())
    }
  }, [mode, gameId, gameData.question?.id])

  // Show answer if correct_answer exists in the data
  const shouldShowAnswer = !!gameData.question?.correct_answer

  // Answers are already shuffled server-side and stored in gameData.question
  // We just need to display them with labels A, B, C, D
  const answers = gameData.question ? [
    { label: 'A' as const, text: gameData.question.a },
    { label: 'B' as const, text: gameData.question.b },
    { label: 'C' as const, text: gameData.question.c },
    { label: 'D' as const, text: gameData.question.d }
  ] : []

  // The correct answer label is provided by the host when revealing
  const correctAnswerLabel = gameData.question?.correct_answer || null

  // Player-specific logic
  const teamAnswer = gameData.teamAnswer
  const hasTeamSubmitted = !!teamAnswer

  const handleAnswerClick = async (answer: string, event: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'player' || hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer) return

    // Remove focus from the clicked element to prevent persistent highlighting on mobile
    if (event.currentTarget) {
      event.currentTarget.blur()
    }

    if (onAnswerSubmit) {
      await onAnswerSubmit(answer)
    }
  }

  if (!gameData.question) {
    return (
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Loading question...
        </h2>
      </div>
    )
  }

  const roundNumber = gameData.round?.round_number || 1
  const totalRounds = gameData.round?.rounds || 1
  const questionNumber = gameData.question?.question_number || 1

  return (
    <div className="text-center mb-8">
      {/* Round Progress - Consistent header showing round and question info */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Round {roundNumber} of {totalRounds} - Question {questionNumber}
        </h2>
        <div className="flex flex-row items-center justify-between px-4">
          <Badge variant="secondary" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
            {gameData.question.category}
          </Badge>
          <Badge variant="outline" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
            {gameData.question.difficulty}
          </Badge>
        </div>
      </div>

      {/* Question Card */}
      <Card className="max-w-3xl mx-auto mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className={textSizeClasses.question}>
            {gameData.question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">

          {/* Answer Options */}
          {answers.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              {answers.map((answer) => {
                // Determine all the states first
                const isDisabled = mode === 'player' && (hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer)
                const isSelectedAnswer = mode === 'player' && hasTeamSubmitted && answer.label === teamAnswer
                const isCorrectAnswer = shouldShowAnswer && answer.label === correctAnswerLabel
                const isIncorrectSelectedAnswer = shouldShowAnswer && answer.label === teamAnswer && answer.label !== correctAnswerLabel

                // Build classes based on final state (no conflicting classes)
                const baseClasses = "p-3 md:p-4 rounded-lg border-2 transition-colors flex items-start outline-none focus:outline-none"
                let answerClasses = baseClasses

                // Determine styling based on current state
                if (shouldShowAnswer) {
                  // Answer is revealed
                  if (isCorrectAnswer) {
                    // This is the correct answer
                    answerClasses += ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200'
                  } else if (isIncorrectSelectedAnswer) {
                    // This is the wrong answer that was selected
                    answerClasses += ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200'
                  } else {
                    // Other wrong answers (not selected)
                    answerClasses += ' bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                  }
                } else if (isSelectedAnswer) {
                  // Answer was selected but not revealed yet
                  answerClasses += ' bg-blue-200 border-blue-500 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                } else if (hasTeamSubmitted) {
                  // Other answers when team has submitted (de-emphasized but readable)
                  answerClasses += ' bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 cursor-not-allowed'
                } else {
                  // Default state (clickable) - no hover effects to prevent mobile Safari focus issues
                  answerClasses += ' bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200'
                  if (mode === 'player') {
                    answerClasses += ' cursor-pointer'
                  }
                }

                if (mode === 'controller') {
                  // Controller mode - show as styled divs (non-clickable)
                  return (
                    <div
                      key={answer.label}
                      className={`${answerClasses} flex justify-between items-start relative`}
                    >
                      <div className={`${textSizeClasses.answer} text-left`}>
                        <span className="font-medium">{answer.label}.</span> {answer.text}
                      </div>
                      {isCorrectAnswer && (
                        <div className="absolute top-3 md:top-4 right-3 md:right-4">
                          <span className="text-green-600 dark:text-green-400 leading-none">✓</span>
                        </div>
                      )}
                    </div>
                  )
                } else {
                  // Player mode - show as clickable divs (same styling as controller)
                  const showGoldStar = isCorrectAnswer && teamAnswer === correctAnswerLabel
                  const showCheckmark = isCorrectAnswer && teamAnswer !== correctAnswerLabel
                  const showXMark = isIncorrectSelectedAnswer

                  return (
                    <div
                      key={answer.label}
                      className={`${answerClasses} flex justify-between items-start relative`}
                      onClick={(e) => !isDisabled && handleAnswerClick(answer.label, e)}
                      tabIndex={-1}
                    >
                      <div className={`${textSizeClasses.answer} text-left`}>
                        <span className="font-medium">{answer.label}.</span> {answer.text}
                      </div>
                      {(showGoldStar || showCheckmark || showXMark) && (
                        <div className="absolute top-3 md:top-4 right-3 md:right-4">
                          {showGoldStar && (
                            <span className="text-green-600 leading-none">★</span>
                          )}
                          {showCheckmark && (
                            <span className="text-green-600 dark:text-green-400 leading-none">✓</span>
                          )}
                          {showXMark && (
                            <span className="text-red-600 dark:text-red-400 leading-none">✗</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }
              })}
            </div>
          )}


          </CardContent>
      </Card>

      {/* Team Answer Status - Only show in controller mode */}
      {mode === 'controller' && scoreboard && Object.keys(scoreboard.teams).length > 0 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Team Answer Status</CardTitle>
              <div className="flex items-center gap-2">
                <label htmlFor="show-empty-teams" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  Show empty teams
                </label>
                <Switch
                  id="show-empty-teams"
                  checked={showEmptyTeams}
                  onCheckedChange={setShowEmptyTeams}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(scoreboard.teams)
                .filter(([teamId, teamData]) => {
                  if (teamId === 'no-team') return false // Exclude "No Team"
                  if (!showEmptyTeams && teamData.players.length === 0) return false // Exclude empty teams if toggle is off
                  return true
                })
                .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0)) // Sort by score descending
                .map(([teamId, teamData]) => {
                  const teamStatus = teamAnswerStatus.get(teamId)
                  const hasAnswered = teamStatus?.answered || false
                  const isCorrect = teamStatus?.isCorrect
                  const isAnswerRevealed = shouldShowAnswer

                  // Determine styling and icon based on state (matching question answer styling)
                  let bgColor = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' // Default badge color
                  let statusIcon = null

                  if (hasAnswered) {
                    if (isAnswerRevealed) {
                      // Answer revealed - show correct/incorrect with same colors as question answers
                      if (isCorrect) {
                        bgColor = 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-600'
                        badgeColor = 'bg-green-600 text-white dark:bg-green-700 dark:text-green-100'
                        statusIcon = <span className="text-green-600 dark:text-green-400 leading-none">✓</span>
                      } else {
                        bgColor = 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-600'
                        badgeColor = 'bg-red-600 text-white dark:bg-red-700 dark:text-red-100'
                        statusIcon = <span className="text-red-600 dark:text-red-400 leading-none">✗</span>
                      }
                    } else {
                      // Answer not revealed yet - show blue box and dot (matching selected answer styling)
                      bgColor = 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-600'
                      badgeColor = 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-100'
                      statusIcon = <span className="text-blue-600 dark:text-blue-400 leading-none">•</span>
                    }
                  }

                  return (
                    <div
                      key={teamId}
                      onClick={() => handleTeamClick(teamData.name, teamData.players)}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 ${bgColor} cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      {/* Score Badge */}
                      <div className={`text-sm font-semibold px-2 py-1 shrink-0 rounded ${badgeColor}`}>
                        {teamData.score || 0}
                      </div>

                      {/* Team Name and Player Count (inline) */}
                      <div className="flex-1 font-medium text-slate-900 dark:text-slate-100 truncate">
                        {teamData.name} <span className="text-sm text-slate-600 dark:text-slate-400">({teamData.players.length})</span>
                      </div>

                      {/* Status Icon */}
                      <div className="w-6 flex items-center justify-center shrink-0">
                        {statusIcon}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          teamName={selectedTeam.name}
          players={selectedTeam.players}
          open={teamModalOpen}
          onOpenChange={setTeamModalOpen}
        />
      )}
    </div>
  )
}