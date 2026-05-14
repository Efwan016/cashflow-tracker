import { Package2, BarChart3, ArrowLeftRight, AlertTriangle } from 'lucide-react'
import { StatCardSkeleton } from '../../components/InventorySkeleton'
import type { StatCardProps } from '../../../types/types'

// ─── InventoryStats ───────────────────────────────────────────────────────────



function StatCard({
  label,
  value,
  subtext,
  icon,
  accentClass,
  borderClass,
  loading,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:shadow-none ${borderClass}`}
    >
      {/* Icon */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={`mt-2.5 text-3xl font-bold tabular-nums ${accentClass}`}>
            {value}
          </p>
          {subtext && (
            <p className="mt-1.5 text-[11px] text-slate-500">{subtext}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-slate-50 dark:bg-slate-950/60 ${borderClass} ${accentClass} transition-transform duration-200 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>

      {/* Ambient glow on hover */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(14,165,233,0.04), transparent 70%)',
        }}
      />
    </div>
  )
}

interface InventoryStatsProps {
  totalProducts: number
  totalStockQty: number
  totalMovements: number
  lowStockCount: number
  loading: boolean
}

export function InventoryStats({
  totalProducts,
  totalStockQty,
  totalMovements,
  lowStockCount,
  loading,
}: InventoryStatsProps) {
  const stats: Omit<StatCardProps, 'loading'>[] = [
    {
      label: 'Total Products',
      value: totalProducts.toLocaleString(),
      subtext: 'unique SKUs tracked',
      icon: <Package2 className="h-4.5 w-4.5" />,
      accentClass: 'text-sky-400',
      borderClass: 'border-sky-500/20',
    },
    {
      label: 'Total Stock Qty',
      value: totalStockQty.toLocaleString(),
      subtext: 'units across all products',
      icon: <BarChart3 className="h-4.5 w-4.5" />,
      accentClass: 'text-violet-400',
      borderClass: 'border-violet-500/20',
    },
    {
      label: 'Stock Movements',
      value: totalMovements.toLocaleString(),
      subtext: 'logged IN/OUT events',
      icon: <ArrowLeftRight className="h-4.5 w-4.5" />,
      accentClass: 'text-indigo-400',
      borderClass: 'border-indigo-500/20',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount.toLocaleString(),
      subtext: lowStockCount > 0 ? 'products need restocking' : 'all products healthy',
      icon: <AlertTriangle className="h-4.5 w-4.5" />,
      accentClass: lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400',
      borderClass: lowStockCount > 0 ? 'border-rose-500/20' : 'border-emerald-500/20',
    },
  ]

  return (
    <section
      aria-label="Inventory statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} loading={loading} />
      ))}
    </section>
  )
}
