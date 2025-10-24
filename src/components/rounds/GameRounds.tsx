import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Round } from '@/types/rounds';
import { roundsService } from '@/lib/rounds';
import RoundForm from './RoundForm';
import RoundsList from './RoundsList';

interface GameRoundsProps {
  gameId: string;
  onBack?: () => void;
}

export default function GameRounds({ gameId, onBack }: GameRoundsProps) {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | undefined>();

  useEffect(() => {
    loadRounds();
  }, [gameId]);

  const loadRounds = async () => {
    try {
      setIsLoading(true);
      const gameRounds = await roundsService.getRounds(gameId);
      setRounds(gameRounds);
    } catch (error) {
      console.error('Failed to load rounds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRound = () => {
    setEditingRound(undefined);
    setShowForm(true);
  };

  const handleEditRound = (round: Round) => {
    // Navigate to round edit page
    navigate(`/host/game/${gameId}/round/${round.id}`);
  };

  const handleSaveRound = async (data: any) => {
    try {
      setIsSaving(true);

      if (editingRound) {
        // Update existing round
        await roundsService.updateRound(editingRound.id, data);
      } else {
        // Create new round - get next sequence number
        const nextSequence = await roundsService.getNextSequenceNumber(gameId);
        const roundData = {
          ...data,
          sequence_number: nextSequence
        };
        await roundsService.createRound(roundData);
      }

      await loadRounds();
      setShowForm(false);
      setEditingRound(undefined);
    } catch (error) {
      console.error('Failed to save round:', error);
      alert('Failed to save round. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  
  const handleReorderRounds = async (reorderedRounds: Round[]) => {
    try {
      const reorderData = {
        gameId,
        rounds: reorderedRounds.map(r => ({
          id: r.id,
          sequence_number: r.sequence_number
        }))
      };

      await roundsService.reorderRounds(reorderData);
      setRounds(reorderedRounds);
    } catch (error) {
      console.error('Failed to reorder rounds:', error);
      alert('Failed to reorder rounds. Please try again.');
      // Reload to ensure consistency
      await loadRounds();
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRound(undefined);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-4"
          >
            ← Back to Game
          </button>
        )}
        <RoundForm
          round={editingRound}
          gameId={gameId}
          onSave={handleSaveRound}
          onCancel={handleCancelForm}
          isLoading={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mb-4"
        >
          ← Back to Game
        </button>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Game Rounds
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage rounds for this trivia game
          </p>
        </div>
      </div>

      <RoundsList
        rounds={rounds}
        onCreateRound={handleCreateRound}
        onEditRound={handleEditRound}
        onReorderRounds={handleReorderRounds}
        isLoading={isLoading}
      />
    </div>
  );
}