import { Loader2, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import type { StockUpdateForm, ProductName } from '../../../types/types'

// ─── StockControlPanel ────────────────────────────────────────────────────────

interface StockControlPanelProps {
  form: StockUpdateForm
  onFormChange: (form: StockUpdateForm) => void
  products: ProductName[]
  onSubmit: () => void
  onQuickAdjust: (delta: number) => void
  submitting: boolean
  error: string
  success: string
}

export function StockControlPanel({
  form,
  onFormChange,
  products,
  onSubmit,
  onQuickAdjust,
  submitting,
  error,
  success,
}: StockControlPanelProps) {
  const isAdd = form.movementType === 'add'

  return (
    <aside
      aria-label="Stock control panel"
      className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30"
    >
      {/* Panel Header */}
      <div className="border-b border-slate-800 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          Control Panel
        </p>
        <h2 className="mt-1 text-base font-bold text-slate-100">Stock Update</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Adjust inventory levels per product.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="animate-in fade-in slide-in-from-top-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-top-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300"
        >
          {success}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {/* Product Select */}
        <div className="space-y-1.5">
          <label htmlFor="stock-product" className="block text-xs font-semibold text-slate-400">
            Product
          </label>
          <select
            id="stock-product"
            value={form.productId}
            onChange={(e) => onFormChange({ ...form, productId: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition-all focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/15 hover:border-slate-600"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type Toggle */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-400">Type</span>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => onFormChange({ ...form, movementType: 'add' })}
              aria-pressed={isAdd}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                isAdd
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Add Stock
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ ...form, movementType: 'reduce' })}
              aria-pressed={!isAdd}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                !isAdd
                  ? 'bg-rose-500/15 text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Reduce
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <label htmlFor="stock-qty" className="block text-xs font-semibold text-slate-400">
            Quantity
          </label>
          <input
            id="stock-qty"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => onFormChange({ ...form, quantity: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="Enter amount…"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition-all focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/15 hover:border-slate-600"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !form.productId || !form.quantity}
          className={`relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
            isAdd
              ? 'bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-400'
              : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/25 hover:from-rose-400 hover:to-orange-400'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          ) : (
            `${isAdd ? 'Add' : 'Reduce'} Stock`
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800" />

      {/* Quick Actions */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Quick Adjust
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: '+10', delta: 10 },
            { label: '+50', delta: 50 },
            { label: '+100', delta: 100 },
            { label: '-10', delta: -10 },
            { label: '-50', delta: -50 },
            { label: '-100', delta: -100 },
          ].map(({ label, delta }) => (
            <button
              key={label}
              type="button"
              onClick={() => onQuickAdjust(delta)}
              title={`Quick adjust ${label}`}
              className={`rounded-xl border py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
                delta > 0
                  ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15'
                  : 'border-rose-500/20 bg-rose-500/8 text-rose-400 hover:bg-rose-500/15'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600">
          Select a product above before using quick adjust.
        </p>
      </div>
    </aside>
  )
}
