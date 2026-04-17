import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { toast } from 'react-toastify'

export default function DetailInfo() {
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [createdAt, setCreatedAt] = useState('')
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)

    useEffect(() => {
        const loadUser = async () => {
            const { data } = await supabase.auth.getUser()
            const user = data?.user

            if (!user) {
                navigate('/')
                return
            }

            setEmail(user.email ?? '')
            setCreatedAt(user.created_at ?? '')

            // ambil profile name
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()

            if (profile?.full_name) {
                setName(profile.full_name)
            } else {
                setName(user.email?.split('@')[0] || 'User')
            }

            setLoading(false)
        }

        loadUser()
    }, [navigate])

    if (loading) return <div className="text-white p-10">Loading...</div>

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Delete account permanently? This action cannot be undone.'
        )

        if (!confirmed) return

        setDeleting(true)

        const loadingToast = toast.loading('Deleting your account...')

        try {
            const { data } = await supabase.auth.getUser()
            const user = data?.user

            if (!user) throw new Error('User not found')

            await supabase.from('Transactions').delete().eq('user_id', user.id)
            await supabase.from('profiles').delete().eq('id', user.id)

            await supabase.auth.signOut()

            toast.update(loadingToast, {
                render: 'Account deleted successfully 👋',
                type: 'success',
                isLoading: false,
                autoClose: 2000,
            })

            setTimeout(() => {
                navigate('/')
            }, 2000)

        } catch (err: unknown) {
            toast.update(loadingToast, {
                render: (err as { message: string }).message || 'Failed to delete account',
                type: 'error',
                isLoading: false,
                autoClose: 3000,
            })
        } finally {
            setDeleting(false)
        }
    }

    const handleChangePassword = async () => {
        if (!newPassword) {
            toast.error('Password required')
            return
        }

        setSavingPassword(true)

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Password updated')
            setNewPassword('')
        }

        setSavingPassword(false)
    }
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white p-6">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* BACK */}
                <button
                    onClick={() => navigate(-1)}
                    className="border border-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition"
                >
                    ← Back
                </button>

                <h1 className="text-3xl font-semibold">Account Info</h1>

                {/* ACCOUNT */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                    <h2 className="text-lg font-semibold mb-4">Account</h2>

                    <div className="space-y-2">
                        <p className="text-xs text-slate-400">Username</p>
                        <p className="text-base">{name}</p>
                    </div>

                    <div className="space-y-2 mt-3">
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-base">{email}</p>
                    </div>

                    <div className="space-y-2 mt-4">
                        <p className="text-xs text-slate-400">Member since</p>
                        <p className="text-base">
                            {new Date(createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* PRIVACY */}
                {/* PRIVACY */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-lg">
                    <h2 className="text-lg font-semibold mb-2">Security & Privacy</h2>

                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        Your financial data is encrypted end-to-end and securely stored. Only you can access your account.
                    </p>

                    {/* CHANGE PASSWORD CARD */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-white">Change Password</h3>
                            <p className="text-xs text-slate-400">
                                Use a strong password with at least 8 characters.
                            </p>
                        </div>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />

                        <button
                            onClick={handleChangePassword}
                            disabled={savingPassword}
                            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition disabled:opacity-50"
                        >
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>

                    {/* DELETE ACCOUNT */}
                    <div className="mt-6 border border-red-500/20 bg-red-500/10 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-red-300">Danger Zone</h3>
                        <p className="text-xs text-red-200/70 mt-1">
                            Once deleted, your account and all data cannot be recovered.
                        </p>

                        {!confirming ? (
                            <button
                                onClick={() => setConfirming(true)}
                                className="mt-4 w-full py-3 rounded-xl font-semibold border border-red-500/40 text-red-300 hover:bg-red-500/10 transition"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <p className="text-xs text-red-200">
                                    Are you absolutely sure?
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleting}
                                        className="flex-1 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-500 transition"
                                    >
                                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>

                                    <button
                                        onClick={() => setConfirming(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}