import { getStockStatus } from '../../lib/utils'

// ─── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  total: number
}

export function StatusBadge({ total }: StatusBadgeProps) {
  const status = getStockStatus(total)

  if (status === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Critical
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Low
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      In Stock
    </span>
  )
}
