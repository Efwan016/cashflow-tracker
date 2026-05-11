export type Product = {
  id: string
  name: string
  harga_modal: number
  harga_jual: number
}

export type Stock = {
  id: string
  product_id: string
  total: number
}

export type Transaction = {
    id: string
    product_id: string
    qty: number
    harga_jual: number
    total: number
    created_at: string
}

export type Expense ={
    id: string
    description: string
    total: number
    created_at: string
}

export type Stock_Logs = {
    id: string
    product_id: string
    type: string
    qty: number
    created_at: string
}

// ─── Inventory Module — Shared Types ──────────────────────────────────────────

export type StockRecord = {
  id: string
  product_id: string
  total: number
  product_name?: string
}

export type StockLogRecord = {
  id: string
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
