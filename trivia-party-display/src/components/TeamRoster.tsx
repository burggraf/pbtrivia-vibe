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
