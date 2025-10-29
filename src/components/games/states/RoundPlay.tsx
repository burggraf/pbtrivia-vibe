import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getShuffledAnswers, getCorrectAnswerLabel } from '@/lib/answerShuffler'

interface RoundPlayProps {
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
  onAnswerSubmit?: (answer: string) => void
}

export default function RoundPlay({ gameData, onAnswerSubmit }: RoundPlayProps) {
  const [showAnswerDebug, setShowAnswerDebug] = useState(false) // Debug flag to test answer reveal

  // Reset debug state when question changes
  useEffect(() => {
    console.log('🔄 RoundPlay: Question changed', {
      newQuestionId: gameData.question?.id,
      newQuestionNumber: gameData.question?.question_number,
      teamAnswer: gameData.teamAnswer
    })
    setShowAnswerDebug(false)
  }, [gameData.question?.id, gameData.question?.question_number])

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

  // Use team answer from subscription (real-time synced across all team members)
  const teamAnswer = gameData.teamAnswer
  const hasTeamSubmitted = !!teamAnswer

  const handleAnswerClick = async (answer: string) => {
    if (hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer) return

    if (onAnswerSubmit) {
      await onAnswerSubmit(answer)
    }
  }

  const getAnswerButtonVariant = (answerLabel: string) => {
    if (!shouldShowAnswer && !hasTeamSubmitted) {
      return 'default'
    }

    if (shouldShowAnswer && correctAnswerLabel) {
      if (answerLabel === correctAnswerLabel) {
        return 'default'
      }
      if (answerLabel === teamAnswer && answerLabel !== correctAnswerLabel) {
        return 'destructive'
      }
      return 'outline'
    }

    if (hasTeamSubmitted && answerLabel === teamAnswer) {
      return 'default'
    }

    return 'outline'
  }

  const getAnswerButtonClass = (answerLabel: string) => {
    if (!shouldShowAnswer && !hasTeamSubmitted) {
      return 'hover:bg-slate-100 dark:hover:bg-slate-800'
    }

    if (shouldShowAnswer && correctAnswerLabel) {
      if (answerLabel === correctAnswerLabel) {
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600'
      }
      if (answerLabel === teamAnswer && answerLabel !== correctAnswerLabel) {
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600'
      }
      return 'opacity-50'
    }

    return 'hover:bg-slate-100 dark:hover:bg-slate-800'
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

  return (
    <div className="text-center mb-8">
      {/* Round Progress */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {gameData.round?.title || 'Round'} - Question {gameData.question.question_number || 1}
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

      {/* Debug Controls */}
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

      {/* Question Card */}
      <Card className="max-w-3xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            Question {gameData.question.question_number || 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
            {gameData.question.question}
          </p>

          {/* Answer Options */}
          {shuffledResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shuffledResult.shuffledAnswers.map((answer) => (
                <Button
                  key={answer.label}
                  variant={getAnswerButtonVariant(answer.label)}
                  className={`h-auto p-4 text-left justify-start whitespace-normal ${getAnswerButtonClass(answer.label)}`}
                  onClick={() => handleAnswerClick(answer.label)}
                  disabled={hasTeamSubmitted || shouldShowAnswer || gameData.isSubmittingAnswer}
                >
                  <span className="font-medium mr-2">{answer.label}.</span>
                  {answer.text}
                  {shouldShowAnswer && answer.label === correctAnswerLabel && (
                    <span className="ml-2 text-green-300">✓ Correct</span>
                  )}
                </Button>
              ))}
            </div>
          )}

          {/* Answer Submission Status */}
          {gameData.isSubmittingAnswer && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-300">
                Submitting answer for your team...
              </p>
            </div>
          )}

          {hasTeamSubmitted && !shouldShowAnswer && !gameData.isSubmittingAnswer && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300">
                ✓ Your team has submitted answer: <strong>{teamAnswer}</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                All team members can see this answer in real-time
              </p>
            </div>
          )}

          {/* Answer Reveal */}
          {shouldShowAnswer && correctAnswerLabel && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-700 dark:text-slate-300">
                {teamAnswer === correctAnswerLabel ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Your team got it right! 🎉
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    Your team answered {teamAnswer}. The correct answer is {correctAnswerLabel}.
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}