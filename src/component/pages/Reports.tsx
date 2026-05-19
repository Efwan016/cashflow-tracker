import ReportControls from './Reports/ReportControls'
import ReportOverview from './Reports/ReportOverview'
import ReportTrendSection from './Reports/ReportTrendSection'
import ReportInsights from './Reports/ReportInsights'
import ReportTables from './Reports/ReportTables'
import { ReportSummary, ReportGrowth, ReportAverages } from './Reports/ReportCards'
import { useReportsData } from '../hooks/useReportsData'

export default function Reports() {
  const {
    filterType,
    startDate,
    endDate,
    loading,
    isRefreshing,
    realtimeConnected,
    dateRangeLabel,
    filterTypeLabel,
    onFilterTypeChange,
    onDateChange,
    onRefresh,
    summaryCards,
    growthCards,
    averageCards,
    monthlyComparisonChartData,
    currentMonthTotals,
    monthlyRevenueGrowth,
    monthlyProfitGrowth,
    monthlyExpenseGrowth,
    monthComparisonSubtitle,
    fmt,
    num,
    trendChartData,
    comparisonChartData,
    comparisonTitle,
    currentTotals,
    bestByQty,
    bestByRevenue,
    mostProfitable,
    maxQtyByQty,
    maxRevenue,
    maxProfit,
    expenseBreakdown,
    maxExpenseCategory,
    biggestExpense,
    stockSummary,
    pagedLowStock,
    lowStockPage,
    itemsPerPage,
    onLowStockPageChange,
    error,
    txTotal,
    stockTotal,
    pagedTransactions,
    pagedStocks,
    txPage,
    stockPage,
    onTxPageChange,
    onStockPageChange,
    getProductName,
    productDetails,
  } = useReportsData()

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950/80 p-8 shadow-xl dark:shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl transition-colors">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-600 dark:text-sky-300/80">Reports</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">Financial intelligence and inventory performance</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Monitor revenue, expenses, profitability, product performance, and growth with a polished executive view.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ReportControls
            filterType={filterType}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            isRefreshing={isRefreshing}
            realtimeConnected={realtimeConnected}
            dateRangeLabel={dateRangeLabel}
            filterTypeLabel={filterTypeLabel}
            onFilterTypeChange={onFilterTypeChange}
            onDateChange={onDateChange}
            onRefresh={onRefresh}
          />

          <ReportSummary summaryCards={summaryCards} />
        </section>

        <ReportGrowth growthCards={growthCards} />
        <ReportAverages averageCards={averageCards} />

        <ReportOverview
          monthlyComparisonChartData={monthlyComparisonChartData}
          currentMonthTotals={currentMonthTotals}
          monthlyRevenueGrowth={monthlyRevenueGrowth}
          monthlyProfitGrowth={monthlyProfitGrowth}
          monthlyExpenseGrowth={monthlyExpenseGrowth}
          monthComparisonSubtitle={monthComparisonSubtitle}
          fmt={fmt}
        />

        <ReportTrendSection
          trendChartData={trendChartData}
          comparisonChartData={comparisonChartData}
          comparisonTitle={comparisonTitle}
          dateRangeLabel={dateRangeLabel}
          currentTotals={currentTotals}
          fmt={fmt}
        />

        <ReportInsights
          bestByQty={bestByQty}
          bestByRevenue={bestByRevenue}
          mostProfitable={mostProfitable}
          maxQtyByQty={maxQtyByQty}
          maxRevenue={maxRevenue}
          maxProfit={maxProfit}
          expenseBreakdown={expenseBreakdown}
          maxExpenseCategory={maxExpenseCategory}
          biggestExpense={biggestExpense}
          stockSummary={stockSummary}
          pagedLowStock={pagedLowStock}
          lowStockPage={lowStockPage}
          itemsPerPage={itemsPerPage}
          onLowStockPageChange={onLowStockPageChange}
          fmt={fmt}
          num={num}
        />

        <ReportTables
          loading={loading}
          error={error}
          txTotal={txTotal}
          stockTotal={stockTotal}
          pagedTransactions={pagedTransactions}
          pagedStocks={pagedStocks}
          txPage={txPage}
          stockPage={stockPage}
          itemsPerPage={itemsPerPage}
          onTxPageChange={onTxPageChange}
          onStockPageChange={onStockPageChange}
          getProductName={getProductName}
          num={num}
          fmt={fmt}
          productDetails={productDetails}
        />
      </div>
    </main>
  )
}
