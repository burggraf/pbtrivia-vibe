import { useState } from 'react';
import { Game } from '@/types/games';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface GamesListProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
  isLoading?: boolean;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'setting-up':
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

function formatDuration(minutes?: number): string {
  if (!minutes) return 'Not set';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function GamesList({ games, onEdit, onDelete, isLoading = false }: GamesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (game: Game) => {
    if (deleteConfirm === game.id) {
      onDelete(game);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(game.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

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
              <TableHead className="text-slate-700 dark:text-slate-300">Start Date</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Duration</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-300">Location</TableHead>
              <TableHead className="text-right text-slate-700 dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id} className="border-slate-200 dark:border-slate-700">
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
                <TableCell className="text-slate-700 dark:text-slate-300">
                  {game.startdate ? formatDate(new Date(game.startdate)) : 'Not set'}
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{formatDuration(game.duration)}</TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300">{game.location || 'Not set'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(game)}
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(game)}
                      disabled={deleteConfirm === game.id}
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                    >
                      {deleteConfirm === game.id ? 'Confirm?' : 'Delete'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}