import { cn } from '@/lib/utils'

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  isActive: boolean
  children: React.ReactNode
  className?: string
  onClick: () => void
}

interface TabsContentProps {
  isActive: boolean
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400 w-full",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ isActive, children, className, onClick }: TabsTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1",
        isActive
          ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50"
          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ isActive, children, className }: TabsContentProps) {
  if (!isActive) return null

  return (
    <div
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:focus-visible:ring-slate-300",
        className
      )}
    >
      {children}
    </div>
  )
}