# Controller Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the `/controller` screen into a card-based dashboard grid layout with keyboard shortcuts and toggleable UI elements.

**Architecture:** Dashboard Grid with responsive CSS Grid, React hooks for settings persistence and keyboard handling, card-based components.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, localStorage API, Keyboard Events API

---

## Task 1: Create Controller Settings Hook

**Files:**
- Create: `src/hooks/useControllerSettings.ts`

**Step 1: Create hooks directory and settings hook**

```typescript
import { useState, useEffect } from 'react'

interface ControllerSettings {
  showQrCode: boolean
  showJoinLink: boolean
}

const STORAGE_KEY_QR = 'controller.showQrCode'
const STORAGE_KEY_LINK = 'controller.showJoinLink'

export function useControllerSettings() {
  const [showQrCode, setShowQrCode] = useState(true)
  const [showJoinLink, setShowJoinLink] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const qrSetting = localStorage.getItem(STORAGE_KEY_QR)
    const linkSetting = localStorage.getItem(STORAGE_KEY_LINK)

    if (qrSetting !== null) {
      setShowQrCode(qrSetting === 'true')
    }
    if (linkSetting !== null) {
      setShowJoinLink(linkSetting === 'true')
    }
  }, [])

  const toggleQrCode = () => {
    const newValue = !showQrCode
    setShowQrCode(newValue)
    localStorage.setItem(STORAGE_KEY_QR, String(newValue))
  }

  const toggleJoinLink = () => {
    const newValue = !showJoinLink
    setShowJoinLink(newValue)
    localStorage.setItem(STORAGE_KEY_LINK, String(newValue))
  }

  return {
    showQrCode,
    showJoinLink,
    toggleQrCode,
    toggleJoinLink
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useControllerSettings.ts
git commit -m "feat(controller): add controller settings hook with localStorage persistence"
```

---

## Task 2: Create Keyboard Shortcuts Hook

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

**Step 1: Create keyboard shortcuts hook**

```typescript
import { useEffect, useRef, useCallback } from 'react'

interface KeyboardShortcutsConfig {
  onNext: () => void
  onBack: () => void
  onPause: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onNext,
  onBack,
  onPause,
  enabled = true
}: KeyboardShortcutsConfig) {
  const handlersRef = useRef({ onNext, onBack, onPause })

  // Update handlers ref when callbacks change
  useEffect(() => {
    handlersRef.current = { onNext, onBack, onPause }
  }, [onNext, onBack, onPause])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    // Skip if modifiers are pressed (allow Cmd+F, etc.)
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        handlersRef.current.onNext()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handlersRef.current.onBack()
        break
      case ' ': // Spacebar
        e.preventDefault()
        handlersRef.current.onPause()
        break
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}
```

**Step 2: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts
git commit -m "feat(controller): add keyboard shortcuts hook (arrows, spacebar)"
```

---

## Task 3: Create Settings Dropdown Component

**Files:**
- Create: `src/components/games/ControllerSettings.tsx`

**Step 1: Create settings dropdown component**

```typescript
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ControllerSettingsProps {
  showQrCode: boolean
  showJoinLink: boolean
  onToggleQrCode: () => void
  onToggleJoinLink: () => void
}

export default function ControllerSettings({
  showQrCode,
  showJoinLink,
  onToggleQrCode,
  onToggleJoinLink
}: ControllerSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[44px] w-[44px]"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onToggleQrCode()
          }}
          className="flex items-center justify-between"
        >
          <Label htmlFor="qr-toggle" className="cursor-pointer">
            Show QR Code
          </Label>
          <Switch
            id="qr-toggle"
            checked={showQrCode}
            onCheckedChange={onToggleQrCode}
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            onToggleJoinLink()
          }}
          className="flex items-center justify-between"
        >
          <Label htmlFor="link-toggle" className="cursor-pointer">
            Show Join Link
          </Label>
          <Switch
            id="link-toggle"
            checked={showJoinLink}
            onCheckedChange={onToggleJoinLink}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/games/ControllerSettings.tsx
git commit -m "feat(controller): add settings dropdown with QR/link toggles"
```

---

## Task 4-17: Continue with remaining tasks...

(See full plan in design document for complete task breakdown)

---

## Summary

This implementation plan breaks down the controller dashboard redesign into 17 bite-sized tasks. Each task includes exact file paths, complete code examples, and commit steps following project standards.

Key deliverables:
- 2 custom React hooks (settings, keyboard shortcuts)
- 7 new components (cards, header, floating bar)
- 2 refactored components (DisplayManagement, NextQuestionPreview)
- Updated ControllerPage integration
- Comprehensive testing checklist

All code follows shadcn/ui standards, mobile-first responsive design, and TypeScript best practices.
