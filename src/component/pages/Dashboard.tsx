import { NavLink } from 'react-router-dom'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ChartComponent from '../components/Chart'
import { IC } from '../components/Icons'
import { getTzOffset, getLocalDate, toDateKey, createCurrencyFormatter, createNumberFormatter, ago } from '../../lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Product = { id: string; name: string; harga_modal: number; harga_jual: number; user_id?: string }
export type Transaction = {
  id: string; product_id: string | null; product_name: string | null
  qty: number; harga_jual: number; harga_modal: number
  profit: number; total: number; mode: string | null; created_at: string; user_id?: string
}
export type Expense = { id: string; description: string | null; total: number; created_at: string }
export type Stock   = { id: string; product_id: string; total: number; harga_modal: number | null; harga_jual: number | null; product?: Product }
export type StockLog = { id: string; product_id: string; type: string | null; qty: number; created_at: string; product?: Product }
export type Profile  = { full_name: string | null; avatar_url: string | null }
export type FilterType = 'today' | 'last7' | 'last30' | 'last3month' | 'specific' | 'range'

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useDashboardData(filter: FilterType, startDate: string, endDate: string) {
  const [data, setData] = useState<{
    transactions: Transaction[],
    expenses: Expense[],
    stocks: Stock[],
    stockLogs: StockLog[],
    profile: Profile | null
  }>({ transactions: [], expenses: [], stocks: [], stockLogs: [], profile: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const tz = getTzOffset()

      let startStr = '', endStr = ''
      if (filter === 'today') { startStr = `${getLocalDate()}T00:00:00.000${tz}`; endStr = `${getLocalDate()}T23:59:59.999${tz}`; }
      else if (filter === 'last7') startStr = `${getLocalDate(7)}T00:00:00.000${tz}`;
      else if (filter === 'last30') startStr = `${getLocalDate(30)}T00:00:00.000${tz}`;
      else if (filter === 'last3month') startStr = `${getLocalDate(90)}T00:00:00.000${tz}`;
      else if (filter === 'specific') { startStr = `${startDate}T00:00:00.000${tz}`; endStr = `${startDate}T23:59:59.999${tz}`; }
      else if (filter === 'range') { startStr = `${startDate}T00:00:00.000${tz}`; endStr = `${endDate}T23:59:59.999${tz}`; }

      let txQ = supabase.from('Transactions').select('*').eq('user_id', user.id);
      let exQ = supabase.from('expenses').select('*').eq('user_id', user.id);

      if (startStr) { txQ = txQ.gte('created_at', startStr); exQ = exQ.gte('created_at', startStr); }
      if (endStr) { txQ = txQ.lte('created_at', endStr); exQ = exQ.lte('created_at', endStr); }

      const [tx, ex, st, sl, pr] = await Promise.all([
        txQ.order('created_at', { ascending: false }),
        exQ.order('created_at', { ascending: false }),
        supabase.from('Stock').select('*, product:Product(*)').eq('user_id', user.id),
        supabase.from('Stock_logs').select('*, product:Product(*)').eq('user_id', user.id).limit(10),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ])

      setData({
        transactions: tx.data || [],
        expenses: ex.data || [],
        stocks: st.data || [],
        stockLogs: sl.data || [],
        profile: pr.data || null
      })
    } catch {
      setError( 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [filter, startDate, endDate])

  useEffect(() => {
    const init = async () => { await fetchData() }
    init()
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  return { ...data, loading, error, refetch: fetchData }
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

type Accent = 'emerald' | 'rose' | 'sky' | 'amber'

const AccentMap: Record<Accent, { bg: string; text: string; ring: string; bar: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20', bar: 'from-emerald-600 to-emerald-400' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',    ring: 'ring-rose-500/20',    bar: 'from-rose-600 to-rose-400' },
  sky:     { bg: 'bg-sky-500/10',     text: 'text-sky-400',     ring: 'ring-sky-500/20',     bar: 'from-sky-600 to-sky-400' },
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',   bar: 'from-amber-600 to-amber-400' },
}

function KpiCard({ label, value, sub, pct, accent, icon, delay = '' }: {
  label: string; value: string; sub?: string; pct?: number
  accent: Accent; icon: React.ReactNode; delay?: string
}) {
  const a = AccentMap[accent]
  return (
    <div className={`group relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 p-6 backdrop-blur-2xl transition-all duration-300 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-black/40 ${delay}`}>
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 ${accent === 'emerald' ? 'bg-emerald-500' : accent === 'rose' ? 'bg-rose-500' : accent === 'sky' ? 'bg-sky-500' : 'bg-amber-500'}`} />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-2xl p-3 ring-1 ${a.bg} ${a.text} ${a.ring}`}>
          {icon}
        </div>
        {sub && <span className="text-[10px] text-slate-500 font-medium mt-0.5 text-right leading-tight max-w-[100px]">{sub}</span>}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${a.text}`}>{value}</p>
      {pct !== undefined && (
        <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${a.bar}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
      )}
    </div>
  )
}

// ─── Feed Row ──────────────────────────────────────────────────────────────────

function FeedRow({ ibg, ic, icon, title, sub, val, vc, badge, bc, time }: {
  ibg: string; ic: string; icon: React.ReactNode; 
  title: string; sub?: string; val?: string; vc?: string
  badge?: string; bc?: string; time: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/[0.03] bg-white/[0.01] p-4 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/10 group cursor-default">
      <div className={`mt-0.5 flex-shrink-0 rounded-xl p-2.5 transition-transform group-hover:scale-110`} style={{ background: ibg }}>
        <span style={{ color: ic }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-100 truncate leading-snug">{title}</span>
          {badge && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: bc, color: ic }}>{badge}</span>}
        </div>
        {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
        {val && <p className="text-sm font-bold mt-1 leading-tight" style={{ color: vc }}>{val}</p>}
      </div>
      <time className="flex-shrink-0 text-[11px] text-slate-600 mt-0.5 whitespace-nowrap">{time}</time>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skel({ n = 4, h = 54 }: { n?: number; h?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`animate-pulse bg-slate-800/40 rounded-2xl`} style={{ height: h, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [filter, setFilter] = useState<FilterType>('last30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { transactions, expenses, stocks, stockLogs, profile, loading, error, refetch } = useDashboardData(filter, startDate, endDate)

  const fmt = useMemo(() => createCurrencyFormatter(), [])
  const num = useMemo(() => createNumberFormatter(), [])

  const metrics = useMemo(() => {
    const revenue      = transactions.reduce((s, t) => s + (t.total  ?? 0), 0)
    const grossProfit  = transactions.reduce((s, t) => s + (t.profit ?? 0), 0)
    const totalExpense = expenses.reduce    ((s, e) => s + (e.total  ?? 0), 0)
    const netProfit    = grossProfit - totalExpense
    const stockQty     = stocks.reduce((s, st) => s + (st.total ?? 0), 0)
    const stockValue   = stocks.reduce((s, st) => {
      const modal = st.harga_modal ?? st.product?.harga_modal ?? 0
      return s + (st.total ?? 0) * modal
    }, 0)
    const marginPct    = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0
    const revSharePct  = revenue + totalExpense > 0 ? Math.round(revenue / (revenue + totalExpense) * 100) : 0
    return { revenue, grossProfit, totalExpense, netProfit, stockQty, stockValue, marginPct, revSharePct, skus: stocks.length, txCount: transactions.length }
  }, [transactions, expenses, stocks])

  // ─── Chart Data (Analytics) ──────────────────────────────────────────────────
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

    const result = { labels, revenue, expense, netProfit }
    return result
  }, [transactions, expenses])

  // ─── Best Selling ────────────────────────────────────────────────────────────
  const bestSelling = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {}
    transactions.forEach(t => {
      const name = t.product_name || 'Produk'
      if (!map[name]) map[name] = { name, qty: 0, total: 0 }
      map[name].qty += t.qty
      map[name].total += t.total
    })
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [transactions])

  // ─── Feed ────────────────────────────────────────────────────────────────────
  type FeedEntry = { kind: 'tx' | 'exp' | 'log'; data: Transaction | Expense | StockLog; ts: string }
  const feed = useMemo<FeedEntry[]>(() => [
    ...transactions.map(d => ({ kind: 'tx'  as const, data: d, ts: d.created_at })),
    ...expenses    .map(d => ({ kind: 'exp' as const, data: d, ts: d.created_at })),
    ...stockLogs   .map(d => ({ kind: 'log' as const, data: d, ts: d.created_at })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 12), [transactions, expenses, stockLogs])

  const pos = metrics.netProfit >= 0
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <>
      <main className="min-h-screen font-sans selection:bg-sky-500/30 text-slate-200" style={{ background: 'radial-gradient(ellipse 80% 50% at 20% -5%, rgba(14,32,64,0.9) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 85% 105%, rgba(30,10,55,0.6) 0%, transparent 55%), #070b12' }}>

        {/* Blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="animate-[pulse_10s_ease-in-out_infinite] absolute rounded-full" style={{ width: 640, height: 640, top: -200, left: '12%', background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 70%)', filter: 'blur(65px)' }} />
          <div className="animate-[pulse_8s_ease-in-out_infinite_reverse] absolute rounded-full" style={{ width: 520, height: 520, bottom: -80, right: '8%', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', filter: 'blur(65px)' }} />
          <div className="animate-[pulse_12s_ease-in-out_infinite] absolute rounded-full" style={{ width: 380, height: 380, top: '45%', left: -80, background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(55px)' }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ── HEADER ── */}
          <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20">Finance Dashboard</span>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {loading ? 'Loading…' : 'Live'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-5xl">
                Hello,{' '}
                <span style={{ background: 'linear-gradient(125deg, #38bdf8 20%, #a78bfa 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {firstName}
                </span>{' '}👋
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-200 outline-none backdrop-blur-xl cursor-pointer hover:bg-slate-800/80 transition-all"
              >
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last3month">Last 3 Months</option>
                <option value="specific">Pick a Date</option>
                <option value="range">Date Range</option>
              </select>

              {(filter === 'specific' || filter === 'range') && (
                <div className="flex items-center gap-2">
                  <input
                    type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-2xl border border-sky-500/20 bg-slate-900/80 px-4 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                  {filter === 'range' && (
                    <>
                      <span className="text-slate-600 text-xs">to</span>
                      <input
                        type="date" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                          className="rounded-2xl border border-sky-500/20 bg-slate-900/80 px-4 py-2 text-xs text-white outline-none focus:border-sky-500"
                      />
                    </>
                  )}
                </div>
              )}

              <button
                onClick={refetch} disabled={loading}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm font-bold text-slate-300 backdrop-blur-xl transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                <span className={loading ? 'animate-spin' : ''}><IC.Refresh /></span>
              </button>
            </div>
          </header>

          {/* ── ERROR ── */}
          {error && (
            <div className="mb-6 rounded-2xl px-5 py-4 text-sm text-rose-300" style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.18)' }}>
              <strong className="text-rose-400">Error: </strong>{error}
            </div>
          )}

          {/* ── NET PROFIT HERO BANNER ── */}
          <div className={`mb-8 relative overflow-hidden rounded-[32px] border ${pos ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-rose-500/20 bg-rose-500/[0.02]'} p-8 sm:p-10 backdrop-blur-md transition-all duration-500 shadow-xl`}>
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: pos ? '#34d399' : '#fb7185' }}>
                  {pos ? 'Net Profit' : 'Net Loss'}
                </p>
                <p className="text-5xl font-black sm:text-7xl tracking-tighter" style={{ color: pos ? '#34d399' : '#fb7185' }}>
                  {pos ? '+' : ''}{fmt.format(metrics.netProfit)}
                </p>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Gross profit{' '}
                  <span className="font-bold text-slate-200">{fmt.format(metrics.grossProfit)}</span>
                  {' '}−{' '}expenses{' '}
                  <span className="font-bold text-slate-200">{fmt.format(metrics.totalExpense)}</span>
                </p>
              </div>
              <div className="flex gap-4 sm:flex-col sm:items-end">
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 px-6 py-4 text-center min-w-[130px]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Margin</p>
                  <p className="mt-1 text-3xl font-black text-white">{metrics.marginPct}%</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 px-6 py-4 text-center min-w-[130px]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Transactions</p>
                  <p className="mt-1 text-3xl font-black text-white">{metrics.txCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4 KPI CARDS ── */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Revenue"       value={fmt.format(metrics.revenue)}      sub={`${metrics.txCount} transactions`}                           pct={metrics.revSharePct}        accent="emerald" icon={<IC.Revenue />} delay="d2" />
            <KpiCard label="Expenses"      value={fmt.format(metrics.totalExpense)} sub={`${expenses.length} entries`}                         pct={100 - metrics.revSharePct}  accent="rose"    icon={<IC.Expense />} delay="d3" />
            <KpiCard label="Gross Profit"  value={fmt.format(metrics.grossProfit)}  sub={`${metrics.marginPct}% of revenue`}                     pct={metrics.marginPct}          accent="sky"     icon={<IC.Profit />} delay="d4" />
            <KpiCard label="Stock Value"   value={fmt.format(metrics.stockValue)}   sub={`${num.format(metrics.stockQty)} units · ${metrics.skus} SKUs`}                              accent="amber"   icon={<IC.Box />} delay="d5" />
          </div>

          {/* ── MAIN 2-COL GRID ── */}
          <div className="grid gap-5 lg:grid-cols-[1fr_350px]">

            {/* LEFT */}
            <div className="space-y-5">

              {/* Cashflow Breakdown */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Overview</p>
                <h2 className="text-xl font-bold text-white mb-6">Cashflow Breakdown</h2>
                <div className="h-[300px] mb-8">
                  <ChartComponent data={chartData} />
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Revenue',       val: fmt.format(metrics.revenue),      pct: metrics.revSharePct,                      bar: 'linear-gradient(90deg,#059669,#34d399)', dot: '#34d399' },
                    { label: 'Expenses',      val: fmt.format(metrics.totalExpense), pct: 100 - metrics.revSharePct,               bar: 'linear-gradient(90deg,#be123c,#fb7185)', dot: '#fb7185' },
                    { label: 'Profit Margin', val: `${metrics.marginPct}%`,          pct: Math.min(100, Math.max(0, metrics.marginPct)), bar: 'linear-gradient(90deg,#0284c7,#38bdf8)', dot: '#38bdf8' },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="flex items-center gap-2 text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: r.dot }} />
                          {r.label}
                        </span>
                        <span className="font-semibold text-slate-200">{r.val}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ background: r.bar, width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Sales</p>
                    <h2 className="font-['Syne'] text-xl font-bold text-white">Recent Transactions</h2>
                  </div>
                  <NavLink to="/transactions" className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: '#38bdf8' }}>
                    View all <IC.Arrow />
                  </NavLink>
                </div>
                {loading ? <Skel /> : transactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-600">No transactions recorded</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 6).map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 rounded-2xl border border-white/[0.03] bg-white/[0.01] p-4 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/10 group">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                          <IC.Tx />
                        </div>
                        <div className="min-w-0 flex-1 font-['DM_Sans']">
                          <p className="text-[15px] font-bold text-slate-100 truncate">{tx.product_name ?? 'Product'}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {num.format(tx.qty)} pcs × {fmt.format(tx.harga_jual)}
                            {tx.mode && <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-slate-500">{tx.mode}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-0.5 font-['DM_Sans']">
                          <p className="text-sm font-bold" style={{ color: '#34d399' }}>{fmt.format(tx.total)}</p>
                          {tx.profit > 0 && <p className="text-[11px]" style={{ color: '#38bdf8' }}>+{fmt.format(tx.profit)}</p>}
                          <p className="text-[10px] text-slate-600">{ago(tx.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Best Selling Products */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-xl p-2 bg-amber-500/10 text-amber-500"><IC.Fire /></div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Popular</p>
                    <h2 className="text-xl font-bold text-white">Best Selling Products</h2>
                  </div>
                </div>
                {loading ? <Skel n={3} h={40} /> : bestSelling.length === 0 ? (
                   <p className="py-4 text-center text-xs text-slate-600 italic">No sales data available</p>
                ) : (
                  <div className="space-y-4">
                    {bestSelling.map((p, i) => {
                      const maxQty = Math.max(...bestSelling.map(x => x.qty), 1)
                      const barPct = Math.round((p.qty / maxQty) * 100)
                      return (
                        <div key={p.name}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-300 font-medium truncate">{i + 1}. {p.name}</span>
                            <span className="text-slate-400">{num.format(p.qty)} units</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Inventory</p>
                    <h2 className="text-xl font-bold text-white">Stock per Product</h2>
                  </div>
                  <NavLink to="/stock" className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: '#fbbf24' }}>
                    Manage <IC.Arrow />
                  </NavLink>
                </div>
                {loading ? <Skel n={5} h={46} /> : stocks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-600">No stock data found</p>
                ) : (
                  <div className="space-y-3">
                    {stocks.slice(0, 7).map(st => {
                      const max = Math.max(...stocks.map(s => s.total), 1)
                      const pct = Math.round((st.total / max) * 100)
                      const low = pct < 20
                      return (
                        <div key={st.id}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-300 font-medium truncate max-w-[65%]">{st.product?.name ?? st.product_id}</span>
                            <span className="font-bold" style={{ color: low ? '#fb7185' : '#fbbf24' }}>
                              {num.format(st.total)} {low && '⚠'}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                              width: `${pct}%`,
                              background: low ? 'linear-gradient(90deg,#be123c,#fb7185)' : 'linear-gradient(90deg,#d97706,#fbbf24)'
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5">

              {/* Net Profit Breakdown card */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-6 backdrop-blur-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Profit Calculation</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl px-5 py-4 bg-sky-500/5 border border-sky-500/10">
                    <span className="text-sm text-slate-400">Gross Profit</span>
                    <span className="text-sm font-bold text-sky-400">+{fmt.format(metrics.grossProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl px-5 py-4 bg-rose-500/5 border border-rose-500/10">
                    <span className="text-sm text-slate-400">Total Expenses</span>
                    <span className="text-sm font-bold text-rose-400">−{fmt.format(metrics.totalExpense)}</span>
                  </div>
                  {/* divider */}
                  <div className="border-t border-white/[0.06] my-1" />
                  <div className="flex items-center justify-between rounded-2xl px-5 py-5 transition-colors duration-500" style={{
                    background: pos ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
                    border: `1px solid ${pos ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)'}`,
                  }}>
                    <span className="text-sm font-bold text-white">Net Profit</span>
                    <span className="text-xl font-bold" style={{ color: pos ? '#34d399' : '#fb7185' }}>
                      {pos ? '+' : ''}{fmt.format(metrics.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Feed */}
              <div className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8 backdrop-blur-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">Activities</p>
                    <h2 className="text-xl font-bold text-white">Live Feed</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    {feed.length}
                  </span>
                </div>
                {loading ? <Skel n={5} /> : feed.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-600">No activities yet</p>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {feed.map(item => {
                      if (item.kind === 'tx') {
                        const t = item.data as Transaction
                        return <FeedRow key={`tx-${t.id}`}
                          ibg="rgba(52,211,153,0.1)" ic="#34d399" icon={<IC.Tx />}
                          title={t.product_name ?? 'Sale'} sub={`${num.format(t.qty)} pcs`}
                          val={fmt.format(t.total)} vc="#34d399"
                          badge="sale" bc="rgba(52,211,153,0.12)" time={ago(t.created_at)} />
                      }
                      if (item.kind === 'exp') {
                        const e = item.data as Expense
                        return <FeedRow key={`exp-${e.id}`}
                          ibg="rgba(251,113,133,0.1)" ic="#fb7185" icon={<IC.Expense />}
                          title={e.description ?? 'Expense'}
                          val={fmt.format(e.total)} vc="#fb7185"
                          badge="expense" bc="rgba(251,113,133,0.12)" time={ago(e.created_at)} />
                      }
                      const sl = item.data as StockLog
                      const isIn = sl.type?.toLowerCase() === 'in'
                      return <FeedRow key={`sl-${sl.id}`}
                        ibg={isIn ? 'rgba(167,139,250,0.1)' : 'rgba(251,191,36,0.1)'}
                        ic={isIn ? '#a78bfa' : '#fbbf24'} icon={<IC.Log />}
                        title={sl.product?.name ?? 'Stock'} sub={`${sl.type ?? 'update'} · ${num.format(sl.qty ?? 0)} units`}
                        badge={sl.type ?? 'log'} bc={isIn ? 'rgba(167,139,250,0.12)' : 'rgba(251,191,36,0.12)'}
                        time={ago(sl.created_at)} />
                    })}
                  </div>
                )}
              </div>

              {/* Quick Nav */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-4 px-1">Quick Menu</p>
                <div className="space-y-2">
                  {([
                    { to: '/transactions', label: 'Transactions', icon: <IC.Tx />,      ic: '#34d399', ibg: 'rgba(52,211,153,0.1)' },
                    { to: '/expenses',     label: 'Expenses',     icon: <IC.Expense />, ic: '#fb7185', ibg: 'rgba(251,113,133,0.1)' },
                    { to: '/stock',        label: 'Stock',        icon: <IC.Box />,     ic: '#fbbf24', ibg: 'rgba(251,191,36,0.1)' },
                    { to: '/stock-logs',   label: 'Stock Logs',   icon: <IC.Log />,     ic: '#a78bfa', ibg: 'rgba(167,139,250,0.1)' },
                  ] as const).map(({ to, label, icon, ic, ibg }) => (
                    <NavLink key={to} to={to} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl transition-all duration-200 hover:bg-slate-800/80 hover:border-white/10 hover:translate-x-1 group">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:rotate-12" style={{ background: ibg, color: ic }}>{icon}</span>
                        {label}
                      </span>
                      <IC.Arrow />
                    </NavLink>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  )
}