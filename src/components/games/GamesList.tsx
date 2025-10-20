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
      <Card>
        <CardHeader>
          <CardTitle>My Games</CardTitle>
          <CardDescription>Loading your games...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Games</CardTitle>
          <CardDescription>You haven't created any games yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">No games found</p>
              <p className="text-xs text-muted-foreground">Create your first game to get started</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Games</CardTitle>
        <CardDescription>Manage your trivia games</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow key={game.id}>
                <TableCell className="font-medium">{game.name}</TableCell>
                <TableCell>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {game.code}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(game.status)}>
                    {formatGameStatus(game.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {game.startdate ? formatDate(new Date(game.startdate)) : 'Not set'}
                </TableCell>
                <TableCell>{formatDuration(game.duration)}</TableCell>
                <TableCell>{game.location || 'Not set'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(game)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(game)}
                      disabled={deleteConfirm === game.id}
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