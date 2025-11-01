import { PartyPopper } from 'lucide-react'

export default function Thanks() {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <PartyPopper className="h-16 w-16 mx-auto text-purple-500 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Thanks for Playing!
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          We hope you enjoyed the trivia game
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md mx-auto">
        <p className="text-slate-700 dark:text-slate-200">
          Your feedback helps us improve future games!
        </p>
      </div>
    </div>
  )
}
