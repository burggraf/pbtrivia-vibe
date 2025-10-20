import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ThemeToggle from '@/components/ThemeToggle'
import pb from '@/lib/pocketbase'

interface AuthFormData {
  email: string
  password: string
  passwordConfirm?: string
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [userMode, setUserMode] = useState<'host' | 'player'>('player')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    passwordConfirm: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await pb.collection('users').authWithPassword(formData.email, formData.password)
      console.log('Login successful, auth state:', pb.authStore.isValid)
      console.log('User mode:', userMode)
      setSuccess('Login successful!')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await pb.collection('users').create({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm
      })

      setSuccess('Registration successful! Please check your email to verify your account.')
      setMode('login')
      setFormData({ email: '', password: '', passwordConfirm: '' })
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await pb.collection('users').requestPasswordReset(formData.email)
      setSuccess('Password reset email sent! Please check your inbox.')
      setFormData({ email: '', password: '', passwordConfirm: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  // Redirect effect - if user is authenticated, redirect to appropriate page
  useEffect(() => {
    if (pb.authStore.isValid && success) {
      // Small delay to show success message
      const timer = setTimeout(() => {
        const targetRoute = userMode === 'host' ? '/host' : '/lobby'
        console.log('Redirect effect triggered, navigating to:', targetRoute)
        navigate(targetRoute)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [pb.authStore.isValid, success, userMode, navigate])

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Enter your credentials to access your account'
              : mode === 'register'
              ? 'Enter your details to create a new account'
              : 'Enter your email to receive a password reset link'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Host/Player Mode Selector */}
            <div className="space-y-3">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">Login as:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={userMode === 'player' ? 'default' : 'outline'}
                  onClick={() => setUserMode('player')}
                  className={`flex-1 ${
                    userMode === 'player'
                      ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Player
                </Button>
                <Button
                  type="button"
                  variant={userMode === 'host' ? 'default' : 'outline'}
                  onClick={() => setUserMode('host')}
                  className={`flex-1 ${
                    userMode === 'host'
                      ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Host
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-slate-200 dark:focus:ring-slate-700"
              />
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-slate-200 dark:focus:ring-slate-700"
                />
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                  className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-slate-200 dark:focus:ring-slate-700"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded-md text-sm">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400 space-y-2">
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccess('')
                }}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
              >
                Back to Login
              </button>
            )}

            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setError('')
                    setSuccess('')
                  }}
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
                >
                  Don't have an account? Sign up
                </button>
                <div className="block">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setError('')
                      setSuccess('')
                    }}
                    className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
                  >
                    Forgot your password?
                  </button>
                </div>
              </>
            )}

            {mode === 'register' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccess('')
                }}
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}