import ChartComponent from '../../components/Chart'
import type { ChartProps } from '../../../types/types'

type TrendTotals = {
  revenue: number
  grossProfit: number
  expenses: number
}

type ReportTrendSectionProps = {
  trendChartData: ChartProps['data']
  comparisonChartData: ChartProps['data']
  comparisonTitle: string
  dateRangeLabel: string
  currentTotals: TrendTotals
  fmt: Intl.NumberFormat
}

export default function ReportTrendSection({
  trendChartData,
  comparisonChartData,
  comparisonTitle,
  dateRangeLabel,
  currentTotals,
  fmt,
}: ReportTrendSectionProps) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Cashflow overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Revenue, expense, and profit trend</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Daily movement across the selected period.</p>
        </div>
        <div className="mt-8 h-[360px] min-h-[280px]">
          <ChartComponent data={trendChartData} />
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Momentum</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{comparisonTitle}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue by timeframe.</p>
          </div>
          <div className="mt-6 h-[260px] min-h-[220px]">
            <ChartComponent data={comparisonChartData} variant="bar" />
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Revenue snapshot</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.revenue)}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 dark:bg-slate-900 dark:text-slate-300">{dateRangeLabel}</div>
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/90">
              <p className="uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Gross profit</p>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.grossProfit)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/90">
              <p className="uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Expenses</p>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.expenses)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
