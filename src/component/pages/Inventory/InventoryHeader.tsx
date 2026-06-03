import { Link } from 'react-router-dom'
import { Search, RefreshCw, Plus, X } from 'lucide-react'
import type  { InventoryHeaderProps } from '../../../types/types'
import { useLanguage } from '../../providers/useLanguage'

// ─── InventoryHeader ──────────────────────────────────────────────────────────


export function InventoryHeader({
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  realtimeConnected,
}: InventoryHeaderProps) {
  const { t } = useLanguage()

  return (
    <header className="relative overflow-hidden rounded-2xl border border-black/5 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 p-6 shadow-xl dark:shadow-slate-950/40 backdrop-blur-xl transition-colors duration-300">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-sky-500/5 blur-3xl"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400/80">
              {t('Inventory')}
            </span>
            {/* Realtime indicator */}
            <span
              title={realtimeConnected ? t('Realtime active') : t('Connecting...')}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-500"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  realtimeConnected
                    ? 'animate-pulse bg-emerald-400'
                    : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              {realtimeConnected ? t('Live') : t('Connecting')}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('Inventory Management')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('Manage stock, monitor inventory movement, and track product history in realtime.')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('Search products...')}
              aria-label={t('Search products')}
              className="h-9 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label={t('Clear search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label={t('Refresh inventory')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Quick Add */}
          <Link
            to="/products"
            aria-label={t('Add stock')}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-sky-500 px-3.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:block">{t('Add Stock')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
