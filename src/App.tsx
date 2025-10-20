import { useState, useEffect } from 'react'
import pb from './lib/pocketbase'

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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected to PocketBase! 🎉'
      case 'connecting': return 'Connecting to PocketBase...'
      case 'error': return 'Failed to connect to PocketBase'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🧠 pbtrivia-vibe
        </h1>

        <div className="space-y-4">
          <div className={`text-center font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>

          {connectionStatus === 'connected' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h2 className="font-semibold text-green-800 mb-2">✅ Setup Complete!</h2>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• React + Vite app running</li>
                  <li>• Tailwind CSS configured</li>
                  <li>• shadcn/ui ready</li>
                  <li>• PocketBase connected on port 8091</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📁 Project Structure</h3>
                <div className="text-xs text-blue-700 font-mono">
                  <div>src/</div>
                  <div className="ml-2">├── lib/pocketbase.ts</div>
                  <div className="ml-2">├── lib/utils.ts</div>
                  <div className="ml-2">├── App.tsx</div>
                  <div className="ml-2">└── main.tsx</div>
                </div>
              </div>
            </div>
          )}

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

export default App