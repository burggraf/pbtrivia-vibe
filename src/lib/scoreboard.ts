import pb from './pocketbase'
import { Game, GameScoreboard } from '@/types/games'

export const scoreboardService = {
  /**
   * Get the current scoreboard for a game
   */
  async getGameScoreboard(gameId: string): Promise<GameScoreboard | null> {
    try {
      const game = await pb.collection('games').getOne<Game>(gameId)
      return game.scoreboard || { teams: {} }
    } catch (error) {
      console.error('Failed to get game scoreboard:', error)
      return null
    }
  },

  /**
   * Subscribe to real-time scoreboard updates for a game
   */
  subscribeToGameScoreboard(gameId: string, callback: (scoreboard: GameScoreboard) => void) {
    return pb.collection('games').subscribe('*', (e) => {
      if (e.action === 'update' && e.record.id === gameId) {
        const updatedGame = e.record as unknown as Game
        if (updatedGame.scoreboard) {
          callback(updatedGame.scoreboard)
        }
      }
    })
  },

  /**
   * Format scoreboard for display
   */
  formatScoreboard(scoreboard: GameScoreboard): Array<{ teamId: string; name: string; players: Array<{ id: string; name: string; email: string }> }> {
    return Object.entries(scoreboard.teams).map(([teamId, team]) => ({
      teamId,
      name: team.name,
      players: team.players
    }))
  }
}