import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'

export default function LobbyPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Game Lobby</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Join or wait for trivia games</p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Join Game Section */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Join a Game</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameCode" className="text-slate-700 dark:text-slate-300">Game Code</Label>
                <Input
                  id="gameCode"
                  placeholder="Enter 6-digit code"
                  className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-slate-200 dark:focus:ring-slate-700"
                  maxLength={6}
                />
              </div>
              <Button className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Available Games */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Available Games</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Public games you can join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">General Knowledge</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Host: GameMaster • 3/10 players</p>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                      Join
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">Science Trivia</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Host: ScienceNerd • 5/8 players</p>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                      Join
                    </Button>
                  </div>
                </div>
                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                  No more available games
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Game Status */}
        <Card className="mt-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Current Game</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Your active game status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>You're not currently in a game</p>
              <p className="text-sm mt-2">Join a game above to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}