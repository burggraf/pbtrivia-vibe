import {
  BookOpen,
  Film,
  Utensils,
  HelpCircle,
  Globe,
  Clock,
  Star,
  Atom,
  Trophy,
  Cpu
} from 'lucide-react'

interface CategoryIconProps {
  category: string
  className?: string
  size?: number
}

// Map of category names to Lucide icon components
const categoryIcons: { [key: string]: React.ComponentType<any> } = {
  'Arts & Literature': BookOpen,
  'Entertainment': Film,
  'Food and Drink': Utensils,
  'General Knowledge': HelpCircle,
  'Geography': Globe,
  'History': Clock,
  'Pop Culture': Star,
  'Science': Atom,
  'Sports': Trophy,
  'Technology': Cpu
}

export default function CategoryIcon({ category, className = '', size = 16 }: CategoryIconProps) {
  const IconComponent = categoryIcons[category]

  if (!IconComponent) {
    // Return a default icon for unknown categories using HelpCircle
    return (
      <HelpCircle
        size={size}
        className={`${className} text-slate-500 dark:text-slate-400`}
      />
    )
  }

  return (
    <IconComponent
      size={size}
      className={className}
    />
  )
}

// Helper function to get all available categories
export function getAvailableCategories(): string[] {
  return Object.keys(categoryIcons)
}

// Helper function to get icon component for a category
export function getCategoryIconComponent(category: string): React.ComponentType<any> | undefined {
  return categoryIcons[category]
}