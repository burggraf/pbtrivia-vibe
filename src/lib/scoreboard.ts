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
  formatScoreboard(scoreboard: GameScoreboard): Array<{ teamId: string; name: string; players: Array<{ id: string; name: string; avatar: string }> }> {
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
  },

  /**
   * Update scoreboard with per-round and total scores
   * Recalculates all scores from game_answers records
   */
  async updateScoreboard(gameId: string, currentRoundNumber: number): Promise<void> {
    try {
      console.log(`📊 Updating scoreboard for game ${gameId}, round ${currentRoundNumber}`)

      // Get current game with scoreboard structure
      const game = await pb.collection('games').getOne<Game>(gameId)
      if (!game.scoreboard?.teams) {
        console.error('No scoreboard structure found for game')
        return
      }

      // Fetch all graded game_answers for this game
      const allAnswers = await pb.collection('game_answers').getFullList({
        filter: `game = "${gameId}" && is_correct != null`,
        expand: 'game_questions_id'
      })

      console.log(`📊 Found ${allAnswers.length} graded answers`)

      // Build score tracking structure
      // teamId -> roundNumber -> correctCount
      const teamRoundScores: Record<string, Record<number, number>> = {}

      // Process each answer
      for (const answer of allAnswers) {
        const teamId = answer.team
        if (!teamId) continue

        // Get the round number from the game_questions record
        const gameQuestion = (answer as any).expand?.game_questions_id
        if (!gameQuestion?.round) continue

        // Fetch the round to get sequence_number
        let roundNumber: number
        try {
          const round = await pb.collection('rounds').getOne(gameQuestion.round)
          roundNumber = round.sequence_number
        } catch (error) {
          console.error(`Failed to fetch round ${gameQuestion.round}:`, error)
          continue
        }

        // Initialize tracking structures if needed
        if (!teamRoundScores[teamId]) {
          teamRoundScores[teamId] = {}
        }
        if (!teamRoundScores[teamId][roundNumber]) {
          teamRoundScores[teamId][roundNumber] = 0
        }

        // Count correct answers
        if (answer.is_correct === true) {
          teamRoundScores[teamId][roundNumber]++
        }
      }

      // Calculate total scores and update scoreboard structure
      const updatedTeams = { ...game.scoreboard.teams }

      for (const [teamId, team] of Object.entries(updatedTeams)) {
        const roundScores = teamRoundScores[teamId] || {}
        const totalScore = Object.values(roundScores).reduce((sum, score) => sum + score, 0)

        updatedTeams[teamId] = {
          ...team,
          score: totalScore,
          roundScores: roundScores
        }

        console.log(`📊 Team ${team.name}: ${totalScore} total points, rounds:`, roundScores)
      }

      // Update the game scoreboard
      await pb.collection('games').update(gameId, {
        scoreboard: {
          teams: updatedTeams,
          updated: new Date().toISOString()
        }
      })

      console.log(`✅ Scoreboard updated successfully`)
    } catch (error) {
      console.error('Failed to update scoreboard:', error)
      throw error
    }
  }
}