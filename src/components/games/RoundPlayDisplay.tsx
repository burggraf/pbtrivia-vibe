import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getShuffledAnswers, getCorrectAnswerLabel } from '@/lib/answerShuffler'

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
}

export default function RoundPlayDisplay({ gameData, mode = 'controller', onAnswerSubmit }: RoundPlayDisplayProps) {
  const [showAnswerDebug, setShowAnswerDebug] = useState(false) // Debug flag to test answer reveal

  // Reset debug state when question changes
  useEffect(() => {
    console.log('🔄 RoundPlayDisplay: Question changed', {
      newQuestionId: gameData.question?.id,
      newQuestionNumber: gameData.question?.question_number,
      teamAnswer: gameData.teamAnswer,
      mode
    })
    setShowAnswerDebug(false)
  }, [gameData.question?.id, gameData.question?.question_number, mode])

  // Show answer if correct_answer exists in the data
  const shouldShowAnswer = showAnswerDebug || !!gameData.question?.correct_answer

  // Get shuffled answers for this question
  const shuffledResult = gameData.question ? getShuffledAnswers(
    gameData.question.id,
    gameData.question.a,
    gameData.question.b,
    gameData.question.c,
    gameData.question.d
  ) : null

  const correctAnswerLabel = gameData.question ? getCorrectAnswerLabel(gameData.question.id) : null

  // Player-specific logic
  const teamAnswer = gameData.teamAnswer
  const hasTeamSubmitted = !!teamAnswer

  const handleAnswerClick = async (answer: string) => {
    if (mode !== 'player' || hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer) return

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
  const roundTitle = gameData.round?.title || 'Round'

  return (
    <div className="text-center mb-8">
      {/* Round Progress - Consistent header showing round and question info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Round {roundNumber} of {totalRounds} - Question {questionNumber}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">
            Category: {gameData.question.category}
          </Badge>
          <Badge variant="outline">
            Difficulty: {gameData.question.difficulty}
          </Badge>
        </div>
      </div>

      {/* Debug Controls - Only in player mode */}
      {mode === 'player' && (
        <div className="mb-4 text-center">
          <Button
            onClick={() => setShowAnswerDebug(!showAnswerDebug)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {showAnswerDebug ? 'Hide' : 'Show'} Answer Override (Debug)
          </Button>
          {showAnswerDebug && correctAnswerLabel && (
            <p className="text-xs text-slate-500 mt-2">
              Correct Answer: {correctAnswerLabel} - {gameData.question?.a}
            </p>
          )}
        </div>
      )}

      {/* Question Card */}
      <Card className="max-w-3xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            {gameData.question.question}
          </CardTitle>
        </CardHeader>
        <CardContent>

          {/* Answer Options */}
          {shuffledResult && (
            <div className="space-y-3">
              {shuffledResult.shuffledAnswers.map((answer) => {
                const isAnswerCorrect = shouldShowAnswer && answer.label === correctAnswerLabel
                const baseClasses = "p-4 rounded-lg border-2 transition-colors flex items-start"

                let answerClasses = baseClasses
                if (isAnswerCorrect) {
                  answerClasses += ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200'
                } else if (shouldShowAnswer) {
                  answerClasses += ' bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                } else {
                  answerClasses += ' bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900'
                }

                // Add hover effect only for player mode when not showing answers
                if (mode === 'player' && !shouldShowAnswer && !hasTeamSubmitted) {
                  answerClasses += ' hover:bg-blue-100 cursor-pointer'
                }

                // Add disabled styling
                const isDisabled = mode === 'player' && (hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer)
                const isSelectedAnswer = mode === 'player' && hasTeamSubmitted && answer.label === teamAnswer
                const isCorrectAnswer = shouldShowAnswer && answer.label === correctAnswerLabel
                const isIncorrectSelectedAnswer = shouldShowAnswer && answer.label === teamAnswer && answer.label !== correctAnswerLabel

                if (isDisabled) {
                  if (isSelectedAnswer && !shouldShowAnswer) {
                    // Highlight the selected answer but don't show if it's correct yet
                    answerClasses += ' bg-blue-200 border-blue-500 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                  } else if (!shouldShowAnswer) {
                    // Disable other answers
                    answerClasses += ' opacity-40 cursor-not-allowed'
                  }
                }

                // Apply answer reveal styling
                if (shouldShowAnswer) {
                  if (isCorrectAnswer) {
                    answerClasses += ' bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200'
                  } else if (isIncorrectSelectedAnswer) {
                    answerClasses += ' bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200'
                  } else {
                    answerClasses += ' opacity-40'
                  }
                }

                if (mode === 'controller') {
                  // Controller mode - show as styled divs (non-clickable)
                  return (
                    <div
                      key={answer.label}
                      className={`${answerClasses} flex justify-between items-start`}
                    >
                      <div>
                        <span className="font-medium">{answer.label}.</span> {answer.text}
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {isCorrectAnswer && (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  // Player mode - show as clickable divs (same styling as controller)
                  const showGoldStar = isCorrectAnswer && teamAnswer === correctAnswerLabel
                  const showCheckmark = isCorrectAnswer && teamAnswer !== correctAnswerLabel

                  return (
                    <div
                      key={answer.label}
                      className={`${answerClasses} flex justify-between items-start`}
                      onClick={() => !isDisabled && handleAnswerClick(answer.label)}
                    >
                      <div>
                        <span className="font-medium">{answer.label}.</span> {answer.text}
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {showGoldStar && (
                          <span className="text-green-600 text-xl">★</span>
                        )}
                        {showCheckmark && (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        )}
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          )}

    
          </CardContent>
      </Card>
    </div>
  )
}