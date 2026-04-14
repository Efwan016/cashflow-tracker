import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Expense() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formattedAmount = useMemo(() => {
    const parsed = Number(amount)
    return Number.isFinite(parsed) ? parsed : 0
  }, [amount])

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!description || !amount) {
      setError('Please complete the description and amount fields.')
      return
    }

    if (formattedAmount <= 0) {
      setError('Expense amount must be greater than zero.')
      return
    }

    setIsSubmitting(true)
    const { error: insertError } = await supabase.from('expenses').insert([
      {
        description,
        total: formattedAmount,
        created_at: new Date().toISOString(),
      },
    ])
    setIsSubmitting(false)

    if (insertError) {
      setError('Failed to save expense: ' + insertError.message)
      return
    }

    setSuccess('Expense saved successfully to the database.')
    setDescription('')
    setAmount('')
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
            <div className="space-y-6">
              {error && (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  {success}
                </div>
              )}

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
                  Rp {formattedAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  This expense entry is stored in the <span className="font-semibold text-white">expenses</span> table and will be reflected in both dashboard and report totals.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save expense'}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Expense tracking</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Capture spend instantly</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <p>Record every expense with an easy description and amount.</p>
                <p>Expenses are saved in Supabase and become part of your dashboard cashflow and reports.</p>
                <p>Use this page when you pay for supplies, services, or overhead.</p>
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
      </div>
    </main>
  )
}
