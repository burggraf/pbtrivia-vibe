import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateRoundData, UpdateRoundData, Round } from '@/types/rounds';
import { questionsService } from '@/lib/questions';

interface RoundFormProps {
  round?: Round;
  gameId: string;
  onSave: (data: CreateRoundData | UpdateRoundData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RoundForm({ round, gameId, onSave, onCancel, isLoading = false }: RoundFormProps) {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(round?.categories || []);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: round?.title || '',
    question_count: round?.question_count?.toString() || '10',
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await questionsService.getCategories();
        setAvailableCategories(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    const submitData: CreateRoundData | UpdateRoundData = {
      title: formData.title,
      question_count: parseInt(formData.question_count),
      categories: selectedCategories,
      sequence_number: round?.sequence_number || 0, // Will be set by service if creating
      game: gameId,
    };

    onSave(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      if (selectedCategories.length < 10) {
        setSelectedCategories(prev => [...prev, category]);
      }
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleSelectAll = () => {
    const maxCategories = Math.min(availableCategories.length, 10);
    setSelectedCategories(availableCategories.slice(0, maxCategories));
  };

  const handleUnselectAll = () => {
    setSelectedCategories([]);
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-800 dark:text-slate-100">
          {round ? 'Edit Round' : 'Create New Round'}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {round ? 'Update the round details below' : 'Configure a new round for your trivia game'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">
              Round Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter round title"
              required
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_count" className="text-slate-700 dark:text-slate-300">
              Number of Questions *
            </Label>
            <Input
              id="question_count"
              type="number"
              value={formData.question_count}
              onChange={(e) => handleChange('question_count', e.target.value)}
              placeholder="10"
              min="1"
              max="100"
              required
              disabled={isLoading}
              className="border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Questions will be randomly selected from the chosen categories
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300">
              Categories * (Select 1-10 categories)
            </Label>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedCategories.length > 0 && (
                <span>Selected: {selectedCategories.length}/10 categories</span>
              )}
            </div>

            {categoriesLoading ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading categories...</p>
            ) : (
              <>
                {availableCategories.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={isLoading || selectedCategories.length >= 10}
                      className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Select All ({Math.min(availableCategories.length, 10)})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnselectAll}
                      disabled={isLoading || selectedCategories.length === 0}
                      className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Unselect All
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-md">
                {availableCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                      disabled={isLoading || (!selectedCategories.includes(category) && selectedCategories.length >= 10)}
                    />
                    <Label
                      htmlFor={category}
                      className="text-sm font-normal text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
              </>
            )}

            {selectedCategories.length === 0 && !categoriesLoading && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Please select at least one category to continue
              </p>
            )}
            {selectedCategories.length >= 10 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Maximum 10 categories allowed
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim() || selectedCategories.length === 0}
              className="flex-1 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
            >
              {isLoading ? 'Saving...' : round ? 'Update Round' : 'Create Round'}
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