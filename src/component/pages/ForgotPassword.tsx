import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import EmailIcon from '../../assets/Icon/EmailIcon'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!email.trim()) {
            setError('Email is required')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })

        setLoading(false)

        if (error) {
            setError(error.message)
            toast.error(error.message)
            return
        }

        setSuccess('Password reset link has been sent. Please check your email.')
        toast.success('Password reset link sent to your email')
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72">
                <div className="absolute left-8 top-[-8rem] h-72 w-72 rounded-full bg-sky-500/12 blur-3xl" />
                <div className="absolute right-8 top-[-6rem] h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64">
                <div className="absolute left-10 bottom-12 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
                <div className="absolute right-10 bottom-8 h-52 w-52 rounded-full bg-indigo-400/10 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
                <section className="w-full max-w-xl rounded-[40px] border border-black/5 bg-white p-8 shadow-2xl transition-colors dark:border-white/10 dark:bg-slate-900/95 dark:shadow-slate-950/30 sm:p-10">
                    <div className="mb-8 text-center">
                        <img
                            src="/IconCashflow.png"
                            alt="Cashflow App"
                            className="mx-auto mb-6 h-16 w-16 rounded-2xl object-cover shadow-lg"
                        />

                        <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300">
                            Forgot Password
                        </span>

                        <h1 className="mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                            Reset your password
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                            Enter your registered email address and we will send you a secure password reset link.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <label className="grid gap-3 text-left">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                    <EmailIcon />
                                </div>

                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder=" "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="peer w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 pl-12 text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
                                />

                                <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-white px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-sky-600 dark:bg-slate-900 dark:peer-focus:text-sky-300">
                                    Email
                                </span>
                            </div>
                        </label>

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-[28px] bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-200 hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Sending reset link...' : 'Send reset link'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Remember your password?{' '}
                        <Link
                            to="/"
                            className="font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
                        >
                            Back to login
                        </Link>
                    </div>

                    <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-400">
                        <p className="font-medium text-slate-900 dark:text-slate-100">Security note</p>
                        <p className="mt-3 leading-6">
                            For your safety, the reset link will be sent only to the email registered in your account.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}