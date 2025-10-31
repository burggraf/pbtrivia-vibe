import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Sparkles, PartyPopper, Gamepad2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ThanksProps {
  gameData: {
    state: 'thanks'
    gameName?: string
  }
}

export default function Thanks({ gameData }: ThanksProps) {
  const navigate = useNavigate()

  const handleReturnToLobby = () => {
    navigate('/lobby')
  }

  return (
    <div className="text-center mb-8">
      {/* Animated Header */}
      <div className="mb-8">
        <div className="flex justify-center items-center gap-3 mb-6">
          <PartyPopper className="h-8 w-8 text-purple-500" />
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            Thanks for Playing!
          </h1>
          <PartyPopper className="h-8 w-8 text-purple-500" />
        </div>

        <div className="flex justify-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <Heart className="h-5 w-5 text-red-500" />
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>

        {gameData.gameName && (
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
            Hope you enjoyed <span className="font-semibold text-slate-800 dark:text-slate-100">{gameData.gameName}</span>!
          </p>
        )}
      </div>

      {/* Thank You Card */}
      <div className="max-w-2xl mx-auto mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-purple-100 dark:bg-purple-800 rounded-full">
                <Heart className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Great Game Everyone!
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Thank you to all the players who participated in tonight's trivia game.
              We hope you had fun, learned something new, and enjoyed the friendly competition!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <Gamepad2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Fair Play</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Everyone played with great sportsmanship
                </p>
              </div>

              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <Sparkles className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Great Questions</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Challenging and entertaining trivia for all
                </p>
              </div>

              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Good Times</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Memories made and friendships strengthened
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800/30 dark:to-pink-800/30 rounded-lg">
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                🌟 You're all winners! 🌟
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Whether you came in first place or just had fun participating,
                everyone who played is a champion in our book.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6 pb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
              Ready for Another Game?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Host your own trivia night or join another game to test your knowledge again!
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleReturnToLobby}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
              >
                Return to Lobby
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                See you at the next trivia night! 🎉
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}