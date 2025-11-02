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

  return null // Temporary
}
