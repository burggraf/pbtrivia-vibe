import { useState, useEffect } from 'react';
import { Game } from '@/types/games';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { roundsService } from '@/lib/rounds';

interface GamesListProps {
  games: Game[];
  onEdit: (game: Game) => void;
  isLoading?: boolean;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'setup':
      return 'secondary';
    case 'ready':
      return 'default';
    case 'in-progress':
      return 'outline';
    case 'completed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatGameStatus(status: string): string {
  return status.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatDuration(minutes?: number): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function GamesList({ games, onEdit, isLoading = false }: GamesListProps) {
  const [roundsCount, setRoundsCount] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const loadRoundsCount = async () => {
      const counts: { [key: string]: number } = {};
      for (const game of games) {
        try {
          const gameRounds = await roundsService.getRounds(game.id);
          counts[game.id] = gameRounds.length;
        } catch (error) {
          console.error('Failed to load rounds count for game:', game.id);
          counts[game.id] = 0;
        }
      }
      setRoundsCount(counts);
    };

    if (games.length > 0) {
      loadRoundsCount();
    }
  }, [games]);

  
  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">My Games</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Loading your games...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-slate-100">My Games</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">You haven't created any games yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">No games found</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Create your first game to get started</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">My Games</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">Manage your trivia games</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableHead className="text-slate-700 dark:text-slate-300">Name</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Code</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Status</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Rounds</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Start Date & Time</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Duration</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow
                  key={game.id}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => onEdit(game)}
                >
                <TableCell className="font-medium text-slate-800 dark:text-slate-100">{game.name}</TableCell>
                <TableCell>
                  <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-800 dark:text-slate-100">
                    {game.code}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(game.status)}>
                    {formatGameStatus(game.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {roundsCount[game.id] || 0} round{(roundsCount[game.id] || 0) !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">
                  {game.startdate ? formatDateTime(new Date(game.startdate)) : null}
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{formatDuration(game.duration)}</TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{game.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}