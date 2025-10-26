import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RoundStartProps {
  gameData: {
    state: 'round-start'
    name: string
    round: number
    rounds: number
    questions: number
    categories: string[]
  }
}

export default function RoundStart({ gameData }: RoundStartProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Round {gameData.round} of {gameData.rounds}
      </h2>
      <h3 className="text-2xl text-slate-700 dark:text-slate-200 mb-6">
        {gameData.name}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {gameData.questions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              {gameData.categories.length > 0 ? (
                gameData.categories.map((category: string) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))
              ) : (
                <p className="text-slate-500">No categories</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}