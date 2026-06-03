import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { createNumberFormatter, formatDateTimeLocal } from '../../lib/utils'
import type { StockLogRecord, ProductName, StockLogForm, SortOption } from '../../types/types'
import ConfirmToast from '../components/ConfirmToast'
import { useLanguage } from '../providers/useLanguage'

// ─── useStockLogs ─────────────────────────────────────────────────────────────
// Manages stock movement logs: fetch, insert, delete (with inventory reversal),
// sorting, filtering, and pagination.

export function useStockLogs(searchQuery: string) {
  const { t } = useLanguage()
  // ── Data State ──────────────────────────────────────────────────────────────
  const [stockLogs, setStockLogs] = useState<StockLogRecord[]>([])
  const [products, setProducts] = useState<ProductName[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<StockLogForm>({
    productId: '',
    qty: '',
    type: 'IN',
  })

  // ── Table State ─────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const num = useMemo(() => createNumberFormatter(), [])

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  // ── Reset pagination on filter change ───────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType])

  // ── Product Map ──────────────────────────────────────────────────────────────
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products]
  )

  // ── Load Logs ────────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async (uid: string) => {
    setLoading(true)
    try {
      const [logRes, productRes] = await Promise.all([
        supabase
          .from('Stock_logs')
          .select('id, user_id, product_id, type, qty, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('Product')
          .select('id, name')
          .eq('user_id', uid)
          .order('name', { ascending: true }),
      ])

      console.log('logRes data:', logRes.data)
      console.log('logRes error:', logRes.error)
      console.log('productRes data:', productRes.data)
      console.log('productRes error:', productRes.error)
      
      if (logRes.error) throw logRes.error
      if (productRes.error) throw productRes.error

      setStockLogs((logRes.data ?? []) as StockLogRecord[])
      setProducts((productRes.data ?? []) as ProductName[])
    } catch {
      setError(t('Unable to load stock logs. Please refresh.'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (userId) loadLogs(userId)
  }, [userId, loadLogs])

  // ── Stats ────────────────────────────────────────────────────────────────────
  const netMovement = useMemo(
    () =>
      stockLogs.reduce(
        (sum, log) => sum + log.qty * (log.type === 'IN' ? 1 : -1),
        0
      ),
    [stockLogs]
  )

  // ── Filtered + Sorted + Paginated Logs ──────────────────────────────────────
  const filteredSortedLogs = useMemo(() => {
    let logs = [...stockLogs]

    // Filter by type
    if (filterType !== 'ALL') {
      logs = logs.filter((log) => log.type === filterType)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      logs = logs.filter((log) =>
        (productMap.get(log.product_id) ?? log.product_id).toLowerCase().includes(q)
      )
    }

    // Sort
    logs.sort((a, b) => {
      const nameA = productMap.get(a.product_id) ?? a.product_id
      const nameB = productMap.get(b.product_id) ?? b.product_id
      switch (sortBy) {
        case 'name-asc': return nameA.localeCompare(nameB)
        case 'name-desc': return nameB.localeCompare(nameA)
        case 'qty-desc': return b.qty - a.qty
        case 'qty-asc': return a.qty - b.qty
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return logs
  }, [stockLogs, filterType, searchQuery, sortBy, productMap])

  const paginatedLogs = useMemo(
    () =>
      filteredSortedLogs.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredSortedLogs, currentPage]
  )

  // ── Refresh Logs (lightweight) ───────────────────────────────────────────────
  const refreshLogs = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('Stock_logs')
      .select('id, user_id, product_id, type, qty, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) setStockLogs((data ?? []) as StockLogRecord[])
  }, [userId])

  // ── Confirm Action (toast-based) ─────────────────────────────────────────────
  const confirmAction = useCallback(
    (message: string, onConfirm: () => void) => {
      const toastId = 'confirm-delete-log'

      toast.info(
        toast.info(
          React.createElement(ConfirmToast, {
            message,
            toastId,
            onConfirm,
          }),
          {
            toastId,
            autoClose: false,
            closeOnClick: false,
            closeButton: false,
            draggable: false,
          }
        )
      )
    },
    []
  )

  // ── Delete Log + Reverse Stock ───────────────────────────────────────────────
  const handleDeleteConfirmed = useCallback(
    async (
      logId: string,
      productIdToRestore: string,
      qtyToRestore: number,
      typeToReverse: 'IN' | 'OUT'
    ) => {
      if (!userId) { toast.error(t('User not authenticated')); return }
      setIsDeleting(true)
      setError('')
      setSuccess('')

      try {
        // 1. Delete the log
        const { error: deleteErr } = await supabase
          .from('Stock_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', userId)
        if (deleteErr) throw deleteErr

        // 2. Reverse the stock adjustment
        const adjustment = typeToReverse === 'IN' ? -qtyToRestore : qtyToRestore
        const { error: stockErr } = await supabase.rpc('update_stock', {
          p_product_id: productIdToRestore,
          p_qty: adjustment,
          p_user_id: userId,
        })
        if (stockErr) throw stockErr

        setSuccess(t('Stock log deleted and inventory reversed.'))
        toast.success(t('Stock log deleted successfully.'))
        await refreshLogs()
      } catch {
        setError(t('Failed to delete stock log.'))
        toast.error(t('Failed to delete stock log.'))
      } finally {
        setIsDeleting(false)
      }
    },
    [userId, refreshLogs, t]
  )

  const handleDelete = useCallback(
    (logId: string, productId: string, qty: number, type: 'IN' | 'OUT') => {
      confirmAction(
        t('Delete this stock log and reverse its inventory effect?'),
        () => handleDeleteConfirmed(logId, productId, qty, type)
      )
    },
    [confirmAction, handleDeleteConfirmed, t]
  )

  // ── Insert Stock Log ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setError('')
    setSuccess('')

    const { productId, qty, type } = form
    if (!productId || !qty) {
      setError(t('Please select a product and enter a quantity.'))
      return
    }

    const parsedQty = Number(qty)
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError(t('Quantity must be greater than zero.'))
      return
    }

    if (!userId) { toast.error(t('User not authenticated')); return }

    setLoading(true)

    try {
      const now = formatDateTimeLocal()

      const { error: insertErr } = await supabase.from('Stock_logs').insert([
        {
          user_id: userId,
          product_id: productId,
          type,
          qty: parsedQty,
          created_at: now,
        },
      ])
      if (insertErr) throw insertErr

      const adjustment = type === 'IN' ? parsedQty : -parsedQty
      const { error: stockErr } = await supabase.rpc('update_stock', {
        p_product_id: productId,
        p_qty: adjustment,
        p_user_id: userId,
      })
      if (stockErr) throw stockErr

      setSuccess(t('Stock log saved and inventory updated.'))
      setForm({ productId: '', qty: '', type: 'IN' })
      await refreshLogs()
    } catch {
      setError(t('Unable to save stock log.'))
    } finally {
      setLoading(false)
    }
  }, [form, userId, refreshLogs, t])

  return {
    // Data
    stockLogs,
    products,
    productMap,
    loading,
    isDeleting,
    error,
    success,
    // Form
    form,
    setForm,
    // Table
    sortBy,
    setSortBy,
    filterType,
    setFilterType,
    currentPage,
    setCurrentPage,
    filteredSortedLogs,
    paginatedLogs,
    ITEMS_PER_PAGE,
    // Stats
    netMovement,
    // Actions
    handleSubmit,
    handleDelete,
    refreshLogs,
    // Helpers
    num,
    setError,
    setSuccess,
  }
}
