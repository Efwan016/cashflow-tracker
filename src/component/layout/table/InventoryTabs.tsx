import { Layers, History } from 'lucide-react'
import type { ActiveTab } from '../../../types/types'

// ─── InventoryTabs ────────────────────────────────────────────────────────────

interface Tab {
  id: ActiveTab
  label: string
  icon: React.ReactNode
  count?: number
}

interface InventoryTabsProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  inventoryCount: number
  logsCount: number
  children: React.ReactNode
}

export function InventoryTabs({
  activeTab,
  onTabChange,
  inventoryCount,
  logsCount,
  children,
}: InventoryTabsProps) {
  const tabs: Tab[] = [
    {
      id: 'inventory',
      label: 'Current Inventory',
      icon: <Layers className="h-3.5 w-3.5" />,
      count: inventoryCount,
    },
    {
      id: 'logs',
      label: 'Movement Logs',
      icon: <History className="h-3.5 w-3.5" />,
      count: logsCount,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Navigation */}
      <nav
        role="tablist"
        aria-label="Inventory sections"
        className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:block">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-slate-800 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="animate-in fade-in duration-200"
      >
        {children}
      </div>
    </div>
  )
}
