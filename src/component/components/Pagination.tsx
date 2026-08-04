import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPageRange } from "../../lib/utils"
import type { PaginationProps } from '../../types/types'

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null

  const range = getPageRange(currentPage, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-900/90 bg-slate-200 dark:bg-slate-900/90 px-3 py-2 sm:px-5 sm:py-3">
      {/* Info */}
      <span className="text-[10px] text-slate-500 sm:hidden">
        Page {currentPage} of {totalPages}
      </span>
      <span className="hidden text-[11px] text-slate-500 sm:block">
        {(currentPage - 1) * itemsPerPage + 1}–
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </span>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {range.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[10px] font-bold text-slate-600">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={currentPage === p ? 'page' : undefined}
              className={`h-8 min-w-[32px] rounded-lg px-1 text-[10px] font-bold transition-all ${
                currentPage === p
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-slate-200 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={currentPage * itemsPerPage >= totalItems}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
