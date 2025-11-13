import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface TimerValues {
  question_timer?: number | null;
  answer_timer?: number | null;
  game_start_timer?: number | null;
  round_start_timer?: number | null;
  round_end_timer?: number | null;
  game_end_timer?: number | null;
  thanks_timer?: number | null;
}

interface TimersAccordionProps {
  timers: TimerValues;
  onTimersChange: (timers: TimerValues) => void;
  onCopyFromPrevious?: () => void;
}

export default function TimersAccordion({ timers, onTimersChange, onCopyFromPrevious }: TimersAccordionProps) {
  const handleTimerChange = (field: keyof TimerValues, value: string) => {
    onTimersChange({
      ...timers,
      [field]: value ? parseInt(value) : null
    })
  }

  return (
    <AccordionItem value="timers">
      <AccordionTrigger className="text-base font-semibold">
        Timers
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-4 pt-4">
          {/* Timer Inputs - 3 columns on large screens, 2 on medium, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Question Timer */}
            <div className="space-y-2">
              <Label htmlFor="question_timer" className="text-sm font-medium">
                Question
              </Label>
              <Input
                id="question_timer"
                type="number"
                min="0"
                max="300"
                value={timers.question_timer ?? ''}
                onChange={(e) => handleTimerChange('question_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Answer Display Timer */}
            <div className="space-y-2">
              <Label htmlFor="answer_timer" className="text-sm font-medium">
                Answer Display
              </Label>
              <Input
                id="answer_timer"
                type="number"
                min="0"
                max="600"
                value={timers.answer_timer ?? ''}
                onChange={(e) => handleTimerChange('answer_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Round Start Timer */}
            <div className="space-y-2">
              <Label htmlFor="round_start_timer" className="text-sm font-medium">
                Round Start
              </Label>
              <Input
                id="round_start_timer"
                type="number"
                min="0"
                max="600"
                value={timers.round_start_timer ?? ''}
                onChange={(e) => handleTimerChange('round_start_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Round End Timer */}
            <div className="space-y-2">
              <Label htmlFor="round_end_timer" className="text-sm font-medium">
                Round End
              </Label>
              <Input
                id="round_end_timer"
                type="number"
                min="0"
                max="600"
                value={timers.round_end_timer ?? ''}
                onChange={(e) => handleTimerChange('round_end_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Game Start Timer */}
            <div className="space-y-2">
              <Label htmlFor="game_start_timer" className="text-sm font-medium">
                Game Start
              </Label>
              <Input
                id="game_start_timer"
                type="number"
                min="0"
                max="600"
                value={timers.game_start_timer ?? ''}
                onChange={(e) => handleTimerChange('game_start_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Game End Timer */}
            <div className="space-y-2">
              <Label htmlFor="game_end_timer" className="text-sm font-medium">
                Game End
              </Label>
              <Input
                id="game_end_timer"
                type="number"
                min="0"
                max="600"
                value={timers.game_end_timer ?? ''}
                onChange={(e) => handleTimerChange('game_end_timer', e.target.value)}
                placeholder="No limit"
                className="w-32"
              />
            </div>

            {/* Thanks Screen Timer */}
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="thanks_timer" className="text-sm font-medium">
                Thanks Screen
              </Label>
              <div className="flex items-center gap-2 lg:grid lg:grid-cols-3 lg:gap-4">
                <Input
                  id="thanks_timer"
                  type="number"
                  min="0"
                  max="600"
                  value={timers.thanks_timer ?? ''}
                  onChange={(e) => handleTimerChange('thanks_timer', e.target.value)}
                  placeholder="No limit"
                  className="w-32"
                />
                {onCopyFromPrevious && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCopyFromPrevious}
                    className="text-xs whitespace-nowrap lg:col-start-2"
                  >
                    Copy from Previous Game
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Helper Note */}
          <p className="text-xs text-slate-500 italic mt-2">
            Leave blank or enter 0 for no time limit (manual advance)
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
