import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useLanguage } from '../providers/useLanguage'
import ReportControls from './Reports/ReportControls'
import ReportOverview from './Reports/ReportOverview'
import ReportTrendSection from './Reports/ReportTrendSection'
import ReportInsights from './Reports/ReportInsights'
import ReportTables from './Reports/ReportTables'
import { ReportSummary, ReportGrowth, ReportAverages } from './Reports/ReportCards'
import LastAIInsight from './Reports/LastAIInsight'
import { useReportsData } from '../hooks/useReportsData'
import type { Transaction } from '../../types/types'

type Translate = (key: string) => string

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

const getLastAutoTableY = (doc: jsPDF, fallback: number) => {
  return (doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? fallback
}

const escapeCsvValue = (value: unknown) => {
  const text = value == null ? '' : String(value)
  const safeText = text.replace(/"/g, '""').replace(/\r?\n/g, ' ')
  return `"${safeText}"`
}

const buildCsvRows = (rows: string[][]) => rows.map((row) => row.join(',')).join('\r\n')

const safeNumber = (value: number | null | undefined) => Number(value ?? 0)

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const generateReportInsights = (params: {
  currentTotals: { revenue: number; grossProfit: number; expenses: number; transactionsCount: number }
  stockSummary: { lowStock: { name: string; qty: number }[] }
  bestByQty: { name: string; qty: number }[]
  filteredTransactions: unknown[]
  t: Translate
}) => {
  const { currentTotals, stockSummary, bestByQty, filteredTransactions, t } = params
  const insights: string[] = []
  const netProfit = currentTotals.grossProfit - currentTotals.expenses

  if (filteredTransactions.length === 0) {
    insights.push(t('No transactions recorded in this period. Focus on marketing and promotions to drive sales.'))
    return insights
  }

  if (netProfit < 0) {
    insights.push(t('Net profit is negative: the business is operating at a loss. Review pricing, costs, and marketing strategy for improvement.'))
  } else {
    insights.push(t('Net profit is positive: business performance is healthy, continue the strategy that is working well.'))
  }

  if (currentTotals.expenses > currentTotals.revenue * 0.6) {
    insights.push(t('Expenses are high compared with revenue. Evaluate operating costs to improve margins.'))
  }

  if (stockSummary.lowStock.length > 0) {
    const lowNames = stockSummary.lowStock.slice(0, 3).map((item) => item.name).join(', ')
    insights.push(`${t('Low stock detected for products')}: ${lowNames}. ${t('Restock soon so sales do not stop.')}`)
  }

  if (bestByQty.length > 0) {
    insights.push(`${t('Best seller product')}: ${bestByQty[0].name}. ${t('Maintain stock and focus on this product.')}`)
  }

  if (currentTotals.revenue > 0 && netProfit / currentTotals.revenue < 0.15) {
    insights.push(t('Profit margin is low. Review cost price and sale price to protect profitability.'))
  }

  return insights
}

const formatCsvDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('en-CA')
  } catch {
    return value
  }
}

export default function Reports() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [previewOpen, setPreviewOpen] = useState(false)

  const {
    filterType,
    startDate,
    endDate,
    loading,
    isRefreshing,
    realtimeConnected,
    dateRangeLabel,
    filterTypeLabel,
    onFilterTypeChange,
    onDateChange,
    onRefresh,
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
    comparisonChartData,
    comparisonTitle,
    currentTotals,
    filteredTransactions,
    filteredExpenses,
    stocks,
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
    error,
    txTotal,
    stockTotal,
    pagedTransactions,
    pagedStocks,
    txPage,
    stockPage,
    onTxPageChange,
    onStockPageChange,
    getProductName,
    productDetails,
  } = useReportsData()

  const handleExportFullReportCsv = () => {
    const lowStockCount = stockSummary.lowStock.length
    const averageTransaction = currentTotals.transactionsCount
      ? currentTotals.revenue / currentTotals.transactionsCount
      : 0
    const insights = generateReportInsights({
      currentTotals,
      stockSummary,
      bestByQty,
      filteredTransactions,
      t,
    })

    const summaryRows: string[][] = [
      [t('SECTION: SUMMARY')],
      [t('Date Range'), dateRangeLabel],
      [t('Filter Type'), filterTypeLabel],
      [t('Revenue'), fmt.format(currentTotals.revenue)],
      [t('Gross Profit'), fmt.format(currentTotals.grossProfit)],
      [t('Expenses'), fmt.format(currentTotals.expenses)],
      [t('Net Profit'), fmt.format(currentTotals.grossProfit - currentTotals.expenses)],
      [t('Transaction Count'), String(currentTotals.transactionsCount)],
      [t('Average Transaction'), fmt.format(averageTransaction)],
      [t('Stock Value'), fmt.format(stockSummary.value)],
      [t('Total Stock Qty'), String(stocks.reduce((sum, stock) => sum + safeNumber(stock.total), 0))],
      [t('Low Stock Count'), String(lowStockCount)],
    ]

    const transactionRows: string[][] = [
      [t('SECTION: TRANSACTIONS')],
      [t('Date'), t('Product Name'), t('Qty'), t('Cost Price'), t('Sale Price'), t('Revenue'), t('Gross Profit'), t('Created At')],
      ...filteredTransactions.map((transaction) => {
        const costPrice = transaction.harga_modal ?? null
        const salePrice = transaction.harga_jual ?? null
        const grossProfit = transaction.profit != null
          ? transaction.profit
          : safeNumber(transaction.total) - safeNumber(costPrice) * safeNumber(transaction.qty)
        return [
          formatCsvDate(transaction.created_at),
          transaction.product_name ?? t('Manual Sale'),
          String(transaction.qty ?? ''),
          costPrice != null ? fmt.format(costPrice) : '',
          salePrice != null ? fmt.format(salePrice) : '',
          fmt.format(transaction.total ?? 0),
          fmt.format(grossProfit),
          transaction.created_at,
        ]
      }),
    ]

    const expenseRows: string[][] = [
      [t('SECTION: EXPENSES')],
      [t('Date'), t('Expense Name / Category'), t('Amount'), t('Note'), t('Created At')],
      ...filteredExpenses.map((expense) => [
        formatCsvDate(expense.created_at),
        expense.description ?? t('Expense'),
        fmt.format(expense.total ?? 0),
        '',
        expense.created_at,
      ]),
    ]

    const stockRows: string[][] = [
      [t('SECTION: STOCK')],
      [t('Product Name'), t('Current Stock'), t('Cost Price'), t('Sale Price'), t('Stock Value'), t('Status')],
      ...stocks.map((stock) => {
        const product = productDetails.get(stock.product_id)
        const qty = safeNumber(stock.total)
        const costPrice = safeNumber(stock.harga_modal ?? product?.harga_modal)
        const salePrice = safeNumber(stock.harga_jual ?? product?.harga_jual)
        const value = qty * costPrice
        return [
          product?.name ?? stock.product_id,
          String(qty),
          fmt.format(costPrice),
          fmt.format(salePrice),
          fmt.format(value),
          qty <= 5 ? t('Low Stock') : t('OK'),
        ]
      }),
    ]

    const bestSellingRows: string[][] = [
      [t('SECTION: BEST SELLING PRODUCTS')],
      [t('Product Name'), t('Total Qty Sold'), t('Revenue'), t('Gross Profit')],
      ...bestByQty.map((product) => [
        product.name,
        String(product.qty),
        fmt.format(product.revenue),
        fmt.format(product.profit),
      ]),
    ]

    const insightRows: string[][] = [
      [t('SECTION: INSIGHTS')],
      ...insights.map((insight) => [insight]),
    ]

    const rows = [
      ...summaryRows,
      [''],
      ...transactionRows,
      [''],
      ...expenseRows,
      [''],
      ...stockRows,
      [''],
      ...bestSellingRows,
      [''],
      ...insightRows,
    ]

    const csv = buildCsvRows(rows.map((row) => row.map(escapeCsvValue)))
    const fileName = filterType === 'today'
      ? `full-report-today-${startDate}.csv`
      : `full-report-${startDate}-to-${endDate}.csv`

    downloadCsv(fileName, csv)
  }

  const handleExportFullReportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const title = t('Business Report')
    const reportDate = filterType === 'today' ? `${t('Date')}: ${dateRangeLabel}` : `${t('Date range')}: ${dateRangeLabel}`
    const netProfit = currentTotals.grossProfit - currentTotals.expenses
    const netMargin = currentTotals.revenue ? netProfit / currentTotals.revenue : 0
    const expenseRatio = currentTotals.grossProfit ? currentTotals.expenses / currentTotals.grossProfit : 0
    const insights = generateReportInsights({
      currentTotals,
      stockSummary,
      bestByQty,
      filteredTransactions,
      t,
    })

    doc.setFontSize(18)
    doc.text(title, 40, 48)
    doc.setFontSize(10)
    doc.text(reportDate, 40, 68)
    doc.text(`${t('Generated')}: ${new Date().toLocaleDateString('en-CA')}`, 40, 82)

    const summaryBody = [
      [t('Revenue'), fmt.format(currentTotals.revenue)],
      [t('Gross Profit'), fmt.format(currentTotals.grossProfit)],
      [t('Expenses'), fmt.format(currentTotals.expenses)],
      [t('Net Profit'), fmt.format(netProfit)],
      [t('Transaction Count'), String(currentTotals.transactionsCount)],
      [t('Average Transaction'), currentTotals.transactionsCount ? fmt.format(currentTotals.revenue / currentTotals.transactionsCount) : fmt.format(0)],
      [t('Stock Value'), fmt.format(stockSummary.value)],
      [t('Low Stock Count'), String(stockSummary.lowStock.length)],
      [t('Net Margin'), `${(netMargin * 100).toFixed(1)}%`],
      [t('Expense Ratio'), currentTotals.grossProfit ? `${(expenseRatio * 100).toFixed(1)}%` : t('N/A')],
    ]

    autoTable(doc, {
      startY: 100,
      head: [[t('Summary metric'), t('Value')]],
      body: summaryBody,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [14, 110, 224] },
      columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 180 } },
    })

    let currentY = getLastAutoTableY(doc, 100)
    currentY += 24

    doc.setFontSize(12)
    doc.text(t('Business Insights'), 40, currentY)
    currentY += 14

    doc.setFontSize(10)
    insights.slice(0, 6).forEach((insight) => {
      doc.text(`• ${insight}`, 48, currentY)
      currentY += 14
    })

    currentY += 10

    autoTable(doc, {
      startY: currentY,
      head: [[t('Best Selling Product'), t('Qty Sold'), t('Revenue'), t('Gross Profit')]],
      body: bestByQty.slice(0, 5).map((product) => [
        product.name,
        String(product.qty),
        fmt.format(product.revenue),
        fmt.format(product.profit),
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [22, 163, 74] },
    })

    currentY = getLastAutoTableY(doc, currentY)
    currentY += 20

    autoTable(doc, {
      startY: currentY,
      head: [[t('Expense Category'), t('Amount')]],
      body: expenseBreakdown.slice(0, 5).map((item) => [
        item.name,
        fmt.format(item.total),
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [234, 88, 12] },
    })

    currentY = getLastAutoTableY(doc, currentY)
    currentY += 20

    autoTable(doc, {
      startY: currentY,
      head: [[t('Low Stock Product'), t('Qty'), t('Status')]],
      body: stockSummary.lowStock.slice(0, 10).map((item) => [
        item.name,
        String(item.qty),
        item.qty <= 5 ? t('Low Stock') : t('OK'),
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [220, 38, 38] },
    })

    currentY = getLastAutoTableY(doc, currentY)
    currentY += 20

    const recentTransactions = filteredTransactions.slice(0, 10)

    if (recentTransactions.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [[t('Date'), t('Product'), t('Qty'), t('Revenue'), t('Gross Profit')]],
        body: recentTransactions.map((transaction) => {
          const grossProfit =
            transaction.profit != null
              ? transaction.profit
              : safeNumber(transaction.total) -
                safeNumber(transaction.harga_modal) * safeNumber(transaction.qty)

          return [
            formatCsvDate(transaction.created_at),
            transaction.product_name ?? t('Manual Sale'),
            String(transaction.qty ?? ''),
            fmt.format(transaction.total ?? 0),
            fmt.format(grossProfit),
          ]
        }),
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [71, 85, 105] },
      })
    }

    const fileName = filterType === 'today'
      ? `business-report-today-${startDate}.pdf`
      : `business-report-${startDate}-to-${endDate}.pdf`

    doc.save(fileName)
  }

  const previewInsights = generateReportInsights({
      currentTotals,
      stockSummary,
      bestByQty,
      filteredTransactions,
      t,
    })

  const averageTransaction = currentTotals.transactionsCount
    ? currentTotals.revenue / currentTotals.transactionsCount
    : 0

  const previewTransactions = filteredTransactions.slice(0, 5) as Transaction[]

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/10 transition-colors dark:border-slate-700 dark:bg-slate-950/95">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Reports')}</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{t('Financial intelligence and inventory performance')}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                {t('Monitor revenue, expenses, profitability, product performance, and growth with a polished executive view.')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleExportFullReportCsv}
                disabled={loading || (!filteredTransactions.length && !filteredExpenses.length && !stocks.length)}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {t('Export Full Report CSV')}
              </button>

              <button
                type="button"
                onClick={handleExportFullReportPdf}
                disabled={loading || (!filteredTransactions.length && !filteredExpenses.length && !stocks.length)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
              >
                {t('Export PDF Business Report')}
              </button>

              <button
                type="button"
                onClick={() => setPreviewOpen((open) => !open)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-700"
              >
                {previewOpen ? t('Hide Report Preview') : t('Preview Full Report')}
              </button>
            </div>
          </div>
        </div>

        {previewOpen && (
          <section className="mb-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/10 transition-colors dark:border-slate-700 dark:bg-slate-950/95">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">{t('Preview')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{t('Full report preview')}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {t('look at the key insights, top products, and recent transactions that will be included in the full report. Use this preview to quickly assess the business performance before exporting the complete report.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('Close Preview')}
              </button>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-4">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Date range')}</p>
                <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{dateRangeLabel}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{filterTypeLabel}</p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Revenue')}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.revenue)}</p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Gross profit')}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.grossProfit)}</p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Net profit')}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{fmt.format(currentTotals.grossProfit - currentTotals.expenses)}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Business insights')}</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {previewInsights.length > 0 ? (
                    previewInsights.slice(0, 5).map((insight) => (
                      <li key={insight} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                        <span>{insight}</span>
                      </li>
                    ))
                  ) : (
                    <li>{t('No insights available for the selected period.')}</li>
                  )}
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Best selling products')}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  {bestByQty.slice(0, 5).map((product) => (
                    <div key={product.name} className="flex items-center justify-between rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-950/70">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{product.qty} {t('pcs')}</span>
                    </div>
                  ))}
                  {!bestByQty.length && <p className="text-slate-500 dark:text-slate-400">{t('No best-selling products available.')}</p>}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Low stock')}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  {stockSummary.lowStock.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-950/70">
                      <span>{item.name}</span>
                      <span className="text-sm text-rose-600 dark:text-rose-400">{item.qty}</span>
                    </div>
                  ))}
                  {!stockSummary.lowStock.length && <p className="text-slate-500 dark:text-slate-400">{t('No low stock items available.')}</p>}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Transactions')}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{filteredTransactions.length}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Recent rows included in export preview.')}</p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Average transaction')}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{fmt.format(averageTransaction)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Average transaction value for the selected period.')}</p>
              </div>
            </div>

              <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-5 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-slate-600 dark:border-slate-700 dark:text-slate-400">
                {t('Transaction preview')}
              </div>
              <div className="overflow-x-auto px-5 pb-5 pt-3">
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700 dark:divide-slate-700 dark:text-slate-200">
                  <thead className="bg-slate-100 text-left text-[0.8rem] uppercase tracking-[0.25em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-3">{t('Date')}</th>
                      <th className="px-3 py-3">{t('Product')}</th>
                      <th className="px-3 py-3">{t('Qty')}</th>
                      <th className="px-3 py-3">{t('Revenue')}</th>
                      <th className="px-3 py-3">{t('Gross Profit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {previewTransactions.length > 0 ? (
                      previewTransactions.map((transaction) => {
                        const grossProfit =
                          transaction.profit != null
                            ? transaction.profit
                            : safeNumber(transaction.total) - safeNumber(transaction.harga_modal) * safeNumber(transaction.qty)

                        return (
                          <tr key={`${transaction.created_at}-${transaction.product_name}-${transaction.qty}`}>
                            <td className="px-3 py-3">{formatCsvDate(transaction.created_at)}</td>
                            <td className="px-3 py-3">{transaction.product_name ?? t('Manual Sale')}</td>
                            <td className="px-3 py-3">{String(transaction.qty ?? '')}</td>
                            <td className="px-3 py-3">{fmt.format(transaction.total ?? 0)}</td>
                            <td className="px-3 py-3">{fmt.format(grossProfit)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-3 py-5 text-center text-sm text-slate-500 dark:text-slate-400">
                          {t('No transactions available for the selected period.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-6">
          <ReportControls
            filterType={filterType}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            isRefreshing={isRefreshing}
            realtimeConnected={realtimeConnected}
            dateRangeLabel={dateRangeLabel}
            filterTypeLabel={filterTypeLabel}
            onFilterTypeChange={onFilterTypeChange}
            onDateChange={onDateChange}
            onRefresh={onRefresh}
          />

          <ReportSummary summaryCards={summaryCards} />
        </section>


        <ReportGrowth growthCards={growthCards} />
        <ReportAverages averageCards={averageCards} />

        <div className="flex justify-end mt-4 mb-6">
          <button
            onClick={() => navigate(`/reports/growth?type=${filterType}&start=${startDate}&end=${endDate}`)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            {t('View Detailed Growth Analysis →')}
          </button>
        </div>

        <LastAIInsight
          revenue={currentTotals.revenue}
          grossProfit={currentTotals.grossProfit}
          expenses={currentTotals.expenses}
          netProfit={currentTotals.grossProfit - currentTotals.expenses}
          expenseRatio={
            currentTotals.grossProfit > 0
              ? ((currentTotals.expenses / currentTotals.grossProfit) * 100)
              : 0
          }
          bestSellingProduct={bestByQty[0]?.name ?? null}
          mostProfitableProduct={mostProfitable[0]?.name ?? null}
          lowStockCount={stockSummary.lowStock.length}
        />

        <ReportOverview
          monthlyComparisonChartData={monthlyComparisonChartData}
          currentMonthTotals={currentMonthTotals}
          monthlyRevenueGrowth={monthlyRevenueGrowth}
          monthlyProfitGrowth={monthlyProfitGrowth}
          monthlyExpenseGrowth={monthlyExpenseGrowth}
          monthComparisonSubtitle={monthComparisonSubtitle}
          fmt={fmt}
        />

        <ReportTrendSection
          trendChartData={trendChartData}
          comparisonChartData={comparisonChartData}
          comparisonTitle={comparisonTitle}
          dateRangeLabel={dateRangeLabel}
          currentTotals={currentTotals}
          fmt={fmt}
        />

        <div className="flex justify-end mt-4 mb-6">
          <button
            onClick={() => navigate(`/reports/trends?type=${filterType}&start=${startDate}&end=${endDate}`)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            {t('View Complete Trend Analysis →')}
          </button>
        </div>

        <ReportInsights
          bestByQty={bestByQty}
          bestByRevenue={bestByRevenue}
          mostProfitable={mostProfitable}
          maxQtyByQty={maxQtyByQty}
          maxRevenue={maxRevenue}
          maxProfit={maxProfit}
          expenseBreakdown={expenseBreakdown}
          maxExpenseCategory={maxExpenseCategory}
          biggestExpense={biggestExpense}
          stockSummary={stockSummary}
          pagedLowStock={pagedLowStock}
          lowStockPage={lowStockPage}
          itemsPerPage={itemsPerPage}
          onLowStockPageChange={onLowStockPageChange}
          fmt={fmt}
          num={num}
          filterType={filterType}
          startDate={startDate}
          endDate={endDate}
        />

        <ReportTables
          loading={loading}
          error={error}
          txTotal={txTotal}
          stockTotal={stockTotal}
          pagedTransactions={pagedTransactions}
          pagedStocks={pagedStocks}
          txPage={txPage}
          stockPage={stockPage}
          itemsPerPage={itemsPerPage}
          onTxPageChange={onTxPageChange}
          onStockPageChange={onStockPageChange}
          getProductName={getProductName}
          num={num}
          fmt={fmt}
          productDetails={productDetails}
        />
      </div>
    </main >
  )
}
