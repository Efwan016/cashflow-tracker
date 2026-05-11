import React from 'react';
import type { Product } from './Dashboard';

interface TransactionFormProps {
  products: Product[];
  formData: {
    productId: string;
    manualName: string;
    qty: string;
    salePrice: string;
    modalPrice: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onSelectProduct: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  calculatedTotal: string;
  expectedProfit: string;
  initialFocusRef?: React.RefObject<HTMLSelectElement | null>;
}

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
  const isWithStock = !!formData.productId;

  return (
    <section className="rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-8 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors">
      <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-slate-500">Mode:</span>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
          isWithStock 
            ? 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20' 
            : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
        }`}>
          {isWithStock ? 'Inventory Linked' : 'Manual Entry'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-3 text-left md:col-span-2">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Select product</span>
          <select
            ref={initialFocusRef}
            value={formData.productId}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90 cursor-pointer"
          >
            <option value="" className="text-slate-900 dark:text-white">Manual Input (No Stock Sync)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        {!isWithStock && (
          <label className="grid gap-3 text-left md:col-span-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Product name</span>
            <input
              type="text"
              placeholder="Enter product name"
              value={formData.manualName}
              onChange={(e) => onFieldChange('manualName', e.target.value)}
              className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
            />
          </label>
        )}

        <label className="grid gap-3 text-left">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sale price</span>
          <input
            type="number"
            value={formData.salePrice}
            onChange={(e) => onFieldChange('salePrice', e.target.value)}
            className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
          />
        </label>

        <label className="grid gap-3 text-left">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cost price</span>
          <input
            type="number"
            value={formData.modalPrice}
            onChange={(e) => onFieldChange('modalPrice', e.target.value)}
            className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/60 p-6 border border-slate-200 dark:border-slate-800 shadow-lg transition-colors">
          <p className="text-xs uppercase tracking-widest text-slate-500">Total</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{calculatedTotal}</h2>
        </div>
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/60 p-6 border border-slate-200 dark:border-slate-800 shadow-lg transition-colors">
          <p className="text-xs uppercase tracking-widest text-slate-500">Profit</p>
          <h2 className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{expectedProfit}</h2>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:from-sky-400 hover:to-indigo-400 hover:shadow-xl hover:shadow-sky-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
    </section>
  )
};