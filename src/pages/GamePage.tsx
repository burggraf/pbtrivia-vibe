import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'

export default function GamePage() {
  const { id } = useParams<{ id: string }>()

  const handleLogout = async () => {
    try {
      pb.authStore.clear()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Game Room</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Game ID: {id}
            </p>
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

        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Welcome to the Game!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This is a stub page for the game interface. The game functionality will be implemented here.
            </p>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm font-mono text-slate-600 dark:text-slate-400">
                Game ID: {id}
              </p>
            </div>
            <Button className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              Start Game (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}