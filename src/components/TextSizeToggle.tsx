import { useTextSize } from '@/contexts/TextSizeContext'
import { Button } from '@/components/ui/button'
import { Type } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TextSizeToggle() {
  const { textSize, setTextSize } = useTextSize()

  const getLabel = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    switch (size) {
      case 'small':
        return 'Small'
      case 'medium':
        return 'Medium'
      case 'large':
        return 'Large'
      case 'xlarge':
        return 'X-Large'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[44px] w-[44px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          title={`Current text size: ${getLabel(textSize)}. Click to change.`}
        >
          <Type className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem
          onClick={() => {
            console.log('Setting text size to small')
            setTextSize('small')
          }}
          className="gap-2 cursor-pointer"
        >
          <span className="text-sm">Small</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log('Setting text size to medium')
            setTextSize('medium')
          }}
          className="gap-2 cursor-pointer"
        >
          <span className="text-base">Medium</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log('Setting text size to large')
            setTextSize('large')
          }}
          className="gap-2 cursor-pointer"
        >
          <span className="text-lg">Large</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log('Setting text size to xlarge')
            setTextSize('xlarge')
          }}
          className="gap-2 cursor-pointer"
        >
          <span className="text-xl">X-Large</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
