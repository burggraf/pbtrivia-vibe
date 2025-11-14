# Player Rejoin from Lobby Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display rejoignable games on player lobby screen with direct navigation to active games.

**Architecture:** Add service layer method to query game_players with PocketBase expand, fetch on mount in LobbyPage, render card with game list above existing "Join Game" card.

**Tech Stack:** React, TypeScript, PocketBase SDK, shadcn/ui components

---

## Task 1: Add Service Method for Active Games

**Files:**
- Modify: `src/lib/games.ts:150-211` (gamePlayersService section)

**Step 1: Add getActiveGamesForPlayer method to gamePlayersService**

Add this method to the `gamePlayersService` object after the existing methods:

```typescript
async getActiveGamesForPlayer(playerId: string): Promise<Game[]> {
  try {
    // Query game_players where this player is registered
    const playerRecords = await pb.collection('game_players').getFullList({
      filter: `player = "${playerId}"`,
      expand: 'game',
      sort: '-game.startdate,-game.updated'
    });

    // Extract and filter games for ready/in-progress status
    const games = playerRecords
      .map(record => record.expand?.game)
      .filter((game): game is Game =>
        game != null &&
        (game.status === 'ready' || game.status === 'in-progress')
      );

    return games;
  } catch (error) {
    console.error('Failed to fetch active games for player:', error);
    return []; // Return empty array on error to avoid breaking UI
  }
},
```

**Location:** Add this method inside the `gamePlayersService` export object, after the `removePlayerFromGame` method and before the closing brace.

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/games.ts
git commit -m "feat: add getActiveGamesForPlayer service method

Adds method to query games where player is registered and
game status is ready or in-progress. Uses PocketBase expand
for efficient single-query fetch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add State and Data Loading to LobbyPage

**Files:**
- Modify: `src/pages/LobbyPage.tsx:1-25` (imports and state section)

**Step 1: Import Game type**

Update the imports section at the top of the file. Find the line:

```typescript
import { gamesService, gameTeamsService, gamePlayersService } from '@/lib/games'
```

Replace with:

```typescript
import { gamesService, gameTeamsService, gamePlayersService } from '@/lib/games'
import { Game } from '@/types/games'
```

**Step 2: Add activeGames state**

Find the state declarations (around line 14-21). After the line:

```typescript
const [profileModalOpen, setProfileModalOpen] = useState(false)
```

Add:

```typescript
const [activeGames, setActiveGames] = useState<Game[]>([])
```

**Step 3: Add data loading effect**

Find the first useEffect (around line 23-25, the one with `inputRef.current?.focus()`). After the closing brace of that useEffect, add this new useEffect:

```typescript
useEffect(() => {
  const loadActiveGames = async () => {
    if (!pb.authStore.model?.id) return

    const games = await gamePlayersService.getActiveGamesForPlayer(pb.authStore.model.id)
    setActiveGames(games)
  }

  loadActiveGames()
}, [])
```

**Step 4: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: add state and data loading for active games

Adds activeGames state and useEffect to load games on mount.
Fetches games where current player is registered with ready
or in-progress status.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Date Formatting Helper

**Files:**
- Modify: `src/pages/LobbyPage.tsx:88-140` (before handleTeamSelected function)

**Step 1: Add formatDate helper function**

Find the `handleJoinGame` function (around line 33-87). After its closing brace and before the `handleTeamSelected` function, add:

```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: add date formatting helper for game display

Formats dates as 'Today', 'Yesterday', or 'Mon DD' for
friendly display in active games list.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Active Games UI Component

**Files:**
- Modify: `src/pages/LobbyPage.tsx:166-215` (render section)

**Step 1: Add active games card component**

Find the line in the render section (around line 166):

```tsx
<div className="w-full max-w-4xl mx-auto px-6 py-4 md:p-6 lg:p-8">
```

Immediately after this line and BEFORE the comment `{/* Join Game Section */}`, add:

```tsx
{/* Active Games Section */}
{activeGames.length > 0 && (
  <Card className="mx-4 sm:mx-auto max-w-sm mb-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
    <CardHeader className="pb-4">
      <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
        Your Active Games
      </CardTitle>
    </CardHeader>
    <CardContent className="px-6 pb-6 space-y-3">
      {activeGames.map(game => (
        <div key={game.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{game.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Code: {game.code}
              {game.startdate && ` • ${formatDate(game.startdate)}`}
            </p>
          </div>
          <Button
            onClick={() => navigate(`/game/${game.id}`)}
            size="sm"
            className="ml-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            Rejoin
          </Button>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

**Important:** This should be placed ABOVE the existing "Join Game" card (the one that starts with `<Card className="mx-4 sm:mx-auto max-w-sm bg-white`).

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add src/pages/LobbyPage.tsx
git commit -m "feat: add active games UI to lobby page

Displays card with list of active games above Join Game card.
Shows game name, code, date with green Rejoin button.
Only renders when player has active games.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Manual Testing

**Step 1: Start development environment**

Run: `./dev.sh`
Expected: PocketBase starts on :8090, frontend starts on :5173 (or next available port)

**Step 2: Create test scenario**

Using the browser:
1. Navigate to host page and create a new game
2. Set game status to "ready"
3. Copy the game code
4. Open a new incognito/private window
5. Log in as a different user (or create new account)
6. Navigate to `/lobby`
7. Enter the game code and join the game
8. Select a team
9. Return to `/lobby` page

**Step 3: Verify active games display**

Expected behavior:
- "Your Active Games" card appears above "Join Game" card
- Game shows correct name, code, and date
- Green "Rejoin" button is visible
- Date shows "Today" for games created today

**Step 4: Test rejoin functionality**

Click the "Rejoin" button

Expected: Navigate directly to `/game/:id` page without team selection

**Step 5: Test with multiple games**

1. Create a second game (as host)
2. Set it to "ready"
3. Join as the player (from step 2)
4. Return to `/lobby`

Expected: Both games appear in the list, sorted by date (most recent first)

**Step 6: Test edge cases**

Test scenarios:
- No active games: Card should not render
- Game with no startdate: Should show code only (no date)
- Yesterday's game: Should show "Yesterday"
- Older game: Should show formatted date like "Nov 14"

**Step 7: Test dark mode**

Toggle dark mode in profile

Expected: All colors/contrasts work correctly in both light and dark modes

**Step 8: Test responsive layout**

Resize browser to mobile width (375px)

Expected: Layout remains usable, text doesn't overflow, button stays accessible

**Step 9: Document results**

If all tests pass, feature is complete and ready for final commit.

If issues found, document them and fix before proceeding.

---

## Implementation Notes

**Key Technical Details:**
- PocketBase `expand` parameter gets related game data in single query
- Type guard `(game): game is Game` narrows type after filter
- Empty dependency array `[]` in useEffect means load once on mount
- Conditional render `{activeGames.length > 0 && ...}` prevents empty state
- Green button color distinguishes from blue "Join Game" action

**Potential Issues:**
- If PocketBase query fails, empty array prevents UI break
- No loading state (query is fast, acceptable UX)
- No real-time updates (acceptable per requirements)
- Games stay in list until refresh if status changes to completed

**Future Enhancements (Out of Scope):**
- Real-time subscription to game status changes
- "Leave game" option in the list
- Team assignment indicator
- Status badge (ready vs in-progress)
