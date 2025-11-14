import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

// Stub context for display app - no text size adjustment needed
// Display app has fixed large text sizes for TV viewing
// But we support all text size types for compatibility with shared components

type TextSize = 'small' | 'normal' | 'medium' | 'large' | 'xlarge'

interface TextSizeContextType {
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const TextSizeContext = createContext<TextSizeContextType>({
  textSize: 'normal', // Default to normal for TV display
  setTextSize: () => {},
})

export function TextSizeProvider({ children }: { children: ReactNode }) {
  return (
    <TextSizeContext.Provider value={{ textSize: 'normal', setTextSize: () => {} }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  return useContext(TextSizeContext)
}
