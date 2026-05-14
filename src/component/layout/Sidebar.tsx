import { NavLink, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { createCurrencyFormatter } from '../../lib/utils'
import ChevronIcon from '../../assets/Icon/ChevronIcon'
import { navItems } from '../hooks/navIteems'
import type { SidebarProps } from '../../types/types'


export default function Sidebar({
  isSidebarOpen,
  isDesktopSidebarOpen,
  closeMobileSidebar,
  name,
  netProfit,
  email,
  avatarUrl,
}: SidebarProps) {
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

  const fmt = useMemo(() => createCurrencyFormatter(), [])

  const displayName = useMemo(() => {
    return name?.trim() || email?.split('@')[0] || 'User'
  }, [name, email])

  const initials = useMemo(() => {
    const segments = displayName.split(' ').filter(Boolean)

    if (segments.length === 0) return 'CF'
    if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()

    return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase()
  }, [displayName])

  const isProfitPositive = netProfit >= 0

  const handleNavigate = () => {
    closeMobileSidebar()
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-dvh w-[18rem] flex-col justify-between overflow-y-auto border-r border-black/5 bg-white/90 p-4 text-slate-900 shadow-2xl shadow-slate-200/40 backdrop-blur-2xl transition-transform duration-300 ease-out [scrollbar-width:none] dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100 dark:shadow-slate-950/40 sm:p-5 lg:w-72 [&::-webkit-scrollbar]:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        }`}
    >
      <div className="space-y-6">
        {/* BRAND / ACCOUNT */}
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-fuchsia-500/10" />
          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                Account
              </p>

              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-500">
                Live
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-sky-500/20">
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
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                  {displayName}
                </p>

                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {email || 'Premium Account'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-black/5 bg-slate-50 p-4 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/60 dark:hover:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Net Profit
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    This Month
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${isProfitPositive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500'
                    }`}
                >
                  {isProfitPositive ? 'Profit' : 'Loss'}
                </span>
              </div>

              <p
                className={`mt-2 truncate text-xl font-black tracking-tight ${isProfitPositive ? 'text-emerald-500' : 'text-rose-500'
                  }`}
              >
                {isProfitPositive ? '+' : ''}
                {fmt.format(netProfit || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children?.length)

            const isProductsGroup = item.label === 'Products'
            const isFinanceGroup = item.label === 'Finance'

            const isOpen = isProductsGroup
              ? isProductsOpen
              : isFinanceGroup
                ? isFinanceOpen
                : false

            const setIsOpen = isProductsGroup
              ? setIsProductsOpen
              : isFinanceGroup
                ? setIsFinanceOpen
                : undefined

            const content = (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-white/80 group-hover:text-sky-500 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-white/10 dark:group-hover:text-sky-400">
                  <Icon />
                </span>

                <span className="min-w-0 flex-1 truncate font-bold">
                  {item.label}
                </span>

                {item.badge ? (
                  <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-500">
                    {item.badge}
                  </span>
                ) : null}

                {hasChildren && (
                  <span className="ml-auto shrink-0">
                    <ChevronIcon isOpen={isOpen} />
                  </span>
                )}
              </div>
            )

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsOpen?.((prev) => !prev)}
                    className={`group block w-full rounded-2xl px-3 py-2.5 text-left text-sm outline-none transition-all duration-200 ${isOpen
                      ? 'bg-slate-100 text-slate-950 shadow-sm dark:bg-white/10 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                      }`}
                  >
                    {content}
                  </button>

                  <div
                    className={`grid transition-all duration-300 ${isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-4 dark:border-white/10">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon

                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={handleNavigate}
                              className={({ isActive }) =>
                                `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-bold outline-none transition-all duration-200 ${isActive
                                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                                }`
                              }
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                                <ChildIcon />
                              </span>

                              <span className="truncate">{child.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <NavLink
                key={item.label}
                to={item.path || '#'}
                onClick={handleNavigate}
                className={({ isActive }) =>
                  `group block w-full rounded-2xl px-3 py-2.5 text-left text-sm outline-none transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`
                }
              >
                {content}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="mt-6 space-y-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />

          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
              Tips
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review your cashflow regularly so profit, expenses, and stock movement stay easy to track.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeMobileSidebar}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-800 transition hover:border-sky-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-sky-400 dark:hover:bg-white/10 lg:hidden"
        >
          Close Sidebar
        </button>
      </div>
    </aside>
  )
}