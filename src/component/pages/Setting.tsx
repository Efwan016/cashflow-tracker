import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function Settings() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser()

            if (!data.user) {
                navigate('/')
                return
            }

            setLoading(false)
        }

        getUser()
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Logged out')
        navigate('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                Loading...
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Settings
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage your account, privacy, and application preferences
                    </p>
                </div>

                {/* ACCOUNT */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:bg-white/10">
                    <h2 className="text-lg font-semibold">Account Info</h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        View your account details including email, username, and membership info.
                    </p>

                    <button
                        onClick={() => navigate('/detailinfo')}
                        className="mt-5 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
                    >
                        View Account Details →
                    </button>
                </div>

                {/* TERMS */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold">Legal</h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        By using this application, you agree to our terms and privacy policy.
                        This app is designed for personal finance tracking only.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-5">
                        <button
                            onClick={() => navigate('/privacy')}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm transition hover:bg-white/10"
                        >
                            Privacy Policy
                        </button>

                        <button
                            onClick={() => navigate('/terms')}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm transition hover:bg-white/10"
                        >
                            Terms of Service
                        </button>
                    </div>
                </div>

                {/* ACTION */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-red-300">
                        Danger Zone
                    </h2>

                    <p className="text-sm text-red-200/70 mt-2">
                        Logout from your account on this device.
                    </p>

                    <button
                        onClick={handleLogout}
                        className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-semibold bg-red-600 hover:bg-red-500 transition"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </main>
    )
}