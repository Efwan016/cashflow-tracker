import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  BarController,
  LineController,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js'

import 'chartjs-adapter-date-fns'
import { Chart as ReactChart } from 'react-chartjs-2'
import type { ChartProps } from '../../types/types'

ChartJS.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompact(value: number) {
  const abs = Math.abs(value)

  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`

  return `${value}`
}

function createBarGradient(
  context: ScriptableContext<'bar'>,
  top: string,
  bottom: string
) {
  const chart = context.chart
  const { ctx, chartArea } = chart

  if (!chartArea) return top

  const gradient = ctx.createLinearGradient(
    0,
    chartArea.top,
    0,
    chartArea.bottom
  )

  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)

  return gradient
}

function createLineGradient(context: ScriptableContext<'line'>) {
  const chart = context.chart
  const { ctx, chartArea } = chart

  if (!chartArea) return 'rgba(56, 189, 248, 0.18)'

  const gradient = ctx.createLinearGradient(
    0,
    chartArea.top,
    0,
    chartArea.bottom
  )

  gradient.addColorStop(0, 'rgba(56, 189, 248, 0.34)')
  gradient.addColorStop(0.45, 'rgba(56, 189, 248, 0.12)')
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0)')

  return gradient
}

export default function Chart({ data, variant = 'cashflow' }: ChartProps) {
  const isBarOnly = variant === 'bar'

  const hasData =
    data.labels.length > 0 &&
    [...data.revenue, ...data.expense, ...data.netProfit].some(
      (value) => Number(value) !== 0
    )

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-center dark:border-white/10 dark:bg-slate-950/40">
        <div>
          <p className="text-sm font-black text-slate-500 dark:text-slate-300">
            No chart data yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Your analytics will appear after new activity is recorded.
          </p>
        </div>
      </div>
    )
  }

  const timePoints = data.labels.map((label, index) => ({
    date: new Date(label).getTime(),
    revenue: data.revenue[index] ?? 0,
    expense: data.expense[index] ?? 0,
    netProfit: data.netProfit[index] ?? 0,
  }))

  const cashflowData: ChartData<'bar' | 'line'> = {
    datasets: [
      {
        type: 'bar' as const,
        label: 'Revenue',
        data: timePoints.map((item) => ({
          x: item.date,
          y: item.revenue,
        })),
        backgroundColor: (context: ScriptableContext<'bar'>) =>
          createBarGradient(
            context,
            'rgba(16, 185, 129, 0.38)',
            'rgba(16, 185, 129, 0.06)'
          ),
        borderColor: 'rgba(16, 185, 129, 0.18)',
        borderWidth: 1,
        borderRadius: 999,
        borderSkipped: false,
        barPercentage: 0.75,
        categoryPercentage: 0.55,
        order: 3,
      },
      {
        type: 'bar' as const,
        label: 'Expense',
        data: timePoints.map((item) => ({
          x: item.date,
          y: item.expense,
        })),
        backgroundColor: (context: ScriptableContext<'bar'>) =>
          createBarGradient(
            context,
            'rgba(244, 63, 94, 0.32)',
            'rgba(244, 63, 94, 0.05)'
          ),
        borderColor: 'rgba(244, 63, 94, 0.16)',
        borderWidth: 1,
        borderRadius: 999,
        borderSkipped: false,
        barPercentage: 0.75,
        categoryPercentage: 0.55,
        order: 4,
      },
      {
        type: 'line' as const,
        label: 'Net Profit',
        data: timePoints.map((item) => ({
          x: item.date,
          y: item.netProfit,
        })),
        borderColor: '#38bdf8',
        backgroundColor: (context: ScriptableContext<'line'>) =>
          createLineGradient(context),
        fill: true,
        tension: 0.42,
        borderWidth: 4,
        pointRadius: 4,
        pointHoverRadius: 9,
        pointHitRadius: 24,
        pointBackgroundColor: '#0f172a',
        pointBorderColor: '#38bdf8',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: '#38bdf8',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
        cubicInterpolationMode: 'monotone' as const,
        order: 1,
      },
    ],
  }

  const hasNetProfit = data.netProfit && data.netProfit.length > 0

  const barData: ChartData<'bar'> = {
    labels: data.labels,
    datasets: [
      {
        type: 'bar',
        label: hasNetProfit ? 'Profit' : 'Revenue',
        data: hasNetProfit ? data.netProfit : data.revenue,
        backgroundColor: (context: ScriptableContext<'bar'>) =>
          hasNetProfit
            ? createBarGradient(
                context,
                'rgba(16, 185, 129, 0.92)', // Warna Emerald top kalau Profit
                'rgba(52, 211, 153, 0.18)'  // Warna Emerald bottom kalau Profit
              )
            : createBarGradient(
                context,
                'rgba(56, 189, 248, 0.92)', // Tetap Sky Blue untuk Revenue/Stok
                'rgba(99, 102, 241, 0.18)'
              ),
        borderColor: hasNetProfit ? 'rgba(16, 185, 129, 0.45)' : 'rgba(56, 189, 248, 0.45)',
        borderWidth: 1,
        borderRadius: 999,
        borderSkipped: false,
        barPercentage: 0.78,
        categoryPercentage: 0.7,
      },
    ],
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 850,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.18)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 18,
        callbacks: {
          label(context) {
            const label = context.dataset.label || 'Value'
            return `${label}: ${formatCurrency(Number(context.raw || 0))}`
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
          drawTicks: false,
        },
        ticks: {
          color: '#94a3b8',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
          padding: 10,
          font: {
            size: 10,
            weight: 'bold',
          },
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawTicks: false,
        },
        ticks: {
          color: '#94a3b8',
          padding: 10,
          maxTicksLimit: 5,
          font: {
            size: 10,
            weight: 'bold',
          },
          callback(value) {
            return formatCompact(Number(value))
          },
        },
      },
    },
  }

  const cashflowOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 900,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          boxHeight: 7,
          padding: 16,
          color: '#94a3b8',
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.18)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 18,
        displayColors: true,
        usePointStyle: true,
        boxPadding: 6,
        titleFont: {
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
          weight: 'bold',
        },
        callbacks: {
          title(items) {
            const raw = items[0]?.parsed.x

            if (!raw) return ''

            return new Intl.DateTimeFormat('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(raw))
          },
          label(context) {
            const label = context.dataset.label || ''
            const value = Number(context.parsed.y || 0)

            return `${label}: ${formatCurrency(value)}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'dd MMM yyyy',
          displayFormats: {
            day: 'dd MMM',
            month: 'MMM yyyy',
          },
        },
        border: {
          display: false,
        },
        grid: {
          display: false,
          drawTicks: false,
        },
        ticks: {
          color: '#94a3b8',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          padding: 12,
          font: {
            size: 10,
            weight: 'bold',
          },
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawTicks: false,
        },
        ticks: {
          color: '#94a3b8',
          padding: 12,
          maxTicksLimit: 6,
          font: {
            size: 10,
            weight: 'bold',
          },
          callback(value) {
            return formatCompact(Number(value))
          },
        },
      },
    },
  }

  if (isBarOnly) {
    return <ReactChart type="bar" data={barData} options={barOptions} />
  }

  return <ReactChart type="bar" data={cashflowData} options={cashflowOptions} />
}