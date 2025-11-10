import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import pb from '@/lib/pocketbase'
import {
  generateDisplayId,
  generateDisplayPassword,
  generateDisplayCode,
  getDisplayEmail,
  STORAGE_KEYS,
} from '@/lib/crypto'
import type { DisplaysRecord, GamesRecord } from '@/types/pocketbase-types'

type DisplayScreen = 'code' | 'game' | 'error'
type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

interface DisplayState {
  // Auth & Identity
  displayId: string | null
  displayPassword: string | null
  isAuthenticated: boolean
  userId: string | null

  // Display Record
  displayRecord: DisplaysRecord | null
  code: string | null

  // Game Connection
  gameId: string | null
  gameRecord: GamesRecord | null

  // UI State
  currentScreen: DisplayScreen
  connectionStatus: ConnectionStatus
  error: string | null
  theme: 'light' | 'dark'

  // Actions
  initialize: () => Promise<void>
  clearError: () => void
}

const DisplayContext = createContext<DisplayState | undefined>(undefined)

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [displayId, setDisplayId] = useState<string | null>(null)
  const [displayPassword, setDisplayPassword] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayRecord, setDisplayRecord] = useState<DisplaysRecord | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [gameRecord, setGameRecord] = useState<GamesRecord | null>(null)
  const [currentScreen, setCurrentScreen] = useState<DisplayScreen>('code')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const clearError = useCallback(() => setError(null), [])

  // Initialize display: check credentials, register/login, create/update display record
  const initialize = useCallback(async () => {
    try {
      setConnectionStatus('reconnecting')

      // Check localStorage for existing credentials
      let storedId = localStorage.getItem(STORAGE_KEYS.DISPLAY_ID)
      let storedPassword = localStorage.getItem(STORAGE_KEYS.DISPLAY_PASSWORD)

      // If no credentials, generate new ones
      if (!storedId || !storedPassword) {
        storedId = generateDisplayId()
        storedPassword = generateDisplayPassword()
        localStorage.setItem(STORAGE_KEYS.DISPLAY_ID, storedId)
        localStorage.setItem(STORAGE_KEYS.DISPLAY_PASSWORD, storedPassword)

        // Register new user
        await pb.collection('users').create({
          email: getDisplayEmail(storedId),
          password: storedPassword,
          passwordConfirm: storedPassword,
        })
      }

      // Login
      const authData = await pb.collection('users').authWithPassword(
        getDisplayEmail(storedId),
        storedPassword
      )

      setDisplayId(storedId)
      setDisplayPassword(storedPassword)
      setIsAuthenticated(true)
      setUserId(authData.record.id)

      // Query for existing display record
      const records = await pb
        .collection('displays')
        .getFullList<DisplaysRecord>({
          filter: `display_user = "${authData.record.id}"`,
        })

      const newCode = generateDisplayCode()

      let record: DisplaysRecord
      if (records.length > 0) {
        // Update existing record
        record = await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
          available: true,
          host: null,
          game: null,
          code: newCode,
          metadata: records[0].metadata || { theme: 'dark' },
        })
      } else {
        // Create new record
        record = await pb.collection('displays').create<DisplaysRecord>({
          display_user: authData.record.id,
          available: true,
          host: null,
          game: null,
          code: newCode,
          metadata: { theme: 'dark' },
        })
      }

      setDisplayRecord(record)
      setCode(newCode)
      setCurrentScreen('code')
      setConnectionStatus('connected')

      // Subscribe to display record changes
      pb.collection('displays').subscribe<DisplaysRecord>(record.id, (e) => {
        setDisplayRecord(e.record)

        // Check if display was claimed (game assigned)
        if (e.record.game && !gameId) {
          setGameId(e.record.game)
          setCurrentScreen('game')
        }

        // Check if display was released (game removed)
        if (!e.record.game && gameId) {
          setGameId(null)
          setGameRecord(null)
          setCurrentScreen('code')

          // Generate new code and update display
          const newCode = generateDisplayCode()
          pb.collection('displays').update<DisplaysRecord>(record.id, {
            code: newCode,
            available: true,
            host: null,
          }).then((updated) => {
            setDisplayRecord(updated)
            setCode(newCode)
          })
        }
      })
    } catch (err) {
      console.error('Initialization error:', err)
      setError('Failed to initialize display. Retrying...')
      setConnectionStatus('disconnected')

      // Retry after 5 seconds
      setTimeout(initialize, 5000)
    }
  }, [gameId])

  // Apply theme from displayRecord metadata
  useEffect(() => {
    if (displayRecord?.metadata?.theme) {
      const newTheme = displayRecord.metadata.theme
      setTheme(newTheme)

      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Default to dark theme
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [displayRecord?.metadata?.theme])

  // Subscribe to game when gameId changes
  useEffect(() => {
    if (!gameId) return

    let unsubscribe: (() => void) | undefined

    const subscribeToGame = async () => {
      try {
        const game = await pb.collection('games').getOne<GamesRecord>(gameId)
        setGameRecord(game)

        // Check if game is already completed
        if (game.status === 'completed') {
          // Set gameId to null FIRST to prevent display subscription from triggering
          setGameId(null)
          setGameRecord(null)
          setCurrentScreen('code')

          // Return to code screen
          if (displayRecord) {
            const newCode = generateDisplayCode()
            const updated = await pb.collection('displays').update<DisplaysRecord>(displayRecord.id, {
              host: null,
              game: null,
              available: true,
              code: newCode,
            })
            setDisplayRecord(updated)
            setCode(newCode)
          }
          return
        }

        // Subscribe to game updates
        unsubscribe = await pb.collection('games').subscribe<GamesRecord>(gameId, (e) => {
          setGameRecord(e.record)

          // Check if game completed
          if (e.record.status === 'completed') {
            // Set gameId to null FIRST to prevent display subscription from triggering
            setGameId(null)
            setGameRecord(null)
            setCurrentScreen('code')

            // Return to code screen
            if (displayRecord) {
              const newCode = generateDisplayCode()
              pb.collection('displays').update<DisplaysRecord>(displayRecord.id, {
                host: null,
                game: null,
                available: true,
                code: newCode,
              }).then((updated) => {
                setDisplayRecord(updated)
                setCode(newCode)
              })
            }
          }
        })
      } catch (err) {
        console.error('Game subscription error:', err)
        setError('Failed to connect to game')
      }
    }

    subscribeToGame()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [gameId, displayRecord])

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Handle beforeunload to mark display unavailable
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (displayRecord) {
        // Best effort - not reliable for crashes
        pb.collection('displays').update(displayRecord.id, {
          available: false,
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [displayRecord])

  const value: DisplayState = {
    displayId,
    displayPassword,
    isAuthenticated,
    userId,
    displayRecord,
    code,
    gameId,
    gameRecord,
    currentScreen,
    connectionStatus,
    error,
    theme,
    initialize,
    clearError,
  }

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
}

export function useDisplay() {
  const context = useContext(DisplayContext)
  if (context === undefined) {
    throw new Error('useDisplay must be used within DisplayProvider')
  }
  return context
}
