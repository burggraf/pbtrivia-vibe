import pb from './pocketbase'
import { GameAnswer, CreateGameAnswerData } from '@/types/games'

class GameAnswersService {
  async createAnswer(data: CreateGameAnswerData): Promise<GameAnswer> {
    try {
      // For game_answers, the host should be the game host, not the current user
      // The calling code should ensure the host field is properly set
      const answerData = {
        ...data,
        host: data.host // Use the provided host (should be game host)
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
      } catch (createError: any) {
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
      // Get the game to find the actual game host
      const game = await pb.collection('games').getOne(gameId)
      const gameHostId = game.host

      console.log('🏠 Found game host:', gameHostId)

      // Check if answer already exists for this team and question
      const existingAnswers = await this.getTeamAnswersForQuestion(gameId, gameQuestionsId)
      const existingAnswer = existingAnswers.find(a => a.team === teamId)

      const isCorrect = correctAnswer ? answer.toUpperCase() === correctAnswer.toUpperCase() : undefined

      console.log('✅ Submitting answer with game host:', gameHostId, {
        gameId,
        gameQuestionsId,
        teamId,
        answer,
        isCorrect,
        existingAnswer: existingAnswer ? 'FOUND' : 'NONE'
      })

      if (existingAnswer) {
        // Update existing answer - keep the original host (game host)
        return await this.updateAnswer(existingAnswer.id, {
          answer,
          is_correct: isCorrect
        })
      } else {
        // Create new answer with game host (not current user)
        return await this.createAnswer({
          game: gameId,
          game_questions_id: gameQuestionsId,
          team: teamId,
          answer,
          is_correct: isCorrect,
          host: gameHostId // Explicitly set the game host
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