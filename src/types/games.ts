export interface Game {
  id: string;
  host: string;
  name: string;
  code: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status: 'setting-up' | 'ready' | 'in-progress' | 'completed';
  created: string;
  updated: string;
}

export interface CreateGameData {
  name: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setting-up' | 'ready' | 'in-progress' | 'completed';
}

export interface UpdateGameData {
  name?: string;
  startdate?: string;
  duration?: number;
  location?: string;
  status?: 'setting-up' | 'ready' | 'in-progress' | 'completed';
}