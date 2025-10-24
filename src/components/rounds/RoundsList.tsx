import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Round } from '@/types/rounds';
import { GripVertical, Plus } from 'lucide-react';

interface RoundsListProps {
  rounds: Round[];
  onCreateRound: () => void;
  onEditRound: (round: Round) => void;
  onReorderRounds: (rounds: Round[]) => void;
  isLoading?: boolean;
}

export default function RoundsList({
  rounds,
  onCreateRound,
  onEditRound,
  onReorderRounds,
  isLoading = false
}: RoundsListProps) {
  const [draggedRound, setDraggedRound] = useState<Round | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, round: Round) => {
    setDraggedRound(round);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedRound) return;

    const draggedIndex = rounds.findIndex(r => r.id === draggedRound.id);
    if (draggedIndex === dropIndex) return;

    const newRounds = [...rounds];
    newRounds.splice(draggedIndex, 1);
    newRounds.splice(dropIndex, 0, draggedRound);

    // Update sequence numbers
    const reorderedRounds = newRounds.map((round, index) => ({
      ...round,
      sequence_number: index + 1
    }));

    onReorderRounds(reorderedRounds);
    setDraggedRound(null);
  };

  const handleDragEnd = () => {
    setDraggedRound(null);
    setDragOverIndex(null);
  };

  
  if (rounds.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No rounds yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create your first round to get started with your trivia game.
            </p>
            <Button
              onClick={onCreateRound}
              disabled={isLoading}
              className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Round
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-slate-800 dark:text-slate-100">Game Rounds</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Drag rounds to reorder them. Total: {rounds.length} round{rounds.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Button
          onClick={onCreateRound}
          disabled={isLoading}
          className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Round
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rounds.map((round, index) => (
            <div
              key={round.id}
              draggable
              onDragStart={(e) => handleDragStart(e, round)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-4 border rounded-lg transition-all cursor-pointer
                ${dragOverIndex === index ? 'border-slate-400 bg-slate-50 dark:bg-slate-700' : ''}
                ${draggedRound?.id === round.id ? 'opacity-50' : ''}
                ${!draggedRound || draggedRound.id === round.id ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800' : ''}
                hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700
              `}
              onClick={() => onEditRound(round)}
            >
              <div className="flex items-center gap-2 text-slate-400">
                <GripVertical className="w-4 h-4" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  #{round.sequence_number}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {round.title}
                </h4>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {round.question_count} questions
                  </Badge>
                  <div className="flex gap-1">
                    {round.categories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {round.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{round.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 Tip: Drag and drop rounds to reorder them. The order determines how they'll appear in your game.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}