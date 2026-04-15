import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
    </svg>
)

const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
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
        <div className="flex flex-col gap-6 rounded-[32px] border border-white/5 bg-slate-900/40 p-5 shadow-2xl backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-800/50 text-slate-100 transition-all hover:bg-sky-500 hover:text-white active:scale-95"
                    aria-label="Toggle sidebar"
                >
                    <MenuIcon />
                </button>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Hello, <span className="text-sky-400">{name.split(' ')[0]}</span>
                    </h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
                <div className="relative flex-1 lg:min-w-[300px]">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                        <SearchIcon />
                    </span>
                    <input
                        type="search"
                        placeholder="Search anything..."
                        className="w-full rounded-2xl border border-white/5 bg-slate-950/50 py-3 pr-4 pl-12 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-1.5 pr-4 transition-all hover:bg-slate-800 ${openMenu ? 'ring-2 ring-sky-500/50' : ''}`}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-sky-500/20">
                            {initials}
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="max-w-[100px] truncate text-xs font-bold text-white">{name}</p>
                            <p className="max-w-[100px] truncate text-[10px] font-medium text-slate-500">{email || 'Premium Plan'}</p>
                        </div>
                    </button>
                    
                    {openMenu && (
                        <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
                            <button
                                onClick={() => {
                                    setOpenMenu(false)
                                    navigate('/profile')
                                }}
                                className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="mt-1 flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
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
