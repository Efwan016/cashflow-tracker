import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

interface ChartProps {
  data: {
    labels: string[]
    revenue: number[]
    expense: number[]
    netProfit: number[]
  }
}

export default function Chart({ data }: ChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Revenue',
        data: data.revenue,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Expense',
        data: data.expense,
        borderColor: '#fb7185',
        backgroundColor: 'rgba(251, 113, 133, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fb7185',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Net Profit',
        data: data.netProfit,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 2,
        pointHoverRadius: 8,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 11,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        padding: 12,
        borderRadius: 12,
        displayColors: true,
        usePointStyle: true,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 10,
          },
          padding: 10,
        },
      },
    },
  }

  return <Line data={chartData} options={options} />
}