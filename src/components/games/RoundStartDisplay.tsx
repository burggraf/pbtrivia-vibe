import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RoundStartDisplayProps {
  round?: {
    round_number: number
    rounds: number
    question_count: number
    title: string
    categories: string[]
  }
  rounds?: any[] // Array of rounds from the parent component (for backward compatibility)
}

export default function RoundStartDisplay({ round }: RoundStartDisplayProps) {
  const roundNumber = round?.round_number || 1
  const totalRounds = round?.rounds || 1
  const roundTitle = round?.title || 'Round'
  const questionCount = round?.question_count || 0
  const categories = round?.categories || []

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
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.length > 0 ? (
                categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {category}
                  </Badge>
                ))
              ) : (
                <p className="text-slate-500">Ready to begin!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}