import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { roundQuestionsService } from '@/lib/roundQuestions'
import { questionsService } from '@/lib/questions'
import { getShuffledAnswers } from '@/lib/answerShuffler'
import { Question } from '@/lib/questions'

interface QuestionsListProps {
  roundId?: string
  roundTitle: string
}

function getDifficultyBadgeVariant(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'default'
    case 'medium': return 'secondary'
    case 'hard': return 'destructive'
    default: return 'outline'
  }
}

export default function QuestionsList({ roundId, roundTitle }: QuestionsListProps) {
  const [roundQuestions, setRoundQuestions] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!roundId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch round questions
        const roundQuestionsData = await roundQuestionsService.getRoundQuestions(roundId)
        setRoundQuestions(roundQuestionsData)

        // Fetch the actual question details
        if (roundQuestionsData.length > 0) {
          const questionIds = roundQuestionsData.map(rq => rq.question)

          // We need to fetch questions one by one since PocketBase doesn't support IN queries easily
          const questionPromises = questionIds.map(async (questionId) => {
            try {
              return await questionsService.getQuestionById(questionId)
            } catch (error) {
              console.error(`Failed to fetch question ${questionId}:`, error)
              return null
            }
          })

          const fetchedQuestions = await Promise.all(questionPromises)
          const validQuestions = fetchedQuestions.filter((q): q is Question => q !== null)
          setQuestions(validQuestions)
        }
      } catch (error) {
        console.error('Failed to fetch round questions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [roundId])

  // Combine round questions with their question details
  const questionsWithDetails = roundQuestions.map(rq => {
    const question = questions.find(q => q.id === rq.question)
    return {
      ...rq,
      questionDetails: question
    }
  }).sort((a, b) => a.sequence - b.sequence)

  if (!roundId) {
    return (
      <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
            Questions for {roundTitle}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Round not specified for question display
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
          Questions for {roundTitle}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {loading
            ? 'Loading questions...'
            : questionsWithDetails.length > 0
              ? `${questionsWithDetails.length} question${questionsWithDetails.length === 1 ? '' : 's'} in this round (answers shuffled)`
              : 'No questions assigned to this round yet'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-slate-600 dark:text-slate-400">Loading questions...</div>
          </div>
        ) : questionsWithDetails.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">No questions found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Questions will be added when the round is created with categories selected
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {questionsWithDetails.map((roundQuestion) => (
              <div
                key={roundQuestion.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Q{roundQuestion.sequence}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {roundQuestion.category_name}
                    </Badge>
                    {roundQuestion.questionDetails?.difficulty && (
                      <Badge variant={getDifficultyBadgeVariant(roundQuestion.questionDetails.difficulty)} className="text-xs">
                        {roundQuestion.questionDetails.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {roundQuestion.questionDetails?.question || 'Question not found'}
                  </p>
                  {roundQuestion.questionDetails?.answer_a && (() => {
                    const shuffledResult = getShuffledAnswers(
                      roundQuestion.id,
                      roundQuestion.questionDetails.answer_a,
                      roundQuestion.questionDetails.answer_b,
                      roundQuestion.questionDetails.answer_c,
                      roundQuestion.questionDetails.answer_d
                    );

                    return (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {shuffledResult.shuffledAnswers.map((answer, index) => (
                          <div
                            key={index}
                            className={`
                              ${answer.originalIndex === 0
                                ? 'font-semibold text-green-700 dark:text-green-400'
                                : ''
                              }
                            `}
                          >
                            {answer.label}) {answer.text}
                            {answer.originalIndex === 0 && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  disabled
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}