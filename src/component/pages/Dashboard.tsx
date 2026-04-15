import { NavLink } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type DashboardTransaction = {
  id: string
  product_id: string
  qty: number
  harga_jual: number
  total: number
  created_at: string
}

type DashboardExpense = {
  id: string
  description: string
  total: number
  created_at: string
}

type DashboardStock = {
  id: string
  product_id: string
  total: number
}

type DashboardStockLog = {
  id: string
  product_id: string
  type: string
  qty: number
  created_at: string
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([])
  const [expenses, setExpenses] = useState<DashboardExpense[]>([])
  const [stocks, setStocks] = useState<DashboardStock[]>([])
  const [stockLogs, setStockLogs] = useState<DashboardStockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError('')

      const [
        { data: transactionData, error: transactionError },
        { data: expenseData, error: expenseError },
        { data: stockData, error: stockError },
        { data: stockLogData, error: stockLogError },
      ] = await Promise.all([
        supabase
          .from('Transactions')
          .select('id, product_id, qty, harga_jual, total, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('expenses')
          .select('id, description, total, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('Stock')
          .select('id, product_id, total')
          .order('product_id', { ascending: true }),
        supabase
          .from('Stock_logs')
          .select('id, product_id, type, qty, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (transactionError || expenseError || stockError || stockLogError) {
        setError(
          'Unable to load dashboard data: ' +
            [transactionError?.message, expenseError?.message, stockError?.message, stockLogError?.message]
              .filter(Boolean)
              .join(' | ')
        )
        setTransactions([])
        setExpenses([])
        setStocks([])
        setStockLogs([])
      } else {
        setTransactions(transactionData ?? [])
        setExpenses(expenseData ?? [])
        setStocks(stockData ?? [])
        setStockLogs(stockLogData ?? [])
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const overview = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, item) => sum + item.total, 0)
    const totalTransactions = transactions.length
    const averageSale = totalTransactions ? totalRevenue / totalTransactions : 0
    const totalExpense = expenses.reduce((sum, item) => sum + item.total, 0)
    const totalStockQty = stocks.reduce((sum, item) => sum + item.total, 0)
    const stockItems = stocks.length
    const netCashflow = totalRevenue - totalExpense
    const revenueShare = totalRevenue + totalExpense > 0 ? Math.round((totalRevenue / (totalRevenue + totalExpense)) * 100) : 0
    return { totalRevenue, totalTransactions, averageSale, totalExpense, totalStockQty, stockItems, netCashflow, revenueShare }
  }, [transactions, expenses, stocks])

  return (
  
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Cashflow Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome back, finance leader</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Review your latest revenue, expenses, inventory, and stock movement in a single connected dashboard.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/30">
              <p className="text-sm text-slate-400">Available revenue</p>
              <p className="mt-3 text-3xl font-semibold text-white">Rp {overview.totalRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/30">
              <p className="text-sm text-slate-400">Total expenses</p>
              <p className="mt-3 text-3xl font-semibold text-white">Rp {overview.totalExpense.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Summary</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Connected finance overview</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 px-4 py-2 text-sm text-slate-300">
                {loading ? 'Loading...' : `${stockLogs.length + transactions.length + expenses.length} items loaded`}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Revenue</p>
                <p className="mt-3 text-2xl font-semibold text-white">Rp {overview.totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Expenses</p>
                <p className="mt-3 text-2xl font-semibold text-white">Rp {overview.totalExpense.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Total stock qty</p>
                <p className="mt-3 text-2xl font-semibold text-white">{overview.totalStockQty.toLocaleString('id-ID')}</p>
              </div>
              <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Net cashflow</p>
                <p className="mt-3 text-2xl font-semibold text-white">Rp {overview.netCashflow.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Inventory coverage</span>
                <span className="font-semibold text-slate-100">{overview.stockItems} products</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="overflow-hidden rounded-full bg-slate-800">
                  <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, overview.stockItems * 10)}%` }} />
                </div>
                <div className="overflow-hidden rounded-full bg-slate-800">
                  <div className="h-3 rounded-full bg-rose-500" style={{ width: `${Math.max(0, 100 - overview.stockItems * 10)}%` }} />
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Recent activity</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Latest entries</h2>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5 text-slate-400">Loading latest data...</div>
              ) : error ? (
                <div className="rounded-[28px] border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">{error}</div>
              ) : (
                <>
                  {transactions.slice(0, 2).map((item) => (
                    <div key={item.id} className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Transaction</p>
                          <p className="mt-2 text-lg font-semibold text-white">Rp {item.total.toLocaleString('id-ID')}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {expenses.slice(0, 1).map((item) => (
                    <div key={item.id} className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Expense</p>
                          <p className="mt-2 text-lg font-semibold text-white">Rp {item.total.toLocaleString('id-ID')}</p>
                          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {stockLogs.slice(0, 2).map((item) => (
                    <div key={item.id} className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">Stock {item.type}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{item.product_id}</p>
                          <p className="mt-1 text-sm text-slate-400">Qty {item.qty.toLocaleString('id-ID')}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Inventory sync</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">Your stock levels are connected with stock logs and transaction data to keep reporting aligned with inventory.</p>
            </div>

            <div className="grid gap-3">
              <NavLink
                to="/stock"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                Manage stock
              </NavLink>
              <NavLink
                to="/stock-logs"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                View stock logs
              </NavLink>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
