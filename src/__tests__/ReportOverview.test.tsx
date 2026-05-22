import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ReportOverview from '../component/pages/Reports/ReportOverview'
import type { ReportOverviewProps } from '../types/types'

vi.mock('../component/components/Chart', () => ({
  default: () => <div data-testid="mock-chart">MockChart</div>,
}))

describe('ReportOverview component', () => {
  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const defaultProps: ReportOverviewProps = {
    monthlyComparisonChartData: {
      labels: ['2024-01-01', '2024-01-02'],
      revenue: [1000, 1200],
      expense: [500, 400],
      netProfit: [500, 800],
    },
    currentMonthTotals: {
      revenue: 10000,
      grossProfit: 6000,
      expenses: 2000,
    },
    monthlyRevenueGrowth: 12.5,
    monthlyProfitGrowth: 8.3,
    monthlyExpenseGrowth: -4.2,
    monthComparisonSubtitle: 'This month',
    fmt,
  }

  test('renders overview headings and summary cards', () => {
    render(<ReportOverview {...defaultProps} />)

    expect(screen.getByText('This month vs last month')).toBeInTheDocument()
    expect(screen.getByText('Revenue, cost, and profit performance.')).toBeInTheDocument()
    expect(screen.getByText(/This month revenue/i)).toBeInTheDocument()
    expect(screen.getByText(/This month profit/i)).toBeInTheDocument()
    expect(screen.getByText(/This month expenses/i)).toBeInTheDocument()
    expect(screen.getByText('Snapshot by the numbers')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  test('formats chart values and growth labels', () => {
    render(<ReportOverview {...defaultProps} />)

    expect(screen.getByText(/10,000/)).toBeInTheDocument()
    expect(screen.getAllByText('+12.5%')[0]).toBeInTheDocument()
    expect(screen.getAllByText('+8.3%')[0]).toBeInTheDocument()
    expect(screen.getAllByText('-4.2%')[0]).toBeInTheDocument()
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
  })
})
