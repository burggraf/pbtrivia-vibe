import { useState, useEffect } from 'react'
import pb from './lib/pocketbase'
import AuthPage from './pages/AuthPage'

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [isHealthy, setIsHealthy] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test PocketBase connection
        const health = await pb.health.check()
        setIsHealthy(true)
        setConnectionStatus('connected')
        console.log('PocketBase connected successfully!', health)
      } catch (error) {
        console.error('PocketBase connection failed:', error)
        setConnectionStatus('error')
      }
    }

    checkConnection()
  }, [])

  // Show connection status if not connected
  if (connectionStatus !== 'connected') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">
            🧠 pbtrivia-vibe
          </h1>

          <div className="space-y-4">
            <div className={`text-center font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {connectionStatus === 'connected' ? 'Connected to PocketBase! 🎉' :
               connectionStatus === 'connecting' ? 'Connecting to PocketBase...' :
               'Failed to connect to PocketBase'}
            </div>

            {connectionStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  Make sure PocketBase is running on port 8091. Check the console for details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <AuthPage />
}

export default App