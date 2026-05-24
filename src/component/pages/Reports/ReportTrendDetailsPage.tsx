import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, LineChart as LineChartIcon, TrendingUp, TrendingDown } from 'lucide-react'
import ChartComponent from '../../components/Chart'
import { useReportsData } from '../../hooks/useReportsData'
import { useLanguage } from '../../providers/useLanguage'
import type { FilterType } from '../../../types/types'

export default function ReportTrendDetailsPage() {
  const { t } = useLanguage()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const filterType = (searchParams.get('type') as FilterType) || 'today'
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''

  const {
    trendChartData,
    dayOfWeekData,
    comparisonChartData,
    monthlyComparisonChartData,
    comparisonTitle,
    dateRangeLabel,
    currentTotals,
    currentMonthTotals,
    monthlyRevenueGrowth,
    monthlyProfitGrowth,
    monthlyExpenseGrowth,
    fmt,
    loading,
    error,
  } = useReportsData(filterType, startDate, endDate)

  // Discover Peak Days
  const peakRevenue = trendChartData.revenue.length > 0 ? Math.max(...trendChartData.revenue) : 0
  const peakRevenueIdx = trendChartData.revenue.indexOf(peakRevenue)
  const peakDate = trendChartData.labels[peakRevenueIdx]

  const peakExpense = trendChartData.expense.length > 0 ? Math.max(...trendChartData.expense) : 0
  const peakExpenseIdx = trendChartData.expense.indexOf(peakExpense)
  const peakExpenseDate = trendChartData.labels[peakExpenseIdx]

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}%`
  }

  const getGrowthColor = (value: number) => {
    if (value >= 0) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950/80 p-5 sm:p-8 shadow-xl dark:shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors">
          <div className="flex items-start sm:items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/reports')}
              className="mt-1 sm:mt-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('Back to reports')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] text-sky-600 dark:text-sky-300/80">{t('Trend Analysis')}</p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{t('Cashflow & Trend Insights')}</h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('Deep dive into revenue, profit, and expense trends with detailed visual analytics.')}
          </p>
        </div>

        {/* Status Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            <p className="text-sm text-slate-500 animate-pulse">{t('Calculating trends and insights...')}</p>
          </div>
        )}

        {/* Status Error */}
        {error && (
          <div className="mb-10 rounded-[40px] border border-rose-500/20 bg-rose-500/10 p-8 text-sm text-rose-600 dark:text-rose-400">
            <p className="font-bold text-lg mb-2">{t('Analysis Error')}</p>
            {error}
          </div>
        )}

        {!loading && !error && trendChartData.revenue.length === 0 && trendChartData.expense.length === 0 && (
          <div className="mb-10 rounded-[40px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-400">
            <p className="font-bold mb-2">{t('No Data Available')}</p>
            <p>{t('There are no transactions or expenses recorded for the selected period. Please adjust your date range.')}</p>
          </div>
        )}

        {!loading && !error && (
          <>
        {/* Main Trend Chart */}
        <section className="mb-10 rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white p-5 sm:p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <LineChartIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Daily Cashflow Overview')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('Revenue, expense, and profit trend')}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {t('Track daily movement across your selected period')} ({dateRangeLabel})
          </p>
          <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/50">
            <ChartComponent data={trendChartData} />
          </div>
        </section>

        {/* Day of Week Pattern Analysis */}
        <section className="mb-10 rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white p-5 sm:p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Average Revenue by Day')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('Discover which days of the week perform best on average')}</p>
            </div>
          </div>
          <div className="h-[300px] sm:h-[350px] rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/50">
            <ChartComponent data={dayOfWeekData} variant="bar" />
          </div>
        </section>

        {/* Performance Anomalies - NEW SECTION */}
        <section className="mb-10 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8 dark:bg-emerald-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500 rounded-2xl text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t('Peak Revenue Day')}</h3>
                <p className="text-sm text-slate-500">{t('Your highest performing date')}</p>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{fmt.format(peakRevenue)}</div>
            <p className="mt-2 text-sm font-medium text-emerald-600 uppercase tracking-tighter italic">{t('Achieved on')} {peakDate}</p>
          </div>

          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8 dark:bg-rose-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-500 rounded-2xl text-white">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t('Highest Spending Day')}</h3>
                <p className="text-sm text-slate-500">{t('Day with maximum operational cost')}</p>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{fmt.format(peakExpense)}</div>
            <p className="mt-2 text-sm font-medium text-rose-600 uppercase tracking-tighter italic">{t('Occurred on')} {peakExpenseDate}</p>
          </div>
        </section>

        {/* Revenue Snapshot */}
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Comparison Chart */}
          <div className="rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('Momentum')}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{comparisonTitle}</p>
              </div>
            </div>
            <div className="h-[300px] sm:h-[350px] rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/50">
              <ChartComponent data={comparisonChartData} variant="bar" />
            </div>
          </div>

          {/* Revenue Details */}
          <div className="rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] text-slate-500 dark:text-slate-400 font-medium mb-2">
                {t('Revenue Snapshot')}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 mt-3 mb-6">
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {fmt.format(currentTotals.revenue)}
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {dateRangeLabel}
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900/90">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 font-medium">
                    {t('Gross Profit')}
                  </p>
                  <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                    {fmt.format(currentTotals.grossProfit)}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900/90">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 font-medium">
                    {t('Total Expenses')}
                  </p>
                  <p className="mt-4 text-3xl font-bold text-rose-600 dark:text-rose-400">
                    {fmt.format(currentTotals.expenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Comparison Section */}
        <section className="mb-10 rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Month Comparison')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('This month vs last month')}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Chart */}
            <div className="h-[300px] sm:h-[350px] rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/50">
              <ChartComponent data={monthlyComparisonChartData} variant="bar" />
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className={`rounded-3xl border border-slate-100 p-5 sm:p-6 ${getGrowthColor(monthlyRevenueGrowth)} dark:border-slate-700`}>
                <p className="text-xs uppercase tracking-[0.28em] font-medium">{t('This Month Revenue')}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {fmt.format(currentMonthTotals.revenue)}
                </p>
                <p className="mt-3 font-semibold text-sm">
                  {formatPercentage(monthlyRevenueGrowth)} {t('vs last month')}
                </p>
              </div>

              <div className={`rounded-3xl border border-slate-100 p-5 sm:p-6 ${getGrowthColor(monthlyProfitGrowth)} dark:border-slate-700`}>
                <p className="text-xs uppercase tracking-[0.28em] font-medium">{t('This Month Profit')}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {fmt.format(currentMonthTotals.grossProfit - currentMonthTotals.expenses)}
                </p>
                <p className="mt-3 font-semibold text-sm">
                  {formatPercentage(monthlyProfitGrowth)} {t('vs last month')}
                </p>
              </div>

              <div className={`rounded-3xl border border-slate-100 p-5 sm:p-6 ${getGrowthColor(monthlyExpenseGrowth)} dark:border-slate-700`}>
                <p className="text-xs uppercase tracking-[0.28em] font-medium">{t('This Month Expenses')}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {fmt.format(currentMonthTotals.expenses)}
                </p>
                <p className="mt-3 font-semibold text-sm">
                  {formatPercentage(monthlyExpenseGrowth)} {t('vs last month')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 dark:border-slate-700 dark:from-slate-900/50 dark:to-slate-900/30">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            {t('📈 Key Insights')}
          </h3>
          <div className="grid gap-6 md:grid-cols-3 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-2">{t('Trend Direction')}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {t('Monitor the overall direction of your revenue and profit over the selected period.')}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-2">{t('Monthly Performance')}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {t('Compare this month\'s performance with the previous month to identify growth patterns.')}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-2">{t('Budget Planning')}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {t('Use these insights to plan your budget and set realistic growth targets.')}
              </p>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </main>
  )
}
