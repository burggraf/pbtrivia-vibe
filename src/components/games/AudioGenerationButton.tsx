import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { Game } from '@/types/games';
import { AudioGenerationResponse, AudioGenerationError } from '@/types/audioGeneration';
import pb from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface AudioGenerationButtonProps {
  game: Game;
  onJobCreated: (jobId: string) => void;
  disabled?: boolean;
}

export default function AudioGenerationButton({ game, onJobCreated, disabled = false }: AudioGenerationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateAudio = async () => {
    if (!game || game.status !== 'setup') {
      toast({
        title: 'Cannot generate audio',
        description: 'Audio can only be generated during game setup.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${pb.baseUrl}/api/games/${game.id}/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData: AudioGenerationError = await response.json();

        if (response.status === 409) {
          // Job already in progress
          toast({
            title: 'Audio generation in progress',
            description: 'An audio generation job is already running for this game.',
            variant: 'default'
          });
          if (errorData.job_id) {
            onJobCreated(errorData.job_id);
          }
        } else {
          throw new Error(errorData.error || 'Failed to start audio generation');
        }
      } else {
        const data: AudioGenerationResponse = await response.json();

        toast({
          title: 'Audio generation started',
          description: `Generating audio for ${data.total_questions} questions...`,
        });

        onJobCreated(data.job_id);
      }
    } catch (error) {
      console.error('Error starting audio generation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start audio generation',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || game.status !== 'setup';

  return (
    <Button
      onClick={handleGenerateAudio}
      disabled={isDisabled}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Generate Audio
        </>
      )}
    </Button>
  );
}
