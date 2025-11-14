import pb from './pocketbase';
import { Game, CreateGameData, UpdateGameData, GameTeam, CreateGameTeamData, GamePlayer, CreateGamePlayerData } from '@/types/games';

export const gamesService = {
  async getGames(): Promise<Game[]> {
    try {
      // Get games without server-side sorting to avoid field name issues
      const result = await pb.collection('games').getList<Game>(1, 50);
      // Filter client-side by host ID for security
      const userGames = result.items.filter(game => game.host === pb.authStore.model?.id);

      // Sort client-side: start_date (desc), then updated (desc)
      userGames.sort((a, b) => {
        // Compare start dates (newest first), treating null/undefined as oldest
        const aStartDate = a.startdate ? new Date(a.startdate) : new Date('1970-01-01');
        const bStartDate = b.startdate ? new Date(b.startdate) : new Date('1970-01-01');

        if (aStartDate > bStartDate) return -1;
        if (aStartDate < bStartDate) return 1;

        // If start dates are equal, sort by updated (newest first)
        const aUpdated = new Date(a.updated);
        const bUpdated = new Date(b.updated);

        if (aUpdated > bUpdated) return -1;
        if (aUpdated < bUpdated) return 1;

        return 0;
      });

      return userGames;
    } catch (error) {
      console.error('Failed to fetch games:', error);
      throw error;
    }
  },

  async getGame(id: string): Promise<Game> {
    try {
      console.log('🎯 gamesService.getGame called for ID:', id);
      console.log('🎯 Auth state in gamesService:', {
        isValid: pb.authStore.isValid,
        hasToken: !!pb.authStore.token,
        userId: pb.authStore.model?.id,
        tokenPreview: pb.authStore.token ? `${pb.authStore.token.substring(0, 20)}...` : 'none'
      });

      const record = await pb.collection('games').getOne<Game>(id);
      console.log('✅ gamesService.getGame succeeded:', record);
      return record;
    } catch (error: any) {
      console.error('❌ gamesService.getGame failed:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        status: error?.status,
        url: error?.url,
        name: error?.name,
        isAuth: error?.status === 401 || error?.message?.includes('unauthorized'),
        isForbidden: error?.status === 403 || error?.message?.includes('forbidden'),
        isNotFound: error?.status === 404,
        data: error?.data
      });
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
      // Get games with status "ready" OR "in-progress"
      const result = await pb.collection('games').getList<Game>(1, 50, {
        filter: `code = "${code}" && (status = "ready" || status = "in-progress")`
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

  async createTeam(data: CreateGameTeamData, gameHostId?: string): Promise<GameTeam> {
    try {
      const teamData = {
        ...data,
        host: gameHostId || pb.authStore.model?.id, // Use game host if provided, otherwise current user
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
  async createPlayer(data: CreateGamePlayerData, gameHostId?: string): Promise<GamePlayer> {
    try {
      const playerData = {
        ...data,
        host: gameHostId || pb.authStore.model?.id, // Use game host if provided, otherwise current user
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

  async findPlayerInGame(gameId: string, playerId: string): Promise<GamePlayer | null> {
    try {
      const result = await pb.collection('game_players').getList<GamePlayer>(1, 50, {
        filter: `game = "${gameId}" && player = "${playerId}"`
      });

      if (result.items.length > 0) {
        // Return the most recent record (sorted by created date descending by default)
        return result.items[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to find player in game:', error);
      throw error;
    }
  },

  async removePlayerFromGame(gameId: string, playerId: string): Promise<void> {
    try {
      // Find the player record first
      const playerRecord = await this.findPlayerInGame(gameId, playerId);

      if (!playerRecord) {
        console.warn('No player record found to remove');
        return;
      }

      // Delete the player record
      await pb.collection('game_players').delete(playerRecord.id);
      console.log('Successfully removed player from game');
    } catch (error) {
      console.error('Failed to remove player from game:', error);
      throw error;
    }
  },

  async getActiveGamesForPlayer(playerId: string): Promise<Game[]> {
    try {
      // Query game_players where this player is registered
      const playerRecords = await pb.collection('game_players').getFullList({
        filter: `player = "${playerId}"`,
        expand: 'game',
        sort: '-game.startdate,-game.updated'
      });

      // Extract and filter games for ready/in-progress status
      const games = playerRecords
        .map(record => record.expand?.game)
        .filter((game): game is Game =>
          game != null &&
          (game.status === 'ready' || game.status === 'in-progress')
        );

      return games;
    } catch (error) {
      console.error('Failed to fetch active games for player:', error);
      return []; // Return empty array on error to avoid breaking UI
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