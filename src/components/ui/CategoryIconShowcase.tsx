import CategoryIcon, { getAvailableCategories } from './CategoryIcon'

export default function CategoryIconShowcase() {
  const categories = getAvailableCategories()

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
        Question Category Icons (Lucide)
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Beautiful, professional icons from Lucide React library for each trivia category.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category}
            className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
          >
            <CategoryIcon
              category={category}
              size={32}
              className="mb-2 text-slate-700 dark:text-slate-300"
            />
            <span className="text-xs text-center text-slate-600 dark:text-slate-300">
              {category}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}