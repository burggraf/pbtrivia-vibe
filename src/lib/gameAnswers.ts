import pb from './pocketbase'
import { GameAnswer, CreateGameAnswerData } from '@/types/games'

class GameAnswersService {
  async createAnswer(data: CreateGameAnswerData): Promise<GameAnswer> {
    try {
      // Ensure the host field is set
      const hostId = pb.authStore.model?.id
      if (!hostId) {
        throw new Error('User not authenticated')
      }

      const answerData = {
        ...data,
        host: hostId // Explicitly set the host
      }

      console.log('📝 Creating answer with data:', {
        ...answerData,
        host: answerData.host ? 'PRESENT' : 'MISSING',
        game: answerData.game,
        game_questions_id: answerData.game_questions_id,
        team: answerData.team,
        answer: answerData.answer,
        is_correct: answerData.is_correct
      })

      try {
        const answer = await pb.collection('game_answers').create(answerData)
        console.log('✅ Successfully created game answer:', answer)
        return answer as unknown as GameAnswer
      } catch (createError) {
        console.error('❌ Failed to create game answer with detailed error:', {
          error: createError,
          message: createError?.message,
          status: createError?.status,
          data: createError?.data,
          validationErrors: createError?.data?.data,
          requestData: answerData,
          authState: {
            isValid: pb.authStore.isValid,
            hasToken: !!pb.authStore.token,
            userId: pb.authStore.model?.id
          }
        })
        throw createError
      }
    } catch (error) {
      console.error('Failed to create game answer:', error)
      throw error
    }
  }

  async getAnswer(id: string): Promise<GameAnswer> {
    try {
      const answer = await pb.collection('game_answers').getOne(id)
      return answer as unknown as GameAnswer
    } catch (error) {
      console.error('Failed to get game answer:', error)
      throw error
    }
  }

  async getTeamAnswersForQuestion(gameId: string, gameQuestionsId: string): Promise<GameAnswer[]> {
    try {
      const answers = await pb.collection('game_answers').getFullList({
        filter: `game = "${gameId}" && game_questions_id = "${gameQuestionsId}"`
      })
      return answers as unknown as GameAnswer[]
    } catch (error) {
      console.error('Failed to get team answers for question:', error)
      throw error
    }
  }

  async getTeamAnswersForGame(gameId: string, teamId: string): Promise<GameAnswer[]> {
    try {
      const answers = await pb.collection('game_answers').getFullList({
        filter: `game = "${gameId}" && team = "${teamId}"`
      })
      return answers as unknown as GameAnswer[]
    } catch (error) {
      console.error('Failed to get team answers for game:', error)
      throw error
    }
  }

  async updateAnswer(id: string, data: Partial<CreateGameAnswerData>): Promise<GameAnswer> {
    try {
      const answer = await pb.collection('game_answers').update(id, data)
      return answer as unknown as GameAnswer
    } catch (error) {
      console.error('Failed to update game answer:', error)
      throw error
    }
  }

  async deleteAnswer(id: string): Promise<void> {
    try {
      await pb.collection('game_answers').delete(id)
    } catch (error) {
      console.error('Failed to delete game answer:', error)
      throw error
    }
  }

  async submitTeamAnswer(
    gameId: string,
    gameQuestionsId: string,
    teamId: string,
    answer: string,
    correctAnswer?: string
  ): Promise<GameAnswer> {
    console.log('🚀 submitTeamAnswer called with:', {
      gameId,
      gameQuestionsId,
      teamId,
      answer,
      correctAnswer,
      authState: {
        isValid: pb.authStore.isValid,
        hasToken: !!pb.authStore.token,
        userId: pb.authStore.model?.id
      }
    })

    try {
      // Check if answer already exists for this team and question
      const existingAnswers = await this.getTeamAnswersForQuestion(gameId, gameQuestionsId)
      const existingAnswer = existingAnswers.find(a => a.team === teamId)

      const isCorrect = correctAnswer ? answer.toUpperCase() === correctAnswer.toUpperCase() : undefined
      const hostId = pb.authStore.model?.id

      if (!hostId) {
        throw new Error('User not authenticated')
      }

      console.log('✅ Submitting answer with host:', hostId, {
        gameId,
        gameQuestionsId,
        teamId,
        answer,
        isCorrect,
        existingAnswer: existingAnswer ? 'FOUND' : 'NONE'
      })

      if (existingAnswer) {
        // Update existing answer
        return await this.updateAnswer(existingAnswer.id, {
          answer,
          is_correct: isCorrect
        })
      } else {
        // Create new answer with explicit host
        return await this.createAnswer({
          game: gameId,
          game_questions_id: gameQuestionsId,
          team: teamId,
          answer,
          is_correct: isCorrect
        })
      }
    } catch (error) {
      console.error('Failed to submit team answer:', error)
      throw error
    }
  }
}

export const gameAnswersService = new GameAnswersService()
export default gameAnswersService