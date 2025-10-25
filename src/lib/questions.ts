import pb from './pocketbase';

export interface Question {
  id: string;
  external_id?: string;
  category: string;
  subcategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  level?: string;
  metadata?: string;
  imported_at: string;
}

export const questionsService = {
  async getCategories(): Promise<string[]> {
    try {
      // Get a sample of questions to extract unique categories
      const result = await pb.collection('questions').getList<Question>(1, 100);

      // Extract unique categories
      const categories = [...new Set(result.items.map(q => q.category))];

      return categories.sort();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  },

  async getQuestionsByCategories(categories: string[]): Promise<Question[]> {
    try {
      // For now, we'll fetch all questions and filter client-side
      const result = await pb.collection('questions').getList<Question>(1, 1000);

      // Filter by categories
      const filteredQuestions = result.items.filter(q =>
        categories.includes(q.category)
      );

      return filteredQuestions;
    } catch (error) {
      console.error('Failed to fetch questions by categories:', error);
      return [];
    }
  },

  async getQuestionById(id: string): Promise<Question> {
    try {
      const record = await pb.collection('questions').getOne<Question>(id);
      return record;
    } catch (error) {
      console.error('Failed to fetch question:', error);
      throw error;
    }
  },

  async getUnusedQuestionsForHost(
    categories: string[],
    questionCount: number,
    hostId?: string
  ): Promise<Question[]> {
    try {
      const currentHostId = hostId || pb.authStore.model?.id;
      if (!currentHostId) throw new Error('User not authenticated');

      // Step 1: Get all available questions from the selected categories
      const allQuestionsResult = await pb.collection('questions').getFullList<Question>(200, {
        filter: categories.map(cat => `category = "${cat}"`).join(' || ')
      });

      if (allQuestionsResult.length === 0) {
        return [];
      }

      // Step 2: Get questions already used by this host
      const usedQuestionsResult = await pb.collection('game_questions').getFullList(200, {
        filter: `host = "${currentHostId}"`
      });

      const usedQuestionIds = new Set(usedQuestionsResult.map(rq => rq.question));

      // Step 3: Filter out used questions
      const availableQuestions = allQuestionsResult.filter(q => !usedQuestionIds.has(q.id));

      if (availableQuestions.length < questionCount) {
        console.warn(`Only ${availableQuestions.length} unique questions available, but ${questionCount} requested`);
      }

      // Step 4: Randomly select questions
      const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(questionCount, availableQuestions.length));
    } catch (error) {
      console.error('Failed to get unused questions for host:', error);
      return [];
    }
  },

  async getRandomQuestionsFromCategories(
    categories: string[],
    questionCount: number,
    hostId?: string
  ): Promise<Question[]> {
    try {
      const currentHostId = hostId || pb.authStore.model?.id;
      if (!currentHostId) throw new Error('User not authenticated');

      // Step 1: Get all available questions from the selected categories
      const allQuestionsResult = await pb.collection('questions').getFullList<Question>(200, {
        filter: categories.map(cat => `category = "${cat}"`).join(' || ')
      });

      if (allQuestionsResult.length === 0) {
        return [];
      }

      // Step 2: Get questions already used by this host in ALL their rounds (including recycled ones)
      const usedQuestionsResult = await pb.collection('game_questions').getFullList(1000, {
        filter: `host = "${currentHostId}"`
      });

      const usedQuestionIds = new Set(usedQuestionsResult.map(rq => rq.question));

      // Step 3: Filter out used questions to ensure no reuse (including recycled questions)
      const availableQuestions = allQuestionsResult.filter(q => !usedQuestionIds.has(q.id));

      if (availableQuestions.length < questionCount) {
        console.warn(`Only ${availableQuestions.length} unique questions available from categories ${categories.join(', ')}, but ${questionCount} requested`);
      }

      // Step 4: Randomly select the requested number of questions
      const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(questionCount, availableQuestions.length));
    } catch (error) {
      console.error('Failed to get random questions from categories:', error);
      return [];
    }
  }
};