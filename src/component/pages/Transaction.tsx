import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import type { Product, Transaction } from '../../types/types'

export default function Transaction() {
  const [productId, setProductId] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [qty, setQty] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [productResult, transactionResult] = await Promise.all([
        supabase.from('Product').select('id, name, harga_modal, harga_jual').order('id', { ascending: true }),
        supabase.from('Transactions').select('id, product_id, qty, harga_jual, total, created_at').order('created_at', { ascending: false }).limit(10),
      ])

      const { data: productData, error: productError } = productResult
      const { data: transactionData, error: transactionError } = transactionResult

      if (!productError) {
        setProducts(productData ?? [])
      }
      if (!transactionError) {
        setTransactions(transactionData ?? [])
      }
    }

    loadData()
  }, [])

  const total = useMemo(() => {
    const quantity = Number(qty)
    const price = Number(salePrice)
    return Number.isFinite(quantity) && Number.isFinite(price) ? quantity * price : 0
  }, [qty, salePrice])

  const refreshTransactions = async () => {
    const { data, error } = await supabase
      .from('Transactions')
      .select('id, product_id, qty, harga_jual, total, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) {
      setTransactions(data ?? [])
    }
  }

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  )

  const confirmAction = (message: string, onConfirm: () => void) => {
    const toastId = toast.info(
      <div className="space-y-4">
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            onClick={() => {
              toast.dismiss(toastId)
              onConfirm()
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={() => toast.dismiss(toastId)}
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false, closeButton: false, draggable: false }
    )
  }

  const handleDeleteConfirmed = async (
    transactionId: string,
    productIdToRestore: string,
    qtyToRestore: number,
    transactionCreatedAt: string
  ) => {
    setError('')
    setSuccess('')
    setIsDeleting(true)

    const { error: deleteError } = await supabase.from('Transactions').delete().eq('id', transactionId)
    if (deleteError) {
      setError('Failed to delete transaction: ' + deleteError.message)
      toast.error('Failed to delete transaction: ' + deleteError.message)
      setIsDeleting(false)
      return
    }

    const { error: deleteLogError } = await supabase
      .from('Stock_logs')
      .delete()
      .match({
        product_id: productIdToRestore,
        type: 'OUT',
        qty: qtyToRestore,
        created_at: transactionCreatedAt,
      })

    if (deleteLogError) {
      toast.warn('Transaction deleted, but could not delete matching stock log: ' + deleteLogError.message)
    }

    const { data: existingStock, error: stockFetchError } = await supabase
      .from('Stock')
      .select('id, total')
      .eq('product_id', productIdToRestore)
      .maybeSingle()

    if (stockFetchError) {
      setError('Transaction deleted but failed to restore stock: ' + stockFetchError.message)
      toast.error('Transaction deleted but failed to restore stock: ' + stockFetchError.message)
      setIsDeleting(false)
      await refreshTransactions()
      return
    }

    if (existingStock) {
      const updatedTotal = Math.max(0, existingStock.total + qtyToRestore)
      const { error: stockUpdateError } = await supabase
        .from('Stock')
        .update({ total: updatedTotal })
        .eq('id', existingStock.id)

      if (stockUpdateError) {
        setError('Transaction deleted but failed to restore stock: ' + stockUpdateError.message)
        toast.error('Transaction deleted but failed to restore stock: ' + stockUpdateError.message)
        setIsDeleting(false)
        await refreshTransactions()
        return
      }
    } else {
      const { error: stockCreateError } = await supabase.from('Stock').insert([
        { product_id: productIdToRestore, total: qtyToRestore },
      ])

      if (stockCreateError) {
        setError('Transaction deleted but failed to restore stock: ' + stockCreateError.message)
        toast.error('Transaction deleted but failed to restore stock: ' + stockCreateError.message)
        setIsDeleting(false)
        await refreshTransactions()
        return
      }
    }

    const { error: logError } = await supabase.from('Stock_logs').insert([
      {
        product_id: productIdToRestore,
        type: 'IN',
        qty: qtyToRestore,
        created_at: new Date().toISOString(),
      },
    ])

    setIsDeleting(false)
    if (logError) {
      setError('Transaction deleted but failed to log stock restore: ' + logError.message)
      toast.error('Transaction deleted but failed to log stock restore: ' + logError.message)
    } else {
      setSuccess('Transaction deleted and stock restored successfully.')
      toast.success('Transaction deleted and stock restored successfully.')
    }

    await refreshTransactions()
  }

  const handleDelete = (
    transactionId: string,
    productIdToRestore: string,
    qtyToRestore: number,
    transactionCreatedAt: string
  ) => {
    confirmAction('Delete this transaction and restore stock?', () =>
      handleDeleteConfirmed(transactionId, productIdToRestore, qtyToRestore, transactionCreatedAt)
    )
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!productId || !qty || !salePrice) {
      setError('Please complete all fields before submitting the transaction.')
      return
    }

    const quantity = Number(qty)
    const price = Number(salePrice)

    if (quantity <= 0 || price <= 0) {
      setError('Quantity and sale price must be greater than zero.')
      return
    }

    setIsSubmitting(true)
    const now = new Date().toISOString()

    const { error: insertError } = await supabase
      .from('Transactions')
      .insert([
        {
          product_id: productId,
          qty: quantity,
          harga_jual: price,
          total,
          created_at: now,
        },
      ])

    if (insertError) {
      setIsSubmitting(false)
      setError('Failed to save transaction: ' + insertError.message)
      return
    }

    const { data: existingStock, error: stockFetchError } = await supabase
      .from('Stock')
      .select('id, total')
      .eq('product_id', productId)
      .maybeSingle()

    if (stockFetchError) {
      setIsSubmitting(false)
      setError('Transaction saved but failed to update stock: ' + stockFetchError.message)
      return
    }

    const stockAdjustment = -quantity
    if (existingStock) {
      const updatedTotal = Math.max(0, existingStock.total + stockAdjustment)
      const { error: stockUpdateError } = await supabase
        .from('Stock')
        .update({ total: updatedTotal })
        .eq('id', existingStock.id)

      if (stockUpdateError) {
        setIsSubmitting(false)
        setError('Transaction saved but failed to update stock: ' + stockUpdateError.message)
        return
      }
    } else {
      const { error: stockCreateError } = await supabase.from('Stock').insert([
        {
          product_id: productId,
          total: 0,
        },
      ])

      if (stockCreateError) {
        setIsSubmitting(false)
        setError('Transaction saved but failed to create stock entry: ' + stockCreateError.message)
        return
      }
    }

    const { error: logError } = await supabase.from('Stock_logs').insert([
      {
        product_id: productId,
        type: 'OUT',
        qty: quantity,
        created_at: now,
      },
    ])

    setIsSubmitting(false)

    if (logError) {
      setError('Transaction saved but failed to log stock change: ' + logError.message)
      return
    }

    setSuccess('Transaction saved successfully and stock was updated.')
    setProductId('')
    setQty('')
    setSalePrice('')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">New transaction</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Enter transaction details</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Add a new transaction and automatically update stock levels and stock logs.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-6">
              {error && (
                <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
              )}
              {success && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{success}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Product</span>
                  <select
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value)
                      const product = products.find((product) => product.id === e.target.value)
                      if (product) setSalePrice(String(product.harga_jual))
                    }}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Sale price</span>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <div className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Total (auto)</span>
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white">Rp {total.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    This transaction is saved to the <span className="font-semibold text-white">transactions</span> table and also updates stock inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save transaction'}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory sync</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Stock-aware sales</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <p>Saving a transaction now creates a stock log and adjusts inventory automatically.</p>
                <p>Use the stock page to add stock and the stock logs page to review all movements.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-sm shadow-slate-950/20">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Tip</p>
                <p className="mt-3 text-sm text-slate-400">Keep stock levels accurate so your reports reflect actual inventory flow.</p>
              </div>
              <NavLink
                to="/stock"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                Manage stock
              </NavLink>
              <NavLink
                to="/stock-logs"
                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
              >
                View stock logs
              </NavLink>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Recent transactions</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Transaction history</h2>
            </div>
            <p className="text-sm text-slate-400">Delete any transaction and restore stock automatically.</p>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Qty</th>
                  <th className="px-4 py-4">Sale Price</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-slate-400">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{productMap.get(transaction.product_id) ?? transaction.product_id}</td>
                      <td className="px-4 py-4 text-slate-100">{transaction.qty}</td>
                      <td className="px-4 py-4 text-slate-100">Rp {transaction.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-4 text-slate-100">Rp {transaction.total.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-4 text-slate-400">{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(transaction.id, transaction.product_id, transaction.qty, transaction.created_at)}
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
          </div>
        </div>
      </div>
    </main>
  )
}
