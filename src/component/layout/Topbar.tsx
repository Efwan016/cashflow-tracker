import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
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

const SunIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
)

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
)

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
)

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
)

interface SearchableItem {
    title: string
    path: string
    category: string
}

export default function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
    const navigate = useNavigate()
    const [openMenu, setOpenMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showResults, setShowResults] = useState(false)
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') !== 'light'
    })
    const searchRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const [email, setEmail] = useState<string>('')
    const [name, setName] = useState<string>('user')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [show, setShow] = useState(true)
    const lastScrollY = useRef(0)

    // List of searchable pages
    const searchableItems = useMemo<SearchableItem[]>(() => [
        { title: 'Dashboard', path: '/dashboard', category: 'General' },
        { title: 'Transactions', path: '/transactions', category: 'Finance' },
        { title: 'Expenses', path: '/expenses', category: 'Finance' },
        { title: 'Products', path: '/products', category: 'Inventory' },
        { title: 'Stock Management', path: '/stock', category: 'Inventory' },
        { title: 'Movement Logs', path: '/stock-logs', category: 'Inventory' },
        { title: 'Reports', path: '/reports', category: 'General' },
        { title: 'Profile Settings', path: '/profile', category: 'Account' },
    ], [])

    const filteredResults = useMemo(() => {
        if (!searchQuery.trim()) return []
        return searchableItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [searchQuery, searchableItems])

    // Logika Night Mode: Update class di <html> tag dan simpan di localStorage
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [isDarkMode])

    // Keyboard shortcuts & Click outside
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
            if (e.key === 'Escape') {
                setShowResults(false)
                setOpenMenu(false)
            }
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('mousedown', handleClickOutside)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Scroll behavior logic
    useEffect(() => {
        const onScroll = () => {
            const currentY = window.scrollY

            if (currentY > lastScrollY.current && currentY > 80) {
                // scroll down → hide
                setShow(false)
            } else {
                // scroll up → show
                setShow(true)
            }

            lastScrollY.current = currentY
        }

        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // User data loading
    useEffect(() => {
        async function loadUser() {
            //  ambil user dulu
            const { data } = await supabase.auth.getUser()
            const user = data?.user
            if (!user) return

            setEmail(user.email ?? '')

            //  ambil profile dari DB
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile) {
                if (profile.full_name) {
                    setName(profile.full_name)
                } else if (user.email) {
                    setName(user.email.split('@')[0])
                }

                if (profile.avatar_url) {
                    setAvatarUrl(profile.avatar_url)
                }
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
        const id = toast.loading("Logging out...")
        try {
            await supabase.auth.signOut()
            toast.update(id, { render: "Logged out successfully", type: "success", isLoading: false, autoClose: 2000 })
            navigate('/')
        } catch  {
            toast.update(id, { render: "Logout failed", type: "error", isLoading: false, autoClose: 2000 })
        }
    }

    return (
      <div
    className={`
        relative flex flex-col gap-6 rounded-[32px] border border-white/10 bg-slate-900/60 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl
        lg:flex-row lg:items-center lg:justify-between

        transition-all duration-300 ease-in-out will-change-transform

        ${show
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }
    `}
>
            <div className="flex min-w-0 items-center gap-4">
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-800/40 text-slate-100 transition-all hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-400 active:scale-95"
                    aria-label="Toggle sidebar"
                >
                    <MenuIcon />
                </button>

                <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                        Hello, <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">{name.split(' ')[0]}</span>
                    </h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:flex-nowrap">
                <div ref={searchRef} className="group relative flex-1 lg:min-w-[320px]">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                        <SearchIcon />
                    </span>
                    <input
                        ref={searchInputRef}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        placeholder="Search anything..."
                        className="w-full rounded-2xl border border-white/5 bg-slate-950/40 py-3 pr-14 pl-12 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all group-hover:bg-slate-950/60 focus:border-sky-500/50 focus:bg-slate-950 focus:ring-4 focus:ring-sky-500/10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <kbd className="hidden rounded border border-white/10 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-block">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute top-full left-0 z-[60] mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl">
                            {filteredResults.length > 0 ? (
                                <div className="max-h-[300px] overflow-y-auto">
                                    {filteredResults.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                navigate(item.path)
                                                setShowResults(false)
                                                setSearchQuery('')
                                            }}
                                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-white/5 transition-colors"
                                        >
                                            <span className="text-sm font-medium text-slate-200">{item.title}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.category}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-sm text-slate-500">No results found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Night Mode Toggle */}
                    <button 
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-slate-800/30 text-slate-400 transition-all hover:bg-slate-800 hover:text-sky-400"
                    >
                        {isDarkMode ? <MoonIcon /> : <SunIcon />}
                    </button>

                    <div className="relative">
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-1.5 pr-4 transition-all hover:bg-slate-800 ${openMenu ? 'ring-2 ring-sky-500/50' : 'hover:border-white/10'}`}
                    >
                        <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-sky-500/20">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="max-w-[100px] truncate text-xs font-bold text-white">{name}</p>
                            <p className="max-w-[100px] truncate text-[10px] font-medium text-slate-500">{email || 'Premium Plan'}</p>
                        </div>
                    </button>

                    {openMenu && (
                        <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl">
                            <button
                                onClick={() => {
                                    setOpenMenu(false)
                                    navigate('/profile')
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                            >
                                <span className="text-slate-500 group-hover:text-sky-400 transition-colors"><UserIcon /></span>
                                Profile
                            </button>

                            <button
                                onClick={handleLogout}
                                className="group mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/10 hover:text-rose-300"
                            >
                                <span className="text-rose-500/50 group-hover:text-rose-400 transition-colors"><LogoutIcon /></span>
                                Logout
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    )
}
