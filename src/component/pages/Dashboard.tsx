import { NavLink } from 'react-router-dom'
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '../../lib/supabase'
import ChartComponent from '../components/Chart'
import { IC } from '../components/Icons'
import {
  getTzOffset,
  getLocalDate,
  toDateKey,
  createNumberFormatter,
} from '../../lib/utils'
import { useLanguage } from '../providers/useLanguage'
import { useCurrencyFormatter } from '../providers/useCurrencyFormatter'
import type {
  Transaction,
  Expense,
  Stock,
  StockLog,
  Profile,
  FilterType,
} from '../../types/types'
import Skeleton from '../components/Skeleton'

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useDashboardData(
  filter: FilterType,
  startDate: string,
  endDate: string,
  t: (key: string) => string
) {
  const [data, setData] = useState<{
    transactions: Transaction[]
    expenses: Expense[]
    stocks: Stock[]
    stockLogs: StockLog[]
    profile: Profile | null
  }>({
    transactions: [],
    expenses: [],
    stocks: [],
    stockLogs: [],
    profile: null,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) return

      const tz = getTzOffset()

      let startStr = ''
      let endStr = ''

      if (filter === 'today') {
        startStr = `${getLocalDate()}T00:00:00.000${tz}`
        endStr = `${getLocalDate()}T23:59:59.999${tz}`
      } else if (filter === 'last7') {
        startStr = `${getLocalDate(7)}T00:00:00.000${tz}`
      } else if (filter === 'thisMonth') {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const firstDayStr = firstDayOfMonth.toLocaleDateString('en-CA')

        startStr = `${firstDayStr}T00:00:00.000${tz}`
      } else if (filter === 'last3month') {
        startStr = `${getLocalDate(90)}T00:00:00.000${tz}`
      }  else if (filter === 'specific') {
        if (!startDate) {
          setData({
            transactions: [],
            expenses: [],
            stocks: [],
            stockLogs: [],
            profile: null,
          })
          setLoading(false)
          return
        }

        startStr = `${startDate}T00:00:00.000${tz}`
        endStr = `${startDate}T23:59:59.999${tz}`
      } else if (filter === 'range') {
        if (!startDate || !endDate) {
          setData({
            transactions: [],
            expenses: [],
            stocks: [],
            stockLogs: [],
            profile: null,
          })
          setLoading(false)
          return
        }

        startStr = `${startDate}T00:00:00.000${tz}`
        endStr = `${endDate}T23:59:59.999${tz}`
      }

      let txQ = supabase
        .from('Transactions')
        .select('*')
        .eq('user_id', user.id)

      let exQ = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      if (startStr) {
        txQ = txQ.gte('created_at', startStr)
        exQ = exQ.gte('created_at', startStr)
      }

      if (endStr) {
        txQ = txQ.lte('created_at', endStr)
        exQ = exQ.lte('created_at', endStr)
      }

      const [tx, ex, st, sl, pr] = await Promise.all([
        txQ.order('created_at', { ascending: false }),
        exQ.order('created_at', { ascending: false }),
        supabase
          .from('Stock')
          .select('*, product:Product(*)')
          .eq('user_id', user.id),
        supabase
          .from('Stock_logs')
          .select('*, product:Product(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (tx.error) throw tx.error
      if (ex.error) throw ex.error
      if (st.error) throw st.error
      if (sl.error) throw sl.error

      if (pr.error && pr.error.code !== 'PGRST116') {
        throw pr.error
      }

      setData({
        transactions: tx.data || [],
        expenses: ex.data || [],
        stocks: st.data || [],
        stockLogs: sl.data || [],
        profile: pr.data || null,
      })
    } catch (err) {
      console.error(err)
      setError(t('Failed to fetch dashboard data'))
    } finally {
      setLoading(false)
    }
  }, [filter, startDate, endDate, t])

  useEffect(() => {
    let isMounted = true
    let timeout: ReturnType<typeof setTimeout>
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      await fetchData()

      if (!isMounted) return

      const refreshDashboard = () => {
        clearTimeout(timeout)

        timeout = setTimeout(() => {
          if (isMounted) {
            fetchData()
          }
        }, 400)
      }

      const channelId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      channel = supabase
        .channel(`dashboard-realtime-${user.id}-${channelId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Transactions',
            filter: `user_id=eq.${user.id}`,
          },
          refreshDashboard
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${user.id}`,
          },
          refreshDashboard
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Stock',
            filter: `user_id=eq.${user.id}`,
          },
          refreshDashboard
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Stock_logs',
            filter: `user_id=eq.${user.id}`,
          },
          refreshDashboard
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          refreshDashboard
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      isMounted = false
      clearTimeout(timeout)

      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchData])
  return {
    ...data,
    loading,
    error,
    refetch: fetchData,
  }
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

type Accent = 'emerald' | 'rose' | 'sky' | 'amber'

const AccentMap: Record<
  Accent,
  {
    bg: string
    text: string
    ring: string
    bar: string
    glow: string
  }
> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    ring: 'ring-emerald-500/20',
    bar: 'from-emerald-600 to-emerald-400',
    glow: 'bg-emerald-500',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    ring: 'ring-rose-500/20',
    bar: 'from-rose-600 to-rose-400',
    glow: 'bg-rose-500',
  },
  sky: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-500',
    ring: 'ring-sky-500/20',
    bar: 'from-sky-600 to-sky-400',
    glow: 'bg-sky-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    ring: 'ring-amber-500/20',
    bar: 'from-amber-600 to-amber-400',
    glow: 'bg-amber-500',
  },
}

function KpiCard({
  label,
  value,
  sub,
  pct,
  accent,
  icon,
}: {
  label: string
  value: string
  sub?: string
  pct?: number
  accent: Accent
  icon: ReactNode
}) {
  const a = AccentMap[accent]

  return (
    <div
      className="group 
    relative overflow-hidden rounded-[1.2rem] 
    border border-slate-200 bg-white p-3 shadow-sm
     backdrop-blur-2xl transition-all duration-300
      hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-xl hover:shadow-sky-500/5 
      dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] 
      sm:rounded-[1.5rem] 
      sm:p-4"
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-3xl transition-transform duration-500 group-hover:scale-150 ${a.glow}`}
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className={`rounded-xl p-2 ring-1 ${a.bg} ${a.text} ${a.ring}`}>
            {icon}
          </div>

          {sub && (
            <span className="max-w-[100px] text-right text-[9px] font-bold leading-3 text-slate-400">
              {sub}
            </span>
          )}
        </div>

        <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>

        <p className={`truncate text-base font-black tracking-tight sm:text-lg ${a.text}`}>
          {value}
        </p>


        {pct !== undefined && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${a.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Feed Row ──────────────────────────────────────────────────────────────────

function FeedRow({
  ibg,
  ic,
  icon,
  title,
  sub,
  val,
  vc,
  badge,
  bc,
  time,
  emptyValueText,
}: {
  ibg: string
  ic: string
  icon: ReactNode
  title: string
  sub?: string
  val?: string
  vc?: string
  badge?: string
  bc?: string
  time: string
  emptyValueText?: string
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-200 hover:border-sky-400/30 hover:bg-white hover:shadow-lg hover:shadow-sky-500/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex shrink-0 rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110"
          style={{ background: ibg }}
        >
          <span style={{ color: ic }}>{icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-black leading-snug text-slate-900 dark:text-slate-100">
              {title}
            </span>

            {badge && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                style={{ background: bc, color: ic }}
              >
                {badge}
              </span>
            )}
          </div>

          {sub && (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {sub}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
        {val ? (
          <p className="truncate text-sm font-black" style={{ color: vc }}>
            {val}
          </p>
        ) : (
          <span className="text-xs font-bold text-slate-400">
            {emptyValueText}
          </span>
        )}

        <time className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-slate-400">
          {time}
        </time>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<FilterType>('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const {
    transactions,
    expenses,
    stocks,
    stockLogs,
    profile,
    loading,
    error,
    refetch,
  } = useDashboardData(filter, startDate, endDate, t)

  const fmt = useCurrencyFormatter()
  const num = useMemo(() => createNumberFormatter(), [])

  const metrics = useMemo(() => {
    const revenue = transactions.reduce((sum, transaction) => {
      return sum + (transaction.total ?? 0)
    }, 0)

    const grossProfit = transactions.reduce((sum, transaction) => {
      return sum + (transaction.profit ?? 0)
    }, 0)

    const totalExpense = expenses.reduce((sum, expense) => {
      return sum + (expense.total ?? 0)
    }, 0)

    const netProfit = grossProfit - totalExpense

    const stockQty = stocks.reduce((sum, stock) => {
      return sum + (stock.total ?? 0)
    }, 0)

    const stockValue = stocks.reduce((sum, stock) => {
      const modal = stock.harga_modal ?? stock.product?.harga_modal ?? 0
      return sum + (stock.total ?? 0) * modal
    }, 0)

    const marginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0

    const revSharePct =
      revenue + totalExpense > 0
        ? Math.round((revenue / (revenue + totalExpense)) * 100)
        : 0

    return {
      revenue,
      grossProfit,
      totalExpense,
      netProfit,
      stockQty,
      stockValue,
      marginPct,
      revSharePct,
      skus: stocks.length,
      txCount: transactions.length,
    }
  }, [transactions, expenses, stocks])

  const chartData = useMemo(() => {
    const map = new Map<string, { revenue: number; expense: number }>()

    transactions.forEach((transaction) => {
      const key = toDateKey(transaction.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0 }

      entry.revenue += transaction.total ?? 0
      map.set(key, entry)
    })

    expenses.forEach((expense) => {
      const key = toDateKey(expense.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0 }

      entry.expense += expense.total ?? 0
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
        revenue.push(data.revenue)
        expense.push(data.expense)
        netProfit.push(data.revenue - data.expense)

        current.setDate(current.getDate() + 1)
      }
    }

    return {
      labels,
      revenue,
      expense,
      netProfit,
    }
  }, [transactions, expenses])

  const bestSelling = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number; profit: number }> = {}

    transactions.forEach((transaction) => {
      // KUNCI UTAMA: Trim spasi gaib dan samakan kapitalisasi ke huruf besar semua saat pengelompokan
      const rawName = transaction.product_name || t('Product')
      const cleanKey = rawName.trim().toUpperCase()

      // Buat format tampilan yang rapi (Title Case atau sesuaikan)
      // Misal jika 'SERVICE HP' maka jadikan 'Service HP' agar enak dilihat di UI
      const displayName = cleanKey === 'SERVICE HP' ? 'Service HP' : rawName.trim()

      if (!map[cleanKey]) {
        map[cleanKey] = { name: displayName, qty: 0, total: 0, profit: 0 }
      }

      map[cleanKey].qty += transaction.qty ?? 0
      map[cleanKey].total += transaction.total ?? 0
      map[cleanKey].profit += Number(transaction.profit) || 0 // Tambahkan akumulasi profit di sini
    })

    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [transactions, t])

const bestSellingChartData = useMemo(
    () => {
      // Cari profit tertinggi di antara top 5 produk ini sebagai patokan 100% lebar bar
      const maxProfit = Math.max(...bestSelling.map((product) => product.profit), 0)

      return {
        labels: bestSelling.map((product) => product.name),
        revenue: bestSelling.map((product) => product.total),
        // KUNCI UTAMA: Kirim data akumulasi profit ke komponen visualisasi
        netProfit: bestSelling.map((product) => product.profit), 
        // Simpan nilai maxProfit di objek ini agar bisa dibaca oleh komponen Chart/Bar di bawah
        maxProfit: maxProfit, 
        expense: [],
      }
    },
    [bestSelling]
  )

  const stockChartData = useMemo(() => {
    const topStocks = [...stocks]
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 6)

    return {
      labels: topStocks.map((stock) => stock.product?.name ?? stock.product_id),
      revenue: topStocks.map((stock) => stock.total ?? 0),
      expense: [],
      netProfit: [],
    }
  }, [stocks])

  type FeedEntry = {
    kind: 'tx' | 'exp' | 'log'
    data: Transaction | Expense | StockLog
    ts: string
  }

  const feed = useMemo<FeedEntry[]>(() => {
    return [
      ...transactions.map((data) => ({
        kind: 'tx' as const,
        data,
        ts: data.created_at,
      })),
      ...expenses.map((data) => ({
        kind: 'exp' as const,
        data,
        ts: data.created_at,
      })),
      ...stockLogs.map((data) => ({
        kind: 'log' as const,
        data,
        ts: data.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 12)
  }, [transactions, expenses, stockLogs])

  const pos = metrics.netProfit >= 0
  const firstName = profile?.full_name?.split(' ')[0] ?? t('there')
  const formatActivityTime = useCallback(
    (dateString: string) => {
      const diff = Date.now() - new Date(dateString).getTime()
      const minutes = Math.max(0, Math.floor(diff / 60000))
      if (minutes < 60) return `${minutes}${t('m ago')}`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}${t('h ago')}`
      return `${Math.floor(hours / 24)}${t('d ago')}`
    },
    [t]
  )

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-sky-500/20 dark:bg-slate-950 dark:text-slate-100">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-[8%] top-[-180px] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[5%] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute left-[-160px] top-[40%] h-[360px] w-[360px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-5 lg:px-8">
        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-500">
                {t('Finance Dashboard')}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {loading ? t('Syncing...') : t('Live')}
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {t('Hello')},{' '}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                {firstName}
              </span>{' '}
              👋
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('Track revenue, expenses, profit, stock movement, and business activity in real time.')}
            </p>
          </div>

          <div className="w-full rounded-[1.5rem] border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="grid gap-2 sm:grid-cols-[minmax(140px,180px)_auto] xl:flex xl:items-center xl:justify-end">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as FilterType)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-black text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
              >
                <option value="today">{t('Today')}</option>
                <option value="last7">{t('Last 7 Days')}</option>
                <option value="thisMonth">{t('This Month')}</option>
                <option value="last3month">{t('Last 3 Months')}</option>
                <option value="specific">{t('Pick a Date')}</option>
                <option value="range">{t('Date Range')}</option>
              </select>

              <button
                type="button"
                onClick={refetch}
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-black text-slate-700 transition hover:border-sky-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:bg-white/[0.08] sm:w-auto"
              >
                <span className={loading ? 'animate-spin' : ''}>
                  <IC.Refresh />
                </span>
                <span>{loading ? t('Syncing...') : t('Refresh')}</span>
              </button>
            </div>

            {(filter === 'specific' || filter === 'range') && (
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
                />

                {filter === 'range' && (
                  <>
                    <span className="hidden text-center text-[10px] font-black uppercase tracking-widest text-slate-400 sm:block">
                      {t('to')}
                    </span>

                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:bg-slate-950"
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </header> 

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-500">
            <strong className="font-black">{t('Error')}: </strong>
            {error}
          </div>
        )}

        {/* NET PROFIT HERO */}
        <section
          className={`relative mb-8 overflow-hidden rounded-[2rem] border p-6 shadow-sm backdrop-blur-2xl sm:p-8 lg:p-10 ${pos
            ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
            : 'border-rose-500/20 bg-rose-500/[0.04]'
            }`}
        >
          <div
            className={`absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${pos ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p
                className={`mb-2 text-[11px] font-black uppercase tracking-widest ${pos ? 'text-emerald-500' : 'text-rose-500'
                  }`}
              >
                {pos ? t('Net Profit') : t('Net Loss')}
              </p>
              <p
                className={`break-words text-3xl font-black tracking-tight sm:text-6xl lg:text-7xl ${pos ? 'text-emerald-500' : 'text-rose-500'
                  }`}
              >
                {pos ? '+' : ''}
                {fmt.format(metrics.netProfit)}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t('Gross profit')}{' '}
                <span className="font-black text-slate-800 dark:text-slate-100">
                  {fmt.format(metrics.grossProfit)}
                </span>{' '}
                {t('minus expenses')}{' '}
                <span className="font-black text-slate-800 dark:text-slate-100">
                  {fmt.format(metrics.totalExpense)}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('Margin')}
                </p>
                <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                  {metrics.marginPct}%
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('Transactions')}
                </p>
                <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                  {metrics.txCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={t('Revenue')}
            value={fmt.format(metrics.revenue)}
            sub={`${metrics.txCount} ${t('tx')}`}
            pct={metrics.revSharePct}
            accent="emerald"
            icon={<IC.Revenue />}
          />

          <KpiCard
            label={t('Expenses')}
            value={fmt.format(metrics.totalExpense)}
            sub={`${expenses.length} ${t('entries')}`}
            pct={100 - metrics.revSharePct}
            accent="rose"
            icon={<IC.Expense />}
          />

          <KpiCard
            label={t('Gross Profit')}
            value={fmt.format(metrics.grossProfit)}
            sub={`${metrics.marginPct}% ${t('of rev')}`}
            pct={metrics.marginPct}
            accent="sky"
            icon={<IC.Profit />}
          />

          <KpiCard
            label={t('Stock')}
            value={fmt.format(metrics.stockValue)}
            sub={`${num.format(metrics.stockQty)} ${t('units')}`}
            pct={0}
            accent="amber"
            icon={<IC.Box />}
          />
        </section>

        {/* MAIN GRID */}
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          {/* LEFT */}
          <div className="min-w-0 space-y-5">
            {/* Cashflow Breakdown */}
            <div className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                {t('Overview')}
              </p>

              <h2 className="mb-6 break-words text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                {t('Cashflow Breakdown')}
              </h2>

              <div className="mb-6 h-[220px] min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-slate-950/40 sm:h-[280px] sm:p-4 lg:h-[320px]">
                <ChartComponent data={chartData} />
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: t('Revenue'),
                    val: fmt.format(metrics.revenue),
                    pct: metrics.revSharePct,
                    bar: 'linear-gradient(90deg,#059669,#34d399)',
                    dot: '#34d399',
                  },
                  {
                    label: t('Expenses'),
                    val: fmt.format(metrics.totalExpense),
                    pct: 100 - metrics.revSharePct,
                    bar: 'linear-gradient(90deg,#be123c,#fb7185)',
                    dot: '#fb7185',
                  },
                  {
                    label: t('Profit Margin'),
                    val: `${metrics.marginPct}%`,
                    pct: Math.min(100, Math.max(0, metrics.marginPct)),
                    bar: 'linear-gradient(90deg,#0284c7,#38bdf8)',
                    dot: '#38bdf8',
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3 text-xs">
                      <span className="flex min-w-0 items-center gap-2 font-bold text-slate-500 dark:text-slate-400">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: row.dot }}
                        />
                        <span className="min-w-0 truncate">{row.label}</span>
                      </span>

                      <span className="shrink-0 whitespace-nowrap font-black text-slate-700 dark:text-slate-200">
                        {row.val}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          background: row.bar,
                          width: `${row.pct}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid min-w-0 gap-5 md:grid-cols-2">
              <NavLink
                to="/transactions"
                className="group min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-slate-50 hover:shadow-xl hover:shadow-emerald-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] sm:p-8"
              >
                <div className="mb-6 flex min-w-0 items-start justify-between gap-4 sm:items-center">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-emerald-500">
                      {t('Sales')}
                    </p>
                    <h2 className="break-words text-lg font-black text-slate-950 transition-colors group-hover:text-emerald-500 dark:text-white sm:text-xl">
                      {t('Daily Sales Volume')}
                    </h2>
                  </div>

                  <span className="shrink-0"><IC.Arrow /></span>
                </div>

                <div className="h-[170px] min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-slate-950/40 sm:h-[200px] sm:p-3">
                  <ChartComponent data={chartData} variant="bar" />
                </div>
              </NavLink>

              <NavLink
                to="/reports"
                className="group min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-slate-50 hover:shadow-xl hover:shadow-amber-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] sm:p-8"
              >
                <div className="mb-6 flex min-w-0 items-start justify-between gap-4 sm:items-center">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-amber-500">
                      {t('Performance')}
                    </p>
                    <h2 className="break-words text-lg font-black text-slate-950 transition-colors group-hover:text-amber-500 dark:text-white sm:text-xl">
                      {t('Best Sellers Revenue')}
                    </h2>
                  </div>

                  <span className="shrink-0"><IC.Arrow /></span>
                </div>

                <div className="h-[180px] min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-slate-950/40 sm:h-[200px] sm:p-3">
                  <ChartComponent data={bestSellingChartData} variant="bar" />
                </div>
              </NavLink>

              <NavLink
                to="/inventory"
                className="group min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-slate-50 hover:shadow-xl hover:shadow-sky-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] sm:p-8 md:col-span-2"
              >
                <div className="mb-6 flex min-w-0 items-start justify-between gap-4 sm:items-center">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-sky-500">
                      {t('Inventory')}
                    </p>
                    <h2 className="break-words text-lg font-black text-slate-950 transition-colors group-hover:text-sky-500 dark:text-white sm:text-xl">
                      {t('Live Stock Distribution')}
                    </h2>
                  </div>

                  <span className="shrink-0"><IC.Arrow /></span>
                </div>

                <div className="h-[180px] min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-slate-950/40 sm:h-[220px] sm:p-3">
                  <ChartComponent data={stockChartData} variant="bar" />
                </div>
              </NavLink>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="min-w-0 space-y-5">
            {/* Net Profit Breakdown */}
            <div className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                {t('Profit Calculation')}
              </p>

              <h2 className="mb-5 break-words text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                {t('Net Profit Breakdown')}
              </h2>

              <div className="space-y-3">
                <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-sky-500/10 bg-sky-500/5 px-4 py-4 sm:px-5">
                  <span className="min-w-0 break-words text-sm font-bold text-slate-500 dark:text-slate-400">
                    {t('Gross Profit')}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-black text-sky-500">
                    +{fmt.format(metrics.grossProfit)}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 px-4 py-4 sm:px-5">
                  <span className="min-w-0 break-words text-sm font-bold text-slate-500 dark:text-slate-400">
                    {t('Total Expenses')}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm font-black text-rose-500">
                    −{fmt.format(metrics.totalExpense)}
                  </span>
                </div>

                <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />

                <div
                  className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-4 py-5 sm:px-5 ${pos
                    ? 'border-emerald-500/15 bg-emerald-500/10'
                    : 'border-rose-500/15 bg-rose-500/10'
                    }`}
                >
                  <span className="min-w-0 break-words text-sm font-black text-slate-800 dark:text-white">
                    {t('Net Profit')}
                  </span>

                  <span
                    className={`shrink-0 whitespace-nowrap text-lg font-black sm:text-xl ${pos ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                  >
                    {pos ? '+' : ''}
                    {fmt.format(metrics.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Feed */}
            <div className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
              <div className="mb-5 flex min-w-0 items-start justify-between gap-4 sm:items-center">
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {t('Activities')}
                  </p>

                  <h2 className="break-words text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                    {t('Live Feed')}
                  </h2>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-500">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  {feed.length}
                </span>
              </div>

              {loading ? (
                <Skeleton n={5} />
              ) : feed.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 py-8 text-center text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
                  {t('No activities yet')}
                </p>
              ) : (
                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden xl:max-h-[420px]">
                  {feed.map((item) => {
                    if (item.kind === 'tx') {
                      const transaction = item.data as Transaction

                      return (
                        <FeedRow
                          key={`tx-${transaction.id}`}
                          ibg="rgba(52,211,153,0.1)"
                          ic="#34d399"
                          icon={<IC.Tx />}
                          title={transaction.product_name ?? t('Sale')}
                          sub={`${num.format(transaction.qty ?? 0)} ${t('pcs')}`}
                          val={fmt.format(transaction.total ?? 0)}
                          vc="#34d399"
                          badge="sale"
                          bc="rgba(52,211,153,0.12)"
                          time={formatActivityTime(transaction.created_at)}
                        />
                      )
                    }

                    if (item.kind === 'exp') {
                      const expense = item.data as Expense

                      return (
                        <FeedRow
                          key={`exp-${expense.id}`}
                          ibg="rgba(251,113,133,0.1)"
                          ic="#fb7185"
                          icon={<IC.Expense />}
                          title={expense.description ?? t('Expense')}
                          val={fmt.format(expense.total ?? 0)}
                          vc="#fb7185"
                          badge="expense"
                          bc="rgba(251,113,133,0.12)"
                          time={formatActivityTime(expense.created_at)}
                        />
                      )
                    }

                    const stockLog = item.data as StockLog
                    const isIn = stockLog.type?.toLowerCase() === 'in'

                    return (
                      <FeedRow
                        key={`sl-${stockLog.id}`}
                        ibg={
                          isIn
                            ? 'rgba(167,139,250,0.1)'
                            : 'rgba(251,191,36,0.1)'
                        }
                        ic={isIn ? '#a78bfa' : '#fbbf24'}
                        icon={<IC.Log />}
                        title={stockLog.product?.name ?? t('Stock')}
                        sub={`${t(stockLog.type ?? 'update')} · ${num.format(
                          stockLog.qty ?? 0
                        )} ${t('units')}`}
                        badge={t(stockLog.type ?? 'log')}
                        bc={
                          isIn
                            ? 'rgba(167,139,250,0.12)'
                            : 'rgba(251,191,36,0.12)'
                        }
                        time={formatActivityTime(stockLog.created_at)}
                        emptyValueText={t('Stock activity')}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Menu */}
            <div className="min-w-0">
              <p className="mb-4 px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                {t('Quick Menu')}
              </p>

              <div className="space-y-2">
                {[
                  {
                    to: '/transactions',
                    label: t('Transactions'),
                    icon: <IC.Tx />,
                    ic: '#34d399',
                    ibg: 'rgba(52,211,153,0.1)',
                  },
                  {
                    to: '/expenses',
                    label: t('Expenses'),
                    icon: <IC.Expense />,
                    ic: '#fb7185',
                    ibg: 'rgba(251,113,133,0.1)',
                  },
                  {
                    to: '/inventory',
                    label: t('Stock'),
                    icon: <IC.Box />,
                    ic: '#fbbf24',
                    ibg: 'rgba(251,191,36,0.1)',
                  },
                  {
                    to: '/reports',
                    label: t('Reports'),
                    icon: <IC.Report />,
                    ic: '#a78bfa',
                    ibg: 'rgba(167,139,250,0.1)',
                  },
                ].map(({ to, label, icon, ic, ibg }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-bold text-slate-700 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-slate-50 hover:shadow-lg hover:shadow-sky-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:rotate-12"
                        style={{ background: ibg, color: ic }}
                      >
                        {icon}
                      </span>

                      <span className="min-w-0 truncate">{label}</span>
                    </span>

                    <span className="shrink-0"><IC.Arrow /></span>
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
