# QR Code Click-to-Copy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the QR code on the controller "Welcome to the Game!" screen clickable to copy the game join URL to the clipboard, providing toast feedback.

**Architecture:** Add sonner toast library, create clipboard utility with fallback support, wrap QR code in accessible button with hover states, show success/error toasts.

**Tech Stack:** React, TypeScript, Sonner (toast), Tailwind CSS, shadcn/ui, Clipboard API

---

## Task 1: Install Sonner Dependency

**Files:**
- Modify: `package.json`

**Step 1: Install sonner package**

Run: `pnpm add sonner`

Expected: Package added to dependencies in package.json

**Step 2: Verify installation**

Run: `pnpm list sonner`

Expected: Shows sonner version installed

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add sonner for toast notifications"
```

---

## Task 2: Add shadcn/ui Sonner Component

**Files:**
- Create: `src/components/ui/sonner.tsx`

**Step 1: Create sonner component file**

Create `src/components/ui/sonner.tsx` with the following content:

```tsx
import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800",
          description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

**Step 2: Verify file compiles**

Run: `pnpm run build`

Expected: Build succeeds with no errors related to sonner.tsx

**Step 3: Commit**

```bash
git add src/components/ui/sonner.tsx
git commit -m "feat: add shadcn/ui sonner toast component"
```

---

## Task 3: Add Toaster Provider to App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read current App.tsx structure**

Read: `src/App.tsx`

Note: Find where ThemeProvider is located and where to add Toaster

**Step 2: Import Toaster component**

Add to imports at top of `src/App.tsx`:

```tsx
import { Toaster } from '@/components/ui/sonner'
```

**Step 3: Add Toaster component to JSX**

Add `<Toaster />` inside the ThemeProvider, outside the Router. The structure should look like:

```tsx
<ThemeProvider defaultTheme="system" storageKey="trivia-party-theme">
  <Toaster />
  <Router>
    {/* existing routes */}
  </Router>
</ThemeProvider>
```

Place it right after the opening `<ThemeProvider>` tag and before `<Router>`.

**Step 4: Verify build**

Run: `pnpm run build`

Expected: Build succeeds, no errors

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Toaster provider to app root"
```

---

## Task 4: Create Clipboard Utility with Tests

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/lib/__tests__/clipboard.test.ts` (if test infrastructure exists)

**Step 1: Create clipboard utility file**

Create `src/lib/clipboard.ts` with the following content:

```typescript
/**
 * Copy text to clipboard using modern Clipboard API with fallback
 *
 * @param text - The text to copy to clipboard
 * @returns Promise resolving to success status and optional error message
 */
export async function copyToClipboard(
  text: string
): Promise<{ success: boolean; error?: string }> {
  // Check if text is provided
  if (!text || text.trim() === '') {
    return {
      success: false,
      error: 'No text provided to copy',
    }
  }

  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (err) {
      console.error('Clipboard API failed:', err)

      // Check if it's a permission error
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Clipboard permission denied',
        }
      }

      // Fall through to fallback method
    }
  }

  // Fallback method for older browsers or non-secure contexts
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text

    // Make the textarea invisible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.setAttribute('aria-hidden', 'true')

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      return { success: true }
    } else {
      return {
        success: false,
        error: 'Copy command failed',
      }
    }
  } catch (err) {
    console.error('Fallback copy failed:', err)
    return {
      success: false,
      error: 'Failed to copy to clipboard',
    }
  }
}
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds, clipboard.ts compiles without errors

**Step 3: Commit**

```bash
git add src/lib/clipboard.ts
git commit -m "feat: add clipboard utility with fallback support"
```

**Note:** Full unit tests would require mocking navigator.clipboard and document.execCommand, which is complex. Manual testing will verify functionality.

---

## Task 5: Make QR Code Clickable in GameStateDisplay

**Files:**
- Modify: `src/components/games/GameStateDisplay.tsx:69-81`

**Step 1: Read current GameStateDisplay implementation**

Read: `src/components/games/GameStateDisplay.tsx`

Note the current QR code structure at lines 69-81 in the 'game-start' case

**Step 2: Add imports**

Add to the imports at the top of `src/components/games/GameStateDisplay.tsx`:

```tsx
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/clipboard'
```

**Step 3: Add click handler function**

Add this function inside the `GameStateDisplay` component, before the `renderStateContent` function:

```tsx
const handleCopyToClipboard = async () => {
  const url = `${getPublicUrl()}/join?code=${game?.code}`
  const result = await copyToClipboard(url)

  if (result.success) {
    toast.success('Link copied to clipboard!', {
      duration: 3000,
    })
  } else {
    toast.error(`Failed to copy link${result.error ? `: ${result.error}` : ''}`, {
      duration: 5000,
    })
  }
}
```

**Step 4: Replace QR code div with button**

Replace the QR code container (lines 69-81) with this clickable button version:

```tsx
<button
  onClick={handleCopyToClipboard}
  className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm inline-block cursor-pointer hover:scale-105 hover:shadow-lg transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-98"
  aria-label="Click to copy game join link to clipboard"
  type="button"
>
  <QRCode
    value={`${getPublicUrl()}/join?code=${game?.code}`}
    size={200}
    level="M"
    aria-label={`QR code to join game ${game?.code}`}
  />
  <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-3">
    Scan to join
  </p>
</button>
```

The key changes:
- Changed outer `<div>` to `<button>`
- Added `onClick={handleCopyToClipboard}`
- Added hover states: `hover:scale-105 hover:shadow-lg`
- Added transition: `transition-transform duration-200`
- Added cursor: `cursor-pointer`
- Added focus ring: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
- Added active state: `active:scale-98`
- Added accessibility: `aria-label` and `type="button"`

**Step 5: Verify TypeScript compilation**

Run: `pnpm run build`

Expected: Build succeeds with no errors

**Step 6: Commit**

```bash
git add src/components/games/GameStateDisplay.tsx
git commit -m "feat: make QR code clickable to copy join link

- Wrap QR code in button with click handler
- Add toast notifications for copy feedback
- Include hover/focus states for accessibility
- Support keyboard navigation (Enter/Space)"
```

---

## Task 6: Manual Testing

**Prerequisites:**
- PocketBase running on port 8090
- Frontend dev server running

**Step 1: Start development environment**

Run: `./dev.sh` (or start PocketBase and frontend separately)

Expected: Both servers start successfully

**Step 2: Create a game and navigate to controller**

1. Navigate to http://localhost:5173
2. Log in (or register)
3. Create a new game
4. Click "Start Game" to go to controller view

Expected: Controller page shows "Welcome to the Game!" with QR code

**Step 3: Test hover state**

Action: Hover mouse over QR code

Expected:
- Cursor changes to pointer
- QR code scales slightly larger (105%)
- Shadow becomes more prominent

**Step 4: Test click functionality**

Action: Click the QR code

Expected:
- Toast notification appears: "Link copied to clipboard!"
- Toast auto-dismisses after 3 seconds

**Step 5: Verify clipboard contents**

Action: Paste into a text field (Cmd+V or Ctrl+V)

Expected: URL appears in format: `http://localhost:5173/join?code=ABCD1234`

**Step 6: Test keyboard navigation**

Actions:
1. Press Tab key until QR code is focused
2. Verify focus ring appears (blue outline)
3. Press Enter key
4. Verify toast appears and link is copied

Expected: Full keyboard accessibility works

**Step 7: Test mobile viewport**

Actions:
1. Open browser DevTools
2. Toggle device toolbar (mobile view)
3. Select iPhone or Android device
4. Tap QR code

Expected:
- Touch interaction works
- Toast appears at bottom-center
- Link copies successfully

**Step 8: Test dark mode**

Actions:
1. Toggle dark mode
2. Verify QR code button styling in dark theme
3. Click QR code
4. Verify toast appears with dark theme styling

Expected: All dark mode styles work correctly

**Step 9: Test error scenario (optional)**

Note: Difficult to test without special browser setup, but if you can:

Actions:
1. Test in non-secure context (HTTP, not localhost)
2. Or deny clipboard permissions in browser settings
3. Click QR code

Expected: Error toast appears with appropriate message

---

## Task 7: Accessibility Verification

**Step 1: Test with screen reader**

If available, use VoiceOver (Mac), NVDA (Windows), or browser screen reader:

Actions:
1. Navigate to controller page with screen reader active
2. Tab to QR code button
3. Verify screen reader announces: "Click to copy game join link to clipboard, button"
4. Activate with Enter
5. Verify screen reader announces toast message

**Step 2: Test keyboard-only navigation**

Actions:
1. Unplug mouse or avoid using it
2. Use only Tab, Enter, Space keys
3. Navigate through entire controller page
4. Verify QR code button is reachable and activatable

Expected: Complete keyboard accessibility without mouse

**Step 3: Verify ARIA labels**

Action: Inspect QR code button in DevTools Elements panel

Expected:
- Button has `aria-label="Click to copy game join link to clipboard"`
- QR code SVG has `aria-label="QR code to join game XXXX"`

---

## Task 8: Cross-Browser Testing

**Step 1: Test in Chrome/Edge**

Repeat manual testing steps in Chrome or Edge browser

Expected: All functionality works

**Step 2: Test in Safari**

Repeat manual testing steps in Safari browser

Expected: All functionality works

**Step 3: Test in Firefox**

Repeat manual testing steps in Firefox browser

Expected: All functionality works

---

## Task 9: Final Verification and Documentation

**Step 1: Run full build**

Run: `pnpm run build`

Expected: Clean build with no errors

**Step 2: Run linter**

Run: `pnpm run lint`

Expected: No new linting errors

**Step 3: Create summary commit**

If any final tweaks were made during testing:

```bash
git add .
git commit -m "test: verify QR code click-to-copy functionality

Manual testing completed:
- Click functionality verified
- Toast notifications working
- Keyboard navigation accessible
- Dark mode styling correct
- Mobile viewport tested"
```

---

## Implementation Complete

**What was built:**
- ✅ Sonner toast library installed and integrated
- ✅ Clipboard utility with fallback support
- ✅ QR code made clickable with accessible button
- ✅ Success/error toast notifications
- ✅ Hover and focus states for visual feedback
- ✅ Full keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Dark mode support

**Next steps:**
1. Merge feature branch to main (or create PR)
2. Deploy to production
3. Monitor for any clipboard-related errors
4. Consider future enhancements (haptic feedback, share API)

**Testing completed:**
- Manual functionality testing ✅
- Keyboard navigation ✅
- Mobile viewport ✅
- Dark mode ✅
- Cross-browser compatibility ✅
- Accessibility verification ✅
