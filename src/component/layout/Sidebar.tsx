import { NavLink } from 'react-router-dom'
import { useMemo } from 'react'

interface Props {
  isSidebarOpen: boolean
  isDesktopSidebarOpen: boolean
  closeMobileSidebar: () => void
  name: string
  revenue: number
  email: string
}

// Ikon-ikon untuk tampilan premium
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Transactions: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Products: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 17l8 4" /></svg>,
  Stock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Logs: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" /></svg>,
  Expenses: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Reports: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Icons.Dashboard, badge: 'New' },
  { label: 'Transactions', path: '/transactions', icon: Icons.Transactions, badge: 'Active' },
  { label: 'Products', path: '/products', icon: Icons.Products, badge: '' },
  { label: 'Stock', path: '/stock', icon: Icons.Stock, badge: '' },
  { label: 'Stock Logs', path: '/stock-logs', icon: Icons.Logs, badge: '' },
  { label: 'Expenses', path: '/expenses', icon: Icons.Expenses, badge: '' },
  { label: 'Reports', path: '/reports', icon: Icons.Reports, badge: 'Live' },
  { label: 'Settings', icon: Icons.Settings, badge: '' },
]

export default function Sidebar({
  isSidebarOpen,
  isDesktopSidebarOpen,
  closeMobileSidebar,
  name,
  revenue,
  email
}: Props) {
  
  const initials = useMemo(() => {
    const segments = name.split(' ').filter(Boolean)
    if (segments.length === 0) return 'CF'
    if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase()
    return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase()
  }, [name])

  return (
    <div
      className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col justify-between overflow-y-auto border-r border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-in-out backdrop-blur-xl ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Account</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20">
                {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="truncate text-[10px] text-slate-500">{email || 'Premium Plan'}</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-950/50 border border-white/5 p-4 transition-colors hover:bg-slate-950/80">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</p>
            <p className="mt-1 text-xl font-bold text-white tracking-tight">Rp {revenue.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="flex items-center gap-3">
                <Icon />
                <span className="font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            )

            return item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `block w-full rounded-2xl border border-transparent px-4 py-3 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
                onClick={closeMobileSidebar}
              >
                {content}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white"
              >
                {content}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-5 shadow-sm shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pro tip</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Get faster insights with live reports and automated budget controls.
          </p>
        </div>

        <button
          type="button"
          onClick={closeMobileSidebar}
          className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:bg-slate-800 lg:hidden"
        >
          Close sidebar
        </button>
      </div>
    </div>
  )
}