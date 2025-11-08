# Early Advance on All Answers Design

**Date:** 2025-11-08
**Status:** Approved
**Author:** Claude Code

## Overview

Implement smart early advance that automatically reveals the answer 3 seconds after all teams have submitted their responses, rather than waiting for the full question timer to expire. This improves game pacing when all teams are engaged and ready to move on.

## Requirements

### Functional Requirements

1. **Detect All Teams Answered**: Monitor answer submissions in real-time and detect when all teams with players have submitted answers
2. **3-Second Early Advance**: Replace question timer with a 3-second countdown when all teams have answered
3. **Visual Countdown**: Display the 3-second countdown to both host and players
4. **Override Question Timer**: When early advance triggers, replace existing question timer with 3-second timer
5. **Fallback to Normal Timer**: If not all teams answer, question timer runs normally until expiration

### Team Counting Rules

- **Count only teams with players**: Teams with at least one player assigned (`players.length > 0`)
- **Exclude empty teams**: Teams with no players don't block the game
- **Exclude no-team players**: Players without team assignment are excluded from count

### User Experience

- Timer bar shows: "3 seconds" → "2 seconds" → "1 second"
- Progress bar smoothly animates from 100% to 0%
- Same visual appearance as normal timer countdown
- Visible to both controller and player pages

## Architecture

### Approach: Real-Time Subscription with Timer Override

**Rationale:**
- Leverages existing timer infrastructure (no changes to auto-advance logic or GameTimer component)
- Event-driven detection via PocketBase subscriptions
- Clean separation of concerns

**Rejected Alternatives:**
1. **Polling in timer effect**: More API calls, less responsive
2. **Centralized state manager**: Over-engineered for current needs

## Components

### 1. Answer Subscription (ControllerPage)

**New useEffect Hook:**
- Subscribe to `game_answers` collection filtered by current game
- Triggered on answer create/update/delete events
- Calculate teams with players vs teams that answered
- When all teams answered, create early-advance timer

**Subscription Logic:**
```typescript
useEffect(() => {
  // Only monitor when question is active (not revealed yet)
  if (!gameData?.question?.id || gameData.question.correct_answer) return;

  const unsubscribe = pb.collection('game_answers').subscribe('*', async (e) => {
    // Filter to current question
    if (e.record.game_questions_id !== gameData.question.id) return;

    // Count teams with players
    const teamsWithPlayers = Object.values(game.scoreboard.teams)
      .filter(team => team.players.length > 0).length;

    // Count teams that answered
    const answers = await gameAnswersService.getTeamAnswersForQuestion(id, gameData.question.id);
    const teamsAnswered = answers.length;

    // If all answered and no early-advance timer exists yet
    if (teamsAnswered >= teamsWithPlayers && teamsWithPlayers > 0 && !gameData.timer?.isEarlyAdvance) {
      // Create 3-second early-advance timer
      const timer = {
        startedAt: new Date().toISOString(),
        duration: 3,
        expiresAt: new Date(Date.now() + 3000).toISOString(),
        isEarlyAdvance: true
      };

      await updateGameDataClean({
        ...gameData,
        timer
      });
    }
  }, { filter: `game = "${id}"` });

  return () => unsubscribe.then(unsub => unsub());
}, [gameData?.question?.id, gameData?.question?.correct_answer]);
```

**Key Points:**
- Only active when question is displayed (before reveal)
- Checks `gameData.question.correct_answer` to stop monitoring after reveal
- Uses `isEarlyAdvance` flag to prevent re-creating timer
- Requires `teamsWithPlayers > 0` to avoid division by zero edge case

### 2. Timer Interface Extension

**Add Optional Field to Timer Interface:**
```typescript
timer?: {
  startedAt: string
  duration: number
  expiresAt: string
  isEarlyAdvance?: boolean  // New field
}
```

**Purpose:** Flag identifies this is an early-advance timer, prevents re-triggering on subsequent answer events.

### 3. Existing Components (No Changes)

**GameTimer Component:** Already displays any timer with countdown and progress bar.

**Auto-Advance Effect:** Already watches timer expiration and calls `handleNextState()`.

**handleNextState Function:** Already handles reveal logic - no changes needed.

## Data Flow

1. **Player submits answer** → `game_answers` record created
2. **Subscription fires** on ControllerPage → Check if all teams answered
3. **If yes:** Create early-advance timer with 3-second duration
4. **Update game.data** via PocketBase → All clients receive update
5. **GameTimer displays** "3 seconds" countdown
6. **Auto-advance effect** detects timer expiration → Calls `handleNextState()`
7. **Answer revealed** (same as manual or normal timer expiration)

## Edge Cases

### 1. Team Removes Answer During Countdown

**Scenario:** Team changes answer during 3-second countdown, total answered drops below team count.

**Behavior:** Early-advance timer continues (timer already created with `isEarlyAdvance` flag).

**Rationale:** Simple, predictable behavior. Teams had their chance.

### 2. Host Clicks "Reveal" During Countdown

**Scenario:** Host manually advances during early-advance countdown.

**Behavior:** Manual advance calls `handleNextState()`, immediately reveals answer. Early-advance timer is replaced by answer timer.

**Rationale:** Manual override always wins (existing behavior).

### 3. New Team Joins Mid-Question

**Scenario:** New team joins after early-advance timer starts.

**Behavior:** Timer continues, new team doesn't get to answer.

**Rationale:** Team joined too late. Alternative (cancel timer, restore question timer) adds significant complexity.

### 4. No-Team Players

**Scenario:** Players without team assignment.

**Behavior:** Excluded from count (only teams with `players.length > 0`).

**Rationale:** Solo players shouldn't block the game.

### 5. Zero Teams with Players

**Scenario:** Game has no teams with players.

**Behavior:** Early-advance never triggers (`teamsWithPlayers > 0` check). Question timer runs normally.

**Rationale:** Safe guard against edge case.

### 6. Answer Deleted After Early-Advance Triggers

**Scenario:** Subscription detects answer delete, team count drops.

**Behavior:** Timer continues (flag prevents re-processing).

**Rationale:** Simpler than canceling and recreating timers.

## Implementation Steps

1. **Extend timer interface** - Add optional `isEarlyAdvance` field
2. **Add answer subscription** - New useEffect in ControllerPage
3. **Implement team counting logic** - Filter teams with players
4. **Implement answer counting logic** - Query game_answers for current question
5. **Create early-advance timer** - When all teams answered
6. **Test with real game flow** - Verify countdown displays and auto-advances

## Testing Strategy

### Manual Testing Scenarios

1. **Basic early advance**: 3 teams, all answer → verify 3-second countdown → verify auto-reveal
2. **Partial answers**: 3 teams, 2 answer → verify question timer continues normally
3. **Manual override**: All teams answer, host clicks Reveal during countdown → verify immediate reveal
4. **Empty teams**: 3 teams (1 empty), 2 answer → verify early-advance triggers
5. **No teams**: Game with no teams → verify question timer works normally
6. **Answer changes**: All teams answer, one changes answer during countdown → verify timer continues

### Edge Cases to Verify

- Team removes answer during countdown (timer continues)
- New team joins during countdown (timer continues)
- Zero teams with players (no early-advance)
- No-team players (excluded from count)

## Success Criteria

- ✅ Early-advance triggers when all teams with players have answered
- ✅ 3-second countdown displays on both controller and player pages
- ✅ Timer overrides question timer when triggered
- ✅ Fallback to question timer when not all teams answer
- ✅ Manual advance works during early-advance countdown
- ✅ Edge cases handled gracefully

## Future Enhancements

- Configurable early-advance delay (currently hardcoded to 3 seconds)
- Cancel early-advance if team count changes (requires more complex state tracking)
- Show "All teams answered!" message during early-advance countdown
- Sound/notification when early-advance triggers
