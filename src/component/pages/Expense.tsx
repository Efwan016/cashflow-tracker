import { useMemo, useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-toastify'
import { createCurrencyFormatter, getTzOffset, getLocalDate, formatDateTimeLocal } from '../../lib/utils'

type ExpenseRecord = {
  id: string
  description: string
  total: number
  created_at: string
}

export default function Expense() {
  const navigate = useNavigate()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('all') // all, today, last7, last30, specific, range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

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
      } else if (filterType === 'last30') {
        startStr = `${getLocalDate(30)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'specific' && startDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${startDate}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'range' && startDate && endDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${endDate}T23:59:59.999${tzOffset}`;
      }

      if (startStr) query = query.gte('created_at', startStr);
      if (endStr) query = query.lte('created_at', endStr);
      if (filterType === 'all') query = query.limit(20);

      const { data, error } = await query
      if (error) throw error
      setExpenses(data || [])
    } catch  {
      toast.error('Gagal memuat data: ')
    } finally {
      setLoading(false)
    }
  }, [userId, filterType, startDate, endDate])

  // 🔥 INITIAL LOAD
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
    loadData()
  }, [loadData])

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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Add expense</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Record a new expense</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Store expense entries in Supabase so the app can report total spend, net cashflow, and expense trends.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Expense description</span>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Office supplies, utilities"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>

                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Expense amount</span>
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-3 text-left">
                <span className="text-sm text-slate-400">Calculated expense</span>
                <div className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white">
                  {fmt.format(formattedAmount)}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  This expense entry is stored in the <span className="font-semibold text-white">expenses</span> table and will be reflected in both dashboard and report totals.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save expense'}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Expense tracking</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Capture spend instantly</h2>
              </div>
              
              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Total period spend</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{fmt.format(totalFilteredExpense)}</p>
                  <p className="mt-1 text-xs text-slate-500 uppercase tracking-wider">{filterType.replace('all', 'Recent items')}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Why it matters</p>
                <p className="mt-3 text-sm text-slate-400">Expenses are essential for accurate cashflow reporting and help you understand real net profit after spend.</p>
              </div>
              <NavLink
                to="/reports"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                Review reports
              </NavLink>
            </div>
          </aside>
        </div>

        {/* HISTORY SECTION */}
        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-400/80">History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Expense Log</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none transition-all focus:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer"
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="name-asc">Alphabet (A-Z)</option>
                <option value="name-desc">Alphabet (Z-A)</option>
                <option value="amount-desc">Nominal (Besar-Kecil)</option>
                <option value="amount-asc">Nominal (Kecil-Besar)</option>
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
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer"
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
                    className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50"
                  />
                  {filterType === 'range' && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800/50 bg-slate-950/20">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-5 font-medium">Description</th>
                  <th className="px-6 py-5 font-medium text-center">Date</th>
                  <th className="px-6 py-5 font-medium">Amount</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-slate-300">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading expenses...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">No expenses recorded for this period.</td></tr>
                ) : (
                  sortedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium">{exp.description}</td>
                      <td className="px-6 py-4 text-center text-slate-500">
                        {new Date(exp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-rose-400 font-semibold">{fmt.format(exp.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={isDeleting}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {expenses.length > 0 && (
                <tfoot className="border-t border-slate-800/50 bg-slate-900/30 text-slate-200">
                  <tr>
                    <td className="px-6 py-4 font-bold">Total Period Spend</td>
                    <td></td>
                    <td className="px-6 py-4 font-bold text-rose-400">{fmt.format(totalFilteredExpense)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
