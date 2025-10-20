import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateGameData, UpdateGameData, Game } from '@/types/games';

interface GameFormProps {
  game?: Game;
  onSave: (data: CreateGameData | UpdateGameData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function GameForm({ game, onSave, onCancel, isLoading = false }: GameFormProps) {
  const [formData, setFormData] = useState({
    name: game?.name || '',
    startdate: game?.startdate ? new Date(game.startdate).toISOString().split('T')[0] : '',
    duration: game?.duration?.toString() || '',
    location: game?.location || '',
    status: game?.status || 'setting-up' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: CreateGameData | UpdateGameData = {
      name: formData.name,
      ...(formData.startdate && { startdate: formData.startdate }),
      ...(formData.duration && { duration: parseInt(formData.duration) }),
      ...(formData.location && { location: formData.location }),
      status: formData.status,
    };

    onSave(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{game ? 'Edit Game' : 'Create New Game'}</CardTitle>
        <CardDescription>
          {game ? 'Update the game details below' : 'Fill in the details to create a new trivia game'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Game Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter game name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Game Code</Label>
            <Input
              id="code"
              value={game?.code || 'Will be generated'}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              6-character code for players to join the game
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startdate">Start Date (Optional)</Label>
              <Input
                id="startdate"
                type="date"
                value={formData.startdate}
                onChange={(e) => handleChange('startdate', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes, Optional)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="60"
                min="1"
                max="9999"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter event location"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select game status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="setting-up">Setting Up</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : game ? 'Update Game' : 'Create Game'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}