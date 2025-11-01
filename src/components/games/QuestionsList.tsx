import { useState, useEffect } from 'react'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { questionsService } from '@/lib/questions'
import { roundsService } from '@/lib/rounds'
import { getShuffledAnswers } from '@/lib/answerShuffler'
import { Question } from '@/lib/questions'
import { RotateCcw } from 'lucide-react'

interface QuestionsListProps {
  roundId?: string
  roundTitle: string
}

export default function QuestionsList({ roundId, roundTitle }: QuestionsListProps) {
  const [roundQuestions, setRoundQuestions] = useState<any[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [recyclingQuestionId, setRecyclingQuestionId] = useState<string | null>(null)
  const [round, setRound] = useState<any>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!roundId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch round details to get categories
        const roundData = await roundsService.getRound(roundId)
        setRound(roundData)

        // Fetch game questions
        const gameQuestionsData = await gameQuestionsService.getGameQuestions(roundId)
        setRoundQuestions(gameQuestionsData)

        // Fetch the actual question details
        if (gameQuestionsData.length > 0) {
          const questionIds = gameQuestionsData.map(rq => rq.question)

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

  const handleRecycleQuestion = async (roundQuestionId: string) => {
    if (!round) return

    try {
      setRecyclingQuestionId(roundQuestionId)

      // Step 1: Get a new random question from the round's categories
      const newQuestion = await questionsService.getRandomQuestionsFromCategories(
        round.categories,
        1
      )

      if (newQuestion.length === 0) {
        console.warn('No new questions available from categories:', round.categories)
        return
      }

      // Step 2: Find the current round question to get its sequence
      const currentRoundQuestion = roundQuestions.find(rq => rq.id === roundQuestionId)
      if (!currentRoundQuestion) {
        console.error('Could not find current round question')
        return
      }

      // Step 3: Update the existing game_questions record to "deactivate" it
      await gameQuestionsService.updateGameQuestion(roundQuestionId, {
        game: null,
        round: null,
        sequence: 0
      })

      // Step 4: Create a new game_questions record with the new question
      await gameQuestionsService.createGameQuestion({
        host: currentRoundQuestion.host,
        game: currentRoundQuestion.game,
        round: currentRoundQuestion.round,
        question: newQuestion[0].id,
        sequence: currentRoundQuestion.sequence,
        category_name: newQuestion[0].category
      })

      // Step 5: Refresh the questions list
      await fetchQuestions()
    } catch (error) {
      console.error('Failed to recycle question:', error)
    } finally {
      setRecyclingQuestionId(null)
    }
  }

  // Extracted fetch logic for reuse
  const fetchQuestions = async () => {
    if (!roundId) return

    try {
      setLoading(true)

      // Fetch round details to get categories
      const roundData = await roundsService.getRound(roundId)
      setRound(roundData)

      // Fetch game questions
      const gameQuestionsData = await gameQuestionsService.getGameQuestions(roundId)
      setRoundQuestions(gameQuestionsData)

      // Fetch the actual question details
      if (gameQuestionsData.length > 0) {
        const questionIds = gameQuestionsData.map(rq => rq.question)

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
      <div>
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-slate-700">
          <h4 className="text-[13px] font-semibold text-[#0a0a0a] dark:text-white">Questions for {roundTitle}</h4>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5">Round not specified for question display</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-slate-700">
        <h4 className="text-[13px] font-semibold text-[#0a0a0a] dark:text-white">Questions</h4>
        <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5">
          {loading
            ? 'Loading questions...'
            : questionsWithDetails.length > 0
              ? `${questionsWithDetails.length} question${questionsWithDetails.length === 1 ? '' : 's'} in this round (answers shuffled)`
              : 'No questions assigned to this round yet'
          }
        </p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-[13px] text-slate-600 dark:text-slate-400">Loading questions...</div>
          </div>
        ) : questionsWithDetails.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-1">No questions found</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Questions will be added when the round is created with categories selected
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {questionsWithDetails.map((roundQuestion) => (
              <div
                key={roundQuestion.id}
                className="flex items-start justify-between p-3 bg-[#fafafa] dark:bg-slate-800 rounded-md border border-[#e5e5e5] dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Q{roundQuestion.sequence}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#f5f5f5] dark:bg-slate-900 text-[#525252] dark:text-slate-400 border border-[#e5e5e5] dark:border-slate-700">
                      {roundQuestion.category_name}
                    </span>
                    {roundQuestion.questionDetails?.difficulty && (
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${
                        roundQuestion.questionDetails.difficulty === 'easy' ? 'bg-[#ecfdf5] dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-400 border-[#d1fae5] dark:border-emerald-900/50' :
                        roundQuestion.questionDetails.difficulty === 'medium' ? 'bg-[#fef3c7] dark:bg-yellow-950/40 text-[#92400e] dark:text-yellow-400 border-[#fde68a] dark:border-yellow-900/50' :
                        'bg-[#fee2e2] dark:bg-red-950/40 text-[#991b1b] dark:text-red-400 border-[#fecaca] dark:border-red-900/50'
                      }`}>
                        {roundQuestion.questionDetails.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-[#0a0a0a] dark:text-white mb-2">
                    {roundQuestion.questionDetails?.question || 'Question not found'}
                  </p>
                  {roundQuestion.questionDetails?.answer_a && (() => {
                    // Use the secure key to shuffle answers (host-only view)
                    const shuffledResult = getShuffledAnswers(
                      roundQuestion.key,
                      roundQuestion.questionDetails.answer_a,
                      roundQuestion.questionDetails.answer_b,
                      roundQuestion.questionDetails.answer_c,
                      roundQuestion.questionDetails.answer_d
                    );

                    return (
                      <div className="space-y-1">
                        {shuffledResult.shuffledAnswers.map((answer, index) => (
                          <div
                            key={index}
                            className={`text-[12px] ${
                              answer.originalIndex === 0
                                ? 'font-medium text-[#065f46] dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {answer.label}) {answer.text}
                            {answer.originalIndex === 0 && (
                              <span className="ml-2 text-[#10b981] dark:text-emerald-400 text-[11px]">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => handleRecycleQuestion(roundQuestion.id)}
                  disabled={recyclingQuestionId === roundQuestion.id || !round?.categories || round.categories.length === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-[#e5e5e5] dark:border-slate-700 text-[#737373] dark:text-slate-400 hover:bg-[#fafafa] dark:hover:bg-slate-700 hover:border-[#d4d4d4] dark:hover:border-slate-600 hover:text-[#0a0a0a] dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Replace with a new question"
                >
                  {recyclingQuestionId === roundQuestion.id ? (
                    <div className="animate-spin">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}