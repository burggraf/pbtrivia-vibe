import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
    currentQuestion?: number
    showAnswer?: boolean
    playerTeam?: string
    submittedAnswers?: { [key: string]: string }
    isSubmittingAnswer?: boolean
  }
  onAnswerSubmit?: (answer: string) => void
}

export default function RoundPlay({ gameData, onAnswerSubmit }: RoundPlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Determine current player's team (simplified for now)
  const playerTeam = gameData.playerTeam || 'team-1' // This would come from auth/context

  // Check if this team has already submitted an answer
  const hasTeamSubmitted = !!gameData.submittedAnswers?.[playerTeam]

  const handleAnswerClick = async (answer: string) => {
    if (hasSubmitted || gameData.showAnswer || gameData.isSubmittingAnswer || hasTeamSubmitted) return

    setSelectedAnswer(answer)
    setHasSubmitted(true)

    if (onAnswerSubmit) {
      await onAnswerSubmit(answer)
    }
  }

  const getAnswerButtonVariant = (answerKey: string) => {
    if (!gameData.showAnswer && !hasSubmitted) {
      return 'default'
    }

    // Determine correct answer from the question data
    const correctAnswer = gameData.question?.correct_answer || 'A' // Default to A for now

    if (gameData.showAnswer) {
      if (answerKey === correctAnswer) {
        return 'default'
      }
      if (answerKey === selectedAnswer && answerKey !== correctAnswer) {
        return 'destructive'
      }
      return 'outline'
    }

    if (hasSubmitted && answerKey === selectedAnswer) {
      return 'default'
    }

    return 'outline'
  }

  const getAnswerButtonClass = (answerKey: string) => {
    if (!gameData.showAnswer && !hasSubmitted) {
      return 'hover:bg-slate-100 dark:hover:bg-slate-800'
    }

    // Determine correct answer from the question data
    const correctAnswer = gameData.question?.correct_answer || 'A' // Default to A for now

    if (gameData.showAnswer) {
      if (answerKey === correctAnswer) {
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600'
      }
      if (answerKey === selectedAnswer && answerKey !== correctAnswer) {
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
          {gameData.round?.title || 'Round'} - Question {gameData.currentQuestion || 1}
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

      {/* Question Card */}
      <Card className="max-w-3xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            Question {gameData.currentQuestion || 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
            {gameData.question.question}
          </p>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'A', text: gameData.question.a },
              { key: 'B', text: gameData.question.b },
              { key: 'C', text: gameData.question.c },
              { key: 'D', text: gameData.question.d }
            ].map((answer) => (
              <Button
                key={answer.key}
                variant={getAnswerButtonVariant(answer.key)}
                className={`h-auto p-4 text-left justify-start whitespace-normal ${getAnswerButtonClass(answer.key)}`}
                onClick={() => handleAnswerClick(answer.key)}
                disabled={hasSubmitted || gameData.showAnswer || gameData.isSubmittingAnswer || hasTeamSubmitted}
              >
                <span className="font-medium mr-2">{answer.key}.</span>
                {answer.text}
                {gameData.showAnswer && answer.key === (gameData.question?.correct_answer || 'A') && (
                  <span className="ml-2 text-green-300">✓ Correct</span>
                )}
              </Button>
            ))}
          </div>

          {/* Answer Submission Status */}
          {gameData.isSubmittingAnswer && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-300">
                Submitting answer for {playerTeam}...
              </p>
            </div>
          )}

          {(hasSubmitted || hasTeamSubmitted) && !gameData.showAnswer && !gameData.isSubmittingAnswer && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300">
                Answer submitted for {playerTeam}!
              </p>
            </div>
          )}

          {/* Answer Reveal */}
          {gameData.showAnswer && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-700 dark:text-slate-300">
                {selectedAnswer?.charAt(0).toUpperCase() === (gameData.question?.correct_answer || 'A') ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Your team got it right! 🎉
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    Your team got it wrong. The correct answer is highlighted above.
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