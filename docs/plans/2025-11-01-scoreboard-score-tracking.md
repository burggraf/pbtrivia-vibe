# Scoreboard Score Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update game.scoreboard with per-round and total scores after grading answers, enabling all players to see all teams' scores on the round-end screen.

**Architecture:** After grading all answers for a question in ControllerPage, call `scoreboardService.updateScoreboard()` which queries all graded game_answers, calculates per-round and total scores, and updates the games.scoreboard field once. RoundEnd component reads scores directly from scoreboard instead of calculating them.

**Tech Stack:** TypeScript, React, PocketBase, existing scoreboard infrastructure

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `src/types/games.ts:7-11`

**Step 1: Add roundScores field to ScoreboardTeam interface**

In `src/types/games.ts`, update the `ScoreboardTeam` interface:

```typescript
export interface ScoreboardTeam {
  name: string;
  players: ScoreboardPlayer[];
  score: number;
  roundScores?: Record<number, number>;  // Add this line
}
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no new TypeScript errors

**Step 3: Commit type changes**

```bash
git add src/types/games.ts
git commit -m "feat: add roundScores field to ScoreboardTeam type"
```

---

## Task 2: Implement updateScoreboard Service Method

**Files:**
- Modify: `src/lib/scoreboard.ts:68` (add new method after calculateTeamScores)

**Step 1: Add updateScoreboard method to scoreboardService**

Add this method to the `scoreboardService` object in `src/lib/scoreboard.ts`:

```typescript
  /**
   * Update scoreboard with per-round and total scores
   * Recalculates all scores from game_answers records
   */
  async updateScoreboard(gameId: string, currentRoundNumber: number): Promise<void> {
    try {
      console.log(`📊 Updating scoreboard for game ${gameId}, round ${currentRoundNumber}`)

      // Get current game with scoreboard structure
      const game = await pb.collection('games').getOne<Game>(gameId)
      if (!game.scoreboard?.teams) {
        console.error('No scoreboard structure found for game')
        return
      }

      // Fetch all graded game_answers for this game
      const allAnswers = await pb.collection('game_answers').getFullList({
        filter: `game = "${gameId}" && is_correct != null`,
        expand: 'game_questions_id'
      })

      console.log(`📊 Found ${allAnswers.length} graded answers`)

      // Build score tracking structure
      // teamId -> roundNumber -> correctCount
      const teamRoundScores: Record<string, Record<number, number>> = {}

      // Process each answer
      for (const answer of allAnswers) {
        const teamId = answer.team
        if (!teamId) continue

        // Get the round number from the game_questions record
        const gameQuestion = (answer as any).expand?.game_questions_id
        if (!gameQuestion?.round) continue

        // Fetch the round to get sequence_number
        let roundNumber: number
        try {
          const round = await pb.collection('rounds').getOne(gameQuestion.round)
          roundNumber = round.sequence_number
        } catch (error) {
          console.error(`Failed to fetch round ${gameQuestion.round}:`, error)
          continue
        }

        // Initialize tracking structures if needed
        if (!teamRoundScores[teamId]) {
          teamRoundScores[teamId] = {}
        }
        if (!teamRoundScores[teamId][roundNumber]) {
          teamRoundScores[teamId][roundNumber] = 0
        }

        // Count correct answers
        if (answer.is_correct === true) {
          teamRoundScores[teamId][roundNumber]++
        }
      }

      // Calculate total scores and update scoreboard structure
      const updatedTeams = { ...game.scoreboard.teams }

      for (const [teamId, team] of Object.entries(updatedTeams)) {
        const roundScores = teamRoundScores[teamId] || {}
        const totalScore = Object.values(roundScores).reduce((sum, score) => sum + score, 0)

        updatedTeams[teamId] = {
          ...team,
          score: totalScore,
          roundScores: roundScores
        }

        console.log(`📊 Team ${team.name}: ${totalScore} total points, rounds:`, roundScores)
      }

      // Update the game scoreboard
      await pb.collection('games').update(gameId, {
        scoreboard: {
          teams: updatedTeams,
          updated: new Date().toISOString()
        }
      })

      console.log(`✅ Scoreboard updated successfully`)
    } catch (error) {
      console.error('Failed to update scoreboard:', error)
      throw error
    }
  }
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit service method**

```bash
git add src/lib/scoreboard.ts
git commit -m "feat: implement scoreboardService.updateScoreboard method"
```

---

## Task 3: Integrate Scoreboard Update in ControllerPage

**Files:**
- Modify: `src/pages/ControllerPage.tsx:11` (add import)
- Modify: `src/pages/ControllerPage.tsx:356` (add service call)

**Step 1: Import scoreboardService at top of ControllerPage.tsx**

Add to the imports section around line 11:

```typescript
import { scoreboardService } from '@/lib/scoreboard'
```

**Step 2: Add scoreboard update after grading loop**

In the `handleNextState` function, after the grading loop completes (around line 356, after `console.log('🎯 All answers graded. Correct answer: ${correctAnswerLabel}')`), add:

```typescript
            console.log(`🎯 All answers graded. Correct answer: ${correctAnswerLabel}`)

            // Update scoreboard with latest scores
            try {
              await scoreboardService.updateScoreboard(id, gameData.round?.round_number || 1)
            } catch (error) {
              console.error('Failed to update scoreboard:', error)
              // Don't block game flow if scoreboard update fails
            }
          }
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit integration**

```bash
git add src/pages/ControllerPage.tsx
git commit -m "feat: integrate scoreboard updates after grading answers"
```

---

## Task 4: Simplify RoundEnd Component

**Files:**
- Modify: `src/components/games/states/RoundEnd.tsx:1-202`

**Step 1: Remove dynamic score calculation logic**

Replace the entire RoundEnd component with this simplified version:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'
import { GameScoreboard } from '@/types/games'

interface RoundEndProps {
  gameData: {
    state: 'round-end'
    round?: {
      round_number: number
      rounds: number
      question_count: number
      title: string
    }
    gameId?: string
  }
  scoreboard?: GameScoreboard
}

export default function RoundEnd({ gameData, scoreboard }: RoundEndProps) {
  const currentRound = gameData.round?.round_number || 1

  const getTopTeams = () => {
    if (!scoreboard?.teams) return []

    return Object.entries(scoreboard.teams)
      .map(([teamId, teamData]) => {
        const totalScore = teamData.score ?? 0
        const roundScore = teamData.roundScores?.[currentRound] ?? 0

        return {
          id: teamId,
          name: teamData.name,
          totalScore: totalScore,
          roundScore: roundScore,
          players: teamData.players.length
        }
      })
      .filter(team => team.players > 0) // Filter out teams with 0 players
      .sort((a, b) => b.totalScore - a.totalScore)
  }

  const topTeams = getTopTeams()
  const firstPlace = topTeams[0]
  const secondPlace = topTeams[1]
  const thirdPlace = topTeams[2]

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return null
    }
  }

  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        End of Round {gameData.round?.round_number || 1}
      </h2>
      {gameData.round?.title && (
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-6">
          {gameData.round.title}
        </p>
      )}

      {/* Podium Display */}
      {topTeams.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                {secondPlace && (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(2)}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {secondPlace.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Round {currentRound}: +{secondPlace.roundScore}
                    </p>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      Total: {secondPlace.totalScore} points
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {secondPlace.players} player{secondPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                {/* 1st Place */}
                {firstPlace && (
                  <div className="text-center p-6 bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-600">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(1)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                      {firstPlace.name}
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Round {currentRound}: +{firstPlace.roundScore}
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      Total: {firstPlace.totalScore} points
                    </p>
                    <Badge variant="default" className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                      {firstPlace.players} player{firstPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {thirdPlace && (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex justify-center mb-2">
                      {getMedalIcon(3)}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {thirdPlace.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Round {currentRound}: +{thirdPlace.roundScore}
                    </p>
                    <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                      Total: {thirdPlace.totalScore} points
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {thirdPlace.players} player{thirdPlace.players !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Full Team Rankings */}
              {topTeams.length > 3 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                    Full Rankings
                  </h4>
                  <div className="space-y-2">
                    {topTeams.slice(3).map((team, index) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium text-slate-600 dark:text-slate-400 w-8">
                            #{index + 4}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {team.name}
                          </span>
                          <Badge variant="outline">
                            {team.players} player{team.players !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Round {currentRound}: +{team.roundScore}
                          </p>
                          <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                            Total: {team.totalScore} points
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit RoundEnd simplification**

```bash
git add src/components/games/states/RoundEnd.tsx
git commit -m "feat: simplify RoundEnd to read scores from scoreboard"
```

---

## Task 5: Manual Testing

**Files:**
- None (testing only)

**Step 1: Start development environment**

Run: `./dev.sh`
Expected: PocketBase starts on port 8090, frontend on port 5173

**Step 2: Test complete game flow**

1. Navigate to `http://localhost:5173/host`
2. Create a new game with 2 rounds, 2 questions per round
3. Navigate to controller page
4. Start the game
5. Join as 2-3 players from different devices/browsers
6. Assign players to different teams
7. Progress through first round:
   - Display first question
   - Have teams submit answers
   - Reveal answer (should grade and update scoreboard)
   - Check browser console for "📊 Updating scoreboard" logs
   - Advance to next question
   - Repeat for all questions in round
8. View round-end screen:
   - Verify all teams' scores are visible
   - Verify round score shows points earned this round
   - Verify total score shows cumulative points
9. Continue to second round and verify:
   - Scores carry over correctly
   - Round 2 scores are tracked separately
   - Totals are accurate sum of both rounds

**Step 3: Verify real-time updates**

1. With game in progress on multiple devices:
   - Have one team submit answer
   - Reveal answer on controller
   - Verify all players see updated scoreboard on round-end
   - Verify scores update without page refresh

**Step 4: Test edge cases**

1. Team with no correct answers (should show 0 score)
2. Unassigned players in "no-team" (should track score)
3. Mid-game player join (scores should reflect only answers submitted)

**Step 5: Check backward compatibility**

1. Load an existing game without roundScores field
2. Verify no errors in console
3. Verify game displays with total scores only

**Step 6: Document any issues**

If any issues found, create GitHub issues or fix immediately.

---

## Task 6: Final Verification and Cleanup

**Files:**
- None (verification only)

**Step 1: Run final build**

Run: `npm run build`
Expected: Build succeeds with no new errors

**Step 2: Run lint check**

Run: `npm run lint`
Expected: No new linting errors (baseline: 26 errors, 57 warnings)

**Step 3: Review all changes**

Run: `git diff main`
Expected: Review all changes for:
- No commented-out code
- No console.logs that should be removed (keep the scoreboard update logs)
- No TODO comments
- Proper error handling

**Step 4: Create final commit if needed**

If any cleanup needed:
```bash
git add .
git commit -m "chore: cleanup and final verification"
```

**Step 5: Push branch and prepare for PR**

```bash
git push -u origin feature/scoreboard-score-tracking
```

---

## Success Criteria

✅ Type definitions updated with roundScores field
✅ scoreboardService.updateScoreboard() implemented
✅ ControllerPage calls updateScoreboard after grading
✅ RoundEnd displays per-round and total scores
✅ All players can see all teams' scores on round-end screen
✅ Real-time updates work correctly
✅ No new TypeScript errors
✅ No new lint errors beyond baseline
✅ Manual testing passes all scenarios

---

## Rollback Plan

If issues occur in production:

1. Revert commits: `git revert <commit-hash>`
2. The roundScores field is optional, so existing games continue working
3. Old RoundEnd logic can be restored by reverting Task 4 commit

---

## Notes

- The roundScores field is optional for backward compatibility
- Scoreboard updates happen after grading, so there's one write per question
- Real-time subscriptions handle broadcasting updates to all players
- Error in scoreboard update doesn't block game progression (try-catch in ControllerPage)
