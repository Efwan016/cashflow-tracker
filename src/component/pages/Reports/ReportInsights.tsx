import { Pagination } from '../../components/Pagination'
import { Link } from 'react-router-dom'
import type { Expense } from '../../../types/types'

type ProductInsight = {
  name: string
  qty: number
  revenue: number
  profit: number
}

type StockItem = {
  name: string
  qty: number
  modal: number
  jual: number
}

type ReportInsightsProps = {
  bestByQty: ProductInsight[]
  bestByRevenue: ProductInsight[]
  mostProfitable: ProductInsight[]
  maxQtyByQty: number
  maxRevenue: number
  maxProfit: number
  expenseBreakdown: { name: string; total: number }[]
  maxExpenseCategory: number
  biggestExpense: Expense | null
  stockSummary: {
    value: number
    potentialRevenue: number
    potentialProfit: number
    lowStock: StockItem[]
  }
  pagedLowStock: StockItem[]
  lowStockPage: number
  itemsPerPage: number
  onLowStockPageChange: (page: number) => void
  fmt: Intl.NumberFormat
  num: Intl.NumberFormat
  filterType: string
  startDate: string
  endDate: string
}

export default function ReportInsights({
  bestByQty,
  bestByRevenue,
  mostProfitable,
  maxQtyByQty,
  maxRevenue,
  maxProfit,
  expenseBreakdown,
  maxExpenseCategory,
  biggestExpense,
  stockSummary,
  pagedLowStock,
  lowStockPage,
  itemsPerPage,
  onLowStockPageChange,
  fmt,
  num,
  filterType,
  startDate,
  endDate,
}: ReportInsightsProps) {
  return (
    <>
      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <Link to={`/reports/insights/best-by-quantity?type=${filterType}&start=${startDate}&end=${endDate}`} className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Product insights</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Best seller by quantity</h3>
          <div className="mt-6 space-y-4">
            {bestByQty.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No product sales available yet.</div>
            ) : (
              bestByQty.map((item, index) => (
                <div key={item.name} className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">#{index + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>Qty {num.format(item.qty)}</span>
                    <span>Revenue {fmt.format(item.revenue)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${Math.min(100, (item.qty / maxQtyByQty) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Link>

        <Link to={`/reports/insights/best-by-revenue?type=${filterType}&start=${startDate}&end=${endDate}`} className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Product insights</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Best seller by revenue</h3>
          <div className="mt-6 space-y-4">
            {bestByRevenue.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No revenue data available.</div>
            ) : (
              bestByRevenue.map((item, index) => (
                <div key={item.name} className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">#{index + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>Revenue {fmt.format(item.revenue)}</span>
                    <span>Profit {fmt.format(item.profit)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(100, (item.revenue / maxRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Link>

        <Link to={`/reports/insights/most-profitable?type=${filterType}&start=${startDate}&end=${endDate}`} className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Product insights</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Most profitable product</h3>
          <div className="mt-6 space-y-4">
            {mostProfitable.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Profit data will appear once sales are recorded.</div>
            ) : (
              mostProfitable.map((item, index) => (
                <div key={item.name} className="space-y-2 rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">#{index + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>Profit {fmt.format(item.profit)}</span>
                    <span>Qty {num.format(item.qty)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-pink-500" style={{ width: `${Math.min(100, (item.profit / maxProfit) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Link>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Expense insights</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Top categories</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Summarized by description.</p>
          </div>
          <div className="mt-6 space-y-4">
            {expenseBreakdown.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No expense breakdown found.</div>
            ) : (
              expenseBreakdown.map((item) => (
                <div key={item.name} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fmt.format(item.total)}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${Math.min(100, (item.total / maxExpenseCategory) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Expense insights</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Biggest expense</h3>
          </div>
          {biggestExpense ? (
            <div className="mt-6 space-y-4 rounded-[28px] border border-slate-100 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{biggestExpense.description || 'Expense'}</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">{fmt.format(biggestExpense.total)}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{new Date(biggestExpense.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No expenses were found in this period.</div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Inventory insights</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Stock value and opportunity</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Based on current inventory and pricing.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-sm text-slate-500 dark:text-slate-400">Stock value</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(stockSummary.value)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-sm text-slate-500 dark:text-slate-400">Potential revenue</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(stockSummary.potentialRevenue)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-sm text-slate-500 dark:text-slate-400">Potential profit</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(stockSummary.potentialProfit)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/90">
              <p className="text-sm text-slate-500 dark:text-slate-400">Low stock alert</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{stockSummary.lowStock.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Inventory alerts</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Low stock products</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Restock priority.</p>
          </div>
          <div className="mt-2 space-y-1">
            {stockSummary.lowStock.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                All stock levels look healthy.
              </div>
            ) : (
              pagedLowStock.map((item) => (
                <div key={`${item.name}-${item.qty}`} className="rounded-xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{num.format(item.qty)} left</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Cost {fmt.format(item.modal)} · Retail {fmt.format(item.jual)}</p>
                </div>
              ))
            )}
          </div>
          {stockSummary.lowStock.length > itemsPerPage && (
            <div className="mt-4">
              <Pagination currentPage={lowStockPage} totalItems={stockSummary.lowStock.length} itemsPerPage={itemsPerPage} onPageChange={onLowStockPageChange} />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
