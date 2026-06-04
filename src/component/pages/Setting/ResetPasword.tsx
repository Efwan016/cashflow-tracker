import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../providers/useLanguage'

import EyeOpen from '../../../assets/Icon/eyeOpen'
import EyeClosed from '../../../assets/Icon/eyeClosed'
import LockIcon from '../../../assets/Icon/LockIcon'

export default function ResetPassword() {
    const { t } = useLanguage()
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()

            if (!data.session) {
                toast.error(t('Reset session expired. Please request a new reset link.'))
                navigate('/forgot-password')
                return
            }

            setCheckingSession(false)
        }

        checkSession()
    }, [navigate, t])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password || !confirmPassword) {
            setError(t('Password and confirm password are required'))
            return
        }

        if (password.length < 6) {
            setError(t('Password must be at least 6 characters'))
            return
        }

        if (password !== confirmPassword) {
            setError(t("Passwords don't match"))
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({
            password
        })

        setLoading(false)

        if (error) {
            setError(error.message)
            toast.error(error.message)
            return
        }

        toast.success(t('Password updated successfully. Please login again.'))

        await supabase.auth.signOut()
        navigate('/auth')
    }

    if (checkingSession) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('Checking reset session...')}
                </p>
            </main>
        )
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
                            alt={t('Cashflow App')}
                            className="mx-auto mb-6 h-16 w-16 rounded-2xl object-cover shadow-lg"
                        />

                        <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300">
                            {t('Reset Password')}
                        </span>

                        <h1 className="mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                            {t('Create new password')}
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                            {t('Enter your new password below to secure your account.')}
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <label className="grid gap-3 text-left">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                    <LockIcon />
                                </div>

                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 pl-12 pr-12 text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
                                />

                                <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-white px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-sky-600 dark:bg-slate-900 dark:peer-focus:text-sky-300">
                                    {t('New Password')}
                                </span>

                                <button
                                    type="button"
                                    onPointerDown={() => setShowPassword(true)}
                                    onPointerUp={() => setShowPassword(false)}
                                    onPointerLeave={() => setShowPassword(false)}
                                    onPointerCancel={() => setShowPassword(false)}
                                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                    {showPassword ? <EyeClosed /> : <EyeOpen />}
                                </button>
                            </div>
                        </label>

                        <label className="grid gap-3 text-left">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                    <LockIcon />
                                </div>

                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    placeholder=" "
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="peer w-full rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 pl-12 pr-12 text-slate-900 shadow-inner outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
                                />

                                <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-white px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-sky-600 dark:bg-slate-900 dark:peer-focus:text-sky-300">
                                    {t('Confirm New Password')}
                                </span>

                                <button
                                    type="button"
                                    onPointerDown={() => setShowConfirmPassword(true)}
                                    onPointerUp={() => setShowConfirmPassword(false)}
                                    onPointerLeave={() => setShowConfirmPassword(false)}
                                    onPointerCancel={() => setShowConfirmPassword(false)}
                                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                                </button>
                            </div>
                        </label>

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-[28px] bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-200 hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? t('Updating password...') : t('Update Password')}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {t('Back to')}{' '}
                        <Link
                            to="/"
                            className="font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
                        >
                            {t('login')}
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    )
}
