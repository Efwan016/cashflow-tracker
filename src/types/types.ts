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