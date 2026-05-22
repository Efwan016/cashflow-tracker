import { render, screen } from '@testing-library/react'
import { ReportSummary, ReportGrowth, ReportAverages } from '../component/pages/Reports/ReportCards'
import type { SummaryCard, GrowthCard, AverageCard } from '../types/types'

describe('ReportCards components', () => {
  test('ReportSummary renders summary cards', () => {
    const summaryCards: SummaryCard[] = [
      { title: 'Revenue', value: 'Rp1.000', helpText: 'Month', badgeClass: 'badge' },
      { title: 'Profit', value: 'Rp500', helpText: 'Month', badgeClass: 'badge' },
    ]

    render(<ReportSummary summaryCards={summaryCards} />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Profit')).toBeInTheDocument()
    expect(screen.getByText('Rp1.000')).toBeInTheDocument()
    expect(screen.getByText('Rp500')).toBeInTheDocument()
  })

  test('ReportSummary handles empty summary cards safely', () => {
    const summaryCards: SummaryCard[] = []
    const { container } = render(<ReportSummary summaryCards={summaryCards} />)

    expect(container.querySelector('section')).toBeInTheDocument()
    expect(screen.queryByText('Revenue')).not.toBeInTheDocument()
  })

  test('ReportGrowth renders growth cards with labels', () => {
    const growthCards: GrowthCard[] = [
      { title: 'Revenue Growth', displayValue: '+10%', growthLabel: '+10%', growthClass: 'text-green-500', helpText: 'vs last month' },
    ]

    render(<ReportGrowth growthCards={growthCards} />)

    expect(screen.getByText('Revenue Growth')).toBeInTheDocument()
    const matches = screen.getAllByText('+10%')
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  test('ReportGrowth renders negative values and labels', () => {
    const growthCards: GrowthCard[] = [
      { title: 'Net Loss', displayValue: '-7.2%', growthLabel: '-7.2%', growthClass: 'text-red-500', helpText: 'expense exceeded revenue' },
    ]

    render(<ReportGrowth growthCards={growthCards} />)

    expect(screen.getByText('Net Loss')).toBeInTheDocument()
    expect(screen.getAllByText('-7.2%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('expense exceeded revenue')).toBeInTheDocument()
  })

  test('ReportAverages renders average cards', () => {
    const averageCards: AverageCard[] = [
      { title: 'Avg Order', value: '5', subtitle: 'per customer' },
    ]

    render(<ReportAverages averageCards={averageCards} />)

    expect(screen.getByText('Avg Order')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('per customer')).toBeInTheDocument()
  })

  test('ReportAverages renders zero values', () => {
    const averageCards: AverageCard[] = [
      { title: 'Average Loss', value: '0', subtitle: 'no activity' },
    ]

    render(<ReportAverages averageCards={averageCards} />)

    expect(screen.getByText('Average Loss')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('no activity')).toBeInTheDocument()
  })
})
