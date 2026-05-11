import { Trash2, ArrowDown, ArrowUp } from 'lucide-react'
import { TableSkeleton } from '../../components/InventorySkeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import type { StockLogRecord, SortOption, ProductName, StockLogForm } from '../../../types/types'

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'IN' | 'OUT' }) {
  if (type === 'IN') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <ArrowDown className="h-2.5 w-2.5" />
        IN
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
      <ArrowUp className="h-2.5 w-2.5" />
      OUT
    </span>
  )
}

// ─── StockLogsForm ────────────────────────────────────────────────────────────

interface StockLogsFormProps {
  form: StockLogForm
  products: ProductName[]
  onFormChange: (form: StockLogForm) => void
  onSubmit: () => void
  loading: boolean
  error: string
  success: string
}

export function StockLogsForm({
  form,
  products,
  onFormChange,
  onSubmit,
  loading,
  error,
  success,
}: StockLogsFormProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Record Movement
      </p>

      {error && (
        <div role="alert" className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Product */}
        <div className="space-y-1">
          <label htmlFor="log-product" className="block text-[11px] font-semibold text-slate-500">
            Product
          </label>
          <select
            id="log-product"
            value={form.productId}
            onChange={(e) => onFormChange({ ...form, productId: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15"
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label htmlFor="log-qty" className="block text-[11px] font-semibold text-slate-500">
            Quantity
          </label>
          <input
            id="log-qty"
            type="number"
            min={1}
            value={form.qty}
            onChange={(e) => onFormChange({ ...form, qty: e.target.value })}
            placeholder="0"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15"
          />
        </div>

        {/* Type + Submit */}
        <div className="space-y-1">
          <label htmlFor="log-type" className="block text-[11px] font-semibold text-slate-500">
            Type
          </label>
          <div className="flex gap-2">
            <select
              id="log-type"
              value={form.type}
              onChange={(e) => onFormChange({ ...form, type: e.target.value as 'IN' | 'OUT' })}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition-all focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !form.productId || !form.qty}
              className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── StockLogsTable ───────────────────────────────────────────────────────────

interface StockLogsTableProps {
  logs: StockLogRecord[]
  paginatedLogs: StockLogRecord[]
  productMap: Map<string, string>
  loading: boolean
  isDeleting: boolean
  onDelete: (id: string, productId: string, qty: number, type: 'IN' | 'OUT') => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  filterType: 'ALL' | 'IN' | 'OUT'
  onFilterTypeChange: (t: 'ALL' | 'IN' | 'OUT') => void
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  formatter: { format: (n: number) => string }
  // Log form props
  form: StockLogForm
  products: ProductName[]
  onFormChange: (form: StockLogForm) => void
  onFormSubmit: () => void
  formLoading: boolean
  formError: string
  formSuccess: string
}

export function StockLogsTable({
  logs,
  paginatedLogs,
  productMap,
  loading,
  isDeleting,
  onDelete,
  sortBy,
  onSortChange,
  filterType,
  onFilterTypeChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  formatter,
  form,
  products,
  onFormChange,
  onFormSubmit,
  formLoading,
  formError,
  formSuccess,
}: StockLogsTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Log Entry Form */}
      <StockLogsForm
        form={form}
        products={products}
        onFormChange={onFormChange}
        onSubmit={onFormSubmit}
        loading={formLoading}
        error={formError}
        success={formSuccess}
      />

      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Filter Tabs */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-0.5">
          {(['ALL', 'IN', 'OUT'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFilterTypeChange(t)}
              aria-pressed={filterType === t}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                filterType === t
                  ? t === 'IN'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : t === 'OUT'
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-slate-800 text-slate-200'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'ALL' ? 'All' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-300 outline-none transition-all hover:border-slate-700 focus:border-sky-500/50"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="qty-desc">Qty (High → Low)</option>
            <option value="qty-asc">Qty (Low → High)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Stock movement logs">
            <thead className="border-b border-slate-800 bg-slate-900/60">
              <tr>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Product
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Type
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Qty
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Date
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : logs.length === 0 ? (
                <EmptyState
                  title="No stock logs found"
                  description="Record IN/OUT movements to see the history here."
                />
              ) : (
                paginatedLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`group transition-colors duration-100 hover:bg-white/[0.02] ${
                      idx % 2 === 1 ? 'bg-slate-900/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-slate-100">
                      {productMap.get(log.product_id) ?? log.product_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <TypeBadge type={log.type} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-100">
                      {formatter.format(log.qty)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(log.id, log.product_id, log.qty, log.type)}
                        disabled={isDeleting}
                        aria-label="Delete stock log"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-1.5 text-[11px] font-bold text-rose-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={logs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  )
}
