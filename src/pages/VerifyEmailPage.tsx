import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setErrorMessage('Verification token is missing. Please use the link from your email.')
        return
      }

      try {
        // Confirm the verification using the token
        await pb.collection('users').confirmVerification(token)
        setStatus('success')
        console.log('Email verified successfully')
      } catch (error) {
        console.error('Email verification failed:', error)
        setStatus('error')

        // Provide user-friendly error messages
        if (error instanceof Error) {
          if (error.message.includes('token')) {
            setErrorMessage('This verification link has expired or is invalid. Please request a new one.')
          } else {
            setErrorMessage('Verification failed. Please try again or contact support.')
          }
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.')
        }
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleNavigateHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600 dark:text-red-500" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            {status === 'loading' && 'Verifying Your Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* Message */}
          <div className="text-slate-600 dark:text-slate-400">
            {status === 'loading' && (
              <p>Please wait while we verify your email address.</p>
            )}
            {status === 'success' && (
              <p>
                Your email has been successfully verified. You can now enjoy all the features of pbtrivia-vibe!
              </p>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {errorMessage}
                </p>
                <p className="text-sm">
                  You can request a new verification email from your profile page.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {status !== 'loading' && (
            <div className="pt-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={handleNavigateHome}
              >
                {status === 'success' ? 'Go to Home' : 'Back to Home'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
