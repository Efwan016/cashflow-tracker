import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/5 bg-slate-950/40 backdrop-blur-2xl">

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8">

        <div className="grid gap-10 lg:grid-cols-[1.2fr_auto]">

          {/* LEFT */}
          <div className="space-y-5">

            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20">
                <span className="text-[11px] font-bold text-white">CF</span>
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/90">
                Cashflow <span className="text-sky-400">Premium</span>
              </p>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-slate-400">
              Manage personal and business finances in one secure, high-performance platform.
              Built for precision, clarity, and long-term financial control.
            </p>

          </div>

          {/* RIGHT */}
          <div className="grid gap-3 sm:grid-cols-3">

            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 group-hover:text-sky-400 transition-colors">
                Support
              </p>
              <p className="mt-1 text-xs text-slate-300">help@cashflow.app</p>
            </div>

            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 group-hover:text-sky-400 transition-colors">
                Uptime
              </p>
              <p className="mt-1 text-xs text-slate-300 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                99.9%
              </p>
            </div>

            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500 group-hover:text-sky-400 transition-colors">
                Updates
              </p>
              <p className="mt-1 text-xs text-slate-300">Smart budgeting</p>
            </div>

          </div>
        </div>

        {/* DIVIDER */}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* BOTTOM */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[11px] tracking-wider text-slate-500">
            © {new Date().getFullYear()} <span className="text-slate-300 font-medium">Cashflow App</span>. All rights reserved.
          </p>

          <div className="flex items-center gap-6">

            <Link
              to="/terms"
              className="text-[11px] tracking-wide text-slate-500 transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              to="/privacy"
              className="text-[11px] tracking-wide text-slate-500 transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              to="/security"
              className="text-[11px] tracking-wide text-slate-500 transition hover:text-white"
            >
              Security
            </Link>

          </div>
        </div>

      </div>
    </footer>
  )
}