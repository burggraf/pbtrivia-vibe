# Game Timer Configuration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add timer configuration UI to game creation flow, storing timer values in `games.metadata` for future enforcement.

**Architecture:** Refactor GameEditModal with shadcn Accordion component organizing Basic Info, Game Structure, and Timers sections. Add 6 timer inputs (question, answer, game_start, round_start, game_end, thanks) with "Copy from Previous Game" quick-fill. Dialog becomes scrollable for mobile support.

**Tech Stack:** React 18, TypeScript, shadcn/ui (Accordion, Input), Tailwind CSS, PocketBase

**Design Reference:** `docs/plans/2025-11-08-game-timer-configuration-design.md`

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `src/types/games.ts`

**Step 1: Add GameMetadata interface**

Add after line 16 (after `GameScoreboard` interface):

```typescript
export interface GameMetadata {
  // Key timers (descriptive names for primary gameplay)
  question_timer?: number | null;        // round-play state
  answer_timer?: number | null;          // round-end state

  // Transition timers (state-based names)
  game_start_timer?: number | null;      // game-start state
  round_start_timer?: number | null;     // round-start state
  game_end_timer?: number | null;        // game-end state
  thanks_timer?: number | null;          // thanks state
}
```

**Step 2: Update Game interface (line 18)**

Change:
```typescript
  data?: string | Record<string, any>;
```

To:
```typescript
  data?: string | Record<string, any>;
  metadata?: GameMetadata;
```

**Step 3: Update CreateGameData interface (line 33)**

Add after line 41 (after `categories?: string[];`):

```typescript
  metadata?: GameMetadata;
```

**Step 4: Update UpdateGameData interface (line 44)**

Add after line 52 (after `categories?: string[];`):

```typescript
  metadata?: GameMetadata;
```

**Step 5: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds with no new errors

**Step 6: Commit**

```bash
git add src/types/games.ts
git commit -m "feat: add GameMetadata type for timer configuration

Add GameMetadata interface to store timer values for 6 game states.
Update Game, CreateGameData, UpdateGameData interfaces.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Verify Accordion Component

**Files:**
- Check: `src/components/ui/accordion.tsx`
- Check: `package.json`

**Step 1: Check if accordion component exists**

Run: `ls src/components/ui/accordion.tsx`
Expected: File exists (shadcn/ui already installed)

**Step 2: Verify @radix-ui/react-accordion in package.json**

Run: `grep "@radix-ui/react-accordion" package.json`
Expected: Found in dependencies

**Step 3: If missing, install accordion component**

If Step 1 or 2 failed:
```bash
npx shadcn@latest add accordion
```

Expected: Component installed successfully

**Step 4: No commit needed** (no changes if already exists)

---

## Task 3: Add Timer State to GameEditModal

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:23-31`

**Step 1: Add timer fields to formData state**

Change lines 23-31 from:
```typescript
  const [formData, setFormData] = useState<UpdateGameData | CreateGameData & { rounds?: number; questionsPerRound?: number; categories?: string[] }>({
    name: '',
    startdate: '',
    duration: 120,
    location: '',
    rounds: 3,
    questionsPerRound: 10,
    categories: []
  })
```

To:
```typescript
  const [formData, setFormData] = useState<UpdateGameData | CreateGameData & {
    rounds?: number;
    questionsPerRound?: number;
    categories?: string[];
    question_timer?: number | null;
    answer_timer?: number | null;
    game_start_timer?: number | null;
    round_start_timer?: number | null;
    game_end_timer?: number | null;
    thanks_timer?: number | null;
  }>({
    name: '',
    startdate: '',
    duration: 120,
    location: '',
    rounds: 3,
    questionsPerRound: 10,
    categories: [],
    question_timer: null,
    answer_timer: null,
    game_start_timer: null,
    round_start_timer: null,
    game_end_timer: null,
    thanks_timer: null
  })
```

**Step 2: Update useEffect for edit mode (lines 36-47)**

Change the game initialization section (lines 38-46) to:
```typescript
      setFormData({
        name: game.name || '',
        startdate: game.startdate ? new Date(game.startdate).toISOString().slice(0, 16) : '',
        duration: game.duration || 120,
        location: game.location || '',
        rounds: 3,
        questionsPerRound: 10,
        categories: [],
        question_timer: game.metadata?.question_timer || null,
        answer_timer: game.metadata?.answer_timer || null,
        game_start_timer: game.metadata?.game_start_timer || null,
        round_start_timer: game.metadata?.round_start_timer || null,
        game_end_timer: game.metadata?.game_end_timer || null,
        thanks_timer: game.metadata?.thanks_timer || null
      })
```

**Step 3: Update useEffect for create mode (lines 69-79)**

Change the create mode initialization section (lines 70-78) to:
```typescript
      setFormData({
        name: '',
        startdate: defaultStartDate,
        duration: 120,
        location: '',
        rounds: 3,
        questionsPerRound: 10,
        categories: getAvailableCategories(),
        question_timer: null,
        answer_timer: null,
        game_start_timer: null,
        round_start_timer: null,
        game_end_timer: null,
        thanks_timer: null
      })
```

**Step 4: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: add timer state fields to GameEditModal form

Add 6 timer fields to formData state for timer configuration.
Initialize from game.metadata in edit mode, null in create mode.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Update Form Submission Handler

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:82-92`

**Step 1: Update handleSubmit to include metadata**

Change lines 82-92 from:
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
    }

    await onSave(submitData)
    onClose()
  }
```

To:
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Convert empty/zero values to null for timers
    const metadata: GameMetadata = {
      question_timer: formData.question_timer || null,
      answer_timer: formData.answer_timer || null,
      game_start_timer: formData.game_start_timer || null,
      round_start_timer: formData.round_start_timer || null,
      game_end_timer: formData.game_end_timer || null,
      thanks_timer: formData.thanks_timer || null
    }

    const submitData = {
      ...formData,
      metadata: metadata,
      startdate: formData.startdate ? new Date(formData.startdate).toISOString() : undefined
    }

    await onSave(submitData)
    onClose()
  }
```

**Step 2: Add GameMetadata import at top**

After line 2, add to the imports from `@/types/games`:
```typescript
import { Game, CreateGameData, UpdateGameData, GameMetadata } from '@/types/games'
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: update handleSubmit to save timer metadata

Convert timer form values to GameMetadata and include in submitData.
Empty/zero timer values converted to null.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Add Accordion Component Imports

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:1-10`

**Step 1: Add Accordion imports**

After line 7 (after Select imports), add:
```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
```

**Step 2: Add toast hook import**

After the Accordion import, add:
```typescript
import { useToast } from '@/hooks/use-toast'
```

**Step 3: Initialize toast in component**

After line 21 (after `const isEdit = !!game`), add:
```typescript
  const { toast } = useToast()
```

**Step 4: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: add Accordion and toast imports to GameEditModal

Import shadcn Accordion components and toast hook for timer UI.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Implement "Copy from Previous Game" Function

**Files:**
- Modify: `src/components/games/GameEditModal.tsx`

**Step 1: Add gamesService import**

After line 10 (after CategoryIcon import), add:
```typescript
import { gamesService } from '@/lib/games'
```

**Step 2: Add copyFromPreviousGame handler**

After line 135 (after `handleDeleteCancel` function), add:

```typescript
  const handleCopyTimersFromPreviousGame = async () => {
    try {
      // Fetch recent games
      const games = await gamesService.getGames()

      // Find most recent game with timer metadata
      const previousGameWithTimers = games.find(g =>
        g.metadata?.question_timer !== undefined ||
        g.metadata?.answer_timer !== undefined ||
        g.metadata?.game_start_timer !== undefined ||
        g.metadata?.round_start_timer !== undefined ||
        g.metadata?.game_end_timer !== undefined ||
        g.metadata?.thanks_timer !== undefined
      )

      if (!previousGameWithTimers) {
        toast({
          title: "No Previous Timers",
          description: "No previous games with timer configuration found.",
          variant: "destructive"
        })
        return
      }

      // Copy timer values to form
      setFormData(prev => ({
        ...prev,
        question_timer: previousGameWithTimers.metadata?.question_timer || null,
        answer_timer: previousGameWithTimers.metadata?.answer_timer || null,
        game_start_timer: previousGameWithTimers.metadata?.game_start_timer || null,
        round_start_timer: previousGameWithTimers.metadata?.round_start_timer || null,
        game_end_timer: previousGameWithTimers.metadata?.game_end_timer || null,
        thanks_timer: previousGameWithTimers.metadata?.thanks_timer || null
      }))

      toast({
        title: "Timers Copied",
        description: `Copied timer settings from "${previousGameWithTimers.name}"`,
      })
    } catch (error) {
      console.error('Failed to copy timers:', error)
      toast({
        title: "Error",
        description: "Failed to load previous game timers.",
        variant: "destructive"
      })
    }
  }
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: add copy from previous game function

Implement handleCopyTimersFromPreviousGame to populate timer fields
from most recent game with timer configuration.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Refactor Dialog Content Structure

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:139-312`

**Step 1: Update DialogContent sizing**

Change line 140 from:
```typescript
        <DialogContent className="sm:max-w-[425px]">
```

To:
```typescript
        <DialogContent className="max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
```

**Step 2: Wrap form content in scrollable container**

Change line 150 from:
```typescript
          <form onSubmit={handleSubmit}>
```

To:
```typescript
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
```

**Step 3: Make inner content scrollable**

Change line 151 from:
```typescript
            <div className="grid gap-4 py-4">
```

To:
```typescript
            <div className="overflow-y-auto px-6 py-4">
```

**Step 4: Verify styling**

Run: `pnpm run dev`
Start dev server and manually check:
- Dialog opens without errors
- Content is visible
- Form can be submitted

**Step 5: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: update dialog sizing and scrollability

Increase max-width to 600px for better desktop layout.
Add max-height and overflow handling for mobile support.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Accordion Structure - Basic Info Section

**Files:**
- Modify: `src/components/games/GameEditModal.tsx:151-209`

**Step 1: Replace grid container with Accordion**

Replace lines 151-209 (the entire grid with Basic Info fields) with:

```typescript
            <div className="overflow-y-auto px-6 py-4">
              <Accordion type="single" collapsible defaultValue="basic-info" className="w-full">
                {/* Basic Info Section */}
                <AccordionItem value="basic-info">
                  <AccordionTrigger className="text-base font-semibold">
                    Basic Game Info
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 pt-4">
                      {/* Name */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="col-span-3"
                          required
                        />
                      </div>

                      {/* Duration and Location on same line */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">
                          Duration
                        </Label>
                        <div className="col-span-3 flex gap-2">
                          <Select
                            value={formData.duration?.toString() || '120'}
                            onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                          >
                            <SelectTrigger className="flex-1 bg-white dark:bg-slate-800 border-input">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border border-input">
                              {durationOptions.map((minutes) => (
                                <SelectItem key={minutes} value={minutes.toString()}>
                                  {minutes === 0 ? 'No limit' : `${minutes} minutes`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center px-2 text-slate-500">/</div>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="Location"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startdate" className="text-right">
                          Start Date
                        </Label>
                        <Input
                          id="startdate"
                          type="datetime-local"
                          value={formData.startdate}
                          onChange={(e) => handleInputChange('startdate', e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 3: Test accordion behavior**

Run: `pnpm run dev`
Manual test:
- Create Game dialog opens
- Basic Info accordion expands/collapses
- All fields work correctly

**Step 4: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: convert Basic Info section to accordion

Wrap name, duration, location, start date in accordion section.
Default to expanded state for initial visibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add Game Structure Accordion Section

**Files:**
- Modify: `src/components/games/GameEditModal.tsx` (after Basic Info accordion item)

**Step 1: Add Game Structure accordion item**

After the closing `</AccordionItem>` for Basic Info, add:

```typescript
                {/* Game Structure Section - Create mode only */}
                {!isEdit && (
                  <AccordionItem value="game-structure">
                    <AccordionTrigger className="text-base font-semibold">
                      Game Structure
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 pt-4">
                        {/* Rounds and Questions */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="rounds" className="text-right">
                            Rounds
                          </Label>
                          <div className="col-span-3 flex gap-4 items-center">
                            <Input
                              id="rounds"
                              type="number"
                              min="0"
                              max="99"
                              value={formData.rounds || 3}
                              onChange={(e) => handleInputChange('rounds', parseInt(e.target.value) || 3)}
                              className="w-16 text-center"
                              required
                            />
                            <Label htmlFor="questionsPerRound" className="text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              Questions
                            </Label>
                            <Input
                              id="questionsPerRound"
                              type="number"
                              min="1"
                              max="99"
                              value={formData.questionsPerRound || 10}
                              onChange={(e) => handleInputChange('questionsPerRound', parseInt(e.target.value) || 10)}
                              className="w-16 text-center"
                              placeholder="per round"
                              required
                            />
                          </div>
                        </div>

                        {/* Categories */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-base font-medium">Categories</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-300">
                                {formData.categories?.length || 0} of {getAvailableCategories().length} selected
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleToggleAllCategories}
                                className="text-xs h-7"
                              >
                                {isAllCategoriesSelected() ? 'Check None' : 'Check All'}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                            {getAvailableCategories().map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={category}
                                  checked={formData.categories?.includes(category) || false}
                                  onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                                />
                                <Label
                                  htmlFor={category}
                                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                >
                                  <CategoryIcon category={category} size={14} />
                                  {category}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
```

**Step 2: Remove old rounds/categories section**

Delete the old section (originally lines 212-287) that had:
- Rounds and Questions input
- Categories Section

This code is now inside the accordion.

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Test accordion behavior**

Run: `pnpm run dev`
Manual test:
- Create Game shows Game Structure section
- Edit Game does NOT show Game Structure section
- Rounds, questions, categories all work

**Step 5: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: move Game Structure to accordion section

Move rounds, questions, and categories into collapsible accordion.
Only shown in Create mode (not Edit mode).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Add Timers Accordion Section

**Files:**
- Modify: `src/components/games/GameEditModal.tsx` (after Game Structure accordion item)

**Step 1: Add Timers accordion item**

After the Game Structure `</AccordionItem>`, add:

```typescript
                {/* Timers Section - Create mode only */}
                {!isEdit && (
                  <AccordionItem value="timers">
                    <AccordionTrigger className="text-base font-semibold">
                      Timers
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 pt-4">
                        {/* Copy from Previous Game Button */}
                        <div className="flex justify-end mb-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyTimersFromPreviousGame}
                            className="text-xs"
                          >
                            Copy from Previous Game
                          </Button>
                        </div>

                        {/* Timer Inputs - 2 columns on desktop, 1 on mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Question Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="question_timer" className="text-sm font-medium">
                              Question Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="question_timer"
                                type="number"
                                min="0"
                                max="300"
                                value={formData.question_timer ?? ''}
                                onChange={(e) => handleInputChange('question_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-play state)</p>
                          </div>

                          {/* Answer Display Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="answer_timer" className="text-sm font-medium">
                              Answer Display Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="answer_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={formData.answer_timer ?? ''}
                                onChange={(e) => handleInputChange('answer_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-end state)</p>
                          </div>

                          {/* Round Start Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="round_start_timer" className="text-sm font-medium">
                              Round Start Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="round_start_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={formData.round_start_timer ?? ''}
                                onChange={(e) => handleInputChange('round_start_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(round-start state)</p>
                          </div>

                          {/* Game Start Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="game_start_timer" className="text-sm font-medium">
                              Game Start Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="game_start_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={formData.game_start_timer ?? ''}
                                onChange={(e) => handleInputChange('game_start_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(game-start state)</p>
                          </div>

                          {/* Game End Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="game_end_timer" className="text-sm font-medium">
                              Game End Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="game_end_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={formData.game_end_timer ?? ''}
                                onChange={(e) => handleInputChange('game_end_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(game-end state)</p>
                          </div>

                          {/* Thanks Screen Timer */}
                          <div className="space-y-2">
                            <Label htmlFor="thanks_timer" className="text-sm font-medium">
                              Thanks Screen Timer
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="thanks_timer"
                                type="number"
                                min="0"
                                max="600"
                                value={formData.thanks_timer ?? ''}
                                onChange={(e) => handleInputChange('thanks_timer', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="No limit"
                                className="flex-1"
                              />
                              <span className="text-sm text-slate-500">seconds</span>
                            </div>
                            <p className="text-xs text-slate-500">(thanks state)</p>
                          </div>
                        </div>

                        {/* Helper Note */}
                        <p className="text-xs text-slate-500 italic mt-2">
                          Leave blank or enter 0 for no time limit (manual advance)
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
```

**Step 2: Update handleInputChange to accept timer fields**

Find the `handleInputChange` function (line 94) and update its type signature:

Change:
```typescript
  const handleInputChange = (field: keyof (UpdateGameData | CreateGameData) | 'rounds' | 'questionsPerRound' | 'categories', value: string | number | string[] | undefined) => {
```

To:
```typescript
  const handleInputChange = (
    field: keyof (UpdateGameData | CreateGameData) | 'rounds' | 'questionsPerRound' | 'categories' |
           'question_timer' | 'answer_timer' | 'game_start_timer' | 'round_start_timer' | 'game_end_timer' | 'thanks_timer',
    value: string | number | string[] | null | undefined
  ) => {
```

**Step 3: Verify TypeScript compilation**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Test timer inputs**

Run: `pnpm run dev`
Manual test:
- Open Create Game dialog
- Expand Timers section
- Enter values in timer fields
- Click "Copy from Previous Game" (should show "No Previous Timers" toast)
- Verify placeholder text shows "No limit"

**Step 5: Commit**

```bash
git add src/components/games/GameEditModal.tsx
git commit -m "feat: add Timers accordion section with 6 timer inputs

Add collapsible Timers section with question, answer, and 4 transition
timers. Include Copy from Previous Game button. Desktop 2-column,
mobile single-column layout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Manual Testing - Create Game Flow

**Files:**
- Test: Application UI

**Step 1: Start development server**

Run: `pnpm run dev`
Expected: Server starts on http://localhost:5176

**Step 2: Test Create Game with timers**

Manual test checklist:
- [ ] Navigate to Host page
- [ ] Click "Create Game" button
- [ ] Basic Info accordion expanded by default
- [ ] Enter game name "Test Timer Game"
- [ ] Expand Game Structure section
- [ ] Select 2 rounds, 5 questions per round
- [ ] Select 3 categories
- [ ] Expand Timers section
- [ ] Enter: question_timer = 30, answer_timer = 10
- [ ] Leave other timers blank
- [ ] Click "Create Game"
- [ ] Game created successfully

**Step 3: Verify data in PocketBase**

1. Open PocketBase admin: http://localhost:8090/_/
2. Login with admin credentials
3. Navigate to `games` collection
4. Find "Test Timer Game"
5. Check `metadata` field contains:
   ```json
   {
     "question_timer": 30,
     "answer_timer": 10,
     "game_start_timer": null,
     "round_start_timer": null,
     "game_end_timer": null,
     "thanks_timer": null
   }
   ```

Expected: Metadata saved correctly

**Step 4: Test Copy from Previous Game**

Manual test:
- [ ] Click "Create Game" again
- [ ] Expand Timers section
- [ ] Click "Copy from Previous Game"
- [ ] Toast shows "Copied timer settings from 'Test Timer Game'"
- [ ] question_timer shows 30
- [ ] answer_timer shows 10
- [ ] Other timers remain blank

Expected: Copy works correctly

**Step 5: Test Edit Game (timers not shown)**

Manual test:
- [ ] Click Edit on existing game
- [ ] Basic Info section visible
- [ ] Game Structure section NOT visible
- [ ] Timers section NOT visible
- [ ] Edit name, save successfully
- [ ] Verify metadata unchanged in PocketBase

Expected: Edit mode doesn't show or modify timers

**Step 6: No commit needed** (manual testing only)

---

## Task 12: Mobile Responsive Testing

**Files:**
- Test: Application UI on mobile viewport

**Step 1: Test mobile viewport (375px)**

Using browser dev tools:
- [ ] Set viewport to 375px width
- [ ] Open Create Game dialog
- [ ] Dialog fits within viewport
- [ ] Content scrollable if needed
- [ ] Timer inputs single column (not 2-column)
- [ ] All inputs have min 44px height
- [ ] Buttons are touch-friendly
- [ ] Accordion expands/collapses smoothly

**Step 2: Test tablet viewport (768px)**

Using browser dev tools:
- [ ] Set viewport to 768px width
- [ ] Open Create Game dialog
- [ ] Timer inputs show 2-column layout
- [ ] Dialog sizing appropriate
- [ ] All interactions work smoothly

**Step 3: No commit needed** (manual testing only)

---

## Task 13: Edge Case Testing

**Files:**
- Test: Application UI

**Step 1: Test zero/blank timer handling**

Manual test:
- [ ] Create game with question_timer = 0
- [ ] Verify saved as null in database
- [ ] Create game with answer_timer = "" (empty)
- [ ] Verify saved as null in database

Expected: Both 0 and empty convert to null

**Step 2: Test max validation**

Manual test:
- [ ] Try entering 301 in question_timer
- [ ] Verify HTML5 validation prevents > 300
- [ ] Try entering 601 in answer_timer
- [ ] Verify HTML5 validation prevents > 600

Expected: Max values enforced

**Step 3: Test Copy with no previous games**

Manual test:
- [ ] Delete all games from database (via PocketBase admin)
- [ ] Open Create Game
- [ ] Click "Copy from Previous Game"
- [ ] Toast shows "No previous games with timer configuration found"

Expected: Graceful handling of empty state

**Step 4: Test form validation with timers**

Manual test:
- [ ] Create game with all fields valid + timers
- [ ] Verify can submit
- [ ] Create game with 3 rounds but no categories
- [ ] Verify submit disabled (existing validation still works)

Expected: Timers don't break existing validation

**Step 5: No commit needed** (manual testing only)

---

## Task 14: Final Build Verification

**Files:**
- Build: Production build

**Step 1: Clean build**

Run: `pnpm run build`
Expected: Build succeeds with no errors

**Step 2: Check bundle size**

Expected output should warn about chunks > 500kb (existing warning, not new)

**Step 3: Run lint**

Run: `pnpm run lint`
Expected: Same 66 warnings as baseline (no new warnings)

**Step 4: Test production build locally**

Run: `pnpm run preview`
Manual test:
- [ ] Create game with timers
- [ ] Verify functionality identical to dev mode

**Step 5: Commit (if any fixes made)**

Only if issues found and fixed in this step:
```bash
git add .
git commit -m "fix: final build adjustments for timer feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 15: Documentation Update

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add timer configuration note**

Add to the "Development Workflow" or "Architecture Overview" section:

```markdown
### Timer Configuration

- Game timers configured via Create Game dialog (Timers accordion section)
- Timer values stored in `games.metadata` JSON field
- 6 timer types: question, answer, game_start, round_start, game_end, thanks
- Values in seconds, null/0 = no time limit
- Timer enforcement not yet implemented (data capture only)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add timer configuration to CLAUDE.md

Document timer configuration feature and data storage.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 16: Final Commit and Verification

**Files:**
- All modified files

**Step 1: Review all changes**

Run: `git status`
Expected: All changes committed

**Step 2: Check commit log**

Run: `git log --oneline -15`
Expected: See all 13+ commits for timer feature

**Step 3: Create feature summary**

Run: `git log --oneline main..HEAD`
Expected: List of all commits in this branch

**Step 4: Run final verification**

Run: `pnpm run build && pnpm run lint`
Expected: Both succeed

**Step 5: Ready for code review**

The feature is now complete and ready for review. Use the code-reviewer skill:
- **REQUIRED SUB-SKILL:** Use superpowers:requesting-code-review

---

## Success Criteria

✅ **Functional Requirements:**
- [ ] 6 timer inputs added to Create Game dialog
- [ ] Timer values stored in `games.metadata`
- [ ] "Copy from Previous Game" functionality works
- [ ] Dialog scrollable on small screens
- [ ] Accordion organization (Basic Info, Game Structure, Timers)
- [ ] Edit mode doesn't show timers section
- [ ] Zero/blank values convert to null
- [ ] Max validation enforced (300s question, 600s others)

✅ **Technical Requirements:**
- [ ] TypeScript types updated (GameMetadata)
- [ ] No new TypeScript errors
- [ ] No new lint warnings
- [ ] Production build succeeds
- [ ] Mobile responsive (375px minimum)
- [ ] Toast notifications for copy function

✅ **Code Quality:**
- [ ] Frequent small commits (~13 commits)
- [ ] Clear commit messages with Co-Authored-By
- [ ] DRY principles followed
- [ ] YAGNI - no timer enforcement implemented
- [ ] Consistent with existing code patterns

---

## Out of Scope

❌ **Not Implemented (Future Work):**
- Timer enforcement during gameplay
- Countdown displays
- Auto-advance between states
- Warning indicators
- Timer editing in Edit mode
- Per-round timer customization
- Timer presets/templates beyond "Copy from Previous"

These features should be implemented in separate tasks after this data capture foundation is complete.
