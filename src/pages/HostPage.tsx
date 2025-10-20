import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase'

export default function HostPage() {
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
            <h1 className="text-3xl font-bold text-slate-800">Host Dashboard</h1>
            <p className="text-slate-600 mt-2">Manage your trivia games here</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Create New Game</CardTitle>
              <CardDescription className="text-slate-600">
                Start a new trivia game session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                Create Game
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Manage Questions</CardTitle>
              <CardDescription className="text-slate-600">
                Add or edit trivia questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                Question Bank
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Game History</CardTitle>
              <CardDescription className="text-slate-600">
                View past games and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                View History
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Settings</CardTitle>
              <CardDescription className="text-slate-600">
                Configure game preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                Game Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}