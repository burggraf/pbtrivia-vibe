# Scoreboard Score Tracking Design

**Date:** 2025-11-01
**Status:** Approved
**Author:** Claude Code

## Problem Statement

The round-end state screen currently shows incorrect behavior: players can only see their own team's score, not all teams' scores. This occurs because the `games.scoreboard` object is not being updated with actual scores during gameplay. The scoreboard only contains team structure (names, players) but no score data.

When the host updates `game_answers` records on the `/controller` page after revealing answers, the scoreboard is not updated with the graded results.

## Requirements

1. Update `games.scoreboard` with team scores after grading answers
2. Track per-round scores and cumulative totals
3. Update scoreboard efficiently (single write after all answers for a question are graded)
4. Display all teams' scores on the round-end screen for all players
5. Maintain backward compatibility with existing scoreboard structure

## Design Decisions

### Update Timing
**Decision:** Update scoreboard after revealing each answer (after all teams' answers for that question are graded)

**Rationale:** Keeps scores current throughout the game. Single database write per question maintains efficiency while ensuring players always see accurate, up-to-date scores.

### Score Tracking Structure
**Decision:** Track per-round breakdown with running totals

**Structure:**
```typescript
interface ScoreboardTeam {
  name: string;
  players: ScoreboardPlayer[];
  score: number;  // Total score across all rounds
  roundScores?: Record<number, number>;  // Round number -> score for that round
}
```

**Example:**
```json
{
  "teams": {
    "76vbslbp5emtwg4": {
      "name": "Team Alpha",
      "score": 12,
      "roundScores": {
        "1": 5,
        "2": 7
      },
      "players": [...]
    },
    "no-team": {
      "name": "No Team",
      "score": 0,
      "players": []
    }
  },
  "updated": "2025-11-01T15:29:21.750Z"
}
```

**Rationale:**
- `roundScores` optional for backward compatibility
- `score` is single source of truth for total
- Enables detailed analytics and per-round performance display
- Minimal additional storage overhead

### Update Approach
**Decision:** Service method with full recalculation from `game_answers`

**Method:** `scoreboardService.updateScoreboard(gameId, currentRoundNumber)`

**Rationale:**
- Most accurate: prevents score drift
- Source of truth: always derives from actual graded answers
- Simple: no complex delta tracking logic
- Performance: acceptable for typical game sizes (dozens of teams, hundreds of answers)

## Architecture

### Data Flow

```
ControllerPage (reveal answer)
  └─> Grade all game_answers for question
      └─> scoreboardService.updateScoreboard(gameId, roundNumber)
          └─> Query all game_answers where is_correct IS NOT NULL
          └─> Group by team and round
          └─> Calculate scores
          └─> Merge with existing scoreboard (preserve teams/players)
          └─> Update games.scoreboard field (single write)
              └─> Real-time subscription updates GamePage
                  └─> RoundEnd component displays all teams' scores
```

### Integration Points

#### 1. ControllerPage.tsx (line ~344)
After the answer grading loop completes:

```typescript
console.log(`🎯 All answers graded. Correct answer: ${correctAnswerLabel}`)

// NEW: Update scoreboard with latest scores
await scoreboardService.updateScoreboard(id, gameData.round?.round_number || 1)
```

#### 2. scoreboardService.ts
New method:

```typescript
async updateScoreboard(gameId: string, currentRoundNumber: number): Promise<void> {
  // 1. Fetch all graded game_answers for this game
  // 2. Group by team and calculate scores per round
  // 3. Get existing scoreboard to preserve team/player structure
  // 4. Merge scores into scoreboard structure
  // 5. Update games.scoreboard field
}
```

#### 3. RoundEnd.tsx
Simplify to read directly from scoreboard:

```typescript
// REMOVE: useEffect that calculates scores dynamically (lines 27-46)
// REMOVE: calculatedScores state

// NEW: Read directly from scoreboard
const score = scoreboard.teams[teamId].score ?? 0
const roundScore = scoreboard.teams[teamId].roundScores?.[currentRound] ?? 0
```

Display format:
```
Team Alpha
Round 2: +7 points
Total: 12 points
```

### Type Updates

Update `src/types/games.ts`:

```typescript
export interface ScoreboardTeam {
  name: string;
  players: ScoreboardPlayer[];
  score: number;  // Add this (currently exists but documented here)
  roundScores?: Record<number, number>;  // Add this
}
```

## Implementation Steps

1. **Update TypeScript types** in `src/types/games.ts`
   - Add `roundScores` field to `ScoreboardTeam` interface

2. **Implement `scoreboardService.updateScoreboard()`** in `src/lib/scoreboard.ts`
   - Query all graded `game_answers` for the game
   - Group answers by team
   - For each team, calculate scores by round (requires joining to `game_questions` to get round)
   - Calculate total score (sum of all round scores)
   - Fetch current scoreboard
   - Merge calculated scores with existing team/player structure
   - Update `games.scoreboard` field

3. **Update ControllerPage.tsx** (line ~344)
   - Import `scoreboardService`
   - Call `updateScoreboard()` after grading loop completes
   - Add error handling

4. **Simplify RoundEnd.tsx**
   - Remove dynamic score calculation logic (lines 27-46)
   - Remove `calculatedScores` state and `isLoadingScores` state
   - Read scores directly from `scoreboard.teams[teamId].score` and `.roundScores`
   - Update display to show both round score and total

5. **Testing**
   - Verify scoreboard updates after each question reveal
   - Verify all teams' scores visible on round-end screen
   - Verify per-round scores displayed correctly
   - Verify backward compatibility with games without `roundScores`

## Edge Cases

1. **No team (unassigned players):**
   - Handle "no-team" as a valid team with score tracking

2. **Teams with no correct answers:**
   - Ensure teams appear with 0 score, not missing from scoreboard

3. **Mid-game joins:**
   - Existing scoreboard structure already handles via `rebuildScoreboard()`
   - Scores only reflect answers submitted, not participation time

4. **Backward compatibility:**
   - Existing games without `roundScores` field: display total score only
   - Optional chaining (`?.`) prevents crashes on old data

## Performance Considerations

- **Single write per question:** Efficient, avoids database thrashing
- **Query scope:** Fetching all game_answers for a game is acceptable for typical game sizes
- **Indexing:** Existing indexes on `game_answers` should support this query pattern
- **Real-time updates:** PocketBase subscription automatically pushes updates to all clients

## Security Considerations

- Scoreboard is part of `games` collection with existing access control
- Players can already see game data, no new permission requirements
- Grading happens on controller (host-only), no player manipulation possible

## Future Enhancements

- Display score deltas in real-time during answer reveal
- Leaderboard animations on round-end screen
- Export game statistics including per-round performance
- Team performance analytics (accuracy %, response times)
