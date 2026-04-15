import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import type { Product, Transaction as TransactionType } from '../../types/types'

type TransactionRecord = TransactionType & {
  product_name?: string;
  profit?: number;
  total?: number;
}

export default function Transaction() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [modalPrice, setModalPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')

  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 🔥 FETCH DATA
  const loadData = useCallback(async (isMounted: boolean = true) => {
    try {
      const [p, t] = await Promise.all([
        supabase.from('Product').select('*').order('name', { ascending: true }),
        supabase
          .from('Transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (!isMounted) return
      if (p.error) throw p.error
      if (t.error) throw t.error

      setProducts((p.data as Product[]) || [])
      setTransactions((t.data as TransactionRecord[]) || [])
    } catch {
      toast.error('Data sync error: ')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    loadData(isMounted)
    return () => { isMounted = false }
  }, [loadData])

  // 🔥 MAP (FAST LOOKUP)
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  // 🔥 DERIVED
  const total = useMemo(
    () => Number(qty || 0) * Number(salePrice || 0),
    [qty, salePrice]
  )

  const profit = useMemo(
    () =>
      (Number(salePrice || 0) - Number(modalPrice || 0)) *
      Number(qty || 0),
    [qty, salePrice, modalPrice]
  )

  const isWithStock = !!productId

  // 🔥 SELECT PRODUCT
  const handleSelectProduct = (id: string) => {
    setProductId(id)

    const p = productMap.get(id)
    if (!p) return

    setSalePrice(String(p.harga_jual))
    setModalPrice(String(p.harga_modal))
  }

  // 🔥 RESET
  const resetForm = () => {
    setProductId('')
    setQty('')
    setModalPrice('')
    setSalePrice('')
  }

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!qty || !salePrice) {
      toast.error('Qty & harga jual wajib')
      return
    }

    setLoading(true)
    const now = new Date().toISOString()

    const { error } = await supabase.from('Transactions').insert([
      {
        product_id: productId || null,
        qty: Number(qty),
        harga_jual: Number(salePrice),
        harga_modal: Number(modalPrice || 0),
        total,
        profit,
        mode: isWithStock ? 'WITH_STOCK' : 'MANUAL',
        created_at: now,
      },
    ])

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 🔥 STOCK UPDATE
    if (isWithStock) {
      const { data: stock, error: stockError } = await supabase
        .from('Stock')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle()

      if (stockError) {
        toast.error(stockError.message)
        setLoading(false)
        return
      }

      if (stock) {
        await supabase
          .from('Stock')
          .update({ total: Math.max(0, stock.total - Number(qty)) })
          .eq('id', stock.id)
      }

      await supabase.from('Stock_logs').insert([
        {
          product_id: productId,
          type: 'OUT',
          qty: Number(qty),
          created_at: now,
        },
      ])
    }

    toast.success('Transaction recorded successfully 🚀')

    resetForm()
    setLoading(false)
    loadData()
  }

  const confirmAction = (message: string, onConfirm: () => void) => {
    const customId = "confirm-delete-trx";
    toast.info(
      <div className="space-y-4">
        <p>{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-3xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
            onClick={() => {
              toast.dismiss(customId)
              onConfirm()
            }}
          >
            Delete
          </button>
          <button
            type="button"
            className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            onClick={() => toast.dismiss(customId)}
          >
            Cancel
          </button>
        </div>
      </div>,
      { toastId: customId, autoClose: false, closeOnClick: false, closeButton: false, draggable: false }
    )
  }

  // 🔥 DELETE
  const handleDeleteConfirmed = async (trx: TransactionRecord) => {
    setIsDeleting(true)
    const { error: deleteError } = await supabase.from('Transactions').delete().eq('id', trx.id)

    if (deleteError) {
      toast.error('Could not delete: ' + deleteError.message)
      setIsDeleting(false)
      return
    }

    if (trx.product_id) {
      const { data: stock } = await supabase
        .from('Stock')
        .select('*')
        .eq('product_id', trx.product_id)
        .maybeSingle()

      if (stock) {
        await supabase
          .from('Stock')
          .update({ total: stock.total + trx.qty })
          .eq('id', stock.id)
      }

      await supabase.from('Stock_logs').insert([
        {
          product_id: trx.product_id,
          type: 'IN',
          qty: trx.qty,
          created_at: new Date().toISOString(),
        },
      ])
    }

    toast.success('Transaction deleted and stock reverted')
    setIsDeleting(false)
    loadData()
  }

  const handleDelete = (trx: TransactionRecord) => {
    confirmAction('Delete this transaction and restore stock?', () =>
      handleDeleteConfirmed(trx)
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Sales Entry</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Record transaction</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Log your sales to automatically track revenue, profit, and inventory changes. Use manual mode for items not tracked in the product catalog.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-slate-500">Mode:</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isWithStock ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isWithStock ? 'Inventory Linked' : 'Manual Entry'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-3 text-left md:col-span-2">
                  <span className="text-sm text-slate-400">Select product</span>
                  <select
                    value={productId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="">Manual Input (No Stock Sync)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Cost price</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>

                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Sale price</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>

                <label className="grid gap-3 text-left md:col-span-2">
                  <span className="text-sm text-slate-400">Quantity</span>
                  <input
                    type="number"
                    placeholder="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/50 p-6 border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Transaction Total</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Rp {total.toLocaleString('id-ID')}</h2>
                </div>
                <div className="rounded-3xl bg-slate-950/50 p-6 border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Expected Profit</p>
                  <h2 className="mt-2 text-2xl font-semibold text-emerald-400">Rp {profit.toLocaleString('id-ID')}</h2>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Workflow Guide</h2>
            <ul className="mt-6 space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">01</span>
                <span>Select a product to auto-fill prices and link to inventory counts.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">02</span>
                <span>Profit is calculated as <code>(Sale - Cost) * Qty</code>.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">03</span>
                <span>Deleting a transaction will automatically restore the product stock level.</span>
              </li>
            </ul>
            <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/90 p-5 text-sm text-slate-300">
              Manual transactions do not impact inventory levels but are included in financial reports.
            </div>
          </aside>
        </div>

        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">History</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Recent Sales</h2>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Profit</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No transactions recorded yet.</td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800 last:border-none hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 font-medium">{productMap.get(t.product_id || '')?.name || 'Manual Sale'}</td>
                      <td className="px-6 py-4">{t.qty}</td>
                      <td className="px-6 py-4">Rp {t.total.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">Rp {(t.profit || 0).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={isDeleting}
                          className="rounded-full bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
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