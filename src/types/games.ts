export interface ScoreboardPlayer {
  id: string;
  name: string;
  avatar: string;
}

export interface ScoreboardTeam {
  name: string;
  players: ScoreboardPlayer[];
  score: number;
  roundScores?: Record<number, number>;
}

export interface GameScoreboard {
  teams: Record<string, ScoreboardTeam>;
}

export interface GameMetadata {
  // Key timers (descriptive names for primary gameplay)
  question_timer?: number | null;        // round-play state
  answer_timer?: number | null;          // round-end state

  // Transition timers (state-based names)
  game_start_timer?: number | null;      // game-start state
  round_start_timer?: number | null;     // round-start state
  game_end_timer?: number | null;        // game-end state
  thanks_timer?: number | null;          // thanks state
}

export interface Game {
  id: string;
  host: string;
  name: string;
  code: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status: 'setup' | 'ready' | 'in-progress' | 'completed';
  scoreboard?: GameScoreboard;
  data?: string | Record<string, any>;
  metadata?: GameMetadata;
  created: string;
  updated: string;
}

export interface CreateGameData {
  name: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setup' | 'ready' | 'in-progress' | 'completed';
  rounds?: number;
  questionsPerRound?: number;
  categories?: string[];
  metadata?: GameMetadata;
}

export interface UpdateGameData {
  name?: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setup' | 'ready' | 'in-progress' | 'completed';
  rounds?: number;
  questionsPerRound?: number;
  categories?: string[];
  metadata?: GameMetadata;
}

export interface GameTeam {
  id: string;
  host: string;
  game: string;
  name: string;
  metadata?: Record<string, any>;
  created: string;
  updated: string;
}

export interface CreateGameTeamData {
  game: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface GamePlayer {
  id: string;
  host: string;
  game: string;
  player: string;
  team?: string;
  name?: string;
  avatar?: string;
  created: string;
  updated: string;
}

export interface CreateGamePlayerData {
  game: string;
  player: string;
  team?: string;
  name?: string;
  avatar?: string;
}

export interface GameAnswer {
  id: string;
  host: string;
  game: string;
  game_questions_id: string;
  team: string;
  answer?: string;
  translated_answer?: string; // Answer translated from shuffled to original position
  is_correct?: boolean;
  created: string;
  updated: string;
}

export interface CreateGameAnswerData {
  host: string;
  game: string;
  game_questions_id: string;
  team: string;
  answer: string;
  translated_answer?: string; // Answer translated from shuffled to original position
  is_correct?: boolean;
}