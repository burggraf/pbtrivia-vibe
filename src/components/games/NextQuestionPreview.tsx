import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { gameQuestionsService } from '@/lib/gameQuestions'
import { questionsService } from '@/lib/questions'
import { getShuffledAnswers, getCorrectAnswerLabel } from '@/lib/answerShuffler'

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
}

interface Round {
  id: string
  sequence_number: number
  question_count: number
  title: string
}

interface NextQuestionPreviewProps {
  gameId: string
  gameData: GameData | null
  rounds: Round[]
}

interface NextQuestionData {
  roundNumber: number
  totalRounds: number
  questionNumber: number
  category: string
  question: string
  difficulty: string
  answers: Array<{ label: string; text: string }>
  correctAnswerLabel: string
}

export default function NextQuestionPreview({ gameId, gameData, rounds }: NextQuestionPreviewProps) {
  const [nextQuestion, setNextQuestion] = useState<NextQuestionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine which question to preview based on current game state
  const getNextQuestionCoordinates = (): { roundIndex: number; questionNumber: number } | null => {
    if (!gameData || rounds.length === 0) return null

    // States where we should hide the preview
    if (gameData.state === 'game-end' || gameData.state === 'thanks' || gameData.state === 'return-to-lobby') {
      return null
    }

    // game-start: Show Round 1, Question 1
    if (gameData.state === 'game-start') {
      return { roundIndex: 0, questionNumber: 1 }
    }

    // round-start: Show Question 1 of current round
    if (gameData.state === 'round-start' && gameData.round) {
      const roundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (roundIndex === -1) return null
      return { roundIndex, questionNumber: 1 }
    }

    // round-play: Show next question (or first question of next round)
    if (gameData.state === 'round-play' && gameData.round && gameData.question) {
      const currentRoundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (currentRoundIndex === -1) return null

      const currentRound = rounds[currentRoundIndex]
      const currentQuestionNumber = gameData.question.question_number
      const nextQuestionNumber = currentQuestionNumber + 1

      // If there's a next question in this round
      if (nextQuestionNumber <= currentRound.question_count) {
        return { roundIndex: currentRoundIndex, questionNumber: nextQuestionNumber }
      }

      // Otherwise, first question of next round
      const nextRoundIndex = currentRoundIndex + 1
      if (nextRoundIndex < rounds.length) {
        return { roundIndex: nextRoundIndex, questionNumber: 1 }
      }

      // No more questions
      return null
    }

    // round-end: Show Question 1 of next round
    if (gameData.state === 'round-end' && gameData.round) {
      const currentRoundIndex = rounds.findIndex(r => r.sequence_number === gameData.round!.round_number)
      if (currentRoundIndex === -1) return null

      const nextRoundIndex = currentRoundIndex + 1
      if (nextRoundIndex < rounds.length) {
        return { roundIndex: nextRoundIndex, questionNumber: 1 }
      }

      // No more rounds
      return null
    }

    return null
  }

  useEffect(() => {
    const fetchNextQuestion = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Determine which question to preview
        const coordinates = getNextQuestionCoordinates()
        if (!coordinates) {
          setNextQuestion(null)
          setIsLoading(false)
          return
        }

        const { roundIndex, questionNumber } = coordinates
        const round = rounds[roundIndex]

        // Fetch game_questions for this round
        const gameQuestions = await gameQuestionsService.getGameQuestions(round.id)

        if (gameQuestions.length === 0) {
          setError('No questions found for this round')
          setIsLoading(false)
          return
        }

        // Get the specific question
        const questionIndex = questionNumber - 1
        if (questionIndex >= gameQuestions.length) {
          setError('Question index out of range')
          setIsLoading(false)
          return
        }

        const gameQuestion = gameQuestions[questionIndex]

        // Fetch the full question details
        const questionDetails = await questionsService.getQuestionById(gameQuestion.question)

        // Shuffle answers using the secure key
        const shuffled = getShuffledAnswers(
          gameQuestion.key,
          questionDetails.answer_a,
          questionDetails.answer_b,
          questionDetails.answer_c,
          questionDetails.answer_d
        )

        // Get the correct answer label after shuffling
        const correctAnswerLabel = getCorrectAnswerLabel(gameQuestion.key)

        // Build the answer array
        const answers = [
          { label: 'A', text: shuffled.shuffledAnswers[0].text },
          { label: 'B', text: shuffled.shuffledAnswers[1].text },
          { label: 'C', text: shuffled.shuffledAnswers[2].text },
          { label: 'D', text: shuffled.shuffledAnswers[3].text }
        ]

        setNextQuestion({
          roundNumber: round.sequence_number,
          totalRounds: rounds.length,
          questionNumber: questionNumber,
          category: questionDetails.category,
          question: questionDetails.question,
          difficulty: questionDetails.difficulty,
          answers,
          correctAnswerLabel
        })
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to fetch next question:', err)
        setError('Unable to load next question')
        setIsLoading(false)
      }
    }

    fetchNextQuestion()
  }, [gameData, rounds, gameId])

  // Don't render if no next question
  if (!nextQuestion && !isLoading && !error) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto mt-4 md:mt-6">
      {/* Question Metadata - Badges above the card */}
      {nextQuestion && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-4">
          <Badge variant="secondary" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
            Category: {nextQuestion.category}
          </Badge>
          <Badge variant="outline" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1">
            Difficulty: {nextQuestion.difficulty}
          </Badge>
        </div>
      )}

      <Card>
        <CardHeader>
          {nextQuestion && (
            <CardTitle className="text-base md:text-xl text-center">
              Next Question: Round {nextQuestion.roundNumber} of {nextQuestion.totalRounds} - Question {nextQuestion.questionNumber}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">Loading next question...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {nextQuestion && (
            <div>
              {/* Question Text */}
              <div className="mb-4 text-center">
                <p className="text-base md:text-lg text-slate-900 dark:text-slate-100">
                  {nextQuestion.question}
                </p>
              </div>

            {/* Answer Options */}
            <div className="space-y-2 md:space-y-3">
              {nextQuestion.answers.map((answer) => {
                const isCorrect = answer.label === nextQuestion.correctAnswerLabel

                // Correct answer styling (green)
                const answerClasses = isCorrect
                  ? 'p-3 md:p-4 rounded-lg border-2 bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200 flex justify-between items-start'
                  : 'p-3 md:p-4 rounded-lg border-2 bg-slate-50 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 flex justify-between items-start'

                return (
                  <div key={answer.label} className={answerClasses}>
                    <div>
                      <span className="font-medium">{answer.label}.</span> {answer.text}
                    </div>
                    {isCorrect && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}
