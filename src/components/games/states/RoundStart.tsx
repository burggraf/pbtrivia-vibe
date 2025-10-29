import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RoundStartProps {
  gameData: {
    state: 'round-start'
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
    }
  }
}

export default function RoundStart({ gameData }: RoundStartProps) {
  const roundNumber = gameData.round?.round_number || 1
  const totalRounds = gameData.round?.rounds || 1
  const roundTitle = gameData.round?.title || 'Round'
  const questionCount = gameData.round?.question_count || 0

  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Round {roundNumber} of {totalRounds}
      </h2>
      <h3 className="text-2xl text-slate-700 dark:text-slate-200 mb-6">
        {roundTitle}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {questionCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ready to Begin!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              Get ready for {questionCount} questions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}