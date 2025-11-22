import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AudioGenerationJob } from '@/types/audioGeneration';
import pb from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface AudioGenerationModalProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export default function AudioGenerationModal({ jobId, isOpen, onClose, onRetry }: AudioGenerationModalProps) {
  const [job, setJob] = useState<AudioGenerationJob | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!jobId || !isOpen) {
      return;
    }

    // Initial fetch
    pb.collection('audio_generation_jobs')
      .getOne<AudioGenerationJob>(jobId)
      .then(setJob)
      .catch((err: any) => {
        console.error('Error fetching job:', err);
        toast({
          title: 'Error',
          description: 'Failed to load job status',
          variant: 'destructive'
        });
      });

    // Subscribe to realtime updates
    const unsubscribe = pb.collection('audio_generation_jobs').subscribe<AudioGenerationJob>(
      jobId,
      (data: any) => {
        setJob(data.record);
      }
    );

    return () => {
      unsubscribe.then((unsub: any) => unsub());
    };
  }, [jobId, isOpen, toast]);

  if (!job) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isComplete = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isInProgress = job.status === 'processing' || job.status === 'pending';
  const hasFailures = job.failed_questions && job.failed_questions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete && !hasFailures && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {(isFailed || hasFailures) && <XCircle className="h-5 w-5 text-red-500" />}
            {isInProgress && <Loader2 className="h-5 w-5 animate-spin" />}
            Audio Generation
          </DialogTitle>
          <DialogDescription>
            {isComplete && !hasFailures && 'Audio generation completed successfully'}
            {isFailed && 'Audio generation completed with errors'}
            {isInProgress && 'Generating audio for questions...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {job.processed_questions} of {job.total_questions} questions
              </span>
            </div>
            <Progress value={job.progress} className="h-2" />
            <div className="text-right text-xs text-muted-foreground">
              {job.progress}%
            </div>
          </div>

          {hasFailures && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                {job.failed_questions.length} question{job.failed_questions.length !== 1 ? 's' : ''} failed
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                The game can still be played. Failed questions will not have audio.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {hasFailures && onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Retry Failed
              </Button>
            )}
            <Button onClick={onClose} variant="default" size="sm">
              {isInProgress ? 'Close' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
