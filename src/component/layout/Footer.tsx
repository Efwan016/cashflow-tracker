export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Cashflow Premium</p>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Kelola keuangan perusahaan dan personal dalam satu platform yang aman, cepat, dan berkelas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm">
            <p className="font-semibold text-white">Support</p>
            <p className="mt-1 text-slate-500">help@cashflow.app</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm">
            <p className="font-semibold text-white">Trust</p>
            <p className="mt-1 text-slate-500">99.9% uptime</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm">
            <p className="font-semibold text-white">Updates</p>
            <p className="mt-1 text-slate-500">Smart budgeting</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-4 text-slate-500 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cashflow App. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  )
}