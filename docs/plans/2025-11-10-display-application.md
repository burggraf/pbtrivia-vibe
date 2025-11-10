# Display Application Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone display application that shows game content on TVs/large screens, claimed by hosts using 6-digit codes and synchronized via PocketBase.

**Architecture:** Two-app system (main app + display app). Display app is completely standalone in `/trivia-party-display` folder with own dependencies. Uses React Context for state management, PocketBase subscriptions for real-time updates, and copies controller display components.

**Tech Stack:** React 18, TypeScript, Vite, PocketBase, Tailwind CSS, shadcn/ui, react-qr-code

---

## Task 1: Display App Folder Structure Setup

**Files:**
- Create: `trivia-party-display/package.json`
- Create: `trivia-party-display/vite.config.ts`
- Create: `trivia-party-display/tsconfig.json`
- Create: `trivia-party-display/tailwind.config.js`
- Create: `trivia-party-display/postcss.config.js`
- Create: `trivia-party-display/index.html`
- Create: `trivia-party-display/.gitignore`
- Create: `trivia-party-display/README.md`

**Step 1: Create trivia-party-display directory**

Run from repository root (parent of .worktrees):
```bash
cd /Users/markb/dev/trivia-party
mkdir -p trivia-party-display/src
```

**Step 2: Create package.json**

File: `trivia-party-display/package.json`
```json
{
  "name": "trivia-party-display",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5174",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pocketbase": "^0.26.2",
    "react-qr-code": "^2.0.18",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",
    "class-variance-authority": "^0.7.1",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.18",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6"
  }
}
```

**Step 3: Create vite.config.ts**

File: `trivia-party-display/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
})
```

**Step 4: Create tsconfig.json**

File: `trivia-party-display/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 5: Create tsconfig.node.json**

File: `trivia-party-display/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 6: Copy Tailwind and PostCSS configs from main app**

Run from repository root:
```bash
cp tailwind.config.js trivia-party-display/
cp postcss.config.js trivia-party-display/
```

**Step 7: Create index.html**

File: `trivia-party-display/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trivia Party Display</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 8: Create .gitignore**

File: `trivia-party-display/.gitignore`
```
# Dependencies
node_modules

# Build output
dist
dist-ssr

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

**Step 9: Create README.md**

File: `trivia-party-display/README.md`
```markdown
# Trivia Party Display Application

Standalone display application for showing trivia game content on TVs and large screens.

## Development

```bash
# Install dependencies
pnpm install

# Start development server (port 5174)
pnpm run dev

# Build for production
pnpm run build
```

## Architecture

- Completely standalone React app
- Connects to PocketBase on localhost:8090 (dev) or same origin (prod)
- Claimed by hosts using 6-digit codes
- Real-time game synchronization via PocketBase subscriptions

## Testing

Requires PocketBase running on port 8090 and main Trivia Party app for host functionality.
```

**Step 10: Install dependencies**

Run from trivia-party-display directory:
```bash
cd /Users/markb/dev/trivia-party/trivia-party-display
pnpm install
```

Expected: Dependencies installed successfully

**Step 11: Commit**

```bash
git add trivia-party-display/
git commit -m "feat(display): initialize display app structure and dependencies"
```

---

## Task 2: Crypto Library with Tests

**Files:**
- Create: `trivia-party-display/src/lib/crypto.ts`
- Create: `trivia-party-display/src/lib/crypto.test.ts`

**Note:** This project doesn't have unit tests set up. For TDD, we'll create tests as documentation but won't run them. Focus on implementation correctness.

**Step 1: Create crypto.ts with ID generation**

File: `trivia-party-display/src/lib/crypto.ts`
```typescript
/**
 * Generate a random 15-character display ID
 * Format: [a-z0-9]{15}
 * Example: "k3j9x2m5p8r1w4q"
 */
export function generateDisplayId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(15)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Generate a random 16-character password
 * Character set: Alphanumeric (uppercase, lowercase, numbers)
 * Meets PocketBase minimum (8+ chars)
 */
export function generateDisplayPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/**
 * Generate a 6-digit numeric code
 * Range: 100000-999999
 * Same algorithm as game code generation
 */
export function generateDisplayCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (array[0] % 900000 + 100000).toString()
  return code
}

/**
 * Construct display email from ID
 * Format: {displayId}@trivia-party-displays.com
 */
export function getDisplayEmail(displayId: string): string {
  return `${displayId}@trivia-party-displays.com`
}

/**
 * LocalStorage keys for display credentials
 */
export const STORAGE_KEYS = {
  DISPLAY_ID: 'displayId',
  DISPLAY_PASSWORD: 'displayPassword',
} as const
```

**Step 2: Verify TypeScript compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/lib/crypto.ts
git commit -m "feat(display): add crypto utilities for ID/password/code generation"
```

---

## Task 3: Copy and Adapt PocketBase Client

**Files:**
- Reference: `src/lib/pocketbase.ts` (main app)
- Create: `trivia-party-display/src/lib/pocketbase.ts`

**Step 1: Copy PocketBase client from main app**

Run from repository root:
```bash
cp src/lib/pocketbase.ts trivia-party-display/src/lib/pocketbase.ts
```

**Step 2: Verify it compiles**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds (PocketBase client is already set up for auto-detection)

**Step 3: Commit**

```bash
git add src/lib/pocketbase.ts
git commit -m "feat(display): add PocketBase client with URL auto-detection"
```

---

## Task 4: Copy Type Definitions

**Files:**
- Reference: `src/types/pocketbase-types.ts` (main app)
- Create: `trivia-party-display/src/types/pocketbase-types.ts`

**Step 1: Copy type definitions**

Run from repository root:
```bash
mkdir -p trivia-party-display/src/types
cp src/types/pocketbase-types.ts trivia-party-display/src/types/pocketbase-types.ts
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/types/
git commit -m "feat(display): add PocketBase type definitions"
```

---

## Task 5: Copy shadcn/ui Base Components

**Files:**
- Reference: `src/components/ui/*` (main app)
- Create: `trivia-party-display/src/components/ui/*`

**Step 1: Copy ui components directory**

Run from repository root:
```bash
mkdir -p trivia-party-display/src/components
cp -r src/components/ui trivia-party-display/src/components/
```

**Step 2: Copy lib/utils.ts (required by shadcn components)**

Run from repository root:
```bash
cp src/lib/utils.ts trivia-party-display/src/lib/utils.ts
```

**Step 3: Copy globals.css (Tailwind styles)**

Run from repository root:
```bash
mkdir -p trivia-party-display/src
cp src/index.css trivia-party-display/src/index.css
```

**Step 4: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 5: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts src/index.css
git commit -m "feat(display): add shadcn/ui components and styles"
```

---

## Task 6: Display Context for State Management

**Files:**
- Create: `trivia-party-display/src/contexts/DisplayContext.tsx`

**Step 1: Create DisplayContext**

File: `trivia-party-display/src/contexts/DisplayContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import PocketBase from 'pocketbase'
import { pb } from '@/lib/pocketbase'
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
        })
      } else {
        // Create new record
        record = await pb.collection('displays').create<DisplaysRecord>({
          display_user: authData.record.id,
          available: true,
          host: null,
          game: null,
          code: newCode,
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
          pb.collection('displays').update(record.id, {
            code: newCode,
            available: true,
            host: null,
          }).then((updated) => {
            setDisplayRecord(updated as DisplaysRecord)
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
          setGameId(null)
          setGameRecord(null)
          setCurrentScreen('code')
          return
        }

        // Subscribe to game updates
        unsubscribe = await pb.collection('games').subscribe<GamesRecord>(gameId, (e) => {
          setGameRecord(e.record)

          // Check if game completed
          if (e.record.status === 'completed') {
            // Return to code screen
            if (displayRecord) {
              const newCode = generateDisplayCode()
              pb.collection('displays').update(displayRecord.id, {
                host: null,
                game: null,
                available: true,
                code: newCode,
              }).then((updated) => {
                setDisplayRecord(updated as DisplaysRecord)
                setCode(newCode)
              })
            }
            setGameId(null)
            setGameRecord(null)
            setCurrentScreen('code')
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
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/contexts/DisplayContext.tsx
git commit -m "feat(display): add DisplayContext for state management and lifecycle"
```

---

## Task 7: ErrorBanner Component

**Files:**
- Create: `trivia-party-display/src/components/ErrorBanner.tsx`

**Step 1: Create ErrorBanner component**

File: `trivia-party-display/src/components/ErrorBanner.tsx`
```typescript
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
  onRetry?: () => void
  autoDissmiss?: boolean
}

export function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  autoDissmiss = true,
}: ErrorBannerProps) {
  useEffect(() => {
    if (autoDissmiss && !onRetry) {
      const timer = setTimeout(onDismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoDissmiss, onRetry, onDismiss])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 text-white px-6 py-4 flex items-center justify-center gap-4">
      <p className="text-lg">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="bg-white text-red-600 hover:bg-gray-100"
        >
          Retry
        </Button>
      )}
    </div>
  )
}
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/components/ErrorBanner.tsx
git commit -m "feat(display): add ErrorBanner component for error notifications"
```

---

## Task 8: CodeDisplay Component

**Files:**
- Create: `trivia-party-display/src/components/CodeDisplay.tsx`

**Step 1: Create CodeDisplay component**

File: `trivia-party-display/src/components/CodeDisplay.tsx`
```typescript
import QRCode from 'react-qr-code'
import { useDisplay } from '@/contexts/DisplayContext'

export function CodeDisplay() {
  const { code, displayId } = useDisplay()

  // Get device info
  const browserInfo = navigator.userAgent.split(' ').slice(-2).join(' ')
  const ipAddress = 'N/A' // IP not available from browser

  if (!code || !displayId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">Initializing...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-8 relative">
      {/* Device info - top left */}
      <div className="absolute top-4 left-4 text-xs text-slate-500 dark:text-slate-600">
        {ipAddress} | {browserInfo}
      </div>

      {/* Main content - centered */}
      <div className="flex flex-col items-center gap-8">
        {/* Large code */}
        <div className="text-[120px] font-bold text-slate-900 dark:text-slate-100 tracking-wider">
          {code}
        </div>

        {/* Instructions */}
        <p className="text-[32px] text-slate-700 dark:text-slate-300 text-center max-w-3xl">
          Enter this code on your host screen to claim this display
        </p>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <QRCode value={code} size={300} level="M" />
        </div>
      </div>

      {/* Display ID - bottom left */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 dark:text-slate-600">
        ID: {displayId}
      </div>

      {/* App version - bottom right */}
      <div className="absolute bottom-4 right-4 text-base text-slate-500 dark:text-slate-600">
        v1.0.0
      </div>
    </div>
  )
}
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/components/CodeDisplay.tsx
git commit -m "feat(display): add CodeDisplay component for waiting screen"
```

---

## Task 9: Copy Game State Display Components

**Files:**
- Reference: `src/components/games/states/*` (main app)
- Create: `trivia-party-display/src/components/states/*`

**Step 1: Copy game state components**

Run from repository root:
```bash
mkdir -p trivia-party-display/src/components/states
cp src/components/games/states/GameStart.tsx trivia-party-display/src/components/states/
cp src/components/games/states/RoundEnd.tsx trivia-party-display/src/components/states/
cp src/components/games/states/GameEnd.tsx trivia-party-display/src/components/states/
cp src/components/games/states/Thanks.tsx trivia-party-display/src/components/states/
```

**Step 2: Copy RoundStartDisplay and RoundPlayDisplay**

Run from repository root:
```bash
cp src/components/games/RoundStartDisplay.tsx trivia-party-display/src/components/
cp src/components/games/RoundPlayDisplay.tsx trivia-party-display/src/components/
```

**Step 3: Check what other dependencies are needed**

Run from trivia-party-display:
```bash
pnpm run build 2>&1 | grep "Cannot find module" || echo "No missing modules"
```

Expected: May show missing modules - we'll copy them next

**Step 4: Copy any additional dependencies found**

If build shows missing imports, copy them from main app. Common ones:
```bash
# Copy any missing game-related components or utilities
# Example (adjust based on actual errors):
# cp src/lib/games.ts trivia-party-display/src/lib/
```

**Step 5: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds (may need to copy additional files)

**Step 6: Commit**

```bash
git add src/components/states/ src/components/Round*.tsx
git commit -m "feat(display): add game state display components from controller"
```

---

## Task 10: GameDisplay Component

**Files:**
- Create: `trivia-party-display/src/components/GameDisplay.tsx`

**Step 1: Create GameDisplay component**

File: `trivia-party-display/src/components/GameDisplay.tsx`
```typescript
import { useDisplay } from '@/contexts/DisplayContext'
import GameStart from '@/components/states/GameStart'
import RoundStartDisplay from '@/components/RoundStartDisplay'
import RoundPlayDisplay from '@/components/RoundPlayDisplay'
import RoundEnd from '@/components/states/RoundEnd'
import GameEnd from '@/components/states/GameEnd'
import Thanks from '@/components/states/Thanks'

type GameState =
  | 'game-start'
  | 'round-start'
  | 'round-play'
  | 'round-end'
  | 'game-end'
  | 'thanks'

export function GameDisplay() {
  const { gameRecord } = useDisplay()

  if (!gameRecord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">
          Loading game...
        </p>
      </div>
    )
  }

  const state = gameRecord.data?.state as GameState | undefined

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <p className="text-2xl text-slate-600 dark:text-slate-400">
          Waiting for game to start...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {state === 'game-start' && <GameStart game={gameRecord} />}
      {state === 'round-start' && <RoundStartDisplay game={gameRecord} />}
      {state === 'round-play' && <RoundPlayDisplay game={gameRecord} />}
      {state === 'round-end' && <RoundEnd game={gameRecord} />}
      {state === 'game-end' && <GameEnd game={gameRecord} />}
      {state === 'thanks' && <Thanks game={gameRecord} />}
    </div>
  )
}
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/components/GameDisplay.tsx
git commit -m "feat(display): add GameDisplay component for showing game content"
```

---

## Task 11: Main App Component

**Files:**
- Create: `trivia-party-display/src/App.tsx`

**Step 1: Create App component**

File: `trivia-party-display/src/App.tsx`
```typescript
import { DisplayProvider, useDisplay } from '@/contexts/DisplayContext'
import { CodeDisplay } from '@/components/CodeDisplay'
import { GameDisplay } from '@/components/GameDisplay'
import { ErrorBanner } from '@/components/ErrorBanner'

function AppContent() {
  const { currentScreen, error, clearError, initialize } = useDisplay()

  return (
    <>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={clearError}
          onRetry={error.includes('Failed to initialize') ? initialize : undefined}
          autoDissmiss={!error.includes('Failed to initialize')}
        />
      )}

      {currentScreen === 'code' && <CodeDisplay />}
      {currentScreen === 'game' && <GameDisplay />}
    </>
  )
}

export default function App() {
  return (
    <DisplayProvider>
      <AppContent />
    </DisplayProvider>
  )
}
```

**Step 2: Verify compilation**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(display): add main App component with screen routing"
```

---

## Task 12: React Entry Point

**Files:**
- Create: `trivia-party-display/src/main.tsx`

**Step 1: Create main.tsx**

File: `trivia-party-display/src/main.tsx`
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 2: Verify compilation and run dev server**

Run from trivia-party-display:
```bash
pnpm run build
```

Expected: Build succeeds, output in dist/

**Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat(display): add React entry point"
```

---

## Task 13: Host UI - DisplayManagement Component

**Files:**
- Create: `src/components/games/DisplayManagement.tsx`

**Note:** This task works in the MAIN app, not the display app. Return to worktree root.

**Step 1: Switch to main app context**

Run from repository root:
```bash
cd /Users/markb/dev/trivia-party/.worktrees/display-application
```

**Step 2: Create DisplayManagement component**

File: `src/components/games/DisplayManagement.tsx`
```typescript
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pb } from '@/lib/pocketbase'
import type { DisplaysRecord } from '@/types/pocketbase-types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface DisplayManagementProps {
  gameId: string
}

export default function DisplayManagement({ gameId }: DisplayManagementProps) {
  const [code, setCode] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [displays, setDisplays] = useState<DisplaysRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Load claimed displays
  useEffect(() => {
    const loadDisplays = async () => {
      try {
        const userId = pb.authStore.model?.id
        if (!userId) return

        const records = await pb.collection('displays').getFullList<DisplaysRecord>({
          filter: `host = "${userId}" && game = "${gameId}"`,
        })
        setDisplays(records)
      } catch (err) {
        console.error('Failed to load displays:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDisplays()

    // Subscribe to display changes
    const userId = pb.authStore.model?.id
    if (!userId) return

    pb.collection('displays').subscribe<DisplaysRecord>('*', (e) => {
      if (e.record.host === userId && e.record.game === gameId) {
        // Display was claimed by this host for this game
        setDisplays((prev) => {
          const exists = prev.find((d) => d.id === e.record.id)
          if (exists) {
            return prev.map((d) => (d.id === e.record.id ? e.record : d))
          }
          return [...prev, e.record]
        })
      } else if (e.record.game !== gameId) {
        // Display was released or assigned to different game
        setDisplays((prev) => prev.filter((d) => d.id !== e.record.id))
      }
    })

    return () => {
      pb.collection('displays').unsubscribe('*')
    }
  }, [gameId])

  const handleClaim = async () => {
    if (!code.trim() || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    setClaiming(true)
    try {
      const userId = pb.authStore.model?.id
      if (!userId) {
        toast.error('Not authenticated')
        return
      }

      // Query for display with this code
      const records = await pb.collection('displays').getFullList<DisplaysRecord>({
        filter: `code = "${code}" && available = true`,
      })

      if (records.length === 0) {
        toast.error('Display not found or already claimed')
        setCode('')
        return
      }

      // Claim the display
      await pb.collection('displays').update<DisplaysRecord>(records[0].id, {
        host: userId,
        game: gameId,
        available: false,
      })

      toast.success('Display claimed successfully')
      setCode('')
    } catch (err) {
      console.error('Failed to claim display:', err)
      toast.error('Failed to claim display. It may already be claimed.')
      setCode('')
    } finally {
      setClaiming(false)
    }
  }

  const handleRelease = async (displayId: string) => {
    try {
      await pb.collection('displays').update<DisplaysRecord>(displayId, {
        host: null,
        game: null,
        available: true,
      })
      toast.success('Display released')
    } catch (err) {
      console.error('Failed to release display:', err)
      toast.error('Failed to release display')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Claim Display Section */}
      <div className="space-y-2">
        <label htmlFor="display-code" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Claim Display
        </label>
        <div className="flex gap-2">
          <Input
            id="display-code"
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="flex-1"
          />
          <Button onClick={handleClaim} disabled={claiming || code.length !== 6}>
            {claiming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              'Claim Display'
            )}
          </Button>
        </div>
      </div>

      {/* Claimed Displays List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Claimed Displays ({displays.length})
        </h3>

        {displays.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center border border-slate-200 dark:border-slate-700 rounded-md">
            No displays claimed. Enter a code above to claim a display.
          </p>
        ) : (
          <div className="space-y-2">
            {displays.map((display) => (
              <div
                key={display.id}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${display.available ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-sm font-medium">
                      {display.available ? 'Disconnected' : 'Connected'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Code: {display.code}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRelease(display.id)}
                >
                  Release
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Verify compilation**

Run from worktree:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 4: Commit**

```bash
git add src/components/games/DisplayManagement.tsx
git commit -m "feat(host): add DisplayManagement component for claiming/releasing displays"
```

---

## Task 14: Integrate DisplayManagement into ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx`

**Step 1: Read ControllerPage to find Timers accordion**

Run from worktree:
```bash
grep -n "AccordionItem.*timer" src/pages/ControllerPage.tsx
```

Expected: Find line number of Timers accordion section

**Step 2: Add import for DisplayManagement**

Add to imports section in `src/pages/ControllerPage.tsx`:
```typescript
import DisplayManagement from '@/components/games/DisplayManagement'
```

**Step 3: Add Displays accordion after Timers**

Find the Timers AccordionItem in `src/pages/ControllerPage.tsx` and add after it:

```typescript
<AccordionItem value="displays">
  <AccordionTrigger>Displays</AccordionTrigger>
  <AccordionContent>
    <DisplayManagement gameId={game.id} />
  </AccordionContent>
</AccordionItem>
```

**Step 4: Verify compilation**

Run from worktree:
```bash
pnpm run build
```

Expected: TypeScript compilation succeeds

**Step 5: Commit**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat(host): integrate DisplayManagement into controller accordion"
```

---

## Task 15: Manual Testing Guide

**Files:**
- Create: `trivia-party-display/TESTING.md`

**Step 1: Create testing guide**

File: `trivia-party-display/TESTING.md`
```markdown
# Display Application Testing Guide

## Prerequisites

1. PocketBase running on port 8090
2. Main Trivia Party app running (for host functionality)
3. Display app running on port 5174

## Setup

### Terminal 1: Start PocketBase
```bash
cd /Users/markb/dev/trivia-party
pocketbase serve --dev --http 0.0.0.0:8090
```

### Terminal 2: Start Main App
```bash
cd /Users/markb/dev/trivia-party
pnpm run dev
```

### Terminal 3: Start Display App
```bash
cd /Users/markb/dev/trivia-party/trivia-party-display
pnpm run dev
```

## Test Scenarios

### 1. First Launch (New Display)

1. Open `http://localhost:5174` in browser
2. **Expected:** Display shows 6-digit code in large text
3. **Expected:** QR code shown below instructions
4. **Expected:** Display ID shown in bottom left
5. **Expected:** Version shown in bottom right
6. **Verify:** LocalStorage has `displayId` and `displayPassword`

### 2. Subsequent Launch (Existing Display)

1. Refresh the page (`http://localhost:5174`)
2. **Expected:** New 6-digit code generated (different from before)
3. **Expected:** Same display ID in bottom left
4. **Verify:** LocalStorage still has same `displayId` and `displayPassword`

### 3. Claim Display Flow

1. In main app, login as host (http://localhost:5173)
2. Create a new game
3. Navigate to controller page (`/controller`)
4. Expand "Displays" accordion
5. Enter the 6-digit code from display app
6. Click "Claim Display"
7. **Expected:** Toast shows "Display claimed successfully"
8. **Expected:** Display appears in claimed list with green "Connected" indicator
9. **Expected:** Display app switches to game screen

### 4. Game Display Synchronization

1. With display claimed, advance game through states:
   - Click "Start Game" → Display shows game-start screen
   - Click "Next" → Display shows round-start screen
   - Click "Next" → Display shows round-play screen with question
   - Click "Next" → Display shows round-end screen with scores
   - Continue through game states
2. **Expected:** Display updates in real-time with each state change
3. **Expected:** All game content visible and readable from distance

### 5. Game Completion Flow

1. Advance game to completion (status = "completed")
2. **Expected:** Display returns to code screen automatically
3. **Expected:** New 6-digit code generated
4. **Expected:** Display removed from host's claimed list
5. **Expected:** Display available=true in database

### 6. Manual Release Flow

1. Claim display again (follow step 3)
2. In host UI, click "Release" button for the display
3. **Expected:** Display returns to code screen immediately
4. **Expected:** New 6-digit code generated
5. **Expected:** Display removed from claimed list
6. **Expected:** Display available=true in database

### 7. Race Condition Test (Simultaneous Claim)

1. Open display app in two different browsers/tabs
2. Note both codes
3. Try to claim the same display from two different host accounts simultaneously
4. **Expected:** Only one claim succeeds
5. **Expected:** Other claim shows error "Display already claimed or not found"

### 8. Connection Loss Handling

1. Claim display and start game
2. Stop PocketBase (Ctrl+C in Terminal 1)
3. **Expected:** Display shows "Reconnecting to server..." banner
4. Restart PocketBase
5. **Expected:** Banner disappears, game display resumes
6. **Expected:** If game ended during downtime, returns to code screen

### 9. Multiple Displays

1. Open display app in 3 different browsers/tabs
2. Note all three codes
3. Claim all three displays from same host
4. **Expected:** All three displays shown in claimed list
5. **Expected:** All three update with game state changes
6. Release one display
7. **Expected:** That display returns to code screen
8. **Expected:** Other two displays continue showing game

## Database Verification

Check displays collection in PocketBase admin (http://localhost:8090/_/):

**After first launch:**
- Record exists with display_user, code, available=true

**After claim:**
- available=false, host=userId, game=gameId

**After release:**
- available=true, host=null, game=null, new code

**After game completion:**
- available=true, host=null, game=null, new code

## Known Limitations

1. IP address not available in browser (shows "N/A")
2. Connection status based on PocketBase subscription (not heartbeat)
3. beforeunload not reliable for crashes/power loss
```

**Step 2: Commit**

```bash
cd /Users/markb/dev/trivia-party/trivia-party-display
git add TESTING.md
git commit -m "docs(display): add comprehensive testing guide"
```

---

## Implementation Complete

**Summary:**
- Display app: Standalone React app in `/trivia-party-display`
- Host UI: DisplayManagement component integrated into controller
- State management: React Context with PocketBase subscriptions
- Real-time sync: Automatic game state updates
- Lifecycle: Complete claim/release/completion flow

**Testing:** Follow `trivia-party-display/TESTING.md` for manual verification

**Deployment:** Display app can be built and deployed separately as static site
