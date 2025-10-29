import RoundStartDisplay from '../RoundStartDisplay'

interface RoundStartProps {
  gameData: {
    state: 'round-start'
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
      categories: string[]
    }
  }
}

export default function RoundStart({ gameData }: RoundStartProps) {
  return <RoundStartDisplay round={gameData.round} />
}