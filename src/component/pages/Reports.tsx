import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { createCurrencyFormatter, createNumberFormatter, getTzOffset } from '../../lib/utils'
import ChartComponent from '../components/Chart'
import { Pagination } from '../components/Pagination'
import type { Expense, FilterType, Product, Stock, Transaction } from '../../types/types'
import { IC } from '../components/Icons'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const formatLocalDate = (date: Date) => date.toLocaleDateString('en-CA')
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}
const addDays = (date: Date, amount: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}
const getDaysBetween = (start: string, end: string) => {
  const startDate = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY))
}
const safeNumber = (value: number | null | undefined) => Number(value ?? 0)
const getLocalKey = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-CA')
}
const ensureRange = (start: string, end: string) => {
  if (parseLocalDate(start) <= parseLocalDate(end)) {
    return { start, end }
  }
  return { start: end, end: start }
}

const getPresetRange = (type: FilterType) => {
  const today = new Date()
  const todayKey = formatLocalDate(today)

  switch (type) {
    case 'today':
      return { start: todayKey, end: todayKey }
    case 'last7':
      return { start: formatLocalDate(addDays(today, -6)), end: todayKey }
    case 'thisMonth':
      return { start: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: todayKey }
    case 'last3month':
      return { start: formatLocalDate(addDays(today, -89)), end: todayKey }
    default:
      return { start: formatLocalDate(addDays(today, -6)), end: todayKey }
  }
}

const getSelectedRange = (type: FilterType, start: string, end: string) => {
  if (type === 'specific') {
    const selected = start || formatLocalDate(new Date())
    return { start: selected, end: selected }
  }

  if (type === 'range') {
    const initialStart = start || formatLocalDate(addDays(new Date(), -6))
    const initialEnd = end || formatLocalDate(new Date())
    return ensureRange(initialStart, initialEnd)
  }

  return getPresetRange(type)
}

const getPreviousRange = (type: FilterType, current: { start: string; end: string }) => {
  const currentStart = parseLocalDate(current.start)

  if (type === 'thisMonth') {
    const previousMonthStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
    const previousMonthEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0)
    return {
      start: formatLocalDate(previousMonthStart),
      end: formatLocalDate(previousMonthEnd),
    }
  }

  const delta = getDaysBetween(current.start, current.end)
  const previousEnd = addDays(currentStart, -1)
  const previousStart = addDays(previousEnd, -delta)

  return {
    start: formatLocalDate(previousStart),
    end: formatLocalDate(previousEnd),
  }
}

const getGrowth = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}%`

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  const [filterType, setFilterType] = useState<FilterType>('today')
  const [startDate, setStartDate] = useState(() => getPresetRange('today').start)
  const [endDate, setEndDate] = useState(() => getPresetRange('today').end)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [txPage, setTxPage] = useState(1)
  const [stockPage, setStockPage] = useState(1)
  const itemsPerPage = 5
  const [pagedTransactions, setPagedTransactions] = useState<Transaction[]>([])
  const [pagedStocks, setPagedStocks] = useState<Stock[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [stockTotal, setStockTotal] = useState(0)
  const [lowStockPage, setLowStockPage] = useState(1)

  const realtimeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentRange = useMemo(
    () => getSelectedRange(filterType, startDate, endDate),
    [filterType, startDate, endDate]
  )

  const previousRange = useMemo(
    () => getPreviousRange(filterType, currentRange),
    [filterType, currentRange]
  )

  const currentMonthRange = useMemo(() => getPresetRange('thisMonth'), [])
  const previousMonthComparisonRange = useMemo(
    () => getPreviousRange('thisMonth', currentMonthRange),
    [currentMonthRange]
  )

  const dateRangeLabel = useMemo(() => {
    if (currentRange.start === currentRange.end) {
      return new Date(currentRange.start).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    return `${new Date(currentRange.start).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })} - ${new Date(currentRange.end).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }, [currentRange])

  const filterTypeLabel = useMemo(() => {
    switch (filterType) {
      case 'today':
        return 'Today'
      case 'last7':
        return 'Last 7 days'
      case 'thisMonth':
        return 'This month'
      case 'last3month':
        return 'Last 3 months'
      case 'specific':
        return 'Pick a date'
      case 'range':
        return 'Custom range'
      default:
        return 'Date range'
    }
  }, [filterType])


  // Fetch paginated table data separately to reduce initial render payload
  const fetchPaged = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const userId = user.id
      const txOffset = (txPage - 1) * itemsPerPage
      const stockOffset = (stockPage - 1) * itemsPerPage
      const tz = getTzOffset()
      const startIso = `${currentRange.start}T00:00:00.000${tz}`
      const endIso = `${currentRange.end}T23:59:59.999${tz}`

      const [{ data: txData, error: txError, count: txCount }, { data: stockData, error: stockError, count: stockCount }] = await Promise.all([
        supabase
          .from('Transactions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false })
          .range(txOffset, txOffset + itemsPerPage - 1),
        supabase
          .from('Stock')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('product_id', { ascending: true })
          .range(stockOffset, stockOffset + itemsPerPage - 1),
      ])

      if (!txError) setPagedTransactions(txData ?? [])
      if (typeof txCount === 'number') setTxTotal(txCount)
      if (!stockError) setPagedStocks(stockData ?? [])
      if (typeof stockCount === 'number') setStockTotal(stockCount)
    } catch {
      // ignore paged errors silently; main fetchReports handles global errors
    }
  }, [currentRange, stockPage, txPage])

  const handleDateChange = useCallback(
    (field: 'start' | 'end', value: string) => {
      if (field === 'start') {
        setStartDate(value)
        if (filterType === 'specific') {
          setEndDate(value)
        }
      } else {
        setEndDate(value)
      }
    },
    [filterType]
  )

  const fmt = useMemo(() => createCurrencyFormatter(), [])
  const num = useMemo(() => createNumberFormatter(), [])

  const productDetails = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )

  const getProductName = useCallback(
    (transaction: Transaction) =>
      (transaction.product_id ? productDetails.get(transaction.product_id)?.name : null) ?? transaction.product_name ?? 'Manual Sale',
    [productDetails]
  )

  const filterByRange = useCallback(
    <T extends { created_at: string }>(records: T[], range: { start: string; end: string }) =>
      records.filter((record) => {
        const key = getLocalKey(record.created_at)

        return key >= range.start && key <= range.end
      }),
    []
  )

  const filteredTransactions = useMemo(
    () => filterByRange(transactions, currentRange),
    [filterByRange, transactions, currentRange]
  )

  const filteredExpenses = useMemo(
    () => filterByRange(expenses, currentRange),
    [filterByRange, expenses, currentRange]
  )

  const previousTransactions = useMemo(
    () => filterByRange(transactions, previousRange),
    [filterByRange, previousRange, transactions]
  )

  const previousExpenses = useMemo(
    () => filterByRange(expenses, previousRange),
    [filterByRange, previousRange, expenses]
  )

  const currentMonthTransactions = useMemo(
    () => filterByRange(transactions, currentMonthRange),
    [filterByRange, transactions, currentMonthRange]
  )

  const currentMonthExpenses = useMemo(
    () => filterByRange(expenses, currentMonthRange),
    [filterByRange, expenses, currentMonthRange]
  )

  const previousMonthTransactions = useMemo(
    () => filterByRange(transactions, previousMonthComparisonRange),
    [filterByRange, transactions, previousMonthComparisonRange]
  )

  const previousMonthExpenses = useMemo(
    () => filterByRange(expenses, previousMonthComparisonRange),
    [filterByRange, expenses, previousMonthComparisonRange]
  )

  const aggregateFinancials = useCallback(
    (transactionsList: Transaction[], expensesList: Expense[]) => {
      const revenue = transactionsList.reduce((sum, item) => sum + safeNumber(item.total), 0)
      const grossProfit = transactionsList.reduce((sum, item) => {
        const profit = item.profit != null ? item.profit : safeNumber(item.total) - safeNumber(item.harga_modal) * safeNumber(item.qty)
        return sum + profit
      }, 0)
      const expenseTotal = expensesList.reduce((sum, item) => sum + safeNumber(item.total), 0)
      return {
        revenue,
        grossProfit,
        expenses: expenseTotal,
        transactionsCount: transactionsList.length,
      }
    },
    []
  )

  const currentTotals = useMemo(
    () => aggregateFinancials(filteredTransactions, filteredExpenses),
    [aggregateFinancials, filteredTransactions, filteredExpenses]
  )

  const previousTotals = useMemo(
    () => aggregateFinancials(previousTransactions, previousExpenses),
    [aggregateFinancials, previousTransactions, previousExpenses]
  )

  const revenueGrowth = useMemo(
    () => getGrowth(currentTotals.revenue, previousTotals.revenue),
    [currentTotals.revenue, previousTotals.revenue]
  )
  const profitGrowth = useMemo(
    () => getGrowth(currentTotals.grossProfit, previousTotals.grossProfit),
    [currentTotals.grossProfit, previousTotals.grossProfit]
  )
  const expenseGrowth = useMemo(
    () => getGrowth(currentTotals.expenses, previousTotals.expenses),
    [currentTotals.expenses, previousTotals.expenses]
  )
  const transactionGrowth = useMemo(
    () => getGrowth(currentTotals.transactionsCount, previousTotals.transactionsCount),
    [currentTotals.transactionsCount, previousTotals.transactionsCount]
  )

  const currentMonthTotals = useMemo(
    () => aggregateFinancials(currentMonthTransactions, currentMonthExpenses),
    [aggregateFinancials, currentMonthTransactions, currentMonthExpenses]
  )

  const previousMonthTotals = useMemo(
    () => aggregateFinancials(previousMonthTransactions, previousMonthExpenses),
    [aggregateFinancials, previousMonthTransactions, previousMonthExpenses]
  )

  const monthlyRevenueGrowth = useMemo(
    () => getGrowth(currentMonthTotals.revenue, previousMonthTotals.revenue),
    [currentMonthTotals.revenue, previousMonthTotals.revenue]
  )

  const monthlyProfitGrowth = useMemo(
    () => getGrowth(currentMonthTotals.grossProfit - currentMonthTotals.expenses, previousMonthTotals.grossProfit - previousMonthTotals.expenses),
    [currentMonthTotals, previousMonthTotals]
  )

  const monthlyExpenseGrowth = useMemo(
    () => getGrowth(currentMonthTotals.expenses, previousMonthTotals.expenses),
    [currentMonthTotals.expenses, previousMonthTotals.expenses]
  )

  const daysInRange = useMemo(() => getDaysBetween(currentRange.start, currentRange.end) + 1, [currentRange])

  const summaryCards = useMemo(
    () => [
      {
        title: 'Revenue',
        value: fmt.format(currentTotals.revenue),
        helpText: 'Sum of all filtered transaction totals.',
        badgeClass: 'inline-flex rounded-3xl bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700',
      },
      {
        title: 'Gross profit',
        value: fmt.format(currentTotals.grossProfit),
        helpText: 'Aggregate of transaction profit values.',
        badgeClass: 'inline-flex rounded-3xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700',
      },
      {
        title: 'Expenses',
        value: fmt.format(currentTotals.expenses),
        helpText: 'Total expense amount in the selected window.',
        badgeClass: 'inline-flex rounded-3xl bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700',
      },
      {
        title: 'Net profit',
        value: fmt.format(currentTotals.grossProfit - currentTotals.expenses),
        helpText: 'Gross profit minus total expenses.',
        badgeClass: 'inline-flex rounded-3xl bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700',
      },
    ],
    [currentTotals, fmt]
  )

  const growthCards = useMemo(
    () => [
      {
        title: 'Revenue Growth',
        displayValue: fmt.format(currentTotals.revenue),
        growthLabel: formatPercentage(revenueGrowth),
        growthClass: revenueGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: 'Current period compared to the previous period.',
      },
      {
        title: 'Profit Growth',
        displayValue: fmt.format(currentTotals.grossProfit),
        growthLabel: formatPercentage(profitGrowth),
        growthClass: profitGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: 'Higher profit is positive for business health.',
      },
      {
        title: 'Expense Growth',
        displayValue: fmt.format(currentTotals.expenses),
        growthLabel: formatPercentage(expenseGrowth),
        growthClass:
          expenseGrowth <= 0
            ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700'
            : 'rounded-3xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700',
        helpText: 'Lower expense growth is generally healthier.',
      },
      {
        title: 'Transaction Growth',
        displayValue: num.format(currentTotals.transactionsCount),
        growthLabel: formatPercentage(transactionGrowth),
        growthClass: transactionGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: 'Volume change in transaction count.',
      },
    ],
    [currentTotals, expenseGrowth, fmt, num, profitGrowth, revenueGrowth, transactionGrowth]
  )

  const averageCards = useMemo(
    () => [
      {
        title: 'Average Order',
        value: currentTotals.transactionsCount ? fmt.format(currentTotals.revenue / currentTotals.transactionsCount) : fmt.format(0),
        subtitle: 'Average revenue per transaction.',
      },
      {
        title: 'Average Expense',
        value: filteredExpenses.length ? fmt.format(currentTotals.expenses / filteredExpenses.length) : fmt.format(0),
        subtitle: 'Average cost per expense entry.',
      },
      {
        title: 'Average Profit',
        value: currentTotals.transactionsCount ? fmt.format(currentTotals.grossProfit / currentTotals.transactionsCount) : fmt.format(0),
        subtitle: 'Average gross profit per sale.',
      },
      {
        title: 'Daily Profit Avg',
        value: daysInRange ? fmt.format((currentTotals.grossProfit - currentTotals.expenses) / daysInRange) : fmt.format(0),
        subtitle: 'Average profit per day in range.',
      },
      {
        title: 'Avg Trx / Daily',
        value: daysInRange
          ? `${(currentTotals.transactionsCount / daysInRange).toFixed(1)} trx`
          : '0 trx',
        subtitle: 'Average transaction count per day.',
      },
    ],
    [currentTotals, daysInRange, fmt, filteredExpenses]
  )

  const trendChartData = useMemo(() => {
    const map = new Map<string, { revenue: number; expense: number; grossProfit: number }>()

    filteredTransactions.forEach((transaction) => {
      const key = getLocalKey(transaction.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0, grossProfit: 0 }
      entry.revenue += safeNumber(transaction.total)
      const margin = transaction.profit != null ? transaction.profit : safeNumber(transaction.total) - safeNumber(transaction.harga_modal) * safeNumber(transaction.qty)
      entry.grossProfit += margin
      map.set(key, entry)
    })

    filteredExpenses.forEach((expense) => {
      const key = getLocalKey(expense.created_at)
      const entry = map.get(key) ?? { revenue: 0, expense: 0, grossProfit: 0 }
      entry.expense += safeNumber(expense.total)
      map.set(key, entry)
    })

    const labels: string[] = []
    const revenue: number[] = []
    const expense: number[] = []
    const netProfit: number[] = []

    let cursor = parseLocalDate(currentRange.start)
    const end = parseLocalDate(currentRange.end)

    while (cursor <= end) {
      const key = formatLocalDate(cursor)
      const entry = map.get(key) ?? { revenue: 0, expense: 0, grossProfit: 0 }
      labels.push(key)
      revenue.push(entry.revenue)
      expense.push(entry.expense)
      netProfit.push(entry.grossProfit - entry.expense)
      cursor = addDays(cursor, 1)
    }

    return { labels, revenue, expense, netProfit }
  }, [filteredTransactions, filteredExpenses, currentRange])

  const monthlyComparisonChartData = useMemo(() => {
    const previousNetProfit = previousMonthTotals.grossProfit - previousMonthTotals.expenses
    const currentNetProfit = currentMonthTotals.grossProfit - currentMonthTotals.expenses
    return {
      labels: ['Last month', 'This month'],
      revenue: [previousMonthTotals.revenue, currentMonthTotals.revenue],
      expense: [previousMonthTotals.expenses, currentMonthTotals.expenses],
      netProfit: [previousNetProfit, currentNetProfit],
    }
  }, [currentMonthTotals, previousMonthTotals])

  const comparisonChartData = useMemo(() => {
    const buckets: { label: string; value: number }[] = []

    if (filterType === 'today') {
      // Hourly buckets for the selected day
      for (let h = 0; h < 24; h++) {
        const value = filteredTransactions.reduce((sum, tx) => {
          const d = new Date(tx.created_at)
          const txKey = formatLocalDate(d)
          if (txKey !== currentRange.start) return sum
          return d.getHours() === h ? sum + safeNumber(tx.total) : sum
        }, 0)
        buckets.push({ label: `${String(h).padStart(2, '0')}:00`, value })
      }
    } else {
      const rangeDays = getDaysBetween(currentRange.start, currentRange.end)
      const shortRange = rangeDays <= 45

      if (shortRange) {
        let cursor = parseLocalDate(currentRange.start)
        const end = parseLocalDate(currentRange.end)

        while (cursor <= end) {
          const bucketEnd = addDays(cursor, 6)
          const lastDay = bucketEnd <= end ? bucketEnd : end
          const label = `${cursor.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
          const bucketStartKey = formatLocalDate(cursor)
          const bucketEndKey = formatLocalDate(lastDay)
          const value = filteredTransactions.reduce((sum, tx) => {
            const targetKey = getLocalKey(tx.created_at)
            return targetKey >= bucketStartKey && targetKey <= bucketEndKey ? sum + safeNumber(tx.total) : sum
          }, 0)
          buckets.push({ label, value })
          cursor = addDays(lastDay, 1)
        }
      } else {
        const monthMap = new Map<string, number>()
        filteredTransactions.forEach((tx) => {
          const date = new Date(tx.created_at)
          const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
          monthMap.set(label, (monthMap.get(label) ?? 0) + safeNumber(tx.total))
        })
        Array.from(monthMap.entries()).forEach(([label, value]) => buckets.push({ label, value }))
      }
    }

    return {
      labels: buckets.map((bucket) => bucket.label),
      revenue: buckets.map((bucket) => bucket.value),
      expense: [],
      netProfit: [],
    }
  }, [currentRange, filteredTransactions, filterType])

  const productPerformance = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>()

    filteredTransactions.forEach((transaction) => {
      const name = getProductName(transaction)
      const entry = map.get(name) ?? { name, qty: 0, revenue: 0, profit: 0 }
      entry.qty += safeNumber(transaction.qty)
      entry.revenue += safeNumber(transaction.total)
      const margin = transaction.profit != null ? transaction.profit : safeNumber(transaction.total) - safeNumber(transaction.harga_modal) * safeNumber(transaction.qty)
      entry.profit += margin
      map.set(name, entry)
    })

    return Array.from(map.values())
  }, [filteredTransactions, getProductName])

  const bestByQty = useMemo(
    () => productPerformance.slice().sort((a, b) => b.qty - a.qty).slice(0, 5),
    [productPerformance]
  )

  const bestByRevenue = useMemo(
    () => productPerformance.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [productPerformance]
  )

  const mostProfitable = useMemo(
    () => productPerformance.slice().sort((a, b) => b.profit - a.profit).slice(0, 5),
    [productPerformance]
  )

  const maxQtyByQty = useMemo(() => Math.max(1, ...bestByQty.map((item) => item.qty)), [bestByQty])
  const maxRevenue = useMemo(() => Math.max(1, ...bestByRevenue.map((item) => item.revenue)), [bestByRevenue])
  const maxProfit = useMemo(() => Math.max(1, ...mostProfitable.map((item) => item.profit)), [mostProfitable])

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    filteredExpenses.forEach((expense) => {
      const label = expense.description?.trim() || 'Expense'
      map.set(label, (map.get(label) ?? 0) + safeNumber(expense.total))
    })
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredExpenses])

  const maxExpenseCategory = useMemo(() => Math.max(1, ...expenseBreakdown.map((item) => item.total)), [expenseBreakdown])

  const biggestExpense = useMemo(
    () =>
      filteredExpenses.reduce<Expense | null>((top, expense) => {
        if (!top || safeNumber(expense.total) > safeNumber(top.total)) return expense
        return top
      }, null),
    [filteredExpenses]
  )

  const stockSummary = useMemo(() => {
    const items = stocks.map((stock) => {
      const product = productDetails.get(stock.product_id)
      const qty = safeNumber(stock.total)
      const modal = safeNumber(stock.harga_modal ?? product?.harga_modal)
      const jual = safeNumber(stock.harga_jual ?? product?.harga_jual)
      return {
        name: product?.name ?? stock.product_id,
        qty,
        modal,
        jual,
        value: qty * modal,
        potentialRevenue: qty * jual,
        potentialProfit: qty * jual - qty * modal,
      }
    })

    return {
      value: items.reduce((sum, item) => sum + item.value, 0),
      potentialRevenue: items.reduce((sum, item) => sum + item.potentialRevenue, 0),
      potentialProfit: items.reduce((sum, item) => sum + item.potentialProfit, 0),
      lowStock: items.filter((item) => item.qty <= 5).sort((a, b) => a.qty - b.qty),
    }
  }, [stocks, productDetails])

  const pagedLowStock = useMemo(() => {
    const start = (lowStockPage - 1) * itemsPerPage
    return stockSummary.lowStock.slice(start, start + itemsPerPage)
  }, [stockSummary.lowStock, lowStockPage, itemsPerPage])

  // server-side pagination used for table data: `pagedTransactions` and `pagedStocks`

  const comparisonTitle = useMemo(() => {
    if (filterType === 'today') return 'Hour over Hour momentum'
    if (filterType === 'last7') return daysInRange <= 1 ? 'Day over Day momentum' : 'Week over Week momentum'
    if (filterType === 'thisMonth' || filterType === 'last3month') return 'Month over Month momentum'
    return daysInRange <= 45 ? 'Week over Week momentum' : 'Month over Month momentum'
  }, [filterType, daysInRange])

  const monthComparisonSubtitle =
    `This month vs last month · ${currentMonthRange.start} - ${currentMonthRange.end}`

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) {
        setError('User not authenticated.')
        return
      }

      const userId = user.id

      const tz = getTzOffset()

      const reportStart = [
        currentRange.start,
        previousRange.start,
        currentMonthRange.start,
        previousMonthComparisonRange.start,
      ].sort()[0]

      const reportEnd =
        [
          currentRange.end,
          previousRange.end,
          currentMonthRange.end,
          previousMonthComparisonRange.end,
        ].sort().at(-1) ?? currentRange.end

      const startIso = `${reportStart}T00:00:00.000${tz}`
      const endIso = `${reportEnd}T23:59:59.999${tz}`

      const [
        { data: transactionData, error: transactionError },
        { data: expenseData, error: expenseError },
        { data: stockData, error: stockError },
        { data: productData, error: productError },
      ] = await Promise.all([
        supabase
          .from('Transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false }),
        supabase
          .from('Stock')
          .select('*')
          .eq('user_id', userId)
          .order('product_id', { ascending: true }),
        supabase
          .from('Product')
          .select('id, name, harga_modal, harga_jual')
          .eq('user_id', userId)
          .order('id', { ascending: true }),
      ])

      if (transactionError || expenseError || stockError) {
        setError(
          'Unable to load report data: ' +
          [transactionError?.message, expenseError?.message, stockError?.message]
            .filter(Boolean)
            .join(' | ')
        )
      } else {
        setTransactions(transactionData ?? [])
        setExpenses(expenseData ?? [])
        setStocks(stockData ?? [])
      }

      if (!productError) {
        setProducts(productData ?? [])
      }
    } catch {
      setError('Unable to load report data.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentRange, previousRange, currentMonthRange, previousMonthComparisonRange])

  const createChannel = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return null
    // create a unique channel name per session to avoid colliding subscriptions
    const uniqueId = Math.random().toString(36).slice(2, 9)
    const channel = supabase.channel(`reports-realtime-${user.id}-${uniqueId}`)
    const tables = ['Transactions', 'expenses', 'Stock', 'Product']


    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (realtimeTimerRef.current) {
            clearTimeout(realtimeTimerRef.current)
          }

          realtimeTimerRef.current = setTimeout(() => {
            fetchReports()
            fetchPaged()
          }, 1000)
        }
      )
    })

    await channel.subscribe()
    setRealtimeConnected(true)
    return channel
  }, [fetchReports, fetchPaged])

  useEffect(() => {
    let activeChannel: ReturnType<typeof supabase.channel> | null = null

    fetchReports()

    createChannel().then((channel) => {
      activeChannel = channel
    })

    return () => {
      if (realtimeTimerRef.current) {
        clearTimeout(realtimeTimerRef.current)
      }

      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }

      setRealtimeConnected(false)
    }
  }, [createChannel, fetchReports])

  useEffect(() => {
    // load the paged table data when range or page changes
    fetchPaged()
  }, [fetchPaged])

  const refreshReports = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchReports(), fetchPaged()])
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchReports, fetchPaged])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950/80 p-8 shadow-xl dark:shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300/80">Reports</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">Financial intelligence and inventory performance</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Monitor revenue, expenses, profitability, product performance, and growth with a polished executive view.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-sm transition-colors dark:border-white/10 dark:bg-slate-950/80">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 p-6 dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/20">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300">
                    Report Control
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Filter & sync report data
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Date filtering applies to transactions, expenses, charts, product performance, growth, and averages.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
                    Live Sync
                  </span>

                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                    {realtimeConnected ? 'Connected' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Date preset
                    </span>

                    <select
                      value={filterType}
                      onChange={(e) => {
                        const type = e.target.value as FilterType

                        setFilterType(type)
                        setTxPage(1)
                        setStockPage(1)
                        setLowStockPage(1)

                        if (type === 'specific') {
                          const todayKey = formatLocalDate(new Date())
                          setStartDate(todayKey)
                          setEndDate(todayKey)
                          return
                        }

                        if (type === 'range') {
                          const range = getPresetRange('last7')
                          setStartDate(range.start)
                          setEndDate(range.end)
                          return
                        }

                        const range = getPresetRange(type)
                        setStartDate(range.start)
                        setEndDate(range.end)
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
                    >
                      <option value="today">Today</option>
                      <option value="last7">Last 7 days</option>
                      <option value="thisMonth">This month</option>
                      <option value="last3month">Last 3 months</option>
                      <option value="specific">Pick a date</option>
                      <option value="range">Date range</option>
                    </select>
                  </label>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      Selected period
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {dateRangeLabel}
                      </p>

                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                        {filterTypeLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {(filterType === 'specific' || filterType === 'range') && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                        Start date
                      </span>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => handleDateChange('start', event.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
                      />
                    </label>

                    {filterType === 'range' && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                          End date
                        </span>

                        <input
                          type="date"
                          value={endDate}
                          onChange={(event) => handleDateChange('end', event.target.value)}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="flex lg:w-[180px] lg:flex-col lg:justify-end">
                <button
                  type="button"
                  onClick={refreshReports}
                  disabled={loading || isRefreshing}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <span className={loading || isRefreshing ? 'animate-spin' : ''}>
                    <IC.Refresh />
                  </span>
                  <span>{loading || isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={card.badgeClass}>{card.title}</span>
                  <span className="h-10 w-10 rounded-2xl bg-slate-100 transition group-hover:scale-105 dark:bg-slate-900" />
                </div>

                <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {card.helpText}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Growth Cards */}
        <section className="mt-8 grid gap-5 grid-cols-1 md:grid-cols-2">
          {growthCards.map((card) => (
            <div key={card.title} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{card.displayValue}</p>
                </div>
                <div className={card.growthClass}>{card.growthLabel}</div>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{card.helpText}</p>
            </div>
          ))}
        </section>

        {/* Average Metrics */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {averageCards.map((card) => (
            <div key={card.title} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{card.title}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.subtitle}</p>
            </div>
          ))}
        </section>


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
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatPercentage(monthlyRevenueGrowth)} vs last month</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">This month profit</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentMonthTotals.grossProfit - currentMonthTotals.expenses)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatPercentage(monthlyProfitGrowth)} vs last month</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">This month expenses</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentMonthTotals.expenses)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatPercentage(monthlyExpenseGrowth)} vs last month</p>
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
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{formatPercentage(monthlyRevenueGrowth)}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-sm text-slate-500 dark:text-slate-400">Profit change</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{formatPercentage(monthlyProfitGrowth)}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-sm text-slate-500 dark:text-slate-400">Expense change</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{formatPercentage(monthlyExpenseGrowth)}</p>
              </div>
            </div>
          </div>
        </section>

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

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
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
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
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
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950/80">
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
          </div>
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
                <Pagination currentPage={lowStockPage} totalItems={stockSummary.lowStock.length} itemsPerPage={itemsPerPage} onPageChange={setLowStockPage} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 grid gap-6">
          <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Revenue report</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Recent transactions</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest sales within your selected period.</p>
            </div>

            <div className="mt-6 overflow-x-auto rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90">
              <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-200">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">Sale</th>
                    <th className="px-4 py-4">Profit</th>
                    <th className="px-4 py-4">Total</th>
                    <th className="px-4 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Loading report data...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-300">{error}</td>
                    </tr>
                  ) : txTotal === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No transactions available for this date range.</td>
                    </tr>
                  ) : (
                    pagedTransactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{getProductName(item)}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{num.format(item.qty)}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.harga_jual)}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.profit != null ? item.profit : safeNumber(item.total) - safeNumber(item.harga_modal) * safeNumber(item.qty))}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.total)}</td>
                        <td className="px-4 py-4 text-right text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && txTotal > itemsPerPage && (
              <div className="mt-4">
                <Pagination
                  currentPage={txPage}
                  totalItems={txTotal}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setTxPage}
                />
              </div>
            )}
          </div>

          <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Inventory report</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Current stock overview</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active stock details and valuation.</p>
            </div>

            <div className="mt-6 overflow-x-auto rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90">
              <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-200">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Product</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">Cost value</th>
                    <th className="px-4 py-4">Retail value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">Loading stock data...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-rose-300">{error}</td>
                    </tr>
                  ) : stockTotal === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No stock records found.</td>
                    </tr>
                  ) : (
                    pagedStocks.map((item) => {
                      const product = productDetails.get(item.product_id)
                      const modalPrice = safeNumber(item.harga_modal ?? product?.harga_modal)
                      const jualPrice = safeNumber(item.harga_jual ?? product?.harga_jual)
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{product?.name ?? item.product_id}</td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{num.format(item.total)}</td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(modalPrice * item.total)}</td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(jualPrice * item.total)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && stockTotal > itemsPerPage && (
              <div className="mt-4">
                <Pagination
                  currentPage={stockPage}
                  totalItems={stockTotal}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setStockPage}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
