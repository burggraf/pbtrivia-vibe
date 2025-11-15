import { useEffect, useState } from 'react'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import pb from './lib/pocketbase'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import HostPage from './pages/HostPage'
import LobbyPage from './pages/LobbyPage'
import JoinPage from './pages/JoinPage'
import GamePage from './pages/GamePage'
import ControllerPage from './pages/ControllerPage'
import AuthGuard from './components/AuthGuard'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from './contexts/ThemeContext'

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
				<div className='text-center space-y-4'>
					<h1 className='text-4xl font-bold text-slate-800 dark:text-slate-100'>
						Trivia Party
					</h1>
					<div className='flex items-center justify-center gap-2'>
						<p className='text-lg text-slate-600 dark:text-slate-400'>
							{connectionStatus === 'connecting'
								? 'Connecting to server'
								: 'Failed to connect to server'}
						</p>
						{connectionStatus === 'connecting' && (
							<div className='flex gap-1 text-slate-600 dark:text-slate-400'>
								<span className='animate-bounce' style={{ animationDelay: '0ms' }}>.</span>
								<span className='animate-bounce' style={{ animationDelay: '150ms' }}>.</span>
								<span className='animate-bounce' style={{ animationDelay: '300ms' }}>.</span>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	return (
		<ThemeProvider>
			<Toaster />
			<Router>
				<Routes>
					<Route path='/' element={<LandingPage />} />
					<Route path='/login' element={<AuthPage />} />
					<Route
						path='/host'
						element={isAuthenticated ? <HostPage /> : <Navigate to='/login' replace />}
					/>
									<Route
						path='/lobby'
						element={isAuthenticated ? <LobbyPage /> : <Navigate to='/login' replace />}
					/>
					<Route
						path='/join'
						element={<JoinPage />}
					/>
					<Route
						path='/game/:id'
						element={
							<AuthGuard>
								<GamePage />
							</AuthGuard>
						}
					/>
					<Route
						path='/controller/:id'
						element={isAuthenticated ? <ControllerPage /> : <Navigate to='/login' replace />}
					/>
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</Router>
		</ThemeProvider>
	)
}

export default App
