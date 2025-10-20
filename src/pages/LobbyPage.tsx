import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Game Lobby</h1>
            <p className="text-slate-600 mt-2">Join or wait for trivia games</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Join Game Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Join a Game</CardTitle>
              <CardDescription className="text-slate-600">
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameCode" className="text-slate-700">Game Code</Label>
                <Input
                  id="gameCode"
                  placeholder="Enter 6-digit code"
                  className="border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                  maxLength={6}
                />
              </div>
              <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                Join Game
              </Button>
            </CardContent>
          </Card>

          {/* Available Games */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Available Games</CardTitle>
              <CardDescription className="text-slate-600">
                Public games you can join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-800">General Knowledge</h3>
                      <p className="text-sm text-slate-600">Host: GameMaster • 3/10 players</p>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                      Join
                    </Button>
                  </div>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-slate-800">Science Trivia</h3>
                      <p className="text-sm text-slate-600">Host: ScienceNerd • 5/8 players</p>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                      Join
                    </Button>
                  </div>
                </div>
                <div className="text-center text-slate-500 py-4">
                  No more available games
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Game Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">Current Game</CardTitle>
            <CardDescription className="text-slate-600">
              Your active game status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <p>You're not currently in a game</p>
              <p className="text-sm mt-2">Join a game above to get started!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}