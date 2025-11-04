import { ReactNode } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

interface AppHeaderProps {
  title: string
  leftButton?: ReactNode
  className?: string
}

/**
 * iPhone-style header component with three-column layout:
 * - Left: back button or action button
 * - Center: title (always centered)
 * - Right: theme toggle
 */
export default function AppHeader({ title, leftButton, className = '' }: AppHeaderProps) {
  return (
    <header className={`flex items-center justify-between h-14 px-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Left section - button or empty */}
      <div className="flex items-center justify-start w-20">
        {leftButton}
      </div>

      {/* Center section - title (always centered) */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] md:max-w-none">
          {title}
        </h1>
      </div>

      {/* Right section - theme toggle */}
      <div className="flex items-center justify-end w-20">
        <ThemeToggle />
      </div>
    </header>
  )
}
