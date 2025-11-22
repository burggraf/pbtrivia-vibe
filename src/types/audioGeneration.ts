export interface AudioGenerationJob {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  game: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  total_questions: number;
  processed_questions: number;
  failed_questions: Array<{
    game_question_id: string;
    error_message: string;
  }>;
  current_api_key_index: number;
}

export interface AudioGenerationResponse {
  job_id: string;
  status: string;
  total_questions: number;
}

export interface AudioGenerationError {
  error: string;
  job_id?: string;
  status?: string;
  progress?: number;
}
