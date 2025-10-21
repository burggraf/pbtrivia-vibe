import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateGameData, UpdateGameData, Game } from '@/types/games';

// Helper function to combine date and time into ISO string
function combineDateAndTime(date: string, time: string): string {
  if (!date) return '';

  // If no time provided, use default time (12:00 PM)
  const timeToUse = time || '12:00';

  // Create Date object from date string
  const dateObj = new Date(date);

  // Parse time hours and minutes
  const [hours, minutes] = timeToUse.split(':').map(Number);

  // Set the time on the date object
  dateObj.setHours(hours, minutes, 0, 0);

  // Return ISO string
  return dateObj.toISOString();
}

// Helper function to generate time options in 15-minute intervals
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(timeString);
    }
  }
  return options;
}

// Helper function to format time for display (12-hour format with AM/PM)
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface GameFormProps {
  game?: Game;
  onSave: (data: CreateGameData | UpdateGameData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function GameForm({ game, onSave, onCancel, isLoading = false }: GameFormProps) {
  const timeOptions = generateTimeOptions();

  const [formData, setFormData] = useState({
    name: game?.name || '',
    startdate: game?.startdate ? new Date(game.startdate).toISOString().split('T')[0] : '',
    starttime: game?.startdate ? new Date(game.startdate).toTimeString().slice(0, 5) : '',
    duration: game?.duration?.toString() || '',
    location: game?.location || '',
    status: game?.status || 'setting-up' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: CreateGameData | UpdateGameData = {
      name: formData.name,
      ...(formData.startdate && {
        startdate: combineDateAndTime(formData.startdate, formData.starttime)
      }),
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
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">{game ? 'Edit Game' : 'Create New Game'}</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {game ? 'Update the game details below' : 'Fill in the details to create a new trivia game'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Game Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter game name"
              required
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700 dark:text-slate-300">Game Code</Label>
            <Input
              id="code"
              value={game?.code || 'Will be generated'}
              disabled
              className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-slate-100"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              6-character code for players to join the game
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">Start Date & Time (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startdate" className="text-sm text-slate-600 dark:text-slate-400">Date</Label>
                <Input
                  id="startdate"
                  type="date"
                  value={formData.startdate}
                  onChange={(e) => handleChange('startdate', e.target.value)}
                  disabled={isLoading}
                  className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starttime" className="text-sm text-slate-600 dark:text-slate-400">Time</Label>
                <Select
                  value={formData.starttime}
                  onValueChange={(value) => handleChange('starttime', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time} className="dark:text-slate-100 dark:focus:bg-slate-700">
                        {formatTimeDisplay(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-slate-700 dark:text-slate-300">Duration (minutes, Optional)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="60"
              min="1"
              max="9999"
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter event location"
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                <SelectValue placeholder="Select game status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectItem value="setting-up" className="dark:text-slate-100 dark:focus:bg-slate-700">Setting Up</SelectItem>
                <SelectItem value="ready" className="dark:text-slate-100 dark:focus:bg-slate-700">Ready</SelectItem>
                <SelectItem value="in-progress" className="dark:text-slate-100 dark:focus:bg-slate-700">In Progress</SelectItem>
                <SelectItem value="completed" className="dark:text-slate-100 dark:focus:bg-slate-700">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              {isLoading ? 'Saving...' : game ? 'Update Game' : 'Create Game'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}