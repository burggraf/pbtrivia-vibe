import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import pb from '@/lib/pocketbase'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 AuthGuard: Checking authentication state...')

      // If we have a token but it's not marked as valid, try to validate it
      if (pb.authStore.token && !pb.authStore.isValid) {
        console.log('🔄 AuthGuard: Token exists but invalid, attempting to refresh...')
        try {
          // Try to refresh the auth state
          await pb.collection('users').authRefresh()
          console.log('✅ AuthGuard: Successfully refreshed authentication')
          setIsAuthenticated(true)
        } catch (error) {
          console.error('❌ AuthGuard: Failed to refresh authentication:', error)
          // Clear invalid auth state
          pb.authStore.clear()
          setIsAuthenticated(false)
        }
      } else if (pb.authStore.isValid) {
        console.log('✅ AuthGuard: User is already authenticated')
        setIsAuthenticated(true)
      } else {
        console.log('❌ AuthGuard: No valid authentication found')
        setIsAuthenticated(false)
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [])

  // Listen to auth store changes
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      console.log('🔄 AuthGuard: Auth state changed:', {
        isValid: pb.authStore.isValid,
        userId: pb.authStore.model?.id
      })
      setIsAuthenticated(pb.authStore.isValid)
    })

    return () => unsubscribe()
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🔒 AuthGuard: Redirecting to login - not authenticated')
    return <Navigate to="/login" replace />
  }

  console.log('🔓 AuthGuard: Authentication verified, rendering children')
  return <>{children}</>
}