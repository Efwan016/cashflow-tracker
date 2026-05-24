import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../providers/useLanguage'
import { createCurrencyFormatter, createNumberFormatter, getTzOffset } from '../../lib/utils'
import type { Expense, FilterType, Product, Stock, Transaction } from '../../types/types'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const ITEMS_PER_PAGE = 5
const LANGUAGE_LOCALES = {
  en: 'en-US',
  id: 'id-ID',
  es: 'es-ES',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ar: 'ar-SA',
} as const

const formatLocalDate = (date: Date) => date.toLocaleDateString('en-CA')
const formatDisplayDate = (
  date: Date,
  language: keyof typeof LANGUAGE_LOCALES,
  options: Intl.DateTimeFormatOptions
) => date.toLocaleDateString(LANGUAGE_LOCALES[language], options)

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

// KUNCI UTAMA: Helper untuk normalisasi nama produk - sama seperti Dashboard
// Gunakan sebagai key untuk pengelompokan (trim + uppercase) agar produk dengan nama yang sama
// tapi berbeda spasi atau kapitalisasi dihitung sebagai satu produk
const normalizeProductName = (rawName: string) => {
  const cleanKey = rawName.trim().toUpperCase()
  // Format tampilan yang rapi: untuk 'SERVICE HP' jadi 'Service HP', selain itu gunakan rawName yang sudah di-trim
  const displayName = cleanKey === 'SERVICE HP' ? 'Service HP' : rawName.trim()
  return { cleanKey, displayName }
}

export function useReportsData(initialFilterType?: FilterType, initialStartDate?: string, initialEndDate?: string) {
  const { t, language } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>(initialFilterType || 'today')
  const [startDate, setStartDate] = useState(initialStartDate || (() => getPresetRange('today').start))
  const [endDate, setEndDate] = useState(initialEndDate || (() => getPresetRange('today').end))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [stockPage, setStockPage] = useState(1)
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
      return formatDisplayDate(parseLocalDate(currentRange.start), language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    return `${formatDisplayDate(parseLocalDate(currentRange.start), language, {
      day: 'numeric',
      month: 'short',
    })} - ${formatDisplayDate(parseLocalDate(currentRange.end), language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }, [currentRange, language])

  const filterTypeLabel = useMemo(() => {
    switch (filterType) {
      case 'today':
        return t('Today')
      case 'last7':
        return t('Last 7 days')
      case 'thisMonth':
        return t('This month')
      case 'last3month':
        return t('Last 3 months')
      case 'specific':
        return t('Pick a date')
      case 'range':
        return t('Custom range')
      default:
        return t('Date range')
    }
  }, [filterType, t])

  const fmt = useMemo(() => createCurrencyFormatter(), [])
  const num = useMemo(() => createNumberFormatter(), [])

  const productDetails = useMemo(
    () => new Map(products.map((product) => [product.id, product] as const)),
    [products]
  )

  const getProductName = useCallback(
    (transaction: Transaction) =>
      (transaction.product_id ? productDetails.get(transaction.product_id)?.name : null) ?? transaction.product_name ?? t('Manual Sale'),
    [productDetails, t]
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

  const daysInRange = useMemo(
    () => getDaysBetween(currentRange.start, currentRange.end) + 1,
    [currentRange]
  )

  const summaryCards = useMemo(
    () => [
      {
        title: t('Revenue'),
        value: fmt.format(currentTotals.revenue),
        helpText: t('Sum of all filtered transaction totals.'),
        badgeClass: 'inline-flex rounded-3xl bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700',
      },
      {
        title: t('Gross profit'),
        value: fmt.format(currentTotals.grossProfit),
        helpText: t('Aggregate of transaction profit values.'),
        badgeClass: 'inline-flex rounded-3xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700',
      },
      {
        title: t('Expenses'),
        value: fmt.format(currentTotals.expenses),
        helpText: t('Total expense amount in the selected window.'),
        badgeClass: 'inline-flex rounded-3xl bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700',
      },
      {
        title: t('Net profit'),
        value: fmt.format(currentTotals.grossProfit - currentTotals.expenses),
        helpText: t('Gross profit minus total expenses.'),
        badgeClass: 'inline-flex rounded-3xl bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700',
      },
    ],
    [currentTotals, fmt, t]
  )

  const growthCards = useMemo(
    () => [
      {
        title: t('Revenue Growth'),
        displayValue: fmt.format(currentTotals.revenue),
        growthLabel: formatPercentage(revenueGrowth),
        growthClass: revenueGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: t('Current period compared to the previous period.'),
      },
      {
        title: t('Profit Growth'),
        displayValue: fmt.format(currentTotals.grossProfit),
        growthLabel: formatPercentage(profitGrowth),
        growthClass: profitGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: t('Higher profit is positive for business health.'),
      },
      {
        title: t('Expense Growth'),
        displayValue: fmt.format(currentTotals.expenses),
        growthLabel: formatPercentage(expenseGrowth),
        growthClass:
          expenseGrowth <= 0
            ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700'
            : 'rounded-3xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700',
        helpText: t('Lower expense growth is generally healthier.'),
      },
      {
        title: t('Transaction Growth'),
        displayValue: num.format(currentTotals.transactionsCount),
        growthLabel: formatPercentage(transactionGrowth),
        growthClass: transactionGrowth >= 0 ? 'rounded-3xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700' : 'rounded-3xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700',
        helpText: t('Volume change in transaction count.'),
      },
    ],
    [currentTotals, expenseGrowth, fmt, num, profitGrowth, revenueGrowth, t, transactionGrowth]
  )

  const averageCards = useMemo(
    () => [
      {
        title: t('Average Order'),
        value: currentTotals.transactionsCount ? fmt.format(currentTotals.revenue / currentTotals.transactionsCount) : fmt.format(0),
        subtitle: t('Average revenue per transaction.'),
      },
      {
        title: t('Average Expense'),
        value: filteredExpenses.length ? fmt.format(currentTotals.expenses / filteredExpenses.length) : fmt.format(0),
        subtitle: t('Average cost per expense entry.'),
      },
      {
        title: t('Average Profit'),
        value: currentTotals.transactionsCount ? fmt.format(currentTotals.grossProfit / currentTotals.transactionsCount) : fmt.format(0),
        subtitle: t('Average gross profit per sale.'),
      },
      {
        title: t('Daily Profit Avg'),
        value: daysInRange ? fmt.format((currentTotals.grossProfit - currentTotals.expenses) / daysInRange) : fmt.format(0),
        subtitle: t('Average profit per day in range.'),
      },
      {
        title: t('Avg Trx / Daily'),
        value: daysInRange ? `${(currentTotals.transactionsCount / daysInRange).toFixed(1)} ${t('trx')}` : `0 ${t('trx')}`,
        subtitle: t('Average transaction count per day.'),
      },
    ],
    [currentTotals, daysInRange, fmt, filteredExpenses, t]
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
      labels.push(formatDisplayDate(cursor, language, { day: 'numeric', month: 'short', year: 'numeric' }))
      revenue.push(entry.revenue)
      expense.push(entry.expense)
      netProfit.push(entry.grossProfit - entry.expense)
      cursor = addDays(cursor, 1)
    }

    return { labels, revenue, expense, netProfit }
  }, [filteredTransactions, filteredExpenses, currentRange, language])

  const dayOfWeekData = useMemo(() => {
    const dailyData = new Array(7).fill(0).map(() => ({
      revenue: 0,
      expense: 0,
      grossProfit: 0,
      transactionsCount: 0,
      daysCount: 0, // To count how many days of this type are in the range
    }))

    // Aggregate transactions and expenses by day of week
    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.created_at)
      const day = d.getDay() // 0 for Sunday, 1 for Monday, etc.
      dailyData[day].revenue += safeNumber(tx.total)
      const profit = tx.profit != null ? tx.profit : safeNumber(tx.total) - safeNumber(tx.harga_modal) * safeNumber(tx.qty)
      dailyData[day].grossProfit += profit
      dailyData[day].transactionsCount++
    })

    filteredExpenses.forEach((exp) => {
      const d = new Date(exp.created_at)
      const day = d.getDay()
      dailyData[day].expense += safeNumber(exp.total)
    })

    // Count how many times each day of the week appears in the currentRange
    let cursor = parseLocalDate(currentRange.start)
    const end = parseLocalDate(currentRange.end)
    while (cursor <= end) {
      dailyData[cursor.getDay()].daysCount++
      cursor = addDays(cursor, 1)
    }
    
    // Calculate averages and reorder labels to start from Monday (Mon -> Sun)
    const orderedLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const orderMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 }

    const averageRevenue: number[] = []
    const averageExpense: number[] = []
    const averageNetProfit: number[] = []

    orderedLabels.forEach(label => {
      const originalDayIndex = orderMap[label as keyof typeof orderMap]
      const data = dailyData[originalDayIndex]
      const daysInPeriod = data.daysCount > 0 ? data.daysCount : 1; // Avoid division by zero

      averageRevenue.push(data.revenue / daysInPeriod)
      averageExpense.push(data.expense / daysInPeriod)
      averageNetProfit.push((data.grossProfit - data.expense) / daysInPeriod)
    })

    return {
      labels: orderedLabels.map((label) => t(label)),
      revenue: averageRevenue,
      expense: averageExpense,
      netProfit: averageNetProfit,
    }
  }, [filteredTransactions, filteredExpenses, currentRange, t])

  const monthlyComparisonChartData = useMemo(() => {
    const previousNetProfit = previousMonthTotals.grossProfit - previousMonthTotals.expenses
    const currentNetProfit = currentMonthTotals.grossProfit - currentMonthTotals.expenses
    return {
      labels: [t('Last month'), t('This month')],
      revenue: [previousMonthTotals.revenue, currentMonthTotals.revenue],
      expense: [previousMonthTotals.expenses, currentMonthTotals.expenses],
      netProfit: [previousNetProfit, currentNetProfit],
    }
  }, [currentMonthTotals, previousMonthTotals, t])

  const comparisonChartData = useMemo(() => {
    const buckets: { label: string; value: number }[] = []

    if (filterType === 'today') {
      for (let h = 0; h < 24; h += 1) {
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
          const label = `${formatDisplayDate(cursor, language, { day: 'numeric', month: 'short' })} - ${formatDisplayDate(lastDay, language, { day: 'numeric', month: 'short' })}`
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
          const label = formatDisplayDate(date, language, { month: 'short', year: 'numeric' })
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
  }, [currentRange, filteredTransactions, filterType, language])

  const productPerformance = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number; profit: number }>()

    filteredTransactions.forEach((transaction) => {
      // KUNCI UTAMA: Gunakan normalisasi nama produk saat pengelompokan, sama seperti Dashboard
      const rawName = getProductName(transaction)
      const { cleanKey, displayName } = normalizeProductName(rawName)
      
      const entry = map.get(cleanKey) ?? { name: displayName, qty: 0, revenue: 0, profit: 0 }
      entry.qty += safeNumber(transaction.qty)
      entry.revenue += safeNumber(transaction.total)
      const margin = transaction.profit != null ? transaction.profit : safeNumber(transaction.total) - safeNumber(transaction.harga_modal) * safeNumber(transaction.qty)
      entry.profit += margin
      map.set(cleanKey, entry)
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
      const label = expense.description?.trim() || t('Expense')
      map.set(label, (map.get(label) ?? 0) + safeNumber(expense.total))
    })
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredExpenses, t])

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
    const start = (lowStockPage - 1) * ITEMS_PER_PAGE
    return stockSummary.lowStock.slice(start, start + ITEMS_PER_PAGE)
  }, [stockSummary.lowStock, lowStockPage])

  const comparisonTitle = useMemo(() => {
    if (filterType === 'today') return t('Hour over Hour momentum')
    if (filterType === 'last7') return daysInRange <= 1 ? t('Day over Day momentum') : t('Week over Week momentum')
    if (filterType === 'thisMonth' || filterType === 'last3month') return t('Month over Month momentum')
    return daysInRange <= 45 ? t('Week over Week momentum') : t('Month over Month momentum')
  }, [filterType, daysInRange, t])

  const monthComparisonSubtitle = useMemo(
    () =>
      `${t('This month vs last month')} · ${formatDisplayDate(parseLocalDate(currentMonthRange.start), language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} - ${formatDisplayDate(parseLocalDate(currentMonthRange.end), language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`,
    [currentMonthRange, language, t]
  )

  const fetchPaged = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) return

      const userId = user.id
      const txOffset = (txPage - 1) * ITEMS_PER_PAGE
      const stockOffset = (stockPage - 1) * ITEMS_PER_PAGE
      const tz = getTzOffset()
      const startIso = `${currentRange.start}T00:00:00.000${tz}`
      const endIso = `${currentRange.end}T23:59:59.999${tz}`

      const [
        { data: txData, error: txError, count: txCount },
        { data: stockData, error: stockError, count: stockCount },
      ] = await Promise.all([
        supabase
          .from('Transactions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false })
          .range(txOffset, txOffset + ITEMS_PER_PAGE - 1),
        supabase
          .from('Stock')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('product_id', { ascending: true })
          .range(stockOffset, stockOffset + ITEMS_PER_PAGE - 1),
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

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) {
        setError(t('User not authenticated.'))
        return
      }

      const userId = user.id
      const tz = getTzOffset()
      const reportStart = [
        currentRange.start,
        previousRange.start,
        currentMonthRange.start,
        previousMonthComparisonRange.start,
      ]
        .sort()[0]
      const reportEnd = [
        currentRange.end,
        previousRange.end,
        currentMonthRange.end,
        previousMonthComparisonRange.end,
      ]
        .sort()
        .at(-1) ?? currentRange.end

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
          `${t('Unable to load report data')}: ` +
            [transactionError?.message, expenseError?.message, stockError?.message].filter(Boolean).join(' | ')
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
      setError(t('Unable to load report data.'))
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentMonthRange, currentRange, previousMonthComparisonRange, previousRange, t])

  const createChannel = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return null

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
  }, [fetchPaged, fetchReports])

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

  const handleFilterTypeChange = useCallback((type: FilterType) => {
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
  }, [])

  return {
    filterType,
    startDate,
    endDate,
    loading,
    isRefreshing,
    realtimeConnected,
    dateRangeLabel,
    filterTypeLabel,
    onFilterTypeChange: handleFilterTypeChange,
    onDateChange: handleDateChange,
    onRefresh: refreshReports,
    summaryCards,
    growthCards,
    averageCards,
    monthlyComparisonChartData,
    currentMonthTotals,
    monthlyRevenueGrowth,
    monthlyProfitGrowth,
    monthlyExpenseGrowth,
    monthComparisonSubtitle,
    fmt,
    num,
    trendChartData,
    dayOfWeekData,
    comparisonChartData,
    comparisonTitle,
    currentTotals,
    filteredTransactions,
    filteredExpenses,
    stocks,
    productPerformance, // <--- Tambahkan ini
    previousTotals,
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
    itemsPerPage: ITEMS_PER_PAGE,
    onLowStockPageChange: setLowStockPage,
    loadingStatus: loading,
    error,
    txTotal,
    stockTotal,
    pagedTransactions,
    pagedStocks,
    txPage,
    stockPage,
    onTxPageChange: setTxPage,
    onStockPageChange: setStockPage,
    getProductName,
    productDetails,
  }
}
