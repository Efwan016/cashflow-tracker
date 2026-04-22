import { useState, useMemo, useEffect } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useProducts } from '../hooks/useProducts'
import { useTransactionForm } from '../hooks/useTransactionForm'
import { TransactionForm } from './TransactionForm'
import { createCurrencyFormatter, createNumberFormatter } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import type { Transaction as TransactionType } from './Dashboard' // Dashboard.tsx remains in pages for types

export default function Transaction() {
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  const { transactions, isLoading, refresh, removeTransaction } = useTransactions(userId, filterType, startDate, endDate);
  const { products } = useProducts(userId);

  const { form, setForm, handleSelectProduct, handleSubmit, isSubmitting, total, profit } = useTransactionForm(userId, products, refresh);

  const fmt = useMemo(() => createCurrencyFormatter(), [])
  const num = useMemo(() => createNumberFormatter(), [])

  const summary = useMemo(() => {
    const qty = transactions.reduce((s: number, t: TransactionType) => s + t.qty, 0);
    const rev = transactions.reduce((s: number, t: TransactionType) => s + t.total, 0);
    const pro = transactions.reduce((s: number, t: TransactionType) => s + t.profit, 0);
    return { qty, rev, pro };
  }, [transactions]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Sales Entry</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Record transaction</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Log your sales to automatically track revenue, profit, and inventory changes. Use manual mode for items not tracked in the product catalog.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <TransactionForm
            products={products}
            formData={form}
            onFieldChange={(f, v) => setForm(prev => ({ ...prev, [f]: v }))}
            onSelectProduct={handleSelectProduct}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            calculatedTotal={fmt.format(total)}
            expectedProfit={fmt.format(profit)}
          />

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Workflow Guide</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">01</span>
                <span>Select a product to auto-fill prices and link to inventory counts.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">02</span>
                <span>Profit is calculated as <code>(Sale - Cost) * Qty</code>.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">03</span>
                <span>Deleting a transaction will automatically restore the product stock level.</span>
              </li>
            </ul>
            <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 text-sm text-slate-300">
              Manual transactions do not impact inventory levels but are included in financial reports.
            </div>
          </aside>
        </div>

        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-400/80">History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {filterType === 'all' && 'Recent Activity'}
                {filterType === 'today' && 'Today\'s Sales'}
                {filterType === 'last7' && 'Last 7 Days'}
                {filterType === 'last30' && 'Last 30 Days'}
                {filterType === 'specific' && (startDate ? `Sales on ${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Specific Date')}
                {filterType === 'range' && (startDate && endDate ? `Sales from ${new Date(startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} to ${new Date(endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Date Range')}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  if (e.target.value !== 'specific' && e.target.value !== 'range') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 hover:bg-slate-900/80 cursor-pointer"
              >
                <option value="all">Recent activity</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="specific">Pick a Date</option>
                <option value="range">Date Range</option>
              </select>

              {(filterType === 'specific' || filterType === 'range') && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"
                  />
                  {filterType === 'range' && (
                    <>
                      <span className="text-slate-500 text-xs">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800/50 bg-slate-950/20">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-5 font-medium">Product</th>
                  <th className="px-6 py-5 font-medium text-center">Qty</th>
                  <th className="px-6 py-5 font-medium">Revenue</th>
                  <th className="px-6 py-5 font-medium">Profit</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Memuat data...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No transactions recorded for this period.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium">{t.product_name || 'Manual Sale'}</td>
                      <td className="px-6 py-4 text-center font-mono">{num.format(t.qty)}</td>
                      <td className="px-6 py-4">{fmt.format(t.total)}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">{fmt.format(t.profit || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeTransaction(t)}
                          disabled={isLoading}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="border-t border-slate-800/50 bg-sky-900/50 text-slate-200">
                  <tr>
                    <td className="px-6 py-4 font-bold">Total</td>
                    <td className="px-6 py-4 text-center font-bold font-mono">{num.format(summary.qty)}</td>
                    <td className="px-6 py-4 font-bold">{fmt.format(summary.rev)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{fmt.format(summary.pro)}</td>
                    <td className="px-6 py-4 text-right"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Daily Net Profit Report */}
      </div>
    </main>
  )
}