import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../component/providers/LanguageProvider'
import ReportInsights from '../component/pages/Reports/ReportInsights'
import type { ReportInsightsProps } from '../types/types'

const fmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('en-US')

const defaultProps: ReportInsightsProps = {
  bestByQty: [{ name: 'Product A', qty: 5, revenue: 600, profit: 120 }],
  bestByRevenue: [{ name: 'Product B', qty: 2, revenue: 1500, profit: 300 }],
  mostProfitable: [{ name: 'Product C', qty: 1, revenue: 400, profit: 220 }],
  maxQtyByQty: 5,
  maxRevenue: 1500,
  maxProfit: 220,
  expenseBreakdown: [{ name: 'Software', total: 250 }],
  maxExpenseCategory: 250,
  biggestExpense: {
    id: 'e1',
    user_id: 'u1',
    description: 'Hosting',
    total: 180,
    created_at: '2024-01-01T00:00:00Z',
  },
  stockSummary: {
    value: 1200,
    potentialRevenue: 1800,
    potentialProfit: 600,
    lowStock: [{ name: 'Spare Part', qty: 2, modal: 10, jual: 15 }],
  },
  pagedLowStock: [{ name: 'Spare Part', qty: 2, modal: 10, jual: 15 }],
  lowStockPage: 1,
  itemsPerPage: 10,
  onLowStockPageChange: () => {},
  fmt,
  num,
  filterType: 'today',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
}

describe('ReportInsights component', () => {
  test('renders product insight cards and expense sections', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <ReportInsights {...defaultProps} />
        </MemoryRouter>
      </LanguageProvider>
    )

    expect(screen.getByText('Best seller by quantity')).toBeInTheDocument()
    expect(screen.getByText('Best seller by revenue')).toBeInTheDocument()
    expect(screen.getByText('Most profitable product')).toBeInTheDocument()
    expect(screen.getByText('Product A')).toBeInTheDocument()
    expect(screen.getByText('Product B')).toBeInTheDocument()
    expect(screen.getByText('Product C')).toBeInTheDocument()
    expect(screen.getByText('Hosting')).toBeInTheDocument()
    expect(screen.getByText('Software')).toBeInTheDocument()
  })

  test('renders stock summary and low stock info', () => {
    render(
      <LanguageProvider>
        <MemoryRouter>
          <ReportInsights {...defaultProps} />
        </MemoryRouter>
      </LanguageProvider>
    )

    expect(screen.getByText('Stock value')).toBeInTheDocument()
    expect(screen.getByText('Potential revenue')).toBeInTheDocument()
    expect(screen.getByText('Potential profit')).toBeInTheDocument()
    expect(screen.getByText('Low stock alert')).toBeInTheDocument()
    expect(screen.getByText('Spare Part')).toBeInTheDocument()
    expect(screen.getByText(/2 left/)).toBeInTheDocument()
  })
})
