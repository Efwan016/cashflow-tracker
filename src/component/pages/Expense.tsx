import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import { Pagination } from '../components/Pagination'
import { createCurrencyFormatter, getTzOffset, getLocalDate, formatDateTimeLocal } from '../../lib/utils'
import type { Expense } from '../../types/types'
import { useLanguage } from '../providers/useLanguage'


export default function Expense() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const descriptionInputRef = useRef<HTMLInputElement>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('today') // today, last7, thisMonth, specific, range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formattedAmount = useMemo(() => {
    const parsed = Number(amount)
    return Number.isFinite(parsed) ? parsed : 0
  }, [amount])

  const fmt = useMemo(() => createCurrencyFormatter(), []);
  const tzOffset = useMemo(() => getTzOffset(), []);

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      let startStr: string | null = null;
      let endStr: string | null = null;

      if (filterType === 'today') {
        const date = getLocalDate();
        startStr = `${date}T00:00:00.000${tzOffset}`;
        endStr = `${date}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'last7') {
        startStr = `${getLocalDate(7)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'thisMonth') {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
        startStr = `${firstDayStr}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'specific' && startDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${startDate}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'range' && startDate && endDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${endDate}T23:59:59.999${tzOffset}`;
      }

      if (startStr) query = query.gte('created_at', startStr);
      if (endStr) query = query.lte('created_at', endStr);

      const { data, error } = await query
      if (error) throw error
      setExpenses(data || [])
    } catch  {
      toast.error('Gagal memuat data: ')
    } finally {
      setLoading(false)
    }
  }, [userId, filterType, startDate, endDate, tzOffset])

  // INITIAL LOAD
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
      } else {
        navigate('/')
      }
    })
  }, [navigate])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      if (!userId) return
      await loadData()

      channel = supabase
        .channel(`expense-realtime-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => loadData(), 500)
        })
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) supabase.removeChannel(channel)
      clearTimeout(timeout)
    }
  }, [loadData, userId])

  const sortedExpenses = useMemo(() => {
    const list = [...expenses]
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.description.localeCompare(b.description)
        case 'name-desc': return b.description.localeCompare(a.description)
        case 'amount-desc': return b.total - a.total
        case 'amount-asc': return a.total - b.total
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    return list
  }, [expenses, sortBy])

  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [sortedExpenses, currentPage])

  const totalFilteredExpense = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.total, 0)
  }, [expenses])

  // 🔥 HANDLERS
  const handleSubmit = async () => {
    if (!description || !amount) {
      toast.error('Deskripsi dan nominal harus diisi.')
      return
    }

    if (formattedAmount <= 0) {
      toast.error('Nominal harus lebih dari nol.')
      return
    }

    if (!userId) {
      toast.error('Sesi berakhir, silakan login kembali.')
      return
    }

    setIsSubmitting(true)
    try {
      const now = formatDateTimeLocal();
      const { error } = await supabase.from('expenses').insert([
        {
          user_id: userId,
          description,
          total: formattedAmount,
          created_at: now,
        },
      ])

      if (error) throw error

      toast.success('Pengeluaran berhasil dicatat 🚀')
      setDescription('')
      setAmount('')
      descriptionInputRef.current?.focus()
      loadData()
    } catch  {
      toast.error('Gagal menyimpan: ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const customId = "confirm-delete-expense";
    toast.info(
      <div className="space-y-4">
        <p>Hapus pengeluaran ini?</p>
        <div className="flex gap-2">
            <button type="button"
            className="rounded-3xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
            onClick={async () => {
              toast.dismiss(customId)
              setIsDeleting(true)
              const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId)
              if (error) {
                toast.error(error.message)
              } else {
                toast.success('Dihapus')
                loadData()
              }
              setIsDeleting(false)
            }}
          >
            Hapus
          </button>
          <button type="button" className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800" onClick={() => toast.dismiss(customId)}>Batal</button>
        </div>
      </div>,
      { toastId: customId, autoClose: false, closeOnClick: false }
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 overflow-hidden hidden dark:block" aria-hidden>
        <div className="animate-[pulse_10s_ease-in-out_infinite] absolute rounded-full" style={{ width: 640, height: 640, top: -200, left: '12%', background: 'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 70%)', filter: 'blur(65px)' }} />
        <div className="animate-[pulse_8s_ease-in-out_infinite_reverse] absolute rounded-full" style={{ width: 520, height: 520, bottom: -80, right: '8%', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', filter: 'blur(65px)' }} />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-6 sm:p-8 shadow-xl dark:shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300/80">{t('Add expense')}</p>
          <h1 className="mt-3 text-2xl sm:text-4xl font-semibold text-slate-900 dark:text-white">{t('Record a new expense')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t('Store expense entries in Supabase so the app can report total spend, net cashflow, and expense trends.')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-6 sm:p-8 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Expense description')}</span>
                  <input
                    ref={descriptionInputRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('e.g. Office supplies, utilities')}
                    className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
                  />
                </label>

                <label className="grid gap-3 text-left">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Expense amount')}</span>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 hover:bg-slate-100 dark:hover:bg-slate-900/90"
                  />
                </label>
              </div>

              <div className="grid gap-3 text-left">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('Calculated expense')}</span>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 dark:from-slate-950/90 dark:to-slate-900/80 px-4 py-4 text-slate-900 dark:text-white">
                  {fmt.format(formattedAmount)}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('This expense entry is stored in the')} <span className="font-semibold text-slate-900 dark:text-white">expenses</span> table.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? t('Saving...') : t('Save expense')}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 dark:from-slate-900/90 dark:to-slate-950/80 p-6 sm:p-8 shadow-2xl dark:shadow-slate-950/20 backdrop-blur-xl transition-colors">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Expense tracking')}</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('Capture spend instantly')}</h2>
              </div>
              
              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/60 p-5 shadow-lg transition-colors">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('Total period spend')}</p>
                  <p className="mt-3 text-3xl font-semibold text-rose-600 dark:text-rose-400">{fmt.format(totalFilteredExpense)}</p>
                  <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-wider">{filterType.replace('all', t('Recent items'))}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm transition-colors">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">{t('Why it matters')}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('Expenses are essential for accurate cashflow reporting and real net profit calculation.')}</p>
              </div>
              <NavLink
                to="/reports"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {t('Review reports')}
              </NavLink>
            </div>
          </aside>
        </div>

        {/* HISTORY SECTION */}
        <div className="mt-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/5 bg-white dark:bg-slate-900/90 dark:from-slate-900/50 dark:to-slate-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-colors">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-600 dark:text-sky-400/80">{t('History')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{t('Expense Log')}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none backdrop-blur-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/90 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-colors"
              >
                <option value="date-desc" className="text-slate-900 dark:text-white">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="name-asc">Alphabet (A-Z)</option>
                <option value="name-desc">Alphabet (Z-A)</option>
                <option value="amount-desc">Lowest Amount</option>
                <option value="amount-asc">Highest Amount</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  if (e.target.value !== 'specific' && e.target.value !== 'range') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                     className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none backdrop-blur-xl transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 dark:[color-scheme:dark] hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="specific">Pick a Date</option>
                <option value="range">Date Range</option>
              </select>

              {(filterType === 'specific' || filterType === 'range') && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/80 px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 dark:[color-scheme:dark]"
                  />
                  {filterType === 'range' && (
                    <>
                      <span className="text-slate-500 text-xs">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/80 px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 dark:[color-scheme:dark]"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[32px]  border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 dark:from-slate-950/20 dark:to-slate-900/40 transition-colors">
            <table className="w-full text-left text-xs sm:text-sm text-white dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-widest text-slate-900/90 dark:text-white/80 bg-slate-50 dark:white dark:bg-slate-900/90 dark:from-slate-950/50 dark:to-slate-900/50">
                <tr>
                  <th className="px-6 py-5 font-medium">Description</th>
                  <th className="px-6 py-5 font-medium text-center">Date</th>
                  <th className="px-6 py-5 font-medium">Amount</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading expenses...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No expenses recorded for this period.</td></tr>
                ) : (
                  paginatedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{exp.description}</td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {new Date(exp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-semibold">{fmt.format(exp.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isDeleting}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot className="border-t border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-200 transition-colors">
                  <tr>
                    <td className="px-6 py-4 font-bold">Total Period Spend</td>
                    <td></td>
                    <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">{fmt.format(totalFilteredExpense)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {!loading && sortedExpenses.length > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalItems={sortedExpenses.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
