import { createContext, useContext, useState, ReactNode } from 'react'

type TextSize = 'small' | 'medium' | 'large' | 'xlarge'

interface TextSizeContextType {
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined)

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    // Get text size from localStorage or default to 'xlarge'
    const stored = localStorage.getItem('textSize') as TextSize
    return stored || 'xlarge'
  })

  const setTextSize = (newSize: TextSize) => {
    console.log('TextSizeContext: setTextSize called with:', newSize)
    setTextSizeState(newSize)
    localStorage.setItem('textSize', newSize)
  }

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </TextSizeContext.Provider>
  )
}

export function useTextSize() {
  const context = useContext(TextSizeContext)
  if (context === undefined) {
    throw new Error('useTextSize must be used within a TextSizeProvider')
  }
  return context
}
