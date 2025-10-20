import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import pb from './lib/pocketbase'
import AuthPage from './pages/AuthPage'
import HostPage from './pages/HostPage'
import LobbyPage from './pages/LobbyPage'

function App() {
	const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
		'connecting'
	)
	const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)

	useEffect(() => {
		const checkConnection = async () => {
			try {
				// Test PocketBase connection
				const health = await pb.health.check()
				setConnectionStatus('connected')
				console.log('PocketBase connected successfully!', health)
			} catch (error) {
				console.error('PocketBase connection failed:', error)
				setConnectionStatus('error')
			}
		}

		checkConnection()
	}, [])

	// Listen to auth store changes
	useEffect(() => {
		const unsubscribe = pb.authStore.onChange(() => {
			console.log('Auth state changed, isValid:', pb.authStore.isValid)
			setIsAuthenticated(pb.authStore.isValid)
		})

		return () => unsubscribe()
	}, [])

	// Show connection status if not connected
	if (connectionStatus !== 'connected') {
		return (
			<div className='min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4'>
				<div className='bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full'>
					<h1 className='text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center'>🧠 pbtrivia-vibe</h1>

					<div className='space-y-4'>
						<div
							className={`text-center font-medium ${
								connectionStatus === 'connecting' ? 'text-yellow-600 dark:text-yellow-500' : 'text-red-600 dark:text-red-500'
							}`}>
							{connectionStatus === 'connecting'
								? 'Connecting to PocketBase...'
								: 'Failed to connect to PocketBase'}
						</div>

						{connectionStatus === 'error' && (
							<div className='bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4'>
								<p className='text-sm text-red-700 dark:text-red-300'>
									Make sure PocketBase is running on port 8090. Check the console for details.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<Router>
			<Routes>
				<Route path='/' element={<AuthPage />} />
				<Route
					path='/host'
					element={isAuthenticated ? <HostPage /> : <Navigate to='/' replace />}
				/>
				<Route
					path='/lobby'
					element={isAuthenticated ? <LobbyPage /> : <Navigate to='/' replace />}
				/>
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</Router>
	)
}

export default App
