import { Check, X, Pencil } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { TableSkeleton } from '../../components/InventorySkeleton'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import type { StockRecord, SortOption }  from "../../../types/types"
import { useLanguage } from '../../providers/useLanguage'

// ─── InventoryTable ───────────────────────────────────────────────────────────

interface InventoryTableProps {
  items: StockRecord[]
  paginatedItems: StockRecord[]
  loading: boolean
  editingId: string | null
  editQty: string
  editName: string
  onEditQtyChange: (v: string) => void
  onEditNameChange: (v: string) => void
  onStartEdit: (item: StockRecord) => void
  onConfirmEdit: (item: StockRecord) => void
  onCancelEdit: () => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  formatter: { format: (n: number) => string }
}

export function InventoryTable({
  items,
  paginatedItems,
  loading,
  editingId,
  editQty,
  editName,
  onEditQtyChange,
  onEditNameChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  sortBy,
  onSortChange,
  currentPage,
  itemsPerPage,
  onPageChange,
  formatter,
}: InventoryTableProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-3">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {loading ? '—' : `${items.length} ${items.length !== 1 ? t('products') : t('product')}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">{t('Sort')}:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 outline-none focus:border-sky-500/50"
          >
            <option value="name-asc">{t('Name (A-Z)')}</option>
            <option value="name-desc">{t('Name (Z-A)')}</option>
            <option value="qty-desc">{t('Quantity (High-Low)')}</option>
            <option value="qty-asc">{t('Quantity (Low-High)')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label={t('Current inventory')}>
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t('Product')}
                </th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t('Qty')}
                </th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t('Status')}
                </th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t('Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
              {loading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : items.length === 0 ? (
                <EmptyState
                  title={t('No inventory data found')}
                  description={t('Add products and update stock to see inventory here.')}
                />
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`group transition-colors duration-100 hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                      idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''
                    }`}
                  >
                    {/* Product Name */}
                    <td className="px-5 py-3.5">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => onEditNameChange(e.target.value)}
                          autoFocus
                          aria-label={t('Edit product name')}
                          className="w-full rounded-lg border border-sky-500/50 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {item.product_name ?? item.product_id}
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-3.5 text-center">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => onEditQtyChange(e.target.value)}
                          aria-label={t('Edit quantity')}
                          className="w-20 rounded-lg border border-sky-500/50 bg-white dark:bg-slate-900 px-2 py-1.5 text-center text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                      ) : (
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatter.format(item.total)}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge total={item.total} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onConfirmEdit(item)}
                            aria-label={t('Save changes')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all hover:bg-emerald-500/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={onCancelEdit}
                            aria-label={t('Cancel edit')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition-all hover:bg-slate-800"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onStartEdit(item)}
                          aria-label={`${t('Edit')} ${item.product_name ?? t('product')}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/8 px-3 py-1.5 text-[11px] font-bold text-sky-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-sky-500/15 hover:text-sky-300"
                        >
                          <Pencil className="h-3 w-3" />
                          {t('Edit')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={items.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  )
}
