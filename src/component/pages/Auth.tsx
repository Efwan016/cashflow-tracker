import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { languages } from '../../lib/i18n'
import { useLanguage } from '../providers/useLanguage'
import MarqueeText from '../components/ui/marquee-text'
import GoogleIcon from '../../assets/Icon/GoogleIcon'
import EyeOpen from '../../assets/Icon/eyeOpen'
import EyeClosed from '../../assets/Icon/eyeClosed'
import EmailIcon from '../../assets/Icon/EmailIcon'
import LockIcon from '../../assets/Icon/LockIcon'

export default function Auth() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { t, language, setLanguage } = useLanguage()
    const activeLanguage = languages.find((lang) => lang.code === language)

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setError('')

        if (!email || !password) {
            setError(t('auth.error.emailPasswordRequired'))
            return
        }

        if (!isLogin && password !== confirmPassword) {
            setError(t('auth.error.passwordMismatch'))
            return
        }

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                // Pesan error yang lebih spesifik untuk password salah
                if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
                    setError(t('auth.error.invalidCredentials'))
                } else if (error.message.includes('User not found')) {
                    setError(t('auth.error.userNotFound'))
                } else if (error.message.includes('too_many_requests')) {
                    setError(t('auth.error.tooManyAttempts'))
                } else {
                    setError(t('auth.error.loginFailed'))
                }
            } else {
                navigate('/dashboard')
            }

        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                setError(t('auth.error.registerFailed'))
                toast.error(t('auth.error.registerFailed'))
            } else {
                toast.success(t('auth.success.registerSuccess'))
            }
        }
    }

    const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        })

        if (error) {
            toast.error(`Login ${provider} gagal: ${error.message}`)
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.26),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.24),_transparent_38%),linear-gradient(135deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] text-slate-100 transition-colors duration-300">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72">
                <div className="absolute left-8 top-[-8rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute right-8 top-[-6rem] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-500/15 blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64">
                <div className="absolute left-10 bottom-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="absolute right-10 bottom-8 h-52 w-52 rounded-full bg-indigo-400/10 blur-3xl" />
            </div>

            <MarqueeText
                text="Cashflow AI — Track your cash flow smarter — Fast, simple, elegant — Secure finance workspace — "
                speed={50}
                className="relative z-20 border-b border-white/10 bg-slate-950/80 py-2 backdrop-blur"
            />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full overflow-hidden rounded-[36px] border border-white/10 bg-slate-950/60 p-2 shadow-[0_30px_100px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr] lg:p-0">
                    <aside className="relative hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 lg:flex lg:flex-col lg:justify-between">
                        <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.16),_transparent_30%)]" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-lg shadow-cyan-500/10">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2 3 6v6c0 5.25 3.44 9.94 9 10 5.56-.06 9-4.75 9-10V6l-9-4Zm0 3.1 6 2.67v4.17c0 3.8-2.31 7.4-6 8.03-3.69-.63-6-4.23-6-8.03V7.77L12 5.1Zm-1 3.4v5.37l4.5-2.5-1.5-2.57-1.5 1.2-1.5-1.5Z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">{t('Cashflow AI')}</p>
                                    <p className="text-sm text-slate-400">{t('Secure and elegant workspace')}</p>
                                </div>
                            </div>

                            <img src="/IconCashflow.png" alt="Hero Image" className="mt-8 w-28 rounded-2xl border border-white/10 object-cover shadow-xl shadow-slate-950/50" />

                            <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">{t('Cashflow App')}</p>
                                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{t('Premium finance experience')}</h1>
                                <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                                    {t('Manage your cash flow effortlessly with a sleek interface, real-time insights, and complete control over your finances.')}
                                </p>
                            </div>

                            <div className="mt-8 grid gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur">
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('Live overview')}</p>
                                    <p className="mt-2 text-xl font-semibold text-white">{t('24/7 visibility')}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur">
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('Smart insights')}</p>
                                    <p className="mt-2 text-xl font-semibold text-white">{t('Faster decisions')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-400 backdrop-blur">
                            <p className="font-medium text-slate-200">{t('Manage your cash flow effortlessly')}</p>
                            <p className="mt-2 leading-6">{t('A refined experience for tracking income, expenses, and momentum in one place.')}</p>
                        </div>
                    </aside>

                    <section className="relative rounded-[30px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 sm:p-10">
                        <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.16),_transparent_20%)]" />
                        <div className="relative z-10">
                            <div className="mb-8 flex flex-col gap-4 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
                            <div>
                                <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-300">
                                    {isLogin ? t('Login') : t('Register')}
                                </span>
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 shadow-sm transition hover:bg-slate-800/80"
                                >
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{t('auth.language')}</span>
                                    <span className="rounded-full bg-cyan-400/20 px-2.5 py-1 text-sm font-medium text-cyan-100">
                                        {activeLanguage?.flag ?? '🌐'}
                                    </span>
                                    <span className="text-xs text-slate-400">{activeLanguage?.name ?? 'English'}</span>
                                </button>

                                {isLanguageMenuOpen && (
                                    <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-slate-950/60 backdrop-blur">
                                        {languages.map((lang) => {
                                            const isActive = language === lang.code
                                            return (
                                                <button
                                                    key={lang.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setLanguage(lang.code)
                                                        setIsLanguageMenuOpen(false)
                                                    }}
                                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${isActive ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    <span className="text-base">{lang.flag}</span>
                                                    <span className="flex-1">{lang.name}</span>
                                                    {isActive && <span className="text-cyan-300">✓</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                                {isLogin ? t('Welcome back') : t('Create your account')}
                            </h2>

                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                                {isLogin
                                    ? t('Sign in to continue managing your finances with a clean and intuitive experience.')
                                    : t('Start tracking your income and expenses with a simple and powerful system.')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                            className="peer w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-5 py-4 pl-12 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                                        />
                                        <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900 px-2 text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-cyan-300 peer-focus:-translate-y-0">
                                            {t('Email')}
                                        </span>
                                    </div>
                                </label>

                                <label className="grid gap-3 text-left">
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                            <LockIcon />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                                            placeholder=" "
                                            className="peer w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-5 py-4 pl-12 pr-12 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />

                                        <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900 px-2 text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-cyan-300 peer-focus:-translate-y-0">
                                            {t('Password')}
                                        </span>

                                        <button
                                            type="button"
                                            onPointerDown={() => setShowPassword(true)}
                                            onPointerUp={() => setShowPassword(false)}
                                            onPointerLeave={() => setShowPassword(false)}
                                            onPointerCancel={() => setShowPassword(false)}
                                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-cyan-300"
                                        >
                                            {showPassword ? <EyeClosed /> : <EyeOpen />}
                                        </button>
                                    </div>
                                </label>
                                {isLogin && (
                                    <div className="flex justify-end">
                                        <Link
                                            to="/forgot-password"
                                            className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                                        >
                                            {t('Forgot password?')}
                                        </Link>
                                    </div>
                                )}

                                {!isLogin && (
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
                                                className="peer w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-5 py-4 pl-12 pr-12 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />

                                            <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900 px-2 text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-cyan-300 peer-focus:-translate-y-0">
                                                {t('Confirm Password')}
                                            </span>

                                            <button
                                                type="button"
                                                onPointerDown={() => setShowConfirmPassword(true)}
                                                onPointerUp={() => setShowConfirmPassword(false)}
                                                onPointerLeave={() => setShowConfirmPassword(false)}
                                                onPointerCancel={() => setShowConfirmPassword(false)}
                                                className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition hover:text-cyan-300"
                                            >
                                                {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                                            </button>
                                            {error && !isLogin && (
                                                <p className="mt-2 text-sm text-red-400">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                )}

                                {error && (
                                    <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 p-4 backdrop-blur">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                <svg
                                                    className="h-5 w-5 text-red-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-red-200">
                                                {error}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full rounded-[24px] bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(59,130,246,0.3)] transition duration-200 hover:translate-y-[-1px] hover:shadow-[0_16px_48px_rgba(59,130,246,0.35)]"
                                >
                                    {isLogin ? t('Sign In') : t('Create Account')}
                                </button>
                            </form>

                            <div className="mt-6 space-y-4">
                                {isLogin && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                                            <span className="h-px flex-1 bg-white/10" />
                                            <span>{t('or continue with')}</span>
                                            <span className="h-px flex-1 bg-white/10" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleOAuthSignIn('google')}
                                            className="flex w-full items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 text-sm font-semibold text-slate-100 shadow-sm transition hover:bg-white/15 hover:scale-[1.01] active:scale-[0.98]"
                                        >
                                            <span className="flex h-5 w-5 items-center justify-center">
                                                <GoogleIcon />
                                            </span>
                                            <span className="leading-none">{t('Continue with Google')}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                                <span>{isLogin ? t("Don't have an account?") : t('Already have an account?')}</span>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-cyan-300 transition hover:text-cyan-200"
                                >
                                    {isLogin ? t('Sign up') : t('Sign in')}
                                </button>
                            </div>

                            <div className="mt-10 rounded-[24px] border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-400 shadow-sm">
                                <p className="font-medium text-slate-100">{t('Pro tip')}</p>
                                <p className="mt-3 leading-6">
                                    {t('Use a secure email and a strong password to protect your account, then monitor your daily financial activity through your dashboard.')}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <MarqueeText
                text="Cashflow AI — Income — Expenses — Reports — Inventory — Profile — "
                speed={60}
                className="relative z-20 border-t border-white/10 bg-slate-950/80 py-2 backdrop-blur"
            />
        </main>
    )
}
