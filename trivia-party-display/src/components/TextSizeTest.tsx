import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTextSize } from '@/contexts/TextSizeContext'

export function TextSizeTest() {
  const { textSize } = useTextSize()

  // Get text size classes
  const getTextSizeClasses = () => {
    switch (textSize) {
      case 'small':
        return { question: 'text-base md:text-xl', answer: 'text-sm md:text-base' }
      case 'medium':
        return { question: 'text-lg md:text-2xl', answer: 'text-base md:text-lg' }
      case 'large':
        return { question: 'text-xl md:text-3xl', answer: 'text-lg md:text-xl' }
      case 'xlarge':
        return { question: 'text-2xl md:text-4xl', answer: 'text-xl md:text-2xl' }
      default:
        return { question: 'text-xl md:text-3xl', answer: 'text-lg md:text-xl' }
    }
  }

  const textSizeClasses = getTextSizeClasses()

  // Longest question from database
  const question = "This is from what British science fiction work? On Earth, man had always assumed that he was more intelligent than dolphins because he had achieved so much - the wheel, New York, wars, and so on - whilst all the dolphins had ever done was muck about in the water having a good time. But conversely, the dolphins had always believed that they were far more intelligent than man for the same reasons."

  // Longest answers from database
  const answers = [
    { label: 'A', text: 'Every object in the universe attracts every other object with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between them' },
    { label: 'B', text: 'Objects at rest tend to stay at rest, and objects in motion tend to stay in motion with the same speed and direction' },
    { label: 'C', text: 'The acceleration of an object is directly proportional to the net force applied to it and inversely proportional to its mass' },
    { label: 'D', text: 'The pressure of a gas is inversely proportional to its volume if the temperature and the amount of gas remain constant' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-2 md:p-4">
      {/* Single line header: category - title - difficulty */}
      <div className="flex items-center justify-between mb-2 px-2">
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          Literature
        </Badge>
        <h2 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100">
          Round 1 of 3 - Question 1
        </h2>
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          Hard
        </Badge>
      </div>

      {/* Question Card */}
      <Card className="max-w-3xl mx-auto mb-2 md:mb-3">
        <CardHeader>
          <CardTitle className={textSizeClasses.question}>
            {question}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {/* Answer Options */}
          <div className="space-y-2 md:space-y-3">
            {answers.map((answer) => {
              const baseClasses = "p-3 md:p-4 rounded-lg border-2 transition-colors flex items-start outline-none focus:outline-none"
              const answerClasses = baseClasses + ' bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200'

              return (
                <div
                  key={answer.label}
                  className={`${answerClasses} flex justify-between items-start relative`}
                >
                  <div className={`${textSizeClasses.answer} text-left`}>
                    <span className="font-medium">{answer.label}.</span> {answer.text}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Footer with measurements */}
      <div className="text-center mt-4">
        <p className="text-xs text-slate-500 dark:text-slate-600">
          Question: {question.length} chars | Longest answer: {Math.max(...answers.map(a => a.text.length))} chars
        </p>
      </div>
    </div>
  )
}
