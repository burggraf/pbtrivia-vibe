# Player Rejoin from Lobby - Design Document

**Date:** 2025-11-14
**Status:** Approved
**Feature:** Display rejoignable games on player lobby screen

## Overview

When a player visits the `/lobby` screen, if they are registered in any games with status `ready` or `in-progress`, we will display those games above the "Join Game" card with a "Rejoin" button for each.

## Requirements

- Show all active games (ready or in-progress) that the player belongs to
- Display game name, code, and date to help identify games
- Place the list above the "Join Game" card
- Load games once on page mount (no real-time updates)
- Direct navigation to game page on rejoin click (no team selection flow)

## Architecture

### 1. Service Layer

Add new method to `gamePlayersService` in `src/lib/games.ts`:

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
}
```

**Key design decisions:**
- Uses PocketBase `expand` to fetch game details in single query (performance)
- Sorts by `startdate` descending, then `updated` descending (most recent first)
- Client-side filtering for `ready`/`in-progress` status
- Graceful error handling with empty array return
- Type guard ensures type safety

### 2. State Management

Add to `LobbyPage.tsx`:

```typescript
// State
const [activeGames, setActiveGames] = useState<Game[]>([])

// Load on mount
useEffect(() => {
  const loadActiveGames = async () => {
    if (!pb.authStore.model?.id) return

    const games = await gamePlayersService.getActiveGamesForPlayer(pb.authStore.model.id)
    setActiveGames(games)
  }

  loadActiveGames()
}, [])
```

**Key design decisions:**
- Loads once on mount (empty dependency array)
- No loading state UI (simple, fast query)
- No error state UI (service returns empty array)
- Guards against unauthenticated users

### 3. UI Component

Add card section before existing "Join Game" card:

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

**Key design decisions:**
- Conditional rendering (only shows if games exist)
- Green button color (distinct from blue "Join Game")
- Compact row layout with game info on left, button on right
- Responsive spacing and dark mode support
- Matches existing card styling patterns

### 4. Date Formatting Helper

Add utility function for friendly date display:

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

**Output examples:**
- "Today"
- "Yesterday"
- "Nov 14"

## User Flow

1. Player navigates to `/lobby`
2. Page loads and fetches active games via `getActiveGamesForPlayer()`
3. If active games exist, "Your Active Games" card appears above "Join Game" card
4. Player sees list of games with name, code, and date
5. Player clicks "Rejoin" button
6. Navigate directly to `/game/:id`

## Edge Cases

- **No active games:** Card not rendered (existing "Join Game" card shows normally)
- **API error:** Empty array returned, no error UI shown
- **Unauthenticated user:** Guard prevents query (shouldn't happen on protected route)
- **Game transitions to completed:** Appears in list until page refresh (acceptable)

## Testing Considerations

- Verify query returns correct games for player
- Test with 0, 1, and multiple active games
- Verify sorting (most recent first)
- Test date formatting for today/yesterday/other dates
- Verify dark mode styling
- Test navigation on rejoin click
- Verify responsive layout on mobile/tablet/desktop

## Implementation Notes

- Use existing shadcn/ui components (Card, Button)
- Follow existing styling patterns from LobbyPage
- Import `Game` type from `@/types/games`
- Add service method to `gamePlayersService` export object
- Place new card before line 169 in LobbyPage.tsx

## Future Enhancements (Out of Scope)

- Real-time updates via PocketBase subscriptions
- "Remove" or "Leave game" option
- Filter/sort UI for many games
- Team assignment indicator in list
- Game status badge (ready vs in-progress)
