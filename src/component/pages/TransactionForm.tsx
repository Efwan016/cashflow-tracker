import React from 'react';
import type { TransactionFormProps } from '../../types/types';
import { useLanguage } from '../providers/useLanguage';


export const TransactionForm: React.FC<TransactionFormProps> = ({
  products,
  formData,
  onFieldChange,
  onSelectProduct,
  onSubmit,
  isSubmitting,
  calculatedTotal,
  expectedProfit,
  initialFocusRef
}) => {
  const { t } = useLanguage();
  const isWithStock = !!formData.productId;

  return (
    <section className="rounded-[28px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-5 sm:p-6 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors overflow-hidden">
      <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-slate-500">{t('Mode')}:</span>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
          isWithStock 
            ? 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20' 
            : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
        }`}>
          {isWithStock ? t('Inventory Linked') : t('Manual Entry')}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-3 text-left md:col-span-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Select product')}</span>
          <select
            ref={initialFocusRef}
            value={formData.productId}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-3 py-3 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90 cursor-pointer"
          >
            <option value="" className="text-slate-900 dark:text-white">{t('Manual Input (No Stock Sync)')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        {!isWithStock && (
          <label className="grid gap-3 text-left md:col-span-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Product name')}</span>
            <input
              type="text"
              placeholder={t('Enter product name')}
              value={formData.manualName}
              onChange={(e) => onFieldChange('manualName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-3 py-3 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
            />
          </label>
        )}

        <label className="grid gap-3 text-left">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Sale price')}</span>
          <input
            type="number"
            value={Number(formData.salePrice) || ''}
            placeholder={t('0')}
            onChange={(e) => onFieldChange('salePrice', e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-3 py-3 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
          />
        </label>

        <label className="grid gap-3 text-left">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Cost price')}</span>
          <input
            type="number"
            value={Number(formData.modalPrice) || ''}
            placeholder={t('0')}
            onChange={(e) => onFieldChange('modalPrice', e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-3 py-3 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 shadow-lg transition-colors">
          <p className="text-xs uppercase tracking-widest text-slate-500">{t('Total')}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{calculatedTotal}</h2>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 shadow-lg transition-colors">
          <p className="text-xs uppercase tracking-widest text-slate-500">{t('Profit')}</p>
          <h2 className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-400">{expectedProfit}</h2>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:from-sky-400 hover:to-indigo-400 hover:shadow-xl hover:shadow-sky-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t('Saving...') : t('Save Transaction')}
      </button>
    </form>
    </section>
  )
};
