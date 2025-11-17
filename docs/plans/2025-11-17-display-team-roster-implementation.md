# Display Team Roster Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time team and player roster display to the Game Start screen in trivia-party-display app with 3-column layout.

**Architecture:** Create standalone TeamRoster component that reads from DisplayContext's gameRecord.scoreboard, sorts teams/players, and renders in 3-column grid with dynamic scaling for density.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, PocketBase (via existing DisplayContext)

---

## Task 1: Create TeamRoster Component Shell

**Files:**
- Create: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Create empty component file**

Create `trivia-party-display/src/components/TeamRoster.tsx`:

```typescript
import { useDisplay } from '@/contexts/DisplayContext'

export function TeamRoster() {
  const { gameRecord } = useDisplay()

  if (!gameRecord?.scoreboard?.teams) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  return (
    <div className="text-slate-200">
      Team Roster Component
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add TeamRoster component shell

Add empty TeamRoster component with DisplayContext integration and
empty state handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Data Processing Logic

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add TypeScript interfaces**

Add at top of TeamRoster.tsx (after imports):

```typescript
interface ProcessedPlayer {
  id: string
  name: string
  avatar?: string
}

interface ProcessedTeam {
  id: string
  name: string
  players: ProcessedPlayer[]
}
```

**Step 2: Add data processing function**

Add before component:

```typescript
function processScoreboardData(
  scoreboard: { teams: Record<string, any> } | undefined
): ProcessedTeam[] {
  if (!scoreboard?.teams) return []

  const teamsArray = Object.entries(scoreboard.teams).map(([id, team]) => ({
    id,
    name: team.name,
    players: [...(team.players || [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }))

  return teamsArray.sort((a, b) =>
    (a.name + a.id).localeCompare(b.name + b.id)
  )
}
```

**Step 3: Use processing function in component**

Update component body:

```typescript
export function TeamRoster() {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  return (
    <div className="text-slate-200">
      {teams.length} team(s) ready
    </div>
  )
}
```

**Step 4: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add scoreboard data processing

Add processScoreboardData function to sort teams and players
alphabetically for display.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Dynamic Scaling Calculation

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add scaling calculation function**

Add after processScoreboardData:

```typescript
function calculateScale(teams: ProcessedTeam[]): number {
  if (teams.length === 0) return 1.0

  const teamCount = teams.length
  const maxPlayersPerTeam = Math.max(...teams.map((t) => t.players.length), 0)

  const teamScale = 8 / Math.max(teamCount, 1)
  const playerScale = 4 / Math.max(maxPlayersPerTeam, 1)

  return Math.max(0.6, Math.min(1.0, Math.min(teamScale, playerScale)))
}
```

**Step 2: Use scaling in component**

Update component to calculate scale:

```typescript
export function TeamRoster() {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)
  const scale = calculateScale(teams)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  return (
    <div className="text-slate-200">
      {teams.length} team(s) ready (scale: {scale.toFixed(2)})
    </div>
  )
}
```

**Step 3: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add dynamic scaling calculation

Calculate scale factor based on team count and max players per team.
Scale range: 0.6 to 1.0.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Avatar Color Helper

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add avatar color function**

Add after calculateScale:

```typescript
function getAvatarColor(playerId: string): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'teal']
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add avatar color helper

Hash player ID to consistently assign avatar fallback colors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create PlayerAvatar Sub-component

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add PlayerAvatar component**

Add before TeamRoster component:

```typescript
interface PlayerAvatarProps {
  player: ProcessedPlayer
}

function PlayerAvatar({ player }: PlayerAvatarProps) {
  const color = getAvatarColor(player.id)

  if (player.avatar) {
    return (
      <img
        src={player.avatar}
        alt={player.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    )
  }

  // Fallback: show first letter with colored background
  const initial = player.name.charAt(0).toUpperCase()

  return (
    <div
      className={`w-8 h-8 rounded-full bg-${color}-500 flex items-center justify-center text-white font-medium text-sm`}
    >
      {initial}
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add PlayerAvatar sub-component

Display player avatar image or initial fallback with colored background.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create PlayerItem Sub-component

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add PlayerItem component**

Add after PlayerAvatar:

```typescript
interface PlayerItemProps {
  player: ProcessedPlayer
}

function PlayerItem({ player }: PlayerItemProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-700/50 rounded-md p-2">
      <PlayerAvatar player={player} />
      <span className="text-base text-slate-200 truncate">{player.name}</span>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add PlayerItem sub-component

Display player with avatar and name in horizontal layout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create TeamCard Sub-component

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add TeamCard component**

Add after PlayerItem:

```typescript
interface TeamCardProps {
  team: ProcessedTeam
  scale: number
}

function TeamCard({ team, scale }: TeamCardProps) {
  return (
    <div
      className="border border-slate-700 bg-slate-800 rounded-lg p-3 transition-transform duration-200 ease-in-out"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top',
      }}
    >
      <h3 className="text-lg font-bold text-slate-100 mb-2">{team.name}</h3>
      <div className="space-y-2">
        {team.players.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): add TeamCard sub-component

Display team name and player list with dynamic scaling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Implement 3-Column Layout

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Update TeamRoster component with column split**

Replace TeamRoster return statement:

```typescript
export function TeamRoster() {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)
  const scale = calculateScale(teams)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  // Split teams into left and right columns
  const midpoint = Math.ceil(teams.length / 2)
  const leftTeams = teams.slice(0, midpoint)
  const rightTeams = teams.slice(midpoint)

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 w-full">
      {/* Left Column */}
      <div className="flex flex-col gap-3">
        {leftTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>

      {/* Center Column - Placeholder for QR code content */}
      <div className="flex items-center justify-center">
        <div className="text-slate-400 text-sm">
          (QR code and game info goes here)
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-3">
        {rightTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "feat(display): implement 3-column layout

Add grid layout with left/right team columns and center placeholder.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Integrate TeamRoster into GameStart

**Files:**
- Modify: `trivia-party-display/src/components/states/GameStart.tsx`

**Step 1: Read current GameStart component**

Run: `cat trivia-party-display/src/components/states/GameStart.tsx`
Note: Understand current structure

**Step 2: Add TeamRoster import**

Add to imports section:

```typescript
import { TeamRoster } from '@/components/TeamRoster'
```

**Step 3: Replace GameStart return with TeamRoster integration**

Replace the return statement in GameStart component:

```typescript
return (
  <TeamRoster />
)
```

Note: The entire QR code/game info content will be passed as children later, but for now we're just rendering TeamRoster to verify integration.

**Step 4: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 5: Commit**

```bash
git add trivia-party-display/src/components/states/GameStart.tsx
git commit -m "feat(display): integrate TeamRoster into GameStart

Replace GameStart content with TeamRoster component (temporary for
integration testing).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Restore GameStart Content as Center Column

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`
- Modify: `trivia-party-display/src/components/states/GameStart.tsx`

**Step 1: Update TeamRoster to accept children prop**

Modify TeamRoster signature and center column:

```typescript
interface TeamRosterProps {
  children: React.ReactNode
}

export function TeamRoster({ children }: TeamRosterProps) {
  const { gameRecord } = useDisplay()
  const teams = processScoreboardData(gameRecord?.scoreboard)
  const scale = calculateScale(teams)

  if (teams.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        Waiting for teams to join...
      </div>
    )
  }

  const midpoint = Math.ceil(teams.length / 2)
  const leftTeams = teams.slice(0, midpoint)
  const rightTeams = teams.slice(midpoint)

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 w-full">
      {/* Left Column */}
      <div className="flex flex-col gap-3">
        {leftTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>

      {/* Center Column - QR code content passed as children */}
      <div className="flex items-center justify-center">
        {children}
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-3">
        {rightTeams.map((team) => (
          <TeamCard key={team.id} team={team} scale={scale} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Update GameStart to pass content as children**

Restore original GameStart content inside TeamRoster:

```typescript
return (
  <TeamRoster>
    <div className="text-center mb-4 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Welcome to Trivia Party!
      </h2>
      <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium mb-3">
        {gameName || 'Get ready to play!'}
      </p>

      {gameCode && (
        <div className="mb-6">
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 mb-4">
            Game Code: <span className="font-mono font-bold text-xl md:text-2xl">{gameCode}</span>
          </p>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <QRCode
                value={`${getMainAppUrl()}/join?code=${gameCode}`}
                size={256}
                level="M"
                aria-label={`QR code to join game ${gameCode}`}
              />
              <p className="text-center text-base text-slate-600 dark:text-slate-700 mt-3">
                Scan to join
              </p>
            </div>
          </div>
        </div>
      )}

      {showChangeTeamButton && (
        <Button
          onClick={handleChangeTeam}
          disabled={isChangingTeam}
          variant="outline"
          className="h-[44px] min-h-[44px] px-6"
        >
          {isChangingTeam ? 'Leaving...' : 'Change My Team'}
        </Button>
      )}
    </div>
  </TeamRoster>
)
```

**Step 3: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx trivia-party-display/src/components/states/GameStart.tsx
git commit -m "feat(display): restore GameStart content in center column

Pass original GameStart content as children to TeamRoster for 3-column
layout integration.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Add React Import for Children Type

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Step 1: Add React import if missing**

Update imports at top of file:

```typescript
import { useDisplay } from '@/contexts/DisplayContext'
import type { ReactNode } from 'react'
```

**Step 2: Update interface to use ReactNode**

Ensure interface uses the imported type:

```typescript
interface TeamRosterProps {
  children: ReactNode
}
```

**Step 3: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "fix(display): add React import for ReactNode type

Import ReactNode type for children prop.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Manual Testing & Verification

**Manual Testing Steps:**

**Step 1: Start development server**

In worktree directory:
```bash
cd trivia-party-display
pnpm tauri:dev
```

**Step 2: Test empty state**

1. Launch display app
2. Wait for code screen to appear
3. Verify: "Waiting for teams to join..." shows when no game active

**Step 3: Test with active game**

Prerequisites: Need main app running with a game in game-start state with teams/players

1. Connect display to an active game
2. Navigate to game-start state
3. Verify:
   - Left column shows teams 1-4
   - Center shows QR code and game info
   - Right column shows teams 5+ (if exist)
   - Team names are sorted alphabetically
   - Players within teams are sorted alphabetically
   - Avatars show (image or initial fallback)

**Step 4: Test scaling behavior**

1. Create game with 2 teams, 2 players each
   - Verify: Normal scale (1.0)
2. Create game with 8 teams, 4 players each
   - Verify: Normal scale (1.0)
3. Create game with 12 teams, 4 players each
   - Verify: Scaled down (< 1.0)
4. Create game with 4 teams, 6 players each
   - Verify: Scaled down based on player count

**Step 5: Test real-time updates**

1. Have game in game-start state on display
2. Add new team from main app
3. Verify: Team appears immediately in roster
4. Add player to team
5. Verify: Player appears immediately in team list
6. Remove player
7. Verify: Player disappears immediately

**Step 6: Document any issues**

Create notes file if needed:
```bash
echo "Manual Testing Results:" > test-notes.md
echo "- Empty state: [PASS/FAIL notes]" >> test-notes.md
echo "- Team display: [PASS/FAIL notes]" >> test-notes.md
echo "- Scaling: [PASS/FAIL notes]" >> test-notes.md
echo "- Real-time: [PASS/FAIL notes]" >> test-notes.md
```

---

## Task 13: Fix Any TypeScript Errors

**Files:**
- Modify: Various files as needed based on TypeScript errors

**Step 1: Run TypeScript check**

Run: `pnpm run build`
Expected: Identify any TypeScript errors

**Step 2: Fix errors systematically**

For each error:
1. Read error message
2. Navigate to file:line
3. Fix type issue
4. Re-run build to verify

Common fixes:
- Add missing type imports
- Fix prop type mismatches
- Add null checks where needed
- Ensure GamesRecord scoreboard type matches usage

**Step 3: Verify clean build**

Run: `pnpm run build`
Expected: Build succeeds with zero TypeScript errors

**Step 4: Commit fixes**

```bash
git add [modified files]
git commit -m "fix(display): resolve TypeScript errors

Fix type issues in TeamRoster integration.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: Fix Avatar Color Tailwind Issue

**Files:**
- Modify: `trivia-party-display/src/components/TeamRoster.tsx`

**Problem:** Tailwind cannot dynamically generate classes like `bg-${color}-500` at runtime.

**Step 1: Create static color mapping**

Replace PlayerAvatar component with:

```typescript
function PlayerAvatar({ player }: PlayerAvatarProps) {
  const colorName = getAvatarColor(player.id)

  if (player.avatar) {
    return (
      <img
        src={player.avatar}
        alt={player.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    )
  }

  // Map color names to Tailwind classes
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
  }

  const bgClass = colorClasses[colorName] || 'bg-slate-500'
  const initial = player.name.charAt(0).toUpperCase()

  return (
    <div
      className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center text-white font-medium text-sm`}
    >
      {initial}
    </div>
  )
}
```

**Step 2: Verify it compiles**

Run: `pnpm run build`
Expected: Build succeeds

**Step 3: Commit fix**

```bash
git add trivia-party-display/src/components/TeamRoster.tsx
git commit -m "fix(display): use static Tailwind classes for avatar colors

Replace dynamic class generation with static color mapping for Tailwind
compatibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 15: Update Design Document Status

**Files:**
- Modify: `docs/plans/2025-11-17-display-team-roster-design.md`

**Step 1: Update status**

Change header:
```markdown
**Status:** Implemented
```

**Step 2: Commit**

```bash
git add docs/plans/2025-11-17-display-team-roster-design.md
git commit -m "docs: mark team roster design as implemented

Update design document status to reflect implementation completion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 16: Final Build Verification

**Step 1: Clean build**

```bash
rm -rf dist trivia-party-display/dist
pnpm run build
```

Expected: Clean build with no errors or warnings (chunk size warnings are acceptable)

**Step 2: Test production build**

```bash
pnpm run preview
```

Expected: App runs correctly from production build

**Step 3: Create completion summary**

```bash
echo "Implementation Complete" > IMPLEMENTATION_SUMMARY.md
echo "" >> IMPLEMENTATION_SUMMARY.md
echo "## Components Added" >> IMPLEMENTATION_SUMMARY.md
echo "- TeamRoster.tsx (with sub-components)" >> IMPLEMENTATION_SUMMARY.md
echo "" >> IMPLEMENTATION_SUMMARY.md
echo "## Components Modified" >> IMPLEMENTATION_SUMMARY.md
echo "- GameStart.tsx (integrated TeamRoster)" >> IMPLEMENTATION_SUMMARY.md
echo "" >> IMPLEMENTATION_SUMMARY.md
echo "## Manual Testing Required" >> IMPLEMENTATION_SUMMARY.md
echo "- Empty state display" >> IMPLEMENTATION_SUMMARY.md
echo "- Team/player rendering" >> IMPLEMENTATION_SUMMARY.md
echo "- Dynamic scaling with various team/player counts" >> IMPLEMENTATION_SUMMARY.md
echo "- Real-time updates" >> IMPLEMENTATION_SUMMARY.md
```

**Step 4: Commit summary**

```bash
git add IMPLEMENTATION_SUMMARY.md
git commit -m "docs: add implementation summary

Document completed components and required testing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] TeamRoster component created with all sub-components
- [ ] Data processing functions implemented
- [ ] Dynamic scaling logic working
- [ ] Avatar display with image and fallback
- [ ] 3-column layout rendering correctly
- [ ] GameStart integration complete
- [ ] TypeScript compiles with no errors
- [ ] Production build succeeds
- [ ] Manual testing performed
- [ ] Design document updated
- [ ] All changes committed

## Known Limitations

1. **Tailwind Purge:** Ensure production build includes all color classes (blue-500, green-500, etc.) by verifying they're used in safelist if needed
2. **Avatar URLs:** Assumes avatar URLs are publicly accessible
3. **Empty Teams:** If a team has zero players, it still displays (could be filtered)
4. **Network Errors:** No error handling for DisplayContext errors
5. **Long Names:** Player/team names truncate with ellipsis but might need tuning

## Next Steps (Not in This Plan)

- Add animations for team/player additions
- Add online status indicators (if integrating with online collection)
- Add team scores display alongside names
- Optimize for very wide screens (ultra-wide monitors)
- Add E2E tests with Playwright
