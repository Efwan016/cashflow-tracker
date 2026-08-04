import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useProducts } from '../hooks/useProducts'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { TransactionForm } from './TransactionForm'
import ChartComponent from '../components/Chart'
import { Pagination } from '../components/Pagination'
import { createNumberFormatter } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Transaction as TransactionType } from '../../types/types'
import { useLanguage } from '../providers/useLanguage'
import type { Language } from '../../lib/i18n'
import { toast } from 'react-toastify'
import { useCurrencyFormatter } from '../providers/useCurrencyFormatter'

const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-US',
  id: 'id-ID',
  es: 'es-ES',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ar: 'ar-SA',
}

export default function Transaction() {
  const { t, language } = useLanguage()
  const [filterType, setFilterType] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLSelectElement | null>(null)

  const { transactions, isLoading, refresh, removeTransaction, editTransaction } = useTransactions(userId, filterType, startDate, endDate);
  const { products } = useProducts(userId);
  const handleFormSuccess = useCallback(() => {
    refresh()
    firstInputRef.current?.focus()
  }, [refresh])
  const { form, setForm, handleSelectProduct, handleSubmit, isSubmitting, total, profit } = useTransactionForm(userId, products, handleFormSuccess);

  const [currentPage, setCurrentPage] = useState(1)
  const [bestSellingCurrentPage, setBestSellingCurrentPage] = useState(1)
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [isUpdatingTransaction, setIsUpdatingTransaction] = useState(false)
  const [transactionEditForm, setTransactionEditForm] = useState({
    productId: '',
    manualName: '',
    qty: '1',
    total: '0',
    modalPrice: '0',
  })
  const itemsPerPage = 10
  const itemsPerPageBestSelling = 5

  const bestSelling = useMemo(() => {
    const productSales = new Map<
      string,
      { name: string; qty: number; revenue: number; profit: number }
    >()

    transactions.forEach((tx) => {
      const key =
        tx.product_name ||
        products.find((p) => p.id === tx.product_id)?.name ||
        t('Manual Sale')

      const existing = productSales.get(key) || {
        name: key,
        qty: 0,
        revenue: 0,
        profit: 0,
      }
      
      existing.qty += tx.qty ?? 0
      existing.revenue += tx.total ?? 0
      existing.profit += tx.profit ?? 0

      productSales.set(key, existing)
    })

    return Array.from(productSales.values()).sort((a, b) => b.qty - a.qty)
  }, [transactions, products, t])

  const paginatedBestSelling = useMemo(() => {
    return bestSelling.slice((bestSellingCurrentPage - 1) * itemsPerPageBestSelling, bestSellingCurrentPage * itemsPerPageBestSelling)
  }, [bestSelling, bestSellingCurrentPage])

  const bestSellingChartData = useMemo(() => {
  const topProducts = bestSelling.slice(0, 5)

  return {
    labels: topProducts.map((p) => p.name),
    revenue: topProducts.map((p) => p.revenue),
    expense: [],
    netProfit: [],
  }
}, [bestSelling])

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!isMounted) return

      setUserId(data.user?.id ?? null)
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  const fmt = useCurrencyFormatter()
  const num = useMemo(() => createNumberFormatter(), [])
  const formatDisplayDate = useCallback(
    (date: string, options: Intl.DateTimeFormatOptions) =>
      new Date(date).toLocaleDateString(LANGUAGE_LOCALES[language], options),
    [language]
  )

  const paginatedTransactions = useMemo(() => {
    return transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [transactions, currentPage])

  const summary = useMemo(() => {
    const qty = transactions.reduce((s: number, t: TransactionType) => s + t.qty, 0);
    const rev = transactions.reduce((s: number, t: TransactionType) => s + t.total, 0);
    const pro = transactions.reduce((s: number, t: TransactionType) => s + (t.profit ?? 0), 0);
    return { qty, rev, pro };
  }, [transactions]);

  const startTransactionEdit = useCallback((transaction: TransactionType) => {
    setEditingTransactionId(transaction.id)
    setTransactionEditForm({
      productId: transaction.product_id || '',
      manualName: transaction.product_name || '',
      qty: String(transaction.qty || 1),
      total: String(transaction.total || 0),
      modalPrice: String(transaction.harga_modal || 0),
    })
  }, [])

  const cancelTransactionEdit = useCallback(() => {
    setEditingTransactionId(null)
    setTransactionEditForm({
      productId: '',
      manualName: '',
      qty: '1',
      total: '0',
      modalPrice: '0',
    })
  }, [])

  const handleTransactionProductEdit = useCallback((productId: string) => {
    const product = products.find((item) => item.id === productId)
    const qty = Number(transactionEditForm.qty) || 0

    setTransactionEditForm(prev => ({
      ...prev,
      productId,
      manualName: product ? product.name : '',
      total: product ? String(qty * product.harga_jual) : prev.total,
      modalPrice: product ? String(product.harga_modal) : prev.modalPrice,
    }))
  }, [products, transactionEditForm.qty])

  const saveTransactionEdit = useCallback(async (transaction: TransactionType) => {
    const qty = Number(transactionEditForm.qty)
    const totalValue = Number(transactionEditForm.total)
    const modalPrice = Number(transactionEditForm.modalPrice)

    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    if (!Number.isFinite(totalValue) || !Number.isFinite(modalPrice) || totalValue < 0 || modalPrice < 0) {
      toast.error('Amount must be greater than zero.')
      return
    }

    if (!transactionEditForm.productId && !transactionEditForm.manualName.trim()) {
      toast.error('Product name is required')
      return
    }

    const product = products.find((item) => item.id === transactionEditForm.productId)
    const salePrice = qty > 0 ? totalValue / qty : 0

    setIsUpdatingTransaction(true)
    const updated = await editTransaction(transaction, {
      product_id: transactionEditForm.productId || null,
      product_name: product ? product.name : transactionEditForm.manualName.trim(),
      qty,
      harga_jual: salePrice,
      harga_modal: modalPrice,
      total: totalValue,
      profit: totalValue - modalPrice * qty,
      mode: transactionEditForm.productId ? 'WITH_STOCK' : 'MANUAL',
    })
    setIsUpdatingTransaction(false)

    if (updated) cancelTransactionEdit()
  }, [cancelTransactionEdit, editTransaction, products, transactionEditForm])



  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        <div className="mb-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-6 sm:p-8 shadow-xl dark:shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300/80">{t('Sales Entry')}</p>
          <h1 className="mt-3 text-2xl sm:text-4xl font-semibold text-slate-900 dark:text-white">{t('Record transaction')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            {t('Log your sales to automatically track revenue, profit, and inventory changes. Use manual mode for items not tracked in the product catalog.')}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr]">
          <div className="w-full overflow-hidden">
          <TransactionForm
            products={products}
            formData={form}
            onFieldChange={(f, v) => setForm(prev => ({ ...prev, [f]: v }))}
            onSelectProduct={handleSelectProduct}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            calculatedTotal={fmt.format(total)}
            expectedProfit={fmt.format(profit)}
            initialFocusRef={firstInputRef}
          />
          </div>
        </div>

        <div className="mt-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/5 bg-white dark:bg-slate-900/90 dark:from-slate-900/50 dark:to-slate-950/40 p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-colors overflow-hidden">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400/80">{t('History')}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {filterType === 'all' && t('Recent Activity')}
                {filterType === 'today' && t("Today's Sales")}
                {filterType === 'last7' && t('Last 7 Days')}
                {filterType === 'thisMonth' && t('This Month')}
                {filterType === 'specific' && (startDate ? `${t('Sales on')} ${formatDisplayDate(startDate, { day: 'numeric', month: 'long', year: 'numeric' })}` : t('Specific Date'))}
                {filterType === 'range' && (startDate && endDate ? `${t('Sales from')} ${formatDisplayDate(startDate, { day: 'numeric', month: 'short', year: 'numeric' })} ${t('to')} ${formatDisplayDate(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}` : t('Date Range'))}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  if (e.target.value !== 'specific' && e.target.value !== 'range') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-3 py-2 text-[10px] font-bold text-slate-900 dark:text-slate-100 outline-none backdrop-blur-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/90 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-colors"
              >
                <option value="all">{t('Recent activity')}</option>
                <option value="today">{t('Today')}</option>
                <option value="last7">{t('Last 7 Days')}</option>
                <option value="thisMonth">{t('This Month')}</option>
                <option value="specific">{t('Pick a Date')}</option>
                <option value="range">{t('Date Range')}</option>
              </select>

              {(filterType === 'specific' || filterType === 'range') && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-3 py-2 text-[10px] font-medium text-slate-900 dark:text-white outline-none backdrop-blur-xl transition-all focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 dark:[color-scheme:dark] hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  />
                  {filterType === 'range' && (
                    <>
                      <span className="text-slate-500 text-[10px]">{t('to')}</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 px-3 py-2 text-[10px] font-medium text-slate-900 dark:text-white outline-none backdrop-blur-xl transition-all focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 dark:[color-scheme:dark] hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/90">
            <table className="w-full text-left text-[10px] text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900 text-[9px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">{t('Product')}</th>
                  <th className="px-3 py-3 font-medium text-center">{t('Qty')}</th>
                  <th className="px-3 py-3 font-medium">{t('Revenue')}</th>
                  <th className="px-3 py-3 font-medium hidden sm:table-cell">{t('Modal')}</th>
                  <th className="px-3 py-3 font-medium">{t('Profit')}</th>
                  <th className="px-3 py-3 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('Loading transactions...')}</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {t('No transactions recorded for this period.')}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => {
                    const isEditing = editingTransactionId === transaction.id
                    const editQty = Number(transactionEditForm.qty) || 0
                    const editTotal = Number(transactionEditForm.total) || 0
                    const editModal = Number(transactionEditForm.modalPrice) || 0
                    const editProfit = editTotal - editModal * editQty

                    return (
                      <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                          {isEditing ? (
                            <div className="grid gap-2">
                              <select
                                value={transactionEditForm.productId}
                                onChange={(event) => handleTransactionProductEdit(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[10px] text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                              >
                                <option value="">{t('Manual Sale')}</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                              </select>
                              {!transactionEditForm.productId && (
                                <input
                                  value={transactionEditForm.manualName}
                                  onChange={(event) => setTransactionEditForm(prev => ({ ...prev, manualName: event.target.value }))}
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[10px] text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                                />
                              )}
                            </div>
                          ) : (
                            transaction.product_name || t('Manual Sale')
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={transactionEditForm.qty}
                              onChange={(event) => setTransactionEditForm(prev => ({ ...prev, qty: event.target.value }))}
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-center text-[10px] text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                            />
                          ) : (
                            num.format(transaction.qty)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={transactionEditForm.total}
                              onChange={(event) => setTransactionEditForm(prev => ({ ...prev, total: event.target.value }))}
                              className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[10px] text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                            />
                          ) : (
                            fmt.format(transaction.total)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={transactionEditForm.modalPrice}
                              onChange={(event) => setTransactionEditForm(prev => ({ ...prev, modalPrice: event.target.value }))}
                              className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-[10px] text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
                            />
                          ) : (
                            fmt.format(transaction.harga_modal || 0)
                          )}
                        </td>
                        <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:table-cell">
                          {fmt.format(isEditing ? editProfit : transaction.profit || 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveTransactionEdit(transaction)}
                                disabled={isUpdatingTransaction}
                                className="rounded-lg border border-emerald-500/10 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {t('Save')}
                              </button>
                              <button
                                type="button"
                                onClick={cancelTransactionEdit}
                                disabled={isUpdatingTransaction}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                              >
                                {t('Cancel')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => startTransactionEdit(transaction)}
                                disabled={isLoading || isUpdatingTransaction}
                                className="rounded-lg border border-sky-500/10 bg-sky-500/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 transition hover:bg-sky-500/20 disabled:opacity-50"
                              >
                                {t('Edit')}
                              </button>
                              <button
                                onClick={() => removeTransaction(transaction)}
                                disabled={isLoading}
                                className="rounded-lg border border-rose-500/10 bg-rose-500/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                {t('Delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-sky-900/50 text-slate-900 dark:text-slate-200 transition-colors font-bold">
                  <tr>
                    <td className="px-3 py-3">{t('Total')}</td>
                    <td className="px-3 py-3 text-center font-mono">{num.format(summary.qty)}</td>
                    <td className="px-3 py-3">{fmt.format(summary.rev)}</td>
                    <td className="px-3 py-3 hidden sm:table-cell"></td>
                    <td className="px-3 py-3 text-emerald-600 dark:text-emerald-400">{fmt.format(summary.pro)}</td>
                    <td className="px-3 py-3 text-right"></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!isLoading && transactions.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalItems={transactions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>

        {/* Best Selling Performance */}
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-900/90 dark:border-slate-200 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-4 sm:p-6 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors overflow-hidden">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">{t('Best Selling Performance')}</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950/20 dark:to-slate-900/40 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors">
              <table className="w-full min-w-[300px] text-left text-[9px] text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-900/90 dark:border-slate-200 bg-white dark:bg-slate-900/90 text-[8px] uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-2 py-2 font-medium">{t('Product')}</th>
                    <th className="px-2 py-2 font-medium text-center">{t('Qty Sold')}</th>
                    <th className="px-2 py-2 font-medium">{t('Revenue')}</th>
                    <th className="px-2 py-2 font-medium">{t('Profit')}</th>
                  </tr>
                </thead>
                <tbody className="border border-slate-900/90 dark:border-slate-200 divide-y divide-slate-100 dark:divide-slate-900/90 bg-white dark:bg-slate-900/90">
                  {paginatedBestSelling.map((item, index) => (
                    <tr key={item.name} className="hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-sky-500/10 dark:from-sky-500/20 to-indigo-500/10 dark:to-indigo-500/20 text-[8px] font-bold text-sky-600 dark:text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                          {index + 1}
                        </span>
                        {item.name}
                      </td>
                      <td className="px-2 py-2 text-center font-mono">{num.format(item.qty)}</td>
                      <td className="px-2 py-2">{fmt.format(item.revenue)}</td>
                      <td className="px-2 py-2 text-emerald-600 dark:text-emerald-400 font-semibold">{fmt.format(item.profit)}</td>
                    </tr>
                  ))}
                </tbody>
                {bestSelling.length > itemsPerPageBestSelling && (
                  <tfoot className="border-t rounded-lg border-slate-900/90 dark:border-slate-200 divide-y divide-slate-100 dark:divide-slate-900/90 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-400 transition-colors">
                    <tr>
                      <td colSpan={4} className="px-2 py-2">
                        <Pagination
                          currentPage={bestSellingCurrentPage}
                          totalItems={bestSelling.length}
                          itemsPerPage={itemsPerPageBestSelling}
                          onPageChange={setBestSellingCurrentPage}
                        />
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-4 sm:p-6 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors overflow-hidden">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">{t('Sales Performance Chart')}</h3>
            <div className="h-48 sm:h-56">
              <ChartComponent data={bestSellingChartData} variant="bar" />
            </div>
          </div>
        </div>

        {/* Daily Net Profit Report */}
      </div>
    </main>
  )
}
