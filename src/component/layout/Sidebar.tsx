import { NavLink } from 'react-router-dom'


interface Props {
  isSidebarOpen: boolean
  isDesktopSidebarOpen: boolean
  closeMobileSidebar: () => void
  name: string
  revenue: number
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', badge: 'New' },
  { label: 'Transactions', path: '/transactions', badge: 'Active' },
  { label: 'Products', path: '/products', badge: 'Catalog' },
  { label: 'Stock', path: '/stock', badge: 'Manage' },
  { label: 'Stock Logs', path: '/stock-logs', badge: 'Latest' },
  { label: 'Expenses', path: '/expenses', badge: 'Open' },
  { label: 'Reports', path: '/reports', badge: 'Live' },
  { label: 'Settings', badge: '' },
]

export default function Sidebar({
  isSidebarOpen,
  isDesktopSidebarOpen,
  closeMobileSidebar,
  name,
  revenue
}: Props) {
  
  return (
    <div
      className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950 transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${!isDesktopSidebarOpen ? 'lg:-translate-x-full' : ''}`}
    >
      <div className="space-y-8">
        <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-4 shadow-sm shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Account</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-sm font-semibold text-slate-100">
                {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
            </div>
          </div>
          <div className="mt-5 rounded-3xl bg-slate-950/90 p-3 text-sm text-slate-400">
            <p className="font-medium text-slate-100">{revenue}</p>
            <p className="mt-1 text-xs">Available balance</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
                    {item.badge}
                  </span>
                ) : null}
              </>
            )

            return item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? 'border-sky-400 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-sky-400 hover:bg-slate-800'
                  }`
                }
              >
                {content}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                {content}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="rounded-[32px] border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
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