import { ReactNode } from 'react'

interface ControllerGridProps {
  children: ReactNode
}

export default function ControllerGrid({ children }: ControllerGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {children}
    </div>
  )
}
