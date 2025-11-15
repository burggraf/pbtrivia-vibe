interface ControllerStatsLineProps {
  teamCount: number
  roundCount: number
  questionCount: number
}

export default function ControllerStatsLine({
  teamCount,
  roundCount,
  questionCount
}: ControllerStatsLineProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-center text-sm md:text-base text-slate-600 dark:text-slate-400">
          {teamCount} {teamCount === 1 ? 'Team' : 'Teams'} •{' '}
          {roundCount} {roundCount === 1 ? 'Round' : 'Rounds'} •{' '}
          {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
        </p>
      </div>
    </div>
  )
}
