import pb from './pocketbase';

export interface RoundQuestion {
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

export interface CreateRoundQuestionData {
  host: string;
  game: string;
  round: string;
  question: string;
  sequence: number;
  category_name: string;
}

export const roundQuestionsService = {
  async getRoundQuestions(roundId: string): Promise<RoundQuestion[]> {
    try {
      const result = await pb.collection('round_questions').getList<RoundQuestion>(1, 200, {
        filter: `round = "${roundId}" && host = "${pb.authStore.model?.id}" && sequence > 0 && game != "" && round != ""`
      });

      // Sort by sequence number
      return result.items.sort((a, b) => a.sequence - b.sequence);
    } catch (error) {
      console.error('Failed to fetch round questions:', error);
      return [];
    }
  },

  async createRoundQuestion(data: CreateRoundQuestionData): Promise<RoundQuestion> {
    try {
      const record = await pb.collection('round_questions').create<RoundQuestion>(data);
      return record;
    } catch (error) {
      console.error('Failed to create round question:', error);
      throw error;
    }
  },

  async updateRoundQuestion(id: string, data: {
    game?: string | null;
    round?: string | null;
    sequence?: number;
  }): Promise<RoundQuestion> {
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

      const record = await pb.collection('round_questions').update<RoundQuestion>(id, updateData);
      return record;
    } catch (error) {
      console.error('Failed to update round question:', error);
      throw error;
    }
  },

  async createRoundQuestionsBatch(roundId: string, questions: Array<{
    questionId: string;
    sequence: number;
    categoryName: string;
  }>): Promise<RoundQuestion[]> {
    try {
      const hostId = pb.authStore.model?.id;
      if (!hostId) throw new Error('User not authenticated');

      // Get the round to find the game ID
      const round = await pb.collection('rounds').getOne(roundId);

      const createPromises = questions.map(q =>
        this.createRoundQuestion({
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
      console.error('Failed to create round questions batch:', error);
      throw error;
    }
  },

  async deleteRoundQuestions(roundId: string): Promise<void> {
    try {
      const questions = await this.getRoundQuestions(roundId);
      const deletePromises = questions.map(q =>
        pb.collection('round_questions').delete(q.id)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to delete round questions:', error);
      throw error;
    }
  }
};