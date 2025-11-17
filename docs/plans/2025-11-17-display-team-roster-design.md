# Display Team Roster Design

**Date:** 2025-11-17
**Status:** Approved
**Target:** trivia-party-display app (Tauri application)

## Overview

Add real-time team and player roster display to the Game Start screen (game-start state) in the display app. Teams and players will be shown in two side columns flanking the central QR code/game info, updating in real-time as players join.

## Requirements

### Functional Requirements
- Display all registered players for the game (from `gameRecord.scoreboard`)
- Show teams sorted by team name + team ID
- Show players sorted by name within each team
- Update in real-time as scoreboard changes
- Display player names and avatars
- Support dynamic scaling for 1-8 teams with 1-4 players each

### Layout Requirements
- 3-column layout: [TEAMS] [QR/CONTENT] [TEAMS]
- Left column: Teams 1-4 (top to bottom)
- Right column: Teams 5-8 (top to bottom)
- Center column: Existing QR code and game info
- Responsive scaling when content exceeds optimal density

### Visual Requirements
- Horizontal avatar + name layout for players
- Team cards with borders and subtle backgrounds
- Avatar images or initial-based fallbacks
- Smooth animations for real-time updates
- Dark theme consistency

## Architecture

### Component Structure

**New Component:**
- `trivia-party-display/src/components/TeamRoster.tsx`
  - Standalone component with no props
  - Uses `useDisplay()` context to access `gameRecord.scoreboard`
  - Self-contained data transformation and rendering
  - Leverages existing real-time subscription

**Modified Component:**
- `trivia-party-display/src/components/states/GameStart.tsx`
  - Import and render `<TeamRoster />`
  - Adjust layout to accommodate 3-column grid

### Data Flow

1. **Data Source:** `gameRecord.scoreboard.teams` from DisplayContext
   ```typescript
   scoreboard: {
     teams: {
       [teamId: string]: {
         name: string
         players: Array<{
           id: string
           name: string
           avatar?: string
         }>
         score: number
       }
     }
   }
   ```

2. **Real-Time Updates:** Automatic via existing DisplayContext subscription to games collection

3. **Data Processing:**
   - Convert teams object to array
   - Sort teams: `(teamA.name + teamA.id).localeCompare(teamB.name + teamB.id)`
   - Sort players within teams: `playerA.name.localeCompare(playerB.name)`
   - Split teams array in half for left/right columns

### Layout Implementation

**Grid Structure:**
```tsx
<div className="grid grid-cols-[1fr_2fr_1fr] gap-8">
  {/* Left Column - Teams 1-4 */}
  <div className="flex flex-col gap-3">
    {leftTeams.map(team => <TeamCard team={team} scale={scale} />)}
  </div>

  {/* Center Column - Existing QR/Content */}
  <div>{/* Existing GameStart content */}</div>

  {/* Right Column - Teams 5-8 */}
  <div className="flex flex-col gap-3">
    {rightTeams.map(team => <TeamCard team={team} scale={scale} />)}
  </div>
</div>
```

**Dynamic Scaling:**
```typescript
const scale = Math.max(0.6, Math.min(1.0,
  8 / teamCount,
  4 / maxPlayersPerTeam
))
```

### Component Hierarchy

```
GameStart
└── TeamRoster (new)
    ├── Left Column
    │   └── TeamCard × N
    │       └── PlayerItem × M
    ├── Center Column (existing content)
    └── Right Column
        └── TeamCard × N
            └── PlayerItem × M
```

## Visual Design

### Team Card
- Background: `bg-slate-800`
- Border: `border border-slate-700`
- Padding: `p-3`
- Border radius: `rounded-lg`
- Team name: `text-lg font-bold text-slate-100`
- Player list: `space-y-2`

### Player Item
- Layout: `flex items-center gap-2`
- Background: `bg-slate-700/50`
- Padding: `p-2`
- Border radius: `rounded-md`
- Avatar: `w-8 h-8 rounded-full`
- Name: `text-base text-slate-200 truncate`

### Avatar Display
1. If `player.avatar` exists: Show image
2. Fallback: Show first letter of name with colored background
3. Colors: Rotate through blue-500, green-500, purple-500, orange-500, pink-500, teal-500
4. Color assignment: Consistent per player using hash of player ID

### Scaling Behavior
- Apply to team cards: `style={{ transform: scale(${scale}) }}`
- Transform origin: `transform-origin: top`
- Transition: `transition-transform duration-200 ease-in-out`
- Minimum scale: 0.6 (60%)
- Maximum scale: 1.0 (100%)

### Empty State
- Condition: No teams in scoreboard
- Display: "Waiting for teams to join..."
- Style: `text-slate-400 text-center`

## Implementation Details

### File Locations
- Component: `trivia-party-display/src/components/TeamRoster.tsx`
- Modified: `trivia-party-display/src/components/states/GameStart.tsx`

### Dependencies
- React hooks: `useState`, `useMemo`
- Context: `useDisplay` from `@/contexts/DisplayContext`
- Types: `GamesRecord` from `@/types/pocketbase-types`

### Key Functions

**Data Processing:**
```typescript
function processScoreboardData(scoreboard: GameScoreboard | undefined): ProcessedTeam[] {
  if (!scoreboard?.teams) return []

  const teamsArray = Object.entries(scoreboard.teams).map(([id, team]) => ({
    id,
    name: team.name,
    players: [...team.players].sort((a, b) => a.name.localeCompare(b.name))
  }))

  return teamsArray.sort((a, b) =>
    (a.name + a.id).localeCompare(b.name + b.id)
  )
}
```

**Scale Calculation:**
```typescript
function calculateScale(teams: ProcessedTeam[]): number {
  const teamCount = teams.length
  const maxPlayersPerTeam = Math.max(...teams.map(t => t.players.length), 0)

  return Math.max(0.6, Math.min(1.0,
    8 / Math.max(teamCount, 1),
    4 / Math.max(maxPlayersPerTeam, 1)
  ))
}
```

**Avatar Color:**
```typescript
function getAvatarColor(playerId: string): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal']
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
```

## Testing Considerations

### Manual Testing Scenarios
1. Empty state: No teams in game
2. Single team: 1 team with 1-4 players
3. Optimal load: 4 teams with 4 players each (left column)
4. Balanced: 8 teams with 2 players each (both columns)
5. High density: 12 teams with 4 players each (scaling)
6. Uneven: 3 teams left, 1 team right
7. Real-time: Add/remove teams and players during display
8. Long names: Team/player names that require truncation

### Edge Cases
- Scoreboard undefined/null
- Teams object empty
- Players array empty for a team
- Missing avatar field
- Missing player name
- Duplicate player names (sort stability)

## Performance Considerations

- No additional subscriptions (reuses DisplayContext)
- Memoize processed data to avoid recalculation
- Use CSS transforms for scaling (GPU-accelerated)
- Minimize re-renders with proper React memoization

## Future Enhancements

- Optional: Show player online status indicator
- Optional: Animate player additions/removals
- Optional: Show team scores alongside names
- Optional: Configurable avatar size
- Optional: Alternative layout for very wide screens
