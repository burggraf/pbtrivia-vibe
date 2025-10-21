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
  }
};