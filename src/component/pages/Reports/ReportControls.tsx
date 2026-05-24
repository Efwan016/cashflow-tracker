import type { FilterType } from '../../../types/types'
import { IC } from '../../components/Icons'
import { useLanguage } from '../../providers/useLanguage'
import type { ReportControlsProps } from '../../../types/types'

export default function ReportControls({
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
}: ReportControlsProps) {
  const { t } = useLanguage()
  return (
    <div className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-slate-50 shadow-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="border-b border-slate-200 bg-slate-100/80 p-6 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300">
              {t('Report Control')}
            </p>

            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t('Filter & sync report data')}
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {t('Date filtering applies to transactions, expenses, charts, product performance, growth, and averages.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
              {t('Live Sync')}
            </span>

            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
              {realtimeConnected ? t('Connected') : t('Pending')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                {t('Date preset')}
              </span>

              <select
                value={filterType}
                onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
              >
                <option value="today">{t('Today')}</option>
                <option value="last7">{t('Last 7 days')}</option>
                <option value="thisMonth">{t('This month')}</option>
                <option value="last3month">{t('Last 3 months')}</option>
                <option value="specific">{t('Pick a Date')}</option>
                <option value="range">{t('Date range')}</option>
              </select>
            </label>

            <div className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                {t('Selected period')}
              </span>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {dateRangeLabel}
                  </p>

                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200">
                    {filterTypeLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(filterType === 'specific' || filterType === 'range') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                  {t('Start date')}
                </span>

                <input
                  type="date"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={startDate}
                  onChange={(event) => onDateChange('start', event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
                  placeholder="YYYY-MM-DD"
                />
              </label>

              {filterType === 'range' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                      {t('End date')}
                    </span>

                  <input
                    type="date"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={endDate}
                    onChange={(event) => onDateChange('end', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-500/10"
                    placeholder="YYYY-MM-DD"
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex lg:w-[180px] lg:flex-col lg:justify-end">
            <button
            type="button"
            onClick={onRefresh}
            disabled={loading || isRefreshing}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <span className={loading || isRefreshing ? 'animate-spin' : ''}>
              <IC.Refresh />
            </span>
            <span>{loading || isRefreshing ? t('Syncing...') : t('Refresh')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
