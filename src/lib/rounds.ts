import pb from './pocketbase';
import { Round, CreateRoundData, UpdateRoundData, RoundReorderData } from '@/types/rounds';

export const roundsService = {
  async getRounds(gameId?: string): Promise<Round[]> {
    try {
      // Use getList with simple parameters that work with PocketBase
      const result = await pb.collection('rounds').getList<Round>(1, 200);

      // Filter client-side by host ID and optionally by game ID for security
      let userRounds = result.items.filter(round => round.host === pb.authStore.model?.id);

      if (gameId) {
        userRounds = userRounds.filter(round => round.game === gameId);
      }

      // Sort by sequence number
      return userRounds.sort((a, b) => a.sequence_number - b.sequence_number);
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
      throw error;
    }
  },

  async getRound(id: string): Promise<Round> {
    try {
      const record = await pb.collection('rounds').getOne<Round>(id);
      return record;
    } catch (error) {
      console.error('Failed to fetch round:', error);
      throw error;
    }
  },

  async createRound(data: CreateRoundData): Promise<Round> {
    try {
      const roundData = {
        ...data,
        host: pb.authStore.model?.id,
      };

      const record = await pb.collection('rounds').create<Round>(roundData);
      return record;
    } catch (error) {
      console.error('Failed to create round:', error);
      throw error;
    }
  },

  async updateRound(id: string, data: UpdateRoundData): Promise<Round> {
    try {
      const record = await pb.collection('rounds').update<Round>(id, data);
      return record;
    } catch (error) {
      console.error('Failed to update round:', error);
      throw error;
    }
  },

  async deleteRound(id: string): Promise<void> {
    try {
      await pb.collection('rounds').delete(id);
    } catch (error) {
      console.error('Failed to delete round:', error);
      throw error;
    }
  },

  async reorderRounds(data: RoundReorderData): Promise<Round[]> {
    try {
      // Update each round with its new sequence number
      const updatePromises = data.rounds.map(round =>
        pb.collection('rounds').update<Round>(round.id, {
          sequence_number: round.sequence_number
        })
      );

      const updatedRounds = await Promise.all(updatePromises);

      // Sort by sequence number before returning
      return updatedRounds.sort((a, b) => a.sequence_number - b.sequence_number);
    } catch (error) {
      console.error('Failed to reorder rounds:', error);
      throw error;
    }
  },

  async getNextSequenceNumber(gameId: string): Promise<number> {
    try {
      const gameRounds = await this.getRounds(gameId);

      if (gameRounds.length === 0) {
        return 1;
      }

      // Find the highest sequence number and add 1
      const maxSequence = Math.max(...gameRounds.map(round => round.sequence_number));
      return maxSequence + 1;
    } catch (error) {
      console.error('Failed to get next sequence number:', error);
      throw error;
    }
  }
};