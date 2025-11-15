import { useEffect, useRef, useCallback } from 'react'

export interface KeyboardShortcutsConfig {
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
