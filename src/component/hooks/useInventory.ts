import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { createNumberFormatter } from '../../lib/utils'
import type { StockRecord, ProductName, StockUpdateForm, SortOption } from '../../types/types'

// ─── useInventory ─────────────────────────────────────────────────────────────
// Manages stock inventory data: fetching, realtime sync, CRUD operations,
// sorting, filtering, pagination, and derived stats.

export function useInventory() {
  // ── Data State ──────────────────────────────────────────────────────────────
  const [stockItems, setStockItems] = useState<StockRecord[]>([])
  const [products, setProducts] = useState<ProductName[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<StockUpdateForm>({
    productId: '',
    quantity: '',
    movementType: 'add',
  })

  // ── Inline-edit State ───────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editName, setEditName] = useState('')

  // ── Table State ─────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const ITEMS_PER_PAGE = 10

  const num = useMemo(() => createNumberFormatter(), [])

  // ── Load Stock ───────────────────────────────────────────────────────────────
  const loadStock = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const [stockRes, productsRes] = await Promise.all([
        supabase.from('Stock').select('id, product_id, total').eq('user_id', user.id),
        supabase.from('Product').select('id, name').eq('user_id', user.id),
      ])

      if (productsRes.error) throw productsRes.error
      if (stockRes.error) throw stockRes.error

      const prods = (productsRes.data ?? []) as ProductName[]
      setProducts(prods)

      const productMap = new Map(prods.map((p) => [p.id, p]))
      const merged: StockRecord[] = (stockRes.data ?? []).map((stock) => ({
        ...stock,
        product_name: productMap.get(stock.product_id)?.name,
      }))

      setStockItems(merged)
    } catch {
      setError('Unable to load stock data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Realtime Subscription ────────────────────────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let debounceTimer: ReturnType<typeof setTimeout>
    let isMounted = true

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isMounted) return

      await loadStock()
      if (!isMounted) return

      channel = supabase
        .channel(`stock-${user.id}-${Math.random().toString(36).substring(7)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Stock',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
              if (isMounted) loadStock()
            }, 300)
          }
        )
        .subscribe()
    }

    init()
    return () => {
      isMounted = false
      if (channel) supabase.removeChannel(channel)
      clearTimeout(debounceTimer)
    }
  }, [loadStock])

  // ── Filtered + Sorted + Paginated Items ──────────────────────────────────────
  const filteredSortedItems = useMemo(() => {
    let items = [...stockItems]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((item) =>
        (item.product_name ?? item.product_id).toLowerCase().includes(q)
      )
    }

    items.sort((a, b) => {
      const nameA = a.product_name ?? a.product_id
      const nameB = b.product_name ?? b.product_id
      switch (sortBy) {
        case 'name-asc':  return nameA.localeCompare(nameB)
        case 'name-desc': return nameB.localeCompare(nameA)
        case 'qty-desc':  return b.total - a.total
        case 'qty-asc':   return a.total - b.total
        default:          return 0
      }
    })

    return items
  }, [stockItems, sortBy, searchQuery])

  const paginatedItems = useMemo(
    () =>
      filteredSortedItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredSortedItems, currentPage]
  )

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalStock = useMemo(
    () => stockItems.reduce((sum, item) => sum + item.total, 0),
    [stockItems]
  )
  const lowStockCount = useMemo(
    () => stockItems.filter((item) => item.total <= 5).length,
    [stockItems]
  )

  // ── Submit Stock Update ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setError('')
    setSuccess('')

    const { productId, quantity, movementType } = form
    if (!productId || !quantity) {
      setError('Please select a product and enter a quantity.')
      return
    }

    const parsedQty = Number(quantity)
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be a positive number.')
      return
    }

    const finalQty = movementType === 'add' ? parsedQty : -parsedQty
    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { setError('User not authenticated.'); return }

      const { error: rpcError } = await supabase.rpc('update_stock', {
        p_product_id: productId,
        p_qty: finalQty,
        p_user_id: user.id,
      })
      if (rpcError) throw rpcError

      setSuccess(`Stock ${movementType === 'add' ? 'added' : 'reduced'} successfully.`)
      setForm({ productId: '', quantity: '', movementType: 'add' })
    } catch {
      setError('Failed to update stock. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [form])

  // ── Inline Edit Submit ───────────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (item: StockRecord) => {
      setError('')
      setSuccess('')

      const newTotal = Number(editQty)
      if (editQty === '') { setError('Quantity cannot be empty.'); return }
      if (!Number.isFinite(newTotal)) { setError('Invalid quantity.'); return }

      const delta = newTotal - item.total
      if (delta === 0 && editName === item.product_name) {
        setError('No changes detected.')
        return
      }
      if (editName !== item.product_name && !editName.trim()) {
        setError('Product name cannot be empty.')
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) { setError('User not found.'); return }

        if (editName !== item.product_name) {
          const { error: nameErr } = await supabase
            .from('Product')
            .update({ name: editName.trim() })
            .eq('id', item.product_id)
            .eq('user_id', user.id)
          if (nameErr) throw nameErr
        }

        if (delta !== 0) {
          const { error: stockErr } = await supabase.rpc('update_stock', {
            p_product_id: item.product_id,
            p_qty: delta,
            p_user_id: user.id,
          })
          if (stockErr) throw stockErr
        }

        setSuccess('Product updated successfully.')
        setEditingId(null)
        setEditQty('')
        setEditName('')
        await loadStock()
      } catch {
        setError('Failed to update product or stock.')
      }
    },
    [editQty, editName, loadStock]
  )

  // ── Edit Helpers ─────────────────────────────────────────────────────────────
  const startEdit = useCallback((item: StockRecord) => {
    setEditingId(item.id)
    setEditQty(item.total.toString())
    setEditName(item.product_name ?? '')
    setError('')
    setSuccess('')
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditQty('')
    setEditName('')
  }, [])

  // ── Quick Adjust ─────────────────────────────────────────────────────────────
  const handleQuickAdjust = useCallback(
    (delta: number) => {
      if (!form.productId) {
        setError('Please select a product first.')
        return
      }
      setForm((prev) => ({
        ...prev,
        quantity: Math.abs(delta).toString(),
        movementType: delta > 0 ? 'add' : 'reduce',
      }))
    },
    [form.productId]
  )

  return {
    // Data
    stockItems,
    products,
    loading,
    submitting,
    error,
    success,
    // Form
    form,
    setForm,
    // Edit
    editingId,
    editQty,
    editName,
    setEditQty,
    setEditName,
    // Table
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    filteredSortedItems,
    paginatedItems,
    ITEMS_PER_PAGE,
    // Stats
    totalStock,
    lowStockCount,
    // Actions
    loadStock,
    handleSubmit,
    handleEdit,
    startEdit,
    cancelEdit,
    handleQuickAdjust,
    // Helpers
    num,
    setError,
    setSuccess,
  }
}
