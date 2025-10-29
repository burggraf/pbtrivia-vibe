import RoundPlayDisplay from '../RoundPlayDisplay'

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
  return <RoundPlayDisplay gameData={gameData} mode="player" onAnswerSubmit={onAnswerSubmit} />
}