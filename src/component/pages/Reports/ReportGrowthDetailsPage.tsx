import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { useReportsData } from '../../hooks/useReportsData'
import { useLanguage } from '../../providers/useLanguage'
import type { FilterType } from '../../../types/types'

export default function ReportGrowthDetailsPage() {
  const { t } = useLanguage()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Ambil filter dari URL agar data sama dengan halaman Reports utama
  const filterType = (searchParams.get('type') as FilterType) || 'today'
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''

  const { growthCards, averageCards, currentTotals, previousTotals, loading, error, fmt } = useReportsData(filterType, startDate, endDate)

  // Derived Metrics for Efficiency
  const grossMargin = currentTotals.revenue > 0 
    ? (currentTotals.grossProfit / currentTotals.revenue) * 100 
    : 0
  const netMargin = currentTotals.revenue > 0 
    ? ((currentTotals.grossProfit - currentTotals.expenses) / currentTotals.revenue) * 100 
    : 0
  const expenseRatio = currentTotals.revenue > 0 
    ? (currentTotals.expenses / currentTotals.revenue) * 100 
    : 0

  const isPositiveGrowth = (growthLabel: string) => {
    return growthLabel.includes('+') || (parseInt(growthLabel) >= 0)
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
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] text-sky-600 dark:text-sky-300/80">{t('Performance Analysis')}</p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{t('Growth & Performance Metrics')}</h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('Comprehensive view of your business growth rates and performance averages.')}
          </p>
        </div>

        {/* Status Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
            <p className="text-sm text-slate-500 animate-pulse">{t('Analyzing performance data...')}</p>
          </div>
        )}

        {/* Status Error */}
        {error && (
          <div className="mb-10 rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-600 dark:text-rose-400">
            <p className="font-bold mb-1">{t('Failed to load data:')}</p>
            {error}
          </div>
        )}

        {!loading && !error && currentTotals.revenue === 0 && currentTotals.expenses === 0 && (
          <div className="mb-10 rounded-[40px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-400">
            <p className="font-bold mb-2">{t('No Data Available')}</p>
            <p>{t('There are no transactions or expenses recorded for the selected period. Please adjust your date range.')}</p>
          </div>
        )}

        {!loading && !error && (
          <>
        {/* Growth Cards Section */}
        <section className="mb-10">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Growth Rate Analysis')}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('Track key growth indicators and performance trends')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {growthCards.map((card) => {
              const isPositive = isPositiveGrowth(card.growthLabel)
              return (
                <div
                  key={card.title}
                  className="group rounded-3xl sm:rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-lg transition hover:shadow-xl hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-950/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.35em] text-slate-500 dark:text-slate-400 mb-2">
                        {card.title}
                      </p>
                      <p className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                        {card.displayValue}
                      </p>
                    </div>
                    <div
                      className={`flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold ${
                        isPositive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {card.growthLabel}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 dark:border-slate-700">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {card.helpText}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Efficiency Metrics - NEW SECTION */}
        <section className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Business Efficiency')}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('Ratios to measure how effectively you generate profit')}</p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-950/80">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t('Gross Margin')}</p>
              <div className="text-3xl sm:text-4xl font-black text-emerald-500">{grossMargin.toFixed(1)}%</div>
              <p className="mt-2 text-xs text-slate-500">{t('Percentage of revenue kept after COGS.')}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-950/80">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t('Net Margin')}</p>
              <div className="text-3xl sm:text-4xl font-black text-sky-500">{netMargin.toFixed(1)}%</div>
              <p className="mt-2 text-xs text-slate-500">{t('Actual profit percentage after all costs.')}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-slate-950/80">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t('Expense Ratio')}</p>
              <div className="text-3xl sm:text-4xl font-black text-rose-500">{expenseRatio.toFixed(1)}%</div>
              <p className="mt-2 text-xs text-slate-500">{t('Portion of revenue consumed by expenses.')}</p>
            </div>
          </div>
        </section>

        {/* Comparative Table - NEW SECTION */}
        <section className="mb-10 rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-950/80">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-semibold">{t('Comparative Performance')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('Direct comparison with the previous period')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-8 py-4">{t('Metric')}</th>
                  <th className="px-8 py-4">{t('Previous Period')}</th>
                  <th className="px-8 py-4">{t('Current Period')}</th>
                  <th className="px-8 py-4">{t('Delta')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <tr>
                  <td className="px-8 py-5 font-medium">{t('Total Revenue')}</td>
                  <td className="px-8 py-5 text-slate-500">{fmt.format(previousTotals.revenue)}</td>
                  <td className="px-8 py-5 font-bold">{fmt.format(currentTotals.revenue)}</td>
                  <td className={`px-8 py-5 font-bold ${currentTotals.revenue >= previousTotals.revenue ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmt.format(currentTotals.revenue - previousTotals.revenue)}
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-5 font-medium">{t('Gross Profit')}</td>
                  <td className="px-8 py-5 text-slate-500">{fmt.format(previousTotals.grossProfit)}</td>
                  <td className="px-8 py-5 font-bold">{fmt.format(currentTotals.grossProfit)}</td>
                  <td className={`px-8 py-5 font-bold ${currentTotals.grossProfit >= previousTotals.grossProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmt.format(currentTotals.grossProfit - previousTotals.grossProfit)}
                  </td>
                </tr>
                <tr>
                  <td className="px-8 py-5 font-medium">{t('Total Expenses')}</td>
                  <td className="px-8 py-5 text-slate-500">{fmt.format(previousTotals.expenses)}</td>
                  <td className="px-8 py-5 font-bold text-rose-500">{fmt.format(currentTotals.expenses)}</td>
                  <td className={`px-8 py-5 font-bold ${currentTotals.expenses <= previousTotals.expenses ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {fmt.format(currentTotals.expenses - previousTotals.expenses)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Averages Section */}
        <section>
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-600 dark:bg-sky-400 flex items-center justify-center">
                <span className="text-white text-sm font-bold">Ø</span>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('Average Performance')}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t('Key averages across your business operations')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {averageCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/80"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-medium">
                  {card.title}
                </p>
                <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {card.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8 dark:border-slate-700 dark:from-slate-900/50 dark:to-slate-900/30">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('📊 Understanding These Metrics')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-2">{t('Growth Rate')}</p>
              <p>{t('Percentage change compared to the previous period. Positive values indicate growth.')}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-2">{t('Averages')}</p>
              <p>{t('Mean values across your selected period. Use these to understand typical performance.')}</p>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </main>
  )
}
