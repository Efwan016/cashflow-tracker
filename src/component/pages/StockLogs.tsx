import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { createNumberFormatter, formatDateTimeLocal } from '../../lib/utils'
import type { Stock_Logs } from '../../types/types'

type StockLogRecord = Stock_Logs & { type: 'IN' | 'OUT' }

type ProductName = {
  id: string
  name: string
}

export default function StockLogs() {
  const [stockLogs, setStockLogs] = useState<StockLogRecord[]>([])
  const [products, setProducts] = useState<ProductName[]>([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [type, setType] = useState<'IN' | 'OUT'>('IN')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortBy, setSortBy] = useState('date-desc')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!userId) return
      setLoading(true)

      const [logResult, productResult] = await Promise.all([
        supabase
          .from('Stock_logs')
          .select('id, product_id, type, qty, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('Product')
          .select('id, name')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
      ])

      const { data: logData, error: logError } = logResult
      const { data: productData, error: productError } = productResult

      if (logError) {
        setError('Unable to load stock logs: ' + logError.message)
      } else {
        setStockLogs(logData ?? [])
      }

      if (!productError) {
        setProducts((productData ?? []) as ProductName[])
      }

      setLoading(false)
    }
    loadData()
  }, [userId])

  const num = useMemo(() => createNumberFormatter(), []);

  const totalLogs = useMemo(() => stockLogs.length, [stockLogs])
  const totalQty = useMemo(() => stockLogs.reduce((sum, item) => sum + item.qty * (item.type === 'IN' ? 1 : -1), 0), [stockLogs])
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  const sortedLogs = useMemo(() => {
    const list = [...stockLogs]
    list.sort((a, b) => {
      const nameA = productMap.get(a.product_id) || a.product_id
      const nameB = productMap.get(b.product_id) || b.product_id
      switch (sortBy) {
        case 'name-asc': return nameA.localeCompare(nameB)
        case 'name-desc': return nameB.localeCompare(nameA)
        case 'qty-desc': return b.qty - a.qty
        case 'qty-asc': return a.qty - b.qty
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    return list
  }, [stockLogs, sortBy, productMap])

  const paginatedLogs = useMemo(() => {
    return sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }, [sortedLogs, currentPage])

  const getPageRange = (current: number, total: number) => {
    const range: (number | string)[] = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) range.push(i)
    } else {
      if (current <= 4) {
        range.push(1, 2, 3, 4, 5, '...', total)
      } else if (current >= total - 3) {
        range.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
      } else {
        range.push(1, '...', current - 1, current, current + 1, '...', total)
      }
    }
    return range
  }

  const refreshLogs = async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('Stock_logs')
      .select('id, product_id, type, qty, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12)

    if (!error) {
      setStockLogs(data ?? [])
    }
  }

  const confirmAction = (message: string, onConfirm: () => void) => {
    const customId = "confirm-delete-log";
    toast.info(
      <div className="space-y-4">
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            onClick={() => {
              toast.dismiss(customId)
              onConfirm()
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={() => toast.dismiss(customId)}
          >
            Cancel
          </button>
        </div>
      </div>,
      { toastId: customId, autoClose: false, closeOnClick: false, closeButton: false, draggable: false }
    )
  }

  const handleDeleteConfirmed = async (
    logId: string,
    productIdToRestore: string,
    qtyToRestore: number,
    typeToReverse: 'IN' | 'OUT'
  ) => {
    setError('')
    setSuccess('')
    setIsDeleting(true)

    if (!userId) {
      toast.error('User not authenticated')
      setIsDeleting(false)
      return
    }

    const { error: deleteError } = await supabase.from('Stock_logs').delete().eq('id', logId).eq('user_id', userId)
    if (deleteError) {
      setError('Unable to delete stock log: ' + deleteError.message)
      toast.error('Unable to delete stock log: ' + deleteError.message)
      setIsDeleting(false)
      return
    }

    const adjustment = typeToReverse === 'IN' ? -qtyToRestore : qtyToRestore
    const { data: existingStock, error: stockError } = await supabase
      .from('Stock')
      .select('id, total')
      .eq('product_id', productIdToRestore)
      .eq('user_id', userId)
      .maybeSingle()

    if (stockError) {
      setError('Stock log deleted but failed to update stock: ' + stockError.message)
      toast.error('Stock log deleted but failed to update stock: ' + stockError.message)
      setIsDeleting(false)
      await refreshLogs()
      return
    }

    if (existingStock) {
      const updatedTotal = Math.max(0, existingStock.total + adjustment)
      const { error: updateError } = await supabase
        .from('Stock')
        .update({ total: updatedTotal })
        .eq('id', existingStock.id)
        .eq('user_id', userId)

      if (updateError) {
        setError('Stock log deleted but failed to update stock: ' + updateError.message)
        toast.error('Stock log deleted but failed to update stock: ' + updateError.message)
        setIsDeleting(false)
        await refreshLogs()
        return
      }
    } else if (adjustment > 0) {
      const { error: createError } = await supabase.from('Stock').insert([
        { product_id: productIdToRestore, total: adjustment, user_id: userId },
      ])
      if (createError) {
        setError('Stock log deleted but failed to restore stock item: ' + createError.message)
        toast.error('Stock log deleted but failed to restore stock item: ' + createError.message)
        setIsDeleting(false)
        await refreshLogs()
        return
      }
    }

    setIsDeleting(false)
    setSuccess('Stock log deleted successfully.')
    toast.success('Stock log deleted successfully.')
    await refreshLogs()
  }

  const handleDelete = (
    logId: string,
    productIdToRestore: string,
    qtyToRestore: number,
    typeToReverse: 'IN' | 'OUT'
  ) => {
    confirmAction('Delete this stock log and reverse its inventory effect?', () =>
      handleDeleteConfirmed(logId, productIdToRestore, qtyToRestore, typeToReverse)
    )
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!productId || !qty) {
      setError('Fill in the product ID and quantity first.')
      return
    }

    const parsedQty = Number(qty)
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    setLoading(true)
    const now = formatDateTimeLocal();

    const { error: insertError } = await supabase.from('Stock_logs').insert([
      {
        user_id: userId,
        product_id: productId,
        type,
        qty: parsedQty,
        created_at: now,
      },
    ])

    if (insertError) {
      setError('Unable to save stock log: ' + insertError.message)
      setLoading(false)
      return
    }

    const { data: existingStock, error: stockError } = await supabase
      .from('Stock')
      .select('id, total')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle()

    if (stockError) {
      setError('Unable to update stock count: ' + stockError.message)
      setLoading(false)
      return
    }

    const adjustment = type === 'IN' ? parsedQty : -parsedQty
    if (existingStock) {
      const updatedTotal = Math.max(0, existingStock.total + adjustment)
      const { error: updateError } = await supabase
        .from('Stock')
        .update({ total: updatedTotal })
        .eq('id', existingStock.id)
        .eq('user_id', userId)
      if (updateError) {
        setError('Unable to update stock count: ' + updateError.message)
        setLoading(false)
        return
      }
    } else if (type === 'IN') {
      const { error: createError } = await supabase.from('Stock').insert([
        {
          user_id: userId,
          product_id: productId,
          total: parsedQty,
        },
      ])
      if (createError) {
        setError('Unable to create stock item: ' + createError.message)
        setLoading(false)
        return
      }
    }

    const [{ data: refreshedLogs, error: refreshLogsError }, { error: refreshStockError }] = await Promise.all([
      supabase
        .from('Stock_logs')
        .select('id, product_id, type, qty, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('Stock')
        .select('id, product_id, total')
        .eq('user_id', userId)
        .order('product_id', { ascending: true }),
    ])

    if (refreshLogsError || refreshStockError) {
      setError(
        'Unable to refresh stock data: ' +
          [refreshLogsError?.message, refreshStockError?.message].filter(Boolean).join(' | ')
      )
      setLoading(false)
      return
    }

    setStockLogs(refreshedLogs ?? [])
    setSuccess('Stock log saved and inventory updated successfully.')
    setProductId('')
    setQty('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Stock logs</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Record inventory movements</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Track inbound and outbound stock changes. Stock logs are linked to inventory counts automatically.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-6">
              {error && (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  {success}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Product</span>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-4">
                  <p className="text-sm text-slate-400">Movement type</p>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'IN' | 'OUT')}
                    className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">Each stock log updates the inventory count in the stocks table automatically.</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Save stock log'}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Current stock activity</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent changes</h2>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Stock logs</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{totalLogs}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm text-slate-400">Net stock movement</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{num.format(totalQty)}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 text-sm text-slate-300">
                Use IN to restock and OUT to mark stock reductions from shipments or wastage.
              </div>

              <NavLink
                to="/stock"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                Manage stock inventory
              </NavLink>
            </div>
          </aside>
        </div>

        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Recent stock logs</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Inventory movement history</h2>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs text-slate-500">Sort:</span>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer"
               >
                 <option value="date-desc">Newest</option>
                 <option value="date-asc">Oldest</option>
                 <option value="name-asc">Alphabet (A-Z)</option>
                 <option value="name-desc">Alphabet (Z-A)</option>
                 <option value="qty-desc">Quantity (High-Low)</option>
                 <option value="qty-asc">Quantity (Low-High)</option>
               </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Qty</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-400">
                      Loading stock logs...
                    </td>
                  </tr>
                ) : stockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-400">
                      No stock logs found.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{productMap.get(log.product_id) ?? log.product_id}</td>
                      <td className={`px-4 py-4 font-semibold ${log.type === 'IN' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {log.type}
                      </td>
                      <td className="px-4 py-4 text-slate-100">{num.format(log.qty)}</td>
                      <td className="px-4 py-4 text-slate-400">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id, log.product_id, log.qty, log.type as 'IN' | 'OUT')}
                          disabled={isDeleting}
                          className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/60">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">PREV</button>
                <div className="flex items-center gap-1">
                  {getPageRange(currentPage, Math.ceil(sortedLogs.length / itemsPerPage)).map((p, i) => (
                    typeof p === 'number' ? (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(p)}
                        className={`h-7 min-w-[28px] rounded-lg text-[10px] font-bold transition-all ${
                          currentPage === p ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={i} className="px-1 text-slate-600 font-bold">...</span>
                    )
                  ))}
                </div>
                <button 
                  disabled={currentPage * itemsPerPage >= sortedLogs.length}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">NEXT</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
