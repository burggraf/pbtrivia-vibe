# QR Code Game Join Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable players to scan QR codes on the Controller page to join games directly, with automatic authentication handling and team selection.

**Architecture:** Add QR code display to ControllerPage using react-qr-code library. Create new /join route that handles unauthenticated users by redirecting through AuthPage with returnTo parameter. Reuse existing game lookup and team selection logic from LobbyPage.

**Tech Stack:** React 18, TypeScript, react-qr-code, React Router, PocketBase

---

## Task 1: Install QR Code Dependency

**Files:**
- Modify: `package.json` (dependencies section)

**Step 1: Install react-qr-code package**

Run:
```bash
npm install react-qr-code
```

Expected output: Package installed successfully, package.json and package-lock.json updated

**Step 2: Verify installation**

Run:
```bash
npm list react-qr-code
```

Expected output: Shows react-qr-code@[version] installed

**Step 3: Commit dependency addition**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-qr-code dependency for QR code generation"
```

---

## Task 2: Create JoinPage Component

**Files:**
- Create: `src/pages/JoinPage.tsx`

**Step 1: Create JoinPage component file**

Create `src/pages/JoinPage.tsx` with the following complete implementation:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import { gamesService } from '@/lib/games'
import pb from '@/lib/pocketbase'

export default function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const code = searchParams.get('code')

  useEffect(() => {
    const handleJoin = async () => {
      // Validate code format
      if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
        setError('Invalid game code format')
        setIsLoading(false)
        return
      }

      // Check authentication
      if (!pb.authStore.isValid) {
        // Redirect to auth page with return URL
        const returnUrl = encodeURIComponent(`/join?code=${code}`)
        navigate(`/?returnTo=${returnUrl}`)
        return
      }

      // User is authenticated, lookup game
      try {
        const game = await gamesService.findGameByCode(code)

        if (!game) {
          setError('Game not found or not available to join')
          setIsLoading(false)
          return
        }

        if (game.status === 'completed') {
          setError('This game has ended and is no longer accepting players')
          setIsLoading(false)
          return
        }

        // Navigate to game page (team selection handled there)
        navigate(`/game/${game.id}`)
      } catch (err: any) {
        console.error('Failed to join game:', err)
        setError('Unable to connect. Please check your connection and try again.')
        setIsLoading(false)
      }
    }

    handleJoin()
  }, [code, navigate])

  const handleRetry = () => {
    setIsLoading(true)
    setError('')
    window.location.reload()
  }

  const handleTryAnother = () => {
    navigate('/lobby')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 md:p-6 lg:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Joining game...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 md:p-6 lg:p-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                Unable to Join Game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300 text-center">
                  {error}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {error.includes('connection') && (
                  <Button
                    onClick={handleRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  >
                    Retry
                  </Button>
                )}
                <Button
                  onClick={handleTryAnother}
                  variant="outline"
                  className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Try Another Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
```

**Step 2: Verify file syntax**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors for JoinPage.tsx

**Step 3: Commit JoinPage component**

```bash
git add src/pages/JoinPage.tsx
git commit -m "feat: create JoinPage component for QR code join flow

- Parse game code from URL query parameter
- Validate code format (6 chars, alphanumeric)
- Redirect to auth if not authenticated
- Lookup game and navigate to GamePage if authenticated
- Handle error states (invalid code, game not found, completed game)
- Mobile-responsive with loading and error states"
```

---

## Task 3: Modify AuthPage to Handle Return URL

**Files:**
- Modify: `src/pages/AuthPage.tsx:101-112` (redirect effect)
- Modify: `src/pages/AuthPage.tsx:17-29` (component state)

**Step 1: Add returnTo state parsing**

In `src/pages/AuthPage.tsx`, after the existing state declarations (around line 29), add:

```tsx
const [searchParams] = useSearchParams()
const returnTo = searchParams.get('returnTo')
```

Also add the import at the top:
```tsx
import { useNavigate, useSearchParams } from 'react-router-dom'
```

**Step 2: Modify redirect effect to use returnTo**

Replace the redirect effect (lines 102-112) with:

```tsx
// Redirect effect - if user is authenticated, redirect to appropriate page
useEffect(() => {
  if (pb.authStore.isValid && success) {
    // Small delay to show success message
    const timer = setTimeout(() => {
      if (returnTo) {
        console.log('Redirecting to returnTo:', returnTo)
        navigate(returnTo)
      } else {
        const targetRoute = userMode === 'host' ? '/host' : '/lobby'
        console.log('Redirect effect triggered, navigating to:', targetRoute)
        navigate(targetRoute)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }
}, [success, userMode, returnTo, navigate])
```

**Step 3: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit AuthPage changes**

```bash
git add src/pages/AuthPage.tsx
git commit -m "feat: add returnTo parameter support in AuthPage

- Parse returnTo query parameter from URL
- Redirect to returnTo URL after successful authentication
- Fallback to original host/lobby logic if no returnTo
- Enables QR code join flow to redirect back after login"
```

---

## Task 4: Add QR Code Display to ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:1-12` (imports)
- Modify: `src/pages/ControllerPage.tsx:670-691` (header section)

**Step 1: Add QR code import**

At the top of `src/pages/ControllerPage.tsx`, add to the imports:

```tsx
import QRCode from 'react-qr-code'
```

**Step 2: Add QR code display in header**

In the header section where game code is displayed (around line 674-691), add the QR code display. Replace the existing header content:

```tsx
<div className="flex justify-between items-center mb-8">
  <div>
    <div className="flex flex-col gap-2">
      <p className="text-slate-600 dark:text-slate-400">
        Game ID: {id} {game && `- ${game.name}`}
      </p>
      {game && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Status:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              game.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              game.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              game.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {game.status.replace('-', ' ')}
            </span>
          </div>
          {/* QR Code Section */}
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Game Code:</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-wider">
                  {game.code}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <QRCode
                  value={`${window.location.origin}/join?code=${game.code}`}
                  size={160}
                  level="M"
                  aria-label={`QR code to join game ${game.code}`}
                />
                <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Scan to join
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
  <div className="flex gap-3 items-center">
```

**Step 3: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit ControllerPage changes**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: add QR code display to ControllerPage

- Import react-qr-code library
- Display QR code below game code in header
- QR encodes join URL: /join?code={GAME_CODE}
- Size: 160x160px with white background for scannability
- Responsive layout with mobile-first design
- Helper text 'Scan to join' below QR code"
```

---

## Task 5: Add /join Route to App

**Files:**
- Modify: `src/App.tsx:1-10` (imports)
- Modify: `src/App.tsx:76-98` (routes)

**Step 1: Import JoinPage**

At the top of `src/App.tsx`, add to the imports:

```tsx
import JoinPage from './pages/JoinPage'
```

**Step 2: Add /join route**

In the Routes section (around line 76-98), add the /join route after the /lobby route:

```tsx
<Route
  path='/lobby'
  element={isAuthenticated ? <LobbyPage /> : <Navigate to='/' replace />}
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
```

**Step 3: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

**Step 4: Commit App.tsx changes**

```bash
git add src/App.tsx
git commit -m "feat: add /join route for QR code game joining

- Import JoinPage component
- Add /join route to router configuration
- Route accessible without authentication (JoinPage handles redirect)
- Enables QR code scanning flow for players"
```

---

## Task 6: Manual Testing & Verification

**Files:**
- No file changes, manual testing only

**Step 1: Start development server**

Run:
```bash
./dev.sh
```

Expected: PocketBase and frontend dev server start successfully

**Step 2: Test QR code display**

1. Navigate to host page and create a game with rounds
2. Set game status to "ready"
3. Click "Play" to open controller page
4. Verify QR code displays below game code
5. Verify "Scan to join" text appears below QR code
6. Test dark mode - verify QR code has white background

Expected: QR code displays correctly in both light and dark modes

**Step 3: Test QR code join flow - unauthenticated user**

1. Open browser in incognito/private mode
2. Scan QR code or manually navigate to `/join?code=ABCD12` (use actual game code)
3. Verify redirect to auth page with returnTo parameter in URL
4. Register a new account
5. Verify redirect back to /join page
6. Verify redirect to game page
7. Verify team selection modal appears

Expected: Complete flow works, user joins game successfully

**Step 4: Test QR code join flow - authenticated user**

1. Log in as a player
2. Scan QR code or navigate to `/join?code=ABCD12`
3. Verify immediate redirect to game page (no auth page)
4. Verify team selection modal appears if not on team

Expected: Direct navigation to game page without auth

**Step 5: Test error cases**

Test the following error scenarios:
1. Invalid code format: `/join?code=ABC` (too short)
2. Non-existent game: `/join?code=XXXXXX`
3. Completed game: Create game, complete it, try to join
4. Missing code: `/join` (no query parameter)

Expected: Appropriate error messages displayed for each case

**Step 6: Test mobile responsiveness**

1. Open browser dev tools
2. Toggle device toolbar (mobile view)
3. Test at 375px, 414px, 768px widths
4. Verify QR code layout adapts properly
5. Verify touch targets are adequate
6. Verify error messages are readable

Expected: Layout works well on mobile devices

**Step 7: Document testing results**

Create testing notes in a comment or file describing:
- What was tested
- Any issues found
- Browser/device compatibility
- Screenshots if applicable

---

## Task 7: Final Integration Testing

**Files:**
- No file changes, integration testing only

**Step 1: End-to-end flow test**

Complete flow with real devices:
1. Host creates game on desktop
2. Host opens controller page
3. Player scans QR code with mobile phone
4. Player registers account on phone
5. Player selects team
6. Host verifies player appears in scoreboard
7. Host starts game
8. Player sees game state on phone

Expected: Complete flow works seamlessly across devices

**Step 2: Final commit**

If any adjustments were made during testing:

```bash
git add .
git commit -m "test: verify QR code join flow end-to-end

- Tested QR code display on controller page
- Verified authentication redirect flow
- Tested error cases and edge conditions
- Confirmed mobile responsiveness
- End-to-end testing with real devices completed"
```

**Step 3: Build verification**

Run final build:
```bash
npm run build
```

Expected: Build succeeds with no errors or warnings

---

## Summary

This implementation adds QR code functionality to enable quick game joining:

1. **Installed react-qr-code** - Lightweight SVG-based QR code library
2. **Created JoinPage** - Handles authentication redirect and game lookup
3. **Modified AuthPage** - Supports returnTo parameter for redirect flow
4. **Added QR code to ControllerPage** - Displays scannable code with game URL
5. **Added /join route** - Enables QR code URL handling
6. **Tested thoroughly** - Verified all flows and error cases

The feature reuses existing game lookup and team selection logic, maintaining code consistency and DRY principles.

**Related Documentation:**
- Design document: `docs/plans/2025-10-31-qr-code-game-join-design.md`
- UI Style Guide: `docs/design/ui-style-guide.md`

**Dependencies Added:**
- `react-qr-code` - QR code generation

**Files Created:**
- `src/pages/JoinPage.tsx`

**Files Modified:**
- `src/pages/AuthPage.tsx`
- `src/pages/ControllerPage.tsx`
- `src/App.tsx`
- `package.json`
