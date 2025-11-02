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

  // Component logic will go here

  return null // Temporary
}
