import { NavLink, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { createCurrencyFormatter } from '../../lib/utils'
import ChevronIcon from '../../assets/Icon/ChevronIcon'
import { navItems } from '../hooks/navIteems'

interface Props {
  isSidebarOpen: boolean
  isDesktopSidebarOpen: boolean
  closeMobileSidebar: () => void
  name: string
  netProfit: number
  email: string
  avatarUrl: string | null
}

export default function Sidebar({
  isSidebarOpen,
  isDesktopSidebarOpen,
  closeMobileSidebar,
  name,
  netProfit,
  email,
  avatarUrl,
}: Props) {
  const location = useLocation()
  
  const [isProductsOpen, setIsProductsOpen] = useState(() => {
    return (
      location.pathname.startsWith('/products') ||
      location.pathname.startsWith('/inventory') 
    )
  })

  const [isFinanceOpen, setIsFinanceOpen] = useState(() => {
    return (
      location.pathname.startsWith('/transactions') ||
      location.pathname.startsWith('/expenses')
    )
  })

  const fmt = useMemo(() => createCurrencyFormatter(), []);

  const initials = useMemo(() => {
    const segments = name.split(' ').filter(Boolean)
    if (segments.length === 0) return 'CF'
    if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()
    return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase()
  }, [name])

  return (
    <div
      className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col justify-between overflow-y-auto border-r border-black/5 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl shadow-slate-100/20 dark:shadow-slate-950/20 transition-transform duration-300 ease-in-out backdrop-blur-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-900/90 p-5 shadow-sm shadow-slate-100/20 dark:shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-500">Account</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{name}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-500">{email || 'Premium Plan'}</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-black/5 dark:border-white/5 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-950/80">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">Net Profit</p>
            <p className={`mt-1 text-xl font-bold tracking-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit >= 0 ? '+' : ''}{fmt.format(netProfit)}
            </p>
          </div>
        </div> 8 

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            
            // Tentukan state buka/tutup berdasarkan label kategori
            const isOpen = item.label === 'Products' ? isProductsOpen : isFinanceOpen;
            const setIsOpen = item.label === 'Products' ? setIsProductsOpen : setIsFinanceOpen;

            const content = (
              <div className="flex items-center gap-3">
                <Icon />
                <span className="font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20">
                    {item.badge}
                  </span>
                ) : null}
                {hasChildren && (
                  <div className="ml-auto">
                    <ChevronIcon isOpen={isOpen} />
                  </div>
                )}
              </div>
            )

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`block w-full rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200 outline-none focus:ring-0 ${isOpen
                      ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {content}
                  </button>
                  {isOpen && (
                    <div className="mt-1 ml-4 space-y-1 border-none pl-4">
                      {item.children?.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-4 py-2 text-xs transition-all outline-none focus:ring-0 ${
                              isActive ? 'bg-sky-500/20 text-sky-400 font-bold'
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            }`
                          }
                          onClick={closeMobileSidebar}
                        >
                          <child.icon />
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.label}
                to={item.path || '#'}
                className={({ isActive }) =>
                  `block w-full rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200 outline-none focus:ring-0 ${
                    isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                onClick={closeMobileSidebar}
              >
                {content}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4 text-slate-900 dark:text-slate-100">
        <div className="rounded-[32px] border border-black/5 dark:border-white/10 bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/80 p-5 shadow-sm shadow-slate-100/20 dark:shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Tips</p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Get faster insights with live reports and automated budget controls.
          </p>
        </div>

        <button
          type="button"
          onClick={closeMobileSidebar}
          className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-400 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-slate-800 lg:hidden"
        >
          Close sidebar
        </button>
      </div>
    </div>
  )
}