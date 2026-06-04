
export type Product = {
  id: string
  name: string
  harga_modal: number
  harga_jual: number
  user_id?: string
}

export type Stock = {
  id: string
  product_id: string
  total: number
  harga_modal?: number | null
  harga_jual?: number | null
  product?: Product
}


export type Transaction = {
  id: string
  product_id: string | null
  product_name?: string | null
  qty: number
  harga_jual: number
  harga_modal?: number
  profit?: number
  total: number
  mode?: string | null
  created_at: string
  user_id?: string
}

export type Expense ={
    id: string
    user_id: string
    description: string
    total: number
    created_at: string
}



export type StockLog = {
  id: string
  user_id: string
  product_id: string
  type: 'IN' | 'OUT'
  qty: number
  created_at: string
  product?: Product
}


export type Profile = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}


export type FilterType =
  | 'today'
  | 'last7'
  | 'thisMonth'
  | 'last3month'
  | 'specific'
  | 'range'

export type ProductInsight = {
  name: string
  qty: number
  revenue: number
  profit: number
}

// ─── Inventory Module — Shared Types ──────────────────────────────────────────

export type StockRecord = {
  id: string
  user_id: string
  product_id: string
  total: number
  product_name?: string
}

export type StockLogRecord = {
  id: string
  user_id: string
  product_id: string
  type: 'IN' | 'OUT'
  qty: number
  created_at: string
}

export type ProductName = {
  id: string
  name: string
}

export type StockMovementType = 'add' | 'reduce'

export type StockUpdateForm = {
  productId: string
  quantity: string
  movementType: StockMovementType
}

export type StockLogForm = {
  productId: string
  qty: string
  type: 'IN' | 'OUT'
}

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'qty-asc'
  | 'qty-desc'
  | 'date-asc'
  | 'date-desc'

export type ActiveTab = 'inventory' | 'logs'

// ───  Inventory Header Props ────────────────────────────────────────────────────────────────

export interface InventoryHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  isRefreshing: boolean
  realtimeConnected: boolean
}

export interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  accentClass: string
  borderClass: string
  loading?: boolean
}

export interface StockControlPanelProps {
  form: StockUpdateForm
  onFormChange: (form: StockUpdateForm) => void
  products: ProductName[]
  onSubmit: () => void
  onQuickAdjust: (delta: number) => void
  submitting: boolean
  error: string
  success: string
}

// ───  Skeleton Types ────────────────────────────────────────────────────────────────

export type SkeletonProps = {
  n?: number
  h?: number
  variant?: 'chart' | 'list'
}

// ───  Transaction Types ────────────────────────────────────────────────────────────────

export interface TransactionFormProps {
  products: Product[];
  formData: {
    productId: string;
    manualName: string;
    qty: string;
    salePrice: string;
    modalPrice: string;
  };
  onFieldChange: (field: string, value: string) => void;
  onSelectProduct: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  calculatedTotal: string;
  expectedProfit: string;
  initialFocusRef?: React.RefObject<HTMLSelectElement | null>;
}

export interface TransactionFilter {
  start?: string;
  end?: string;
  limit?: number;
}

// ───  Chart Props ────────────────────────────────────────────────────────────────
export type ChartVariant = 'cashflow' | 'bar'

export type ChartProps = {
  data: {
    labels: string[]
    revenue: number[]
    expense: number[]
    netProfit: number[]
  }
  variant?: ChartVariant
}

// ───  Confirm Toast Props ────────────────────────────────────────────────────────────────

export type ConfirmToastProps = {
  message: string
  toastId: string
  onConfirm: () => void
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

// ─── InventorySkeleton ────────────────────────────────────────────────────────


export interface TableSkeletonProps {
  rows?: number
  cols?: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  total: number
}


export interface SidebarProps {
  isSidebarOpen: boolean
  isDesktopSidebarOpen: boolean
  closeMobileSidebar: () => void
  name: string
  netProfit: number
  email: string
  avatarUrl: string | null
}
 // ───  Report Types ────────────────────────────────────────────────────────────────

 export type SummaryCard = {
  title: string
  value: string
  helpText: string
  badgeClass: string
}

export type GrowthCard = {
  title: string
  displayValue: string
  growthLabel: string
  growthClass: string
  helpText: string
}

export type AverageCard = {
  title: string
  value: string
  subtitle: string
}

export type ReportCardsProps = {
  summaryCards: SummaryCard[]
  growthCards: GrowthCard[]
  averageCards: AverageCard[]
}

export type ReportControlsProps = {
  filterType: FilterType
  startDate: string
  endDate: string
  loading: boolean
  isRefreshing: boolean
  realtimeConnected: boolean
  dateRangeLabel: string
  filterTypeLabel: string
  onFilterTypeChange: (type: FilterType) => void
  onDateChange: (field: 'start' | 'end', value: string) => void
  onRefresh: () => void
}

export type StockItem = {
  name: string
  qty: number
  modal: number
  jual: number
}

export type ReportInsightsProps = {
  bestByQty: ProductInsight[]
  bestByRevenue: ProductInsight[]
  mostProfitable: ProductInsight[]
  maxQtyByQty: number
  maxRevenue: number
  maxProfit: number
  expenseBreakdown: { name: string; total: number }[]
  maxExpenseCategory: number
  biggestExpense: Expense | null
  stockSummary: {
    value: number
    potentialRevenue: number
    potentialProfit: number
    lowStock: StockItem[]
  }
  pagedLowStock: StockItem[]
  lowStockPage: number
  itemsPerPage: number
  onLowStockPageChange: (page: number) => void
  fmt: Intl.NumberFormat
  num: Intl.NumberFormat
  filterType: string
  startDate: string
  endDate: string
}

export type OverviewTotals = {
  revenue: number
  grossProfit: number
  expenses: number
}

export type ReportOverviewProps = {
  monthlyComparisonChartData: ChartProps['data']
  currentMonthTotals: OverviewTotals
  monthlyRevenueGrowth: number
  monthlyProfitGrowth: number
  monthlyExpenseGrowth: number
  monthComparisonSubtitle: string
  fmt: Intl.NumberFormat
}

export type ReportTablesProps = {
  loading: boolean
  error: string
  txTotal: number
  stockTotal: number
  pagedTransactions: Transaction[]
  pagedStocks: Stock[]
  txPage: number
  stockPage: number
  itemsPerPage: number
  onTxPageChange: (page: number) => void
  onStockPageChange: (page: number) => void
  getProductName: (transaction: Transaction) => string
  num: Intl.NumberFormat
  fmt: Intl.NumberFormat
  productDetails: Map<string, Product>
}

export type TrendTotals = {
  revenue: number
  grossProfit: number
  expenses: number
}

export type ReportTrendSectionProps = {
  trendChartData: ChartProps['data']
  comparisonChartData: ChartProps['data']
  comparisonTitle: string
  dateRangeLabel: string
  currentTotals: TrendTotals
  fmt: Intl.NumberFormat
}

// ─── AI Insight Types ────────────────────────────────────────────────────────

export type ReportInsightResponse = {
  insight: string
  generatedAt: string
  geminiStatus?: 'generated' | 'fallback'
  telegramNotified?: boolean
  telegramStatus?: 'sent' | 'not_configured' | 'misconfigured' | 'failed'
  error?: string
}
