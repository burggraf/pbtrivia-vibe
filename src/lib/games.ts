import pb from './pocketbase';
import { Game, CreateGameData, UpdateGameData, GameTeam, CreateGameTeamData, GamePlayer, CreateGamePlayerData } from '@/types/games';

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
        status: data.status || 'setup',
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

  async findGameByCode(code: string): Promise<Game | null> {
    try {
      // Get the first page of games and filter by code and status
      const result = await pb.collection('games').getList<Game>(1, 50, {
        filter: `code = "${code}" && status = "ready"`
      });

      if (result.items.length > 0) {
        return result.items[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to find game by code:', error);
      throw error;
    }
  },
};

export const gameTeamsService = {
  async getTeamsByGame(gameId: string): Promise<GameTeam[]> {
    try {
      const result = await pb.collection('game_teams').getList<GameTeam>(1, 50, {
        filter: `game = "${gameId}"`
      });
      return result.items;
    } catch (error) {
      console.error('Failed to fetch teams for game:', error);
      throw error;
    }
  },

  async createTeam(data: CreateGameTeamData): Promise<GameTeam> {
    try {
      const teamData = {
        ...data,
        host: pb.authStore.model?.id,
      };

      const record = await pb.collection('game_teams').create<GameTeam>(teamData);
      return record;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  },
};

export const gamePlayersService = {
  async createPlayer(data: CreateGamePlayerData): Promise<GamePlayer> {
    try {
      const playerData = {
        ...data,
        host: pb.authStore.model?.id,
      };

      const record = await pb.collection('game_players').create<GamePlayer>(playerData);
      return record;
    } catch (error) {
      console.error('Failed to create player:', error);
      throw error;
    }
  },

  async updatePlayer(id: string, data: Partial<CreateGamePlayerData>): Promise<GamePlayer> {
    try {
      const record = await pb.collection('game_players').update<GamePlayer>(id, data);
      return record;
    } catch (error) {
      console.error('Failed to update player:', error);
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