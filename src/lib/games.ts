import pb from './pocketbase';
import { Game, CreateGameData, UpdateGameData } from '@/types/games';

export const gamesService = {
  async getGames(): Promise<Game[]> {
    try {
      // Use getList with simple parameters that work with PocketBase
      const result = await pb.collection('games').getList<Game>(1, 50);
      // Filter client-side by host ID for security
      const userGames = result.items.filter(game => game.host === pb.authStore.model?.id);
      return userGames;
    } catch (error) {
      console.error('Failed to fetch games:', error);
      throw error;
    }
  },

  async getGame(id: string): Promise<Game> {
    try {
      const record = await pb.collection('games').getOne<Game>(id);
      return record;
    } catch (error) {
      console.error('Failed to fetch game:', error);
      throw error;
    }
  },

  async createGame(data: CreateGameData): Promise<Game> {
    try {
      const gameData = {
        ...data,
        host: pb.authStore.model?.id,
        status: data.status || 'setting-up',
        code: generateGameCode(),
      };

      const record = await pb.collection('games').create<Game>(gameData);
      return record;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  },

  async updateGame(id: string, data: UpdateGameData): Promise<Game> {
    try {
      const record = await pb.collection('games').update<Game>(id, data);
      return record;
    } catch (error) {
      console.error('Failed to update game:', error);
      throw error;
    }
  },

  async deleteGame(id: string): Promise<void> {
    try {
      await pb.collection('games').delete(id);
    } catch (error) {
      console.error('Failed to delete game:', error);
      throw error;
    }
  },
};

function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}