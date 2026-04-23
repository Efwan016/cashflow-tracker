import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { createCurrencyFormatter, createNumberFormatter, toDateKey } from '../../lib/utils'
import ChartComponent from '../components/Chart'
import type { Product } from '../../types/types'

type ReportTransaction = {
  id: string
  product_id: string | null
  qty: number
  harga_jual: number
  total: number
  created_at: string
  product_name: string | null
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

  // Pagination states
  const [txPage, setTxPage] = useState(1)
  const [stockPage, setStockPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await fetchReports()

      channel = supabase
        .channel(`reports-realtime-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchReports(), 1000) // Reports lebih berat, kasih jeda 1 detik
        })
        .subscribe()
    }

    const fetchReports = async () => {
      setLoading(true)
      setError('')

      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
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
          .limit(200),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId) // Filter by user_id
          .order('created_at', { ascending: false })
          .limit(200),
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

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
      clearTimeout(timeout)
    }
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

  const chartData = useMemo(() => {
    const map = new Map<string, { revenue: number; expense: number }>()

    transactions.forEach((t) => {
      const key = toDateKey(t.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0 }
      entry.revenue += t.total ?? 0
      map.set(key, entry)
    })

    expenses.forEach((e) => {
      const key = toDateKey(e.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0 }
      entry.expense += e.total ?? 0
      map.set(key, entry)
    })

    const sortedKeys = Array.from(map.keys()).sort()
    const labels: string[] = []
    const revenue: number[] = []
    const expense: number[] = []
    const netProfit: number[] = []

    if (sortedKeys.length > 0) {
      const start = new Date(sortedKeys[0])
      const end = new Date(sortedKeys[sortedKeys.length - 1])
      const current = new Date(start)

      while (current <= end) {
        const key = current.toISOString().split('T')[0]
        const data = map.get(key) ?? { revenue: 0, expense: 0 }

        labels.push(key)
        revenue.push(data.revenue ?? 0)
        expense.push(data.expense ?? 0)
        netProfit.push((data.revenue ?? 0) - (data.expense ?? 0))

        current.setDate(current.getDate() + 1)
      }
    }
    return { labels, revenue, expense, netProfit }
  }, [transactions, expenses])

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  const bestSelling = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>()
    
    transactions.forEach(t => {
      const name = (t.product_id ? productMap.get(t.product_id) : null) ?? t.product_name ?? 'Manual Sale'
      const entry = map.get(name) ?? { name, qty: 0, revenue: 0 }
      entry.qty += t.qty
      entry.revenue += t.total
      map.set(name, entry)
    })

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [transactions, productMap])

  const bestSellingChart = useMemo(() => {
    return {
      labels: bestSelling.map(p => p.name),
      revenue: bestSelling.map(p => p.revenue),
      expense: [],
      netProfit: []
    }
  }, [bestSelling])

  // Paginated Data
  const paginatedTx = useMemo(() => 
    transactions.slice((txPage - 1) * itemsPerPage, txPage * itemsPerPage)
  , [transactions, txPage])

  const paginatedStocks = useMemo(() => 
    stocks.slice((stockPage - 1) * itemsPerPage, stockPage * itemsPerPage)
  , [stocks, stockPage])

  const getPageRange = (current: number, total: number) => {
    const range: (number | string)[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i)
    } else {
      if (current <= 4) {
        range.push(1, 2, 3, 4, 5, '...', total)
      } else if (current >= total - 3) {
        range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
      } else {
        range.push(1, '...', current - 1, current, current + 1, '...', total)
      }
    }
    return range
  }

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

        {/* Financial Chart Section */}
        <div className="mt-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Analytics</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Cashflow trend</h2>
          </div>
          <div className="h-[350px]">
            <ChartComponent data={chartData} />
          </div>
        </div>

        {/* Best Selling Section */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory Insights</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Top 5 Products by Revenue</h2>
            </div>
            <div className="h-[300px]">
              {/* Menggunakan ChartComponent untuk visualisasi perbandingan revenue produk */}
              <ChartComponent data={bestSellingChart} />
            </div>
          </div>

          <div className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Sales Performance</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Best Selling List</h2>
            </div>
            <div className="space-y-6">
              {bestSelling.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No sales data found for products.</p>
              ) : (
                bestSelling.map((product, idx) => {
                  const maxQty = Math.max(...bestSelling.map(p => p.qty))
                  const percentage = (product.qty / maxQty) * 100
                  
                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">{product.name}</span>
                        <span className="text-sm font-bold text-sky-400">{num.format(product.qty)} units</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-widest text-right">Total: {fmt.format(product.revenue)}</p>
                    </div>
                  )
                })
              )}
            </div>
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
                    paginatedTx.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800 last:border-none">
                        <td className="px-4 py-4 text-slate-100">{(item.product_id ? productMap.get(item.product_id) : null) ?? item.product_name ?? 'Manual Sale'}</td>
                        <td className="px-4 py-4 text-slate-100">{item.qty}</td>
                        <td className="px-4 py-4 text-slate-100">{fmt.format(item.harga_jual)}</td>
                        <td className="px-4 py-4 text-slate-100">{fmt.format(item.total)}</td>
                        <td className="px-4 py-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/50">
                <button 
                  disabled={txPage === 1}
                  onClick={() => setTxPage(p => p - 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">PREV</button>
                <div className="flex items-center gap-1">
                  {getPageRange(txPage, Math.ceil(transactions.length / itemsPerPage)).map((p, i) => (
                    typeof p === 'number' ? (
                      <button
                        key={i}
                        onClick={() => setTxPage(p)}
                        className={`h-7 min-w-[28px] rounded-lg text-[10px] font-bold transition-all ${
                          txPage === p ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={i} className="px-1 text-slate-600 font-bold">...</span>
                    )
                  ))}
                </div>
                <button 
                  disabled={txPage * itemsPerPage >= transactions.length}
                  onClick={() => setTxPage(p => p + 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">NEXT</button>
              </div>
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
                  paginatedStocks.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{productMap.get(item.product_id) ?? item.product_id}</td>
                      <td className="px-4 py-4 text-slate-100">{num.format(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/50">
                <button 
                  disabled={stockPage === 1}
                  onClick={() => setStockPage(p => p - 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">PREV</button>
                <div className="flex items-center gap-1">
                  {getPageRange(stockPage, Math.ceil(stocks.length / itemsPerPage)).map((p, i) => (
                    typeof p === 'number' ? (
                      <button
                        key={i}
                        onClick={() => setStockPage(p)}
                        className={`h-7 min-w-[28px] rounded-lg text-[10px] font-bold transition-all ${
                          stockPage === p ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={i} className="px-1 text-slate-600 font-bold">...</span>
                    )
                  ))}
                </div>
                <button 
                  disabled={stockPage * itemsPerPage >= stocks.length}
                  onClick={() => setStockPage(p => p + 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">NEXT</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
