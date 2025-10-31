# QR Code Game Join Design

**Date**: 2025-10-31
**Status**: Approved

## Overview

Add QR code functionality to the Controller page that allows players to scan and join games directly, with automatic handling of authentication and team selection.

## Purpose

Enable players to quickly join games by scanning a QR code instead of manually typing a 6-character game code. The system handles authentication seamlessly, redirecting unauthenticated users through login/registration before completing the join flow.

## User Flow

### Player Scans QR Code

1. **Controller page displays QR code** below game code (e.g., "Game Code: 9VQAJ1")
2. **Player scans QR code** with mobile device → Opens `https://yourdomain.com/join?code=9VQAJ1`
3. **JoinPage evaluates authentication state:**

   **If NOT authenticated:**
   - Redirect to `/?returnTo=/join?code=9VQAJ1`
   - User sees AuthPage with login/register options
   - User mode defaults to "player"
   - After successful auth, redirect back to `/join?code=9VQAJ1`

   **If authenticated:**
   - Lookup game by code using `gamesService.findGameByCode(code)`
   - Check if player already in game using `gamePlayersService.findPlayerInGame(gameId, playerId)`
   - Navigate to `/game/:id` (GamePage handles team selection if needed)

4. **GamePage/TeamSelectionModal:**
   - Existing logic handles team selection
   - Player joins team and enters game
   - No changes needed to GamePage

### Host View

1. **Controller page displays:**
   - Game code text: "Game Code: 9VQAJ1"
   - QR code below the text (200x200px)
   - Helper text: "Scan to join"
2. **QR code visible throughout game:**
   - Always displayed during game setup and play
   - Players can join at any time by scanning

## Architecture Decisions

### 1. URL Pattern
- Format: `https://yourdomain.com/join?code={GAME_CODE}`
- Example: `https://yourdomain.com/join?code=9VQAJ1`
- Clean, shareable URL that works with or without QR code

### 2. Authentication Strategy
- Redirect to AuthPage with return URL parameter
- Reuses existing AuthPage component and logic
- Clean separation of concerns
- Game code preserved through redirect chain via URL parameter

### 3. QR Code Library
- **Library**: `react-qr-code` (lightweight SVG-based, ~10KB)
- **Alternative considered**: `qrcode.react` (~40KB, more features but heavier)
- **Reason**: Lightweight, TypeScript support, SVG rendering, sufficient features

### 4. QR Code Placement
- **Location**: Below game code in Controller page header
- **Visibility**: Always visible (not in modal or collapsible)
- **Reason**: Easy access for hosts, clear visual hierarchy

## Implementation Details

### New Components

#### JoinPage Component (`src/pages/JoinPage.tsx`)

**Responsibilities:**
- Parse `code` query parameter from URL
- Check authentication state
- Handle redirect flow for unauthenticated users
- Lookup game and navigate to GamePage for authenticated users
- Display loading states and error messages

**Key logic:**
```tsx
const searchParams = new URLSearchParams(window.location.search)
const code = searchParams.get('code')

if (!pb.authStore.isValid) {
  // Redirect to auth page with return URL
  navigate(`/?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
  return
}

// Lookup game by code
const game = await gamesService.findGameByCode(code)
if (!game) {
  setError('Game not found or not available')
  return
}

// Navigate to game page (team selection handled there)
navigate(`/game/${game.id}`)
```

**Error states:**
- Invalid/missing game code
- Game not found
- Game already completed
- Network errors
- Code format validation (6 chars alphanumeric)

### Modified Components

#### ControllerPage (`src/pages/ControllerPage.tsx`)

**Changes:**
- Import `react-qr-code` library
- Add QR code display below game code text (after line 678)
- Generate QR URL: `${window.location.origin}/join?code=${game.code}`

**Implementation:**
```tsx
import QRCode from 'react-qr-code'

// In header section, below game code display:
{game && (
  <div className="mt-4 flex flex-col items-start gap-2">
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
      <QRCode
        value={`${window.location.origin}/join?code=${game.code}`}
        size={200}
        level="M"
        aria-label={`QR code to join game ${game.code}`}
      />
      <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
        Scan to join
      </p>
    </div>
  </div>
)}
```

#### AuthPage (`src/pages/AuthPage.tsx`)

**Changes:**
- Parse `returnTo` query parameter on mount
- After successful login/registration, check for `returnTo`
- If `returnTo` exists, navigate to that URL
- Otherwise use existing logic (redirect to /host or /lobby based on user mode)

**Implementation:**
```tsx
// Parse returnTo on mount
const searchParams = new URLSearchParams(window.location.search)
const returnTo = searchParams.get('returnTo')

// In redirect effect (around line 102-112):
useEffect(() => {
  if (pb.authStore.isValid && success) {
    const timer = setTimeout(() => {
      if (returnTo) {
        navigate(returnTo)
      } else {
        const targetRoute = userMode === 'host' ? '/host' : '/lobby'
        navigate(targetRoute)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }
}, [success, userMode, returnTo, navigate])
```

#### App.tsx (`src/App.tsx`)

**Changes:**
- Import JoinPage component
- Add route: `/join` → `<JoinPage />`

**Implementation:**
```tsx
import JoinPage from './pages/JoinPage'

// Add route after lobby route (line 85):
<Route
  path='/join'
  element={<JoinPage />}
/>
```

## Visual Design

### QR Code Display

**Styling:**
- Container: White background (dark mode: slate-800)
- Border: 1px slate-200 (dark mode: slate-700)
- Padding: 16px around QR code
- Border radius: 8px (rounded-lg)
- QR code size: 200x200px
- Error correction level: M (15% correction)
- Helper text: "Scan to join" in slate-600 (dark mode: slate-400)

**Layout:**
- Positioned below "Game Code: 9VQAJ1" text
- Centered or left-aligned with game info
- Maintains spacing consistency with existing UI

### Mobile Responsiveness

**Controller Page (Host View):**
- QR code displays on all screen sizes
- On mobile/tablet hosts: Consider showing "Share Link" button as alternative
- Use responsive classes to adjust size if needed on smaller screens

**JoinPage (Player View):**
- Mobile-optimized layout (players scan with phones)
- Card-based design matching LobbyPage style
- Clear loading states (spinner while looking up game)
- Readable error messages on small screens
- Touch targets minimum 44px height (UI style guide)

### Accessibility

- QR code has `aria-label="QR code to join game {gameCode}"`
- Loading states announced to screen readers
- Error messages have proper ARIA roles
- Keyboard navigation works throughout auth flow
- Focus management during redirects

## Error Handling

### JoinPage Error Cases

1. **Missing or invalid game code:**
   - Show: "Invalid game code. Please check the code and try again."
   - Action: Display error message, no redirect

2. **Game not found:**
   - Show: "Game not found or not available to join."
   - Action: Display error with "Try Another Code" button

3. **Game already completed:**
   - Show: "This game has ended and is no longer accepting players."
   - Action: Display informational message

4. **Network errors:**
   - Show: "Unable to connect. Please check your connection and try again."
   - Action: Display error with "Retry" button

5. **Code format validation:**
   - Validate: 6 characters, alphanumeric only
   - Show: "Invalid code format" if validation fails

### QR Code Generation Errors

**If QR library fails:**
- Fallback to displaying game code text only
- Log error to console
- No visual indication to user (graceful degradation)

## Dependencies

### New Package

```bash
npm install react-qr-code
```

**Package details:**
- Name: `react-qr-code`
- Version: Latest stable
- Size: ~10KB
- License: MIT
- TypeScript: Built-in support

## Testing Considerations

### Manual Testing

1. **QR Code Display:**
   - Verify QR code appears on Controller page
   - Verify QR code is scannable with mobile device
   - Verify QR code updates when game code changes
   - Test dark mode rendering

2. **Join Flow - Unauthenticated:**
   - Scan QR code while logged out
   - Verify redirect to AuthPage with returnTo parameter
   - Register new account
   - Verify redirect back to JoinPage
   - Verify navigation to GamePage

3. **Join Flow - Authenticated:**
   - Scan QR code while logged in
   - Verify direct navigation to GamePage
   - Verify team selection modal appears if not on team
   - Verify direct entry to game if already on team

4. **Error Handling:**
   - Test invalid game code
   - Test expired/completed game
   - Test network disconnection
   - Test code format validation

5. **Mobile Responsiveness:**
   - Test on various mobile screen sizes (375px, 414px, 768px)
   - Verify touch targets are adequate
   - Test landscape orientation
   - Verify text readability

### Edge Cases

1. **User scans QR then closes browser before completing flow**
   - Expected: Next scan starts flow from beginning
   - No stale state preserved

2. **Multiple players scan QR simultaneously**
   - Expected: Each player gets independent flow
   - No race conditions on team/player creation

3. **Game code changes after QR displayed**
   - Expected: QR updates reactively (game prop changes)
   - Old QR codes become invalid

4. **User manually modifies returnTo URL parameter**
   - Expected: Redirect still works (worst case: 404)
   - No security vulnerability (auth still required)

## Files Modified

### New Files
- `/src/pages/JoinPage.tsx` - Join page component

### Modified Files
- `/src/pages/ControllerPage.tsx` - Add QR code display
- `/src/pages/AuthPage.tsx` - Handle returnTo parameter
- `/src/App.tsx` - Add /join route
- `/package.json` - Add react-qr-code dependency

## Future Enhancements

1. **Share functionality:**
   - Add "Share Link" button alongside QR code
   - Copy link to clipboard
   - Native share API on mobile

2. **Dynamic QR code styling:**
   - Add team colors or branding to QR code
   - Use qr-code-styling library for advanced customization

3. **Analytics:**
   - Track QR code scans vs manual code entry
   - Measure conversion rate through join flow

4. **Short URLs:**
   - Create short URL service for cleaner links
   - Example: `https://yourdomain.com/j/9VQAJ1` instead of `/join?code=9VQAJ1`
