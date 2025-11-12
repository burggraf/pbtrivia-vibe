import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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

  // Use ref to avoid stale closure in display subscription
  const gameIdRef = useRef<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // Initialize display: check credentials, register/login, create/update display record
  const initialize = useCallback(async () => {
    try {
      console.log('🔄 Starting display initialization...')
      setConnectionStatus('reconnecting')

      // Check if PocketBase URL has changed - if so, clear credentials
      const storedUrl = localStorage.getItem('pbUrl')
      const currentUrl = pb.baseUrl
      if (storedUrl && storedUrl !== currentUrl) {
        console.log('🔄 PocketBase URL changed, clearing credentials', {
          old: storedUrl,
          new: currentUrl
        })
        localStorage.removeItem(STORAGE_KEYS.DISPLAY_ID)
        localStorage.removeItem(STORAGE_KEYS.DISPLAY_PASSWORD)
      }
      localStorage.setItem('pbUrl', currentUrl)

      // Check localStorage for existing credentials
      let storedId = localStorage.getItem(STORAGE_KEYS.DISPLAY_ID)
      let storedPassword = localStorage.getItem(STORAGE_KEYS.DISPLAY_PASSWORD)
      console.log('💾 Stored credentials:', { hasId: !!storedId, hasPassword: !!storedPassword })

      // If no credentials, generate new ones
      if (!storedId || !storedPassword) {
        console.log('🆕 Generating new credentials...')
        storedId = generateDisplayId()
        storedPassword = generateDisplayPassword()
        localStorage.setItem(STORAGE_KEYS.DISPLAY_ID, storedId)
        localStorage.setItem(STORAGE_KEYS.DISPLAY_PASSWORD, storedPassword)

        // Register new user
        console.log('📝 Registering new user:', getDisplayEmail(storedId))
        await pb.collection('users').create({
          email: getDisplayEmail(storedId),
          password: storedPassword,
          passwordConfirm: storedPassword,
        })
        console.log('✅ User registered successfully')
      }

      // Login
      console.log('🔑 Logging in:', getDisplayEmail(storedId))
      const authData = await pb.collection('users').authWithPassword(
        getDisplayEmail(storedId),
        storedPassword
      )
      console.log('✅ Logged in successfully, userId:', authData.record.id)

      setDisplayId(storedId)
      setDisplayPassword(storedPassword)
      setIsAuthenticated(true)
      setUserId(authData.record.id)

      // Query for existing display record
      console.log('🔍 Querying for existing display records...')
      const records = await pb
        .collection('displays')
        .getFullList<DisplaysRecord>({
          filter: `display_user = "${authData.record.id}"`,
        })
      console.log('📋 Found', records.length, 'existing display record(s)')

      let record: DisplaysRecord
      if (records.length > 0) {
        // Update existing record only if it's not currently claimed
        record = records[0]
        console.log('📺 Existing record state:', {
          available: record.available,
          hasGame: !!record.game,
          code: record.code
        })

        if (record.available && !record.game) {
          // Display is available and not claimed, just use it as-is
          console.log('📺 Using existing available display record')
        } else if (record.game) {
          // Display is claimed - don't reset it!
          console.log('📺 Display is already claimed, keeping claim')
        } else {
          // Display exists but is unavailable (not claimed) - reset it
          console.log('📺 Resetting unavailable display record')
          const newCode = generateDisplayCode()
          record = await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
            available: true,
            host: null,
            game: null,
            code: newCode,
            metadata: records[0].metadata || { theme: 'dark' },
          })
          console.log('✅ Display record reset with new code:', newCode)
        }
      } else {
        // Create new record
        console.log('📺 Creating new display record')
        const newCode = generateDisplayCode()
        record = await pb.collection('displays').create<DisplaysRecord>({
          display_user: authData.record.id,
          available: true,
          host: null,
          game: null,
          code: newCode,
          metadata: { theme: 'dark' },
        })
        console.log('✅ Display record created with code:', newCode)
      }

      setDisplayRecord(record)
      setCode(record.code || generateDisplayCode())

      // Set screen based on whether display is claimed
      if (record.game) {
        setCurrentScreen('game')
        setGameId(record.game)
        gameIdRef.current = record.game
      } else {
        setCurrentScreen('code')
      }

      setConnectionStatus('connected')

      console.log('🎧 Subscribing to display record changes:', record.id)
      // Subscribe to display record changes
      await pb.collection('displays').subscribe<DisplaysRecord>(record.id, (e) => {
        console.log('🖥️ Display subscription update:', {
          hasGame: !!e.record.game,
          currentGameId: gameIdRef.current,
          available: e.record.available,
          status: e.action
        })
        setDisplayRecord(e.record)

        // Check if display was claimed (game assigned)
        if (e.record.game && !gameIdRef.current) {
          console.log('✅ Display claimed, game assigned:', e.record.game)
          setGameId(e.record.game)
          gameIdRef.current = e.record.game
          setCurrentScreen('game')
        }

        // Check if display was released (game removed)
        if (!e.record.game && gameIdRef.current) {
          console.log('❌ Display released, game removed')
          setGameId(null)
          gameIdRef.current = null
          setGameRecord(null)
          setCurrentScreen('code')

          // Only update if not already available (prevents duplicate updates)
          if (!e.record.available) {
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
          } else {
            // Already updated by game completion handler, just set the code
            setCode(e.record.code || generateDisplayCode())
          }
        }
      })
      console.log('✅ Display initialization complete!')
    } catch (err) {
      console.error('❌ Initialization error:', err)

      // Extract detailed error information from PocketBase ClientResponseError
      let errorMessage = 'Unknown error'
      let errorCode = 0
      let errorData: any = null

      if (err && typeof err === 'object') {
        const pbError = err as any
        errorMessage = pbError.message || pbError.toString()
        errorCode = pbError.status || pbError.code || 0
        errorData = pbError.data || pbError.response || null

        console.error('Full error object:', {
          message: errorMessage,
          status: errorCode,
          data: errorData,
          url: pbError.url,
          isAbort: pbError.isAbort,
          originalError: pbError.originalError
        })
      }

      setError(`Failed to initialize display: ${errorMessage} (${errorCode}). Retrying...`)
      setConnectionStatus('disconnected')

      // Retry after 5 seconds
      setTimeout(initialize, 5000)
    }
  }, [])

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
        console.log('🎮 Fetching game:', gameId)
        const game = await pb.collection('games').getOne<GamesRecord>(gameId)
        console.log('🎮 Game fetched:', { id: game.id, status: game.status, state: game.data?.state })
        setGameRecord(game)

        // Check if game is already completed
        if (game.status === 'completed') {
          console.log('🏁 Game already completed, releasing display')
          // Set gameId to null FIRST to prevent display subscription from triggering
          setGameId(null)
          gameIdRef.current = null
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

        console.log('✅ Game active, subscribing to updates')
        // Subscribe to game updates
        unsubscribe = await pb.collection('games').subscribe<GamesRecord>(gameId, (e) => {
          console.log('🎮 Game update received:', { status: e.record.status, state: e.record.data?.state })
          setGameRecord(e.record)

          // Check if game completed
          if (e.record.status === 'completed') {
            console.log('🏁 Game completed, releasing display')
            // Set gameId to null FIRST to prevent display subscription from triggering
            setGameId(null)
            gameIdRef.current = null
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

  // Initialize once on mount
  useEffect(() => {
    initialize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
