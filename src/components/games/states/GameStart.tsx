interface GameStartProps {
  gameData: {
    state: 'game-start'
    name: string
    rounds: number
  }
}

export default function GameStart({ gameData }: GameStartProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Welcome to {gameData.name}!
      </h2>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
        There will be {gameData.rounds} rounds
      </p>
      <p className="text-lg text-slate-500 dark:text-slate-500 font-medium">
        Get ready to play!
      </p>
    </div>
  )
}