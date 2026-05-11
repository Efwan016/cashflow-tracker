// ─── InventorySkeleton ────────────────────────────────────────────────────────

function ShimmerRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </td>
      ))}
    </tr>
  )
}

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 6, cols = 4 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-2.5 w-20 animate-pulse rounded-lg bg-slate-800" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-800" />
      </div>
    </div>
  )
}
