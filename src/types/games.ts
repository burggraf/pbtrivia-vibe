export interface ScoreboardPlayer {
  id: string;
  name: string;
  email: string;
}

export interface ScoreboardTeam {
  name: string;
  players: ScoreboardPlayer[];
  score: number;
}

export interface GameScoreboard {
  teams: Record<string, ScoreboardTeam>;
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
  created: string;
  updated: string;
}

export interface CreateGameData {
  name: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setup' | 'ready' | 'in-progress' | 'completed';
}

export interface UpdateGameData {
  name?: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setup' | 'ready' | 'in-progress' | 'completed';
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
  created: string;
  updated: string;
}

export interface CreateGamePlayerData {
  game: string;
  player: string;
  team?: string;
}

export interface GameAnswer {
  id: string;
  host: string;
  game: string;
  game_questions_id: string;
  team: string;
  answer?: string;
  is_correct?: boolean;
  created: string;
  updated: string;
}

export interface CreateGameAnswerData {
  game: string;
  game_questions_id: string;
  team: string;
  answer: string;
  is_correct?: boolean;
}