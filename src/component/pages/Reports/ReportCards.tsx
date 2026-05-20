import type { ReportCardsProps } from '../../../types/types'

export function ReportSummary({
  summaryCards,
}: Pick<ReportCardsProps, 'summaryCards'>) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:shadow-xl hover:shadow-sky-500/5 dark:border-white/10 dark:bg-slate-950/80 dark:ring-white/5 dark:hover:bg-slate-900/80"
        >
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-500/10 blur-3xl transition duration-300 group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-3">
            <span className={card.badgeClass}>{card.title}</span>
          </div>

          <p className="relative mt-6 min-w-0 break-words text-[clamp(1.5rem,2vw,2rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            {card.value}
          </p>

          <p className="relative mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {card.helpText}
          </p>
        </div>
      ))}
    </section>
  )
}

export function ReportGrowth({
  growthCards,
}: Pick<ReportCardsProps, 'growthCards'>) {
  return (
    <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
      {growthCards.map((card) => (
        <div
          key={card.title}
          className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:shadow-xl hover:shadow-sky-500/5 dark:border-white/10 dark:bg-slate-950/80 dark:ring-white/5 dark:hover:bg-slate-900/80"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                {card.title}
              </p>

              <p className="mt-3 min-w-0 break-words text-[clamp(1.6rem,3vw,2.25rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                {card.displayValue}
              </p>
            </div>

            <div className={`${card.growthClass} shrink-0`}>
              {card.growthLabel}
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {card.helpText}
          </p>
        </div>
      ))}
    </section>
  )
}

export function ReportAverages({
  averageCards,
}: Pick<ReportCardsProps, 'averageCards'>) {
  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {averageCards.map((card) => (
        <div
          key={card.title}
          className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/40 hover:shadow-xl hover:shadow-sky-500/5 dark:border-white/10 dark:bg-slate-950/80 dark:ring-white/5 dark:hover:bg-slate-900/80"
        >
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            {card.title}
          </p>

          <p className="mt-4 min-w-0 break-words text-[clamp(1.4rem,2vw,1.875rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            {card.value}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  )
}