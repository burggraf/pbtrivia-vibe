export interface Round {
  id: string;
  title: string;
  question_count: number;
  categories: string[];
  sequence_number: number;
  game: string;
  host: string;
  created: string;
  updated: string;
}

export interface CreateRoundData {
  title: string;
  question_count: number;
  categories: string[];
  sequence_number: number;
  game: string;
}

export interface UpdateRoundData {
  title?: string;
  question_count?: number;
  categories?: string[];
  sequence_number?: number;
}

export interface RoundReorderData {
  gameId: string;
  rounds: { id: string; sequence_number: number }[];
}