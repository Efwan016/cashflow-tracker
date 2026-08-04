import { useState, useCallback, useEffect, useRef } from 'react'
import { useInventory } from '../../hooks/useInventory'
import { useStockLogs } from '../../hooks/useStockLogs'
import { InventoryHeader } from '../../pages/Inventory/InventoryHeader'
import { InventoryStats } from '../../pages/Inventory/InventoryStats'
import { StockControlPanel } from '../../pages/Inventory/StockControlPanel'
import { InventoryTable } from '../../layout/table/InventoryTable'
import { StockLogsTable } from '../../layout/table/StockLogsTable'
import { InventoryTabs } from '../../layout/table/InventoryTabs'
import type { ActiveTab } from '../../../types/types'

// ─── InventoryPage ────────────────────────────────────────────────────────────
// Merged page combining Stock + StockLogs into a unified enterprise dashboard.
// All Supabase logic is preserved via useInventory / useStockLogs hooks.

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory')
  const [globalSearch, setGlobalSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Debounced Search ─────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(globalSearch), 250)
    return () => clearTimeout(debounceRef.current)
  }, [globalSearch])

  // ── Hooks ────────────────────────────────────────────────────────────────────
  const inventory = useInventory()
  const logs = useStockLogs(debouncedSearch)

  // Pass debounced search to inventory table too
  useEffect(() => {
    inventory.setSearchQuery(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // ── Realtime indicator ────────────────────────────────────────────────────────
  // Mark as connected after initial load
  useEffect(() => {
    if (!inventory.loading) {
      const t = setTimeout(() => setRealtimeConnected(true), 500)
      return () => clearTimeout(t)
    }
  }, [inventory.loading])

  // ── Refresh All ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      inventory.loadStock(),
      logs.refreshLogs(),
    ])
    setIsRefreshing(false)
  }, [inventory, logs])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-4 sm:py-6 lg:px-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <InventoryHeader
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          realtimeConnected={realtimeConnected}
        />

        {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
        <InventoryStats
          totalProducts={inventory.products.length}
          totalStockQty={inventory.totalStock}
          totalMovements={logs.stockLogs.length}
          lowStockCount={inventory.lowStockCount}
          loading={inventory.loading}
        />

        {/* ── Main Content ─────────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[1fr]">

          {/* ── Left: Stock Control Panel ───────────────────────────────────── */}
          <StockControlPanel
            form={inventory.form}
            onFormChange={inventory.setForm}
            products={inventory.products}
            onSubmit={inventory.handleSubmit}
            onQuickAdjust={inventory.handleQuickAdjust}
            submitting={inventory.submitting}
            error={inventory.error}
            success={inventory.success}
          />

          {/* ── Right: Tabs ─────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <InventoryTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              inventoryCount={inventory.stockItems.length}
              logsCount={logs.stockLogs.length}
            >
              {activeTab === 'inventory' ? (
                <InventoryTable
                  items={inventory.filteredSortedItems}
                  paginatedItems={inventory.paginatedItems}
                  loading={inventory.loading}
                  editingId={inventory.editingId}
                  editQty={inventory.editQty}
                  editName={inventory.editName}
                  onEditQtyChange={inventory.setEditQty}
                  onEditNameChange={inventory.setEditName}
                  onStartEdit={inventory.startEdit}
                  onConfirmEdit={inventory.handleEdit}
                  onCancelEdit={inventory.cancelEdit}
                  sortBy={inventory.sortBy}
                  onSortChange={inventory.setSortBy}
                  currentPage={inventory.currentPage}
                  itemsPerPage={inventory.ITEMS_PER_PAGE}
                  onPageChange={inventory.setCurrentPage}
                  formatter={inventory.num}
                />
              ) : (
                <StockLogsTable
                  logs={logs.filteredSortedLogs}
                  paginatedLogs={logs.paginatedLogs}
                  productMap={logs.productMap}
                  loading={logs.loading}
                  isDeleting={logs.isDeleting}
                  onDelete={logs.handleDelete}
                  sortBy={logs.sortBy}
                  onSortChange={logs.setSortBy}
                  filterType={logs.filterType}
                  onFilterTypeChange={logs.setFilterType}
                  currentPage={logs.currentPage}
                  itemsPerPage={logs.ITEMS_PER_PAGE}
                  onPageChange={logs.setCurrentPage}
                  formatter={logs.num}
                  // Log entry form
                  form={logs.form}
                  products={logs.products}
                  onFormChange={logs.setForm}
                  onFormSubmit={logs.handleSubmit}
                  formLoading={logs.loading}
                  formError={logs.error}
                  formSuccess={logs.success}
                />
              )}
            </InventoryTabs>
          </div>
        </div>

      </div>
    </main>
  )
}
