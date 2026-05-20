import ChartComponent from '../../components/Chart'
import type { ReportOverviewProps } from '../../../types/types'

export default function ReportOverview({
  monthlyComparisonChartData,
  currentMonthTotals,
  monthlyRevenueGrowth,
  monthlyProfitGrowth,
  monthlyExpenseGrowth,
  monthComparisonSubtitle,
  fmt,
}: ReportOverviewProps) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Month comparison</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">This month vs last month</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Revenue, cost, and profit performance.</p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">This month revenue</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentMonthTotals.revenue)}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{(Math.round(monthlyRevenueGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyRevenueGrowth * 10) / 10}%`} vs last month</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">This month profit</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentMonthTotals.grossProfit - currentMonthTotals.expenses)}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{(Math.round(monthlyProfitGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyProfitGrowth * 10) / 10}%`} vs last month</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">This month expenses</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentMonthTotals.expenses)}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{(Math.round(monthlyExpenseGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyExpenseGrowth * 10) / 10}%`} vs last month</p>
          </div>
        </div>
        <div className="mt-6 h-[260px] min-h-[220px]">
          <ChartComponent data={monthlyComparisonChartData} variant="bar" />
        </div>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Current month summary</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Snapshot by the numbers</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">{monthComparisonSubtitle}</span>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue change</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{(Math.round(monthlyRevenueGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyRevenueGrowth * 10) / 10}%`}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-sm text-slate-500 dark:text-slate-400">Profit change</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{(Math.round(monthlyProfitGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyProfitGrowth * 10) / 10}%`}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
            <p className="text-sm text-slate-500 dark:text-slate-400">Expense change</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{(Math.round(monthlyExpenseGrowth * 10) / 10 >= 0 ? '+' : '') + `${Math.round(monthlyExpenseGrowth * 10) / 10}%`}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
