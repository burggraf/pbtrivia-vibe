import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  name?: string
}

interface OAuth2Provider {
  name: string
  displayName: string
  authUrl: string
  codeVerifier: string
  codeChallenge: string
  state: string
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const roleParam = searchParams.get('role') as 'host' | 'player' | null
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [userMode, setUserMode] = useState<'host' | 'player'>(roleParam || 'player')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    passwordConfirm: '',
    name: ''
  })
  const [oauthProviders, setOauthProviders] = useState<OAuth2Provider[]>([])

  // Load OAuth providers on mount
  useEffect(() => {
    const loadOAuthProviders = async () => {
      try {
        const authMethods = await pb.collection('users').listAuthMethods() as any

        // OAuth providers are in oauth2.providers in PocketBase 0.30.x
        const providers = authMethods.oauth2?.providers || []

        if (providers && providers.length > 0) {
          const oauthProviders: OAuth2Provider[] = providers.map((provider: any) => ({
            name: provider.name,
            displayName: provider.displayName,
            authUrl: provider.authUrl,
            codeVerifier: '',
            codeChallenge: '',
            state: provider.state || ''
          }))
          setOauthProviders(oauthProviders)
        }
      } catch (err) {
        console.error('Failed to load OAuth providers:', err)
      }
    }

    loadOAuthProviders()
  }, [])

  // No callback handling needed - authWithOAuth2 handles everything!

  const handleOAuthLogin = async (providerName: string) => {
    try {
      setLoading(true)
      setError('')

      // Store user mode before OAuth redirect
      localStorage.setItem('oauth2_userMode', userMode)

      // Use PocketBase's all-in-one OAuth2 method
      // This opens a popup and handles everything automatically
      await pb.collection('users').authWithOAuth2({
        provider: providerName,
      })

      setSuccess('Login successful!')

    } catch (err: any) {
      console.error('OAuth login error:', err)
      setError(err.message || 'Failed to authenticate with Google')
    } finally {
      setLoading(false)
    }
  }

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
      // Create the user account
      await pb.collection('users').create({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name
      })

      // Request email verification
      try {
        await pb.collection('users').requestVerification(formData.email)
      } catch (verificationErr) {
        // Log but don't fail registration if verification email fails
        console.warn('Failed to send verification email:', verificationErr)
      }

      // Auto-login after successful registration
      await pb.collection('users').authWithPassword(formData.email, formData.password)

      setSuccess('Account created successfully! Please check your email to verify your account.')
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
      setFormData({ email: '', password: '', passwordConfirm: '', name: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  // Redirect effect - if user is authenticated, redirect to appropriate page
  useEffect(() => {
    if (pb.authStore.isValid && success) {
      if (returnTo) {
        navigate(returnTo)
      } else {
        // Check if we have a stored userMode from OAuth login
        const storedUserMode = localStorage.getItem('oauth2_userMode') as 'host' | 'player' | null
        const effectiveUserMode = storedUserMode || userMode

        // Clean up stored userMode
        if (storedUserMode) {
          localStorage.removeItem('oauth2_userMode')
        }

        const targetRoute = effectiveUserMode === 'host' ? '/host' : '/lobby'
        navigate(targetRoute)
      }
    }
  }, [success, userMode, returnTo, navigate])

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-1 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
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

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-slate-200 dark:focus:ring-slate-700"
                />
              </div>
            )}

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
              className="w-full min-h-11 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </Button>

            {/* OAuth Login Options */}
            {(mode === 'login' || mode === 'register') && oauthProviders.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.name}
                    type="button"
                    variant="outline"
                    className="w-full min-h-11 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={() => handleOAuthLogin(provider.name)}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {mode === 'login' ? 'Sign in' : 'Sign up'} with {provider.displayName}
                  </Button>
                ))}
              </div>
            )}

            {/* Host/Player Mode Selector - Moved to bottom for better mobile keyboard UX */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Login as:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={userMode === 'player' ? 'default' : 'outline'}
                  onClick={() => setUserMode('player')}
                  className={`flex-1 min-h-11 ${
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
                  className={`flex-1 min-h-11 ${
                    userMode === 'host'
                      ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Host
                </Button>
              </div>
            </div>
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