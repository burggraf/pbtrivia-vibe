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

      // Throttle API calls to respect PocketHost rate limits (5 req/sec, 5 concurrent/IP)
      // Process questions in batches of 3 with 350ms delay between batches
      const results: GameQuestion[] = [];
      const batchSize = 3;

      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        const batchPromises = batch.map(q =>
          this.createGameQuestion({
            host: hostId,
            game: round.game,
            round: roundId,
            question: q.questionId,
            sequence: q.sequence,
            category_name: q.categoryName
          })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to stay under rate limits (except for last batch)
        if (i + batchSize < questions.length) {
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      }

      return results;
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