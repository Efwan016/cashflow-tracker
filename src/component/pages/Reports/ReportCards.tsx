type SummaryCard = {
  title: string
  value: string
  helpText: string
  badgeClass: string
}

type GrowthCard = {
  title: string
  displayValue: string
  growthLabel: string
  growthClass: string
  helpText: string
}

type AverageCard = {
  title: string
  value: string
  subtitle: string
}

type ReportCardsProps = {
  summaryCards: SummaryCard[]
  growthCards: GrowthCard[]
  averageCards: AverageCard[]
}

export function ReportSummary({ summaryCards }: Pick<ReportCardsProps, 'summaryCards'>) {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div
          key={card.title}
          className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950/80"
        >
          <div className="flex items-start justify-between gap-4">
            <span className={card.badgeClass}>{card.title}</span>
            <span className="h-10 w-10 rounded-2xl bg-slate-100 transition group-hover:scale-105 dark:bg-slate-900" />
          </div>

          <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {card.value}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {card.helpText}
          </p>
        </div>
      ))}
    </section>
  )
}

export function ReportGrowth({ growthCards }: Pick<ReportCardsProps, 'growthCards'>) {
  return (
    <section className="mt-8 grid gap-5 grid-cols-1 md:grid-cols-2">
      {growthCards.map((card) => (
        <div key={card.title} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{card.title}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{card.displayValue}</p>
            </div>
            <div className={card.growthClass}>{card.growthLabel}</div>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{card.helpText}</p>
        </div>
      ))}
    </section>
  )
}

export function ReportAverages({ averageCards }: Pick<ReportCardsProps, 'averageCards'>) {
  return (
    <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      {averageCards.map((card) => (
        <div key={card.title} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{card.title}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.subtitle}</p>
        </div>
      ))}
    </section>
  )
}
