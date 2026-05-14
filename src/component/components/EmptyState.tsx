import { PackageSearch } from 'lucide-react'
import type { EmptyStateProps } from '../../types/types'

export function EmptyState({
  title = 'No data found',
  description = 'There are no records to display here yet.',
  action,
}: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
            <PackageSearch className="h-7 w-7 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-300">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-400 transition-all hover:bg-sky-500/20 hover:text-sky-300"
            >
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
