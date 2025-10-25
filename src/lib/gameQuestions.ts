import pb from './pocketbase';

export interface GameQuestion {
  id: string;
  host: string;
  game: string | null;
  round: string | null;
  question: string;
  sequence: number;
  category_name: string;
  created: string;
  updated: string;
}

export interface CreateGameQuestionData {
  host: string;
  game: string;
  round: string;
  question: string;
  sequence: number;
  category_name: string;
}

export const gameQuestionsService = {
  async getGameQuestions(roundId: string): Promise<GameQuestion[]> {
    try {
      const result = await pb.collection('game_questions').getList<GameQuestion>(1, 200, {
        filter: `round = "${roundId}" && host = "${pb.authStore.model?.id}" && sequence > 0 && game != "" && round != ""`
      });

      // Sort by sequence number
      return result.items.sort((a, b) => a.sequence - b.sequence);
    } catch (error) {
      console.error('Failed to fetch game questions:', error);
      return [];
    }
  },

  async createGameQuestion(data: CreateGameQuestionData): Promise<GameQuestion> {
    try {
      const record = await pb.collection('game_questions').create<GameQuestion>(data);
      return record;
    } catch (error) {
      console.error('Failed to create game question:', error);
      throw error;
    }
  },

  async updateGameQuestion(id: string, data: {
    game?: string | null;
    round?: string | null;
    sequence?: number;
  }): Promise<GameQuestion> {
    try {
      // For PocketBase, to clear relation fields, we need to send empty strings
      const updateData: any = {
        sequence: data.sequence,
        updated: new Date().toISOString() // Set updated field to current date/time
      };

      if (data.game === null) {
        updateData.game = '';
      }
      if (data.round === null) {
        updateData.round = '';
      }

      const record = await pb.collection('game_questions').update<GameQuestion>(id, updateData);
      return record;
    } catch (error) {
      console.error('Failed to update game question:', error);
      throw error;
    }
  },

  async createGameQuestionsBatch(roundId: string, questions: Array<{
    questionId: string;
    sequence: number;
    categoryName: string;
  }>): Promise<GameQuestion[]> {
    try {
      const hostId = pb.authStore.model?.id;
      if (!hostId) throw new Error('User not authenticated');

      // Get the round to find the game ID
      const round = await pb.collection('rounds').getOne(roundId);

      const createPromises = questions.map(q =>
        this.createGameQuestion({
          host: hostId,
          game: round.game,
          round: roundId,
          question: q.questionId,
          sequence: q.sequence,
          category_name: q.categoryName
        })
      );

      return await Promise.all(createPromises);
    } catch (error) {
      console.error('Failed to create game questions batch:', error);
      throw error;
    }
  },

  async deleteGameQuestions(roundId: string): Promise<void> {
    try {
      const questions = await this.getGameQuestions(roundId);
      const deletePromises = questions.map(q =>
        pb.collection('game_questions').delete(q.id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete game questions:', error);
      throw error;
    }
  }
};