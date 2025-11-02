# Rejoin In-Progress Games Design

**Date:** 2025-11-02
**Status:** Approved
**Author:** Claude Code

## Problem Statement

Currently, players can only join games with status "ready". If a player is disconnected from a game that's already in progress, they cannot rejoin even though they have a valid `game_players` record proving they were registered.

## Requirements

1. **Registered players** (with `game_players` record) can join games with status "ready" OR "in-progress"
2. **Unregistered players** can only join games with status "ready"
3. **No one** can join games with status "completed"

## Solution: Smart Fetch with Validation

### 1. Game Service Modification

**File:** `src/lib/games.ts`
**Method:** `findGameByCode`

Update the filter to accept both "ready" and "in-progress" games:

```typescript
async findGameByCode(code: string): Promise<Game | null> {
  try {
    const result = await pb.collection('games').getList<Game>(1, 50, {
      filter: `code = "${code}" && (status = "ready" || status = "in-progress")`
    });

    if (result.items.length > 0) {
      return result.items[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to find game by code:', error);
    throw error;
  }
}
```

**Rationale:**
- Single database query for performance
- Existing lobby logic already handles registered vs new players
- Minimal change reduces risk of breaking existing functionality

### 2. Lobby Page Validation

**File:** `src/pages/LobbyPage.tsx`
**Method:** `handleJoinGame`

Add validation after checking player registration status:

```typescript
// After checking existingPlayer...
if (existingPlayer) {
  // Existing flow - allow registered players to rejoin
  if (existingPlayer.team) {
    navigate(`/game/${game.id}`)
    return
  } else {
    setCurrentGame(game)
    setShowTeamModal(true)
    return
  }
}

// NEW: Block unregistered players from joining in-progress games
if (game.status === 'in-progress') {
  setError('This game is already in progress. Only registered players can rejoin.')
  return
}

// Existing flow - new players can join ready games
setCurrentGame(game)
setShowTeamModal(true)
```

**Rationale:**
- Validation happens in the frontend for immediate feedback
- Clear, user-friendly error message
- Maintains existing team selection flow for valid cases

## Complete Flow

```
Player enters game code
  ↓
Fetch game (status = "ready" OR "in-progress")
  ↓
Game found?
  NO → Error: "Game not found or not ready to join"
  YES → Continue
  ↓
Check game_players record
  ↓
Player registered in game?
  YES → Has team?
          YES → Navigate to /game/:id
          NO  → Show team selection modal
  NO  → Game status = "in-progress"?
          YES → Error: "This game is already in progress. Only registered players can rejoin."
          NO  → Show team selection modal (status = "ready")
```

## Error Messages

- **"Game not found or not ready to join"** - Invalid code or completed game
- **"This game is already in progress. Only registered players can rejoin."** - Unregistered player trying to join in-progress game

## What's NOT Changing

- Team selection modal behavior
- Game page authorization logic
- Database schema or migrations
- PocketBase access rules
- Game creation or host controls

## Testing Considerations

1. **Registered player rejoins in-progress game** - Should succeed and navigate to game
2. **Unregistered player tries to join in-progress game** - Should see error message
3. **New player joins ready game** - Should see team selection (existing behavior)
4. **Player tries to join completed game** - Should see "not found" error
5. **Registered player rejoins but has no team** - Should see team selection modal

## Implementation Files

- `src/lib/games.ts` - Update `findGameByCode` filter
- `src/pages/LobbyPage.tsx` - Add in-progress validation logic
