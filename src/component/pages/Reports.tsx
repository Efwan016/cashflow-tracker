import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { createCurrencyFormatter, createNumberFormatter } from '../../lib/utils'
import type { Product } from '../../types/types'

type ReportTransaction = {
  id: string
  product_id: string
  qty: number
  harga_jual: number
  total: number
  created_at: string
}

type ReportExpense = {
  id: string
  description: string
  total: number
  created_at: string
}

type ReportStock = {
  id: string
  product_id: string
  total: number
}

type ReportStockLog = {
  id: string
  product_id: string
  type: string
  qty: number
  created_at: string
}

export default function Reports() {
  const [transactions, setTransactions] = useState<ReportTransaction[]>([])
  const [expenses, setExpenses] = useState<ReportExpense[]>([])
  const [stocks, setStocks] = useState<ReportStock[]>([])
  // Menggunakan tipe data yang lebih spesifik untuk stockLogs
  const [stockLogs, setStockLogs] = useState<ReportStockLog[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError('')

      const { data: user } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated.')
        setLoading(false)
        return
      }
      const userId = user.id

      const [
        { data: transactionData, error: transactionError },
        { data: expenseData, error: expenseError },
        { data: stockData, error: stockError },
        { data: stockLogData, error: stockLogError },
        { data: productData, error: productError },
      ] = await Promise.all([
        supabase
          .from('Transactions')
          .select('*')
          .eq('user_id', userId) // Filter by user_id
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId) // Filter by user_id
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('Stock')
          .select('*')
          .eq('user_id', userId) // Filter by user_id
          .order('product_id', { ascending: true }),
        supabase
          .from('Stock_logs')
          .select('*')
          .eq('user_id', userId) // Filter by user_id
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('Product')
          .select('id, name, harga_modal, harga_jual')
          .eq('user_id', userId) // Filter by user_id
          .order('id', { ascending: true }),
      ])

      if (transactionError || expenseError || stockError || stockLogError) {
        setError('Unable to load report data: ' + [transactionError?.message, expenseError?.message, stockError?.message, stockLogError?.message].filter(Boolean).join(' | '))
      } else {
        setTransactions(transactionData ?? [])
        setExpenses(expenseData ?? [])
        setStocks(stockData ?? [])
        setStockLogs(stockLogData ?? [])
      }
      
      if (!productError) { // Memastikan productData juga di-set
        setProducts(productData ?? [])
      }

      setLoading(false)
    }

    fetchReports()
  }, [])

  const fmt = useMemo(() => createCurrencyFormatter(), []);
  const num = useMemo(() => createNumberFormatter(), []);

  const overview = useMemo(() => {
    const totalRevenue = transactions.reduce((sum, item) => sum + item.total, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.total, 0)
    const totalTransactions = transactions.length
    const totalStockQuantity = stocks.reduce((sum, item) => sum + item.total, 0)
    const totalStockLogs = stockLogs.length
    const averageOrder = totalTransactions ? totalRevenue / totalTransactions : 0
    const netProfit = totalRevenue - totalExpenses
    const totalIn = stockLogs.filter((log) => log.type === 'IN').reduce((sum, log) => sum + log.qty, 0)
    const totalOut = stockLogs.filter((log) => log.type === 'OUT').reduce((sum, log) => sum + log.qty, 0)
    return { totalRevenue, totalExpenses, totalTransactions, totalStockQuantity, totalStockLogs, averageOrder, netProfit, totalIn, totalOut }
  }, [transactions, expenses, stocks, stockLogs])

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Reports</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Financial insights and inventory reports</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Explore live revenue, expense, stock, and stock movement metrics pulled directly from Supabase.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Total revenue</p>
            <p className="mt-4 text-3xl font-semibold text-white">{fmt.format(overview.totalRevenue)}</p>
            <p className="mt-2 text-sm text-slate-400">Recent transaction total</p>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Net profit</p>
            <p className="mt-4 text-3xl font-semibold text-white">{fmt.format(overview.netProfit)}</p>
            <p className="mt-2 text-sm text-slate-400">Revenue minus spend</p>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Stock quantity</p>
            <p className="mt-4 text-3xl font-semibold text-white">{num.format(overview.totalStockQuantity)}</p>
            <p className="mt-2 text-sm text-slate-400">Available inventory</p>
          </div>
          <div className="rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-sm shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Stock logs</p>
            <p className="mt-4 text-3xl font-semibold text-white">{overview.totalStockLogs}</p>
            <p className="mt-2 text-sm text-slate-400">Movements recorded</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Revenue report</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent transactions</h2>
              </div>
              <p className="text-sm text-slate-400">Loaded from the transactions table.</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">Sale Price</th>
                    <th className="px-4 py-4">Total</th>
                    <th className="px-4 py-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-slate-400">Loading report data...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-rose-300">{error}</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-slate-400">No transactions found.</td>
                    </tr>
                  ) : (
                    transactions.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800 last:border-none">
                        <td className="px-4 py-4 text-slate-100">{productMap.get(item.product_id) ?? item.product_id}</td>
                        <td className="px-4 py-4 text-slate-100">{item.qty}</td>
                        <td className="px-4 py-4 text-slate-100">{fmt.format(item.harga_jual)}</td>
                        <td className="px-4 py-4 text-slate-100">{fmt.format(item.total)}</td>
                        <td className="px-4 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Stock report</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Stock movement summary</h2>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Total stock flow in</p>
                <p className="mt-3 text-2xl font-semibold text-white">{num.format(overview.totalIn)}</p>
              </div>
              <div className="rounded-[28px] border border-slate-700 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Total stock flow out</p>
                <p className="mt-3 text-2xl font-semibold text-white">{num.format(overview.totalOut)}</p>
              </div>
              <div className="rounded-[28px] border border-slate-700 bg-slate-900/90 p-5 text-sm text-slate-300">
                Stock logs and inventory records are synchronized for consistent stock reporting.
              </div>
            </div>

            <NavLink
              to="/stock-logs"
              className="mt-6 inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
            >
              View stock logs
            </NavLink>
          </aside>
        </div>

        <div className="mt-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Current stock overview</h2>
            </div>
            <p className="text-sm text-slate-400">Loaded from the stocks table.</p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Product ID</th>
                  <th className="px-4 py-4">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-slate-400">Loading stock data...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-rose-300">{error}</td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-slate-400">No stock records found.</td>
                  </tr>
                ) : (
                  stocks.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{productMap.get(item.product_id) ?? item.product_id}</td>
                      <td className="px-4 py-4 text-slate-100">{num.format(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
