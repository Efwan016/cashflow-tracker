import { Link } from 'react-router-dom'

const footerLinks = [
  { label: 'Terms', path: '/terms' },
  { label: 'Privacy', path: '/privacy' },
]

const footerStats = [
  {
    label: 'Contact',
    value: 'Call customer support',
    href: 'https://api.whatsapp.com/send/?phone=081218115660&text&type=phone_number&app_absent=0'
  },
  {
    label: 'Uptime',
    value: '99.9%',
    live: true,
  },
  {
    label: 'Support',
    value: 'Support this app',
    href: 'https://saweria.co/widgets/qr?streamKey=c914b0805351e159460692fa208716a2',
  }
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 dark:text-white">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          {/* LEFT */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-sky-500/20">
                <span className="relative text-xs font-black text-white">
                  CF
                </span>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.32em] text-slate-900 dark:text-white">
                  Cashflow <span className="text-sky-500">Premium</span>
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Finance Control System
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Manage personal and business finances in one secure, fast, and
              focused platform built for clarity, control, and long-term growth.
            </p>
          </div>

          {/* RIGHT */}
          <div className="grid gap-3 sm:grid-cols-3">
            {footerStats.map((item) => {
              const cardContent = (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 transition-colors group-hover:text-sky-500">
                    {item.label}
                  </p>

                  <p className="mt-2 flex items-center gap-2 truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                    {item.live && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
                    )}
                    {item.value}
                  </p>
                </>
              )

              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white hover:shadow-lg hover:shadow-sky-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                  >
                    {cardContent}
                  </a>
                )
              }

              return (
                <div
                  key={item.label}
                  className="group rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-white hover:shadow-lg hover:shadow-sky-500/5 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

        {/* BOTTOM */}
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            © {currentYear}{' '}
            <span className="font-black text-slate-800 dark:text-white">
              Cashflow App
            </span>
            . All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-[11px] font-bold tracking-wide text-slate-500 transition hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}