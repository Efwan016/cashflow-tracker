import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
    </svg>
)

export default function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
    const navigate = useNavigate()
    const [openMenu, setOpenMenu] = useState(false)
    const [email, setEmail] = useState<string>('')
    const [name, setName] = useState<string>('Cashflow User')

    useEffect(() => {
        async function loadUser() {
            const { data } = await supabase.auth.getUser()
            const user = data?.user
            if (!user) return
            setEmail(user.email ?? '')
            const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
            if (metadataName) {
                setName(metadataName)
            } else if (user.email) {
                setName(user.email.split('@')[0])
            }
        }
        loadUser()
    }, [])

    const initials = useMemo(() => {
        const segments = name.split(' ').filter(Boolean)
        if (segments.length === 0) return 'CF'
        if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()
        return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase()
    }, [name])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    return (
        <div className="flex flex-col gap-5 rounded-[32px] border border-slate-800 bg-slate-950/95 p-5 shadow-xl shadow-slate-950/20 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-sm shadow-slate-950/20 transition hover:border-sky-400 hover:bg-slate-800"
                    aria-label="Toggle sidebar"
                >
                    <span className="text-xl leading-none">☰</span>
                </button>

                <div className="min-w-0">
                    <h1 className="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">Welcome back, {name}</h1>
                    <p className="mt-2 text-sm text-slate-400">See your latest activity and manage your account from one place.</p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        placeholder="Search activity, reports, transactions"
                        className="w-full rounded-3xl border border-slate-700 bg-slate-900/90 py-3 pr-4 pl-14 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 shadow-sm shadow-slate-950/20"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-sm font-semibold text-white">
                            {initials}
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="truncate text-sm font-semibold text-white">{name}</p>
                            <p className="truncate text-xs text-slate-400">{email || 'Connected'}</p>
                        </div>
                    </button>
                    {openMenu && (
                        <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-slate-700 bg-slate-900 shadow-lg">
                            <button
                                onClick={() => {
                                    setOpenMenu(false)
                                    navigate('/profile')
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800 rounded-t-2xl"
                            >
                                Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-slate-800 rounded-b-2xl"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
