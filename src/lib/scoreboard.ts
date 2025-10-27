import pb from './pocketbase'
import { Game, GameScoreboard } from '@/types/games'
import { gameAnswersService } from './gameAnswers'

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
  },

  /**
   * Calculate actual scores from game answers
   */
  async calculateTeamScores(gameId: string, teams: Record<string, any>): Promise<Record<string, number>> {
    const scores: Record<string, number> = {}

    for (const [teamId, teamData] of Object.entries(teams)) {
      try {
        // Get all answers for this team in this game
        const teamAnswers = await gameAnswersService.getTeamAnswersForGame(gameId, teamId)

        // Calculate score: 1 point per correct answer
        const correctAnswers = teamAnswers.filter(answer => answer.is_correct === true)
        scores[teamId] = correctAnswers.length

        console.log(`Calculated score for team ${teamData.name}: ${scores[teamId]} points (${correctAnswers.length} correct answers)`)
      } catch (error) {
        console.error(`Failed to calculate score for team ${teamId}:`, error)
        scores[teamId] = 0
      }
    }

    return scores
  }
}