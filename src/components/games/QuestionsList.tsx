import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MockQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'multiple-choice' | 'true-false'
}

interface QuestionsListProps {
  roundTitle: string
}

// Mock data for questions
const mockQuestions: MockQuestion[] = [
  {
    id: '1',
    question: 'What is the capital of France?',
    category: 'Geography',
    difficulty: 'easy',
    type: 'multiple-choice'
  },
  {
    id: '2',
    question: 'Who painted the Mona Lisa?',
    category: 'Art',
    difficulty: 'easy',
    type: 'multiple-choice'
  },
  {
    id: '3',
    question: 'What is the largest planet in our solar system?',
    category: 'Science',
    difficulty: 'easy',
    type: 'multiple-choice'
  },
  {
    id: '4',
    question: 'In which year did World War II end?',
    category: 'History',
    difficulty: 'medium',
    type: 'multiple-choice'
  },
  {
    id: '5',
    question: 'What is the chemical symbol for gold?',
    category: 'Science',
    difficulty: 'easy',
    type: 'multiple-choice'
  }
]

function getDifficultyBadgeVariant(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'default'
    case 'medium': return 'secondary'
    case 'hard': return 'destructive'
    default: return 'outline'
  }
}

export default function QuestionsList({ roundTitle }: QuestionsListProps) {
  return (
    <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
          Questions for {roundTitle}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Manage questions for this round (Coming soon)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockQuestions.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {question.question}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {question.category}
                  </Badge>
                  <Badge variant={getDifficultyBadgeVariant(question.difficulty)} className="text-xs">
                    {question.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {question.type}
                  </Badge>
                </div>
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
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Question management functionality will be available in a future update
          </p>
        </div>
      </CardContent>
    </Card>
  )
}