import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
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
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async () => {
        setError('')

        if (!email || !password) {
            setError('Email and password are required')
            return
        }

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords don't match")
            return
        }

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                setError('Login failed: ' + error.message)
            } else {
                navigate('/dashboard')
            }

        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                setError('Register failed: ' + error.message)
                toast.error('Register failed: ' + error.message)
            } else {
                toast.success('Register successful, check your email!')
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
        <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72">
                <div className="absolute left-8 top-[-8rem] h-72 w-72 rounded-full bg-sky-500/12 blur-3xl" />
                <div className="absolute right-8 top-[-6rem] h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64">
                <div className="absolute left-10 bottom-12 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
                <div className="absolute right-10 bottom-8 h-52 w-52 rounded-full bg-indigo-400/10 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
                <div className="grid w-full gap-8 rounded-[40px] border border-white/10 bg-slate-900/90 p-6 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] lg:p-0">
                    <aside className="hidden rounded-[40px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 lg:flex lg:flex-col lg:justify-center">
                        <img src="/IconCashflow.png" alt="Hero Image" className="mb-10 w-32 rounded-lg object-cover" />
                        <h1 className="text-4xl font-bold tracking-tight text-white">Manage your cash flow effortlessly</h1>
                        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-10 shadow-2xl shadow-slate-950/30">
                            <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Cashflow App</p>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">Premium finance experience</h1>
                            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                                Manage your cash flow effortlessly with a sleek interface, real-time insights, and complete control over your finances.
                            </p>
                            <div className="mt-10 space-y-4 text-sm text-slate-400">
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
                                    Clean & insightful dashboard
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
                                    Bank-level data security
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
                                    Fully responsive across all devices
                                </div>
                            </div>
                            <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                                Take control of your finances with a modern interface, powerful insights, and a seamless experience built for clarity and speed.
                            </p>
                        </div>
                    </aside>

                    <section className="rounded-[40px] border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/30 sm:p-10">
                        <div className="mb-8 text-center lg:text-left">
                            <span className="inline-flex rounded-full bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-sky-300">
                                {isLogin ? 'Login' : 'Register'}
                            </span>

                            <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </h2>

                            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                                {isLogin
                                    ? 'Sign in to continue managing your finances with a clean and intuitive experience.'
                                    : 'Start tracking your income and expenses with a simple and powerful system.'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <label className="grid gap-3 text-left">
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <EmailIcon />
                                    </div>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder=" "
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="peer w-full rounded-[28px] border border-slate-700 bg-slate-900/85 px-5 py-4 pl-12 text-slate-100 shadow-inner shadow-slate-950/10 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                                    />
                                    <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900/95 px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-300 peer-focus:-translate-y-0">
                                        Email
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
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        placeholder=" "
                                        className="peer w-full rounded-[28px] border border-slate-700 bg-slate-900/85 px-5 py-4 pl-12 pr-12 text-slate-100 shadow-inner shadow-slate-950/10 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900/95 px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-300 peer-focus:-translate-y-0">
                                        Password
                                    </span>

                                    <button
                                        type="button"
                                        onPointerDown={() => setShowPassword(true)}
                                        onPointerUp={() => setShowPassword(false)}
                                        onPointerLeave={() => setShowPassword(false)}
                                        onPointerCancel={() => setShowPassword(false)}
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeClosed /> : <EyeOpen />}
                                    </button>
                                </div>
                            </label>

                            {!isLogin && (
                                <label className="grid gap-3 text-left">
                                    <div className="relative">
                                         <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <LockIcon />
                                    </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            placeholder=" "
                                            className="peer w-full rounded-[28px] border border-slate-700 bg-slate-900/85 px-5 py-4 pl-12 pr-12 text-slate-100 shadow-inner shadow-slate-950/10 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />

                                        <span className="pointer-events-none absolute left-12 -top-2 z-10 rounded-xl bg-slate-900/95 px-2 text-sm text-slate-500 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-300 peer-focus:-translate-y-0">
                                            Confirm Password
                                        </span>

                                        <button
                                            type="button"
                                            onPointerDown={() => setShowConfirmPassword(true)}
                                            onPointerUp={() => setShowConfirmPassword(false)}
                                            onPointerLeave={() => setShowConfirmPassword(false)}
                                            onPointerCancel={() => setShowConfirmPassword(false)}
                                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white"
                                        >
                                            {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                                        </button>
                                        {error && !isLogin && (
                                            <p className="text-sm text-red-400 mt-2">
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </label>
                            )}

                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="w-full rounded-[28px] bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition duration-200 hover:from-sky-400 hover:to-indigo-400"
                            >
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </button>

                            {isLogin && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
                                        <span className="h-px flex-1 bg-slate-700" />
                                        <span>or continue with</span>
                                        <span className="h-px flex-1 bg-slate-700" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleOAuthSignIn('google')}
                                        className="w-full flex items-center justify-center gap-3 rounded-[28px] border border-slate-700 bg-slate-800 text-white px-5 py-4 text-sm font-semibold shadow-sm transition hover:bg-slate-700 hover:scale-[1.01] active:scale-[0.98]"
                                    >
                                        <span className="flex items-center justify-center w-5 h-5">
                                            <GoogleIcon />
                                        </span>
                                        <span className="leading-none">Continue with Google</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-400">
                            <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sky-300 transition hover:text-sky-100"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </div>

                        <div className="mt-10 rounded-[28px] border border-slate-700 bg-slate-950/75 p-5 text-sm text-slate-400 shadow-sm shadow-slate-950/20">
                            <p className="font-medium text-slate-100">Pro tip</p>
                            <p className="mt-3 leading-6">
                                Use a secure email and a strong password to protect your account, then monitor your daily financial activity through your dashboard.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
