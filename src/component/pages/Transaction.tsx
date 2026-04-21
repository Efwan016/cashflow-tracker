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
  const [manualName, setManualName] = useState('')
  const [qty, setQty] = useState('')
  const [modalPrice, setModalPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')

  const [filterType, setFilterType] = useState('all') // all, today, last7, last30, specific, range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
  }, [userId])

  // 🔥 FETCH DATA
  const loadData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      let transactionQuery = supabase
        .from('Transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      let startStr: string | null = null
      let endStr: string | null = null

      // Helper untuk mendapatkan offset zona waktu user (e.g., +07:00)
      const getTzOffset = () => {
        const offset = new Date().getTimezoneOffset();
        const absOffset = Math.abs(offset);
        const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        const minutes = String(absOffset % 60).padStart(2, '0');
        const sign = offset <= 0 ? '+' : '-';
        return `${sign}${hours}:${minutes}`;
      };

      const tzOffset = getTzOffset();
      const getLocalDate = (daysAgo = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toLocaleDateString('en-CA'); // Format YYYY-MM-DD sesuai waktu lokal
      };

      if (filterType === 'today') {
        const date = getLocalDate();
        startStr = `${date}T00:00:00.000${tzOffset}`;
        endStr = `${date}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'last7') {
        startStr = `${getLocalDate(7)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'last30') {
        startStr = `${getLocalDate(30)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'specific' && startDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${startDate}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'range' && startDate && endDate) {
        startStr = `${startDate}T00:00:00.000${tzOffset}`;
        endStr = `${endDate}T23:59:59.999${tzOffset}`;
      }

      if (startStr) transactionQuery = transactionQuery.gte('created_at', startStr)
      if (endStr) transactionQuery = transactionQuery.lte('created_at', endStr)

      if (filterType === 'all') {
        transactionQuery = transactionQuery.limit(10)
      }

      const [p, t] = await Promise.all([
        supabase.from('Product').select('*').eq('user_id', userId).order('name', { ascending: true }),
        transactionQuery,
      ])


      if (p.error) throw p.error
      if (t.error) throw t.error

      setProducts((p.data as Product[]) || [])
      setTransactions((t.data as TransactionRecord[]) || [])
    } catch {
      toast.error('Gagal memuat data transaksi')
    } finally {
      setLoading(false)
    }
  }, [userId, filterType, startDate, endDate])

  useEffect(() => {
    if (!userId) return

    loadData()
  }, [userId, loadData])

  // 🌍 CURRENCY & NUMBER FORMATTER
  const currencyFormatter = useMemo(() => {
    // Mencoba menebak mata uang berdasarkan locale browser (default ke IDR jika Indo)
    const currency = navigator.language.includes('ID') ? 'IDR' : 'USD';
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
  }, []);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(navigator.language), []);

  // 🔥 CALCULATE TOTALS FOR DISPLAYED TRANSACTIONS
  const totalDisplayedQty = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.qty, 0);
  }, [transactions]);

  const totalDisplayedRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  }, [transactions]);

  const totalDisplayedProfit = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  }, [transactions]);


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

    if (id === '') {

      setModalPrice('')
      setSalePrice('')
    } else {
      const p = productMap.get(id)
      if (p) {
        setSalePrice(String(p.harga_jual))
        setModalPrice(String(p.harga_modal))
      }
    }
  }

  // 🔥 RESET
  const resetForm = () => {
    setProductId('')
    setQty('')
    setModalPrice('')
    setSalePrice('')
    setManualName('')
  }

  // 🔥 SUBMIT
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const parsedQty = Number(qty)
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.error('Qty must be greater than zero')
      return
    }

    const parsedModalPrice = Number(modalPrice)
    const parsedSalePrice = Number(salePrice)
    if (!Number.isFinite(parsedModalPrice) || !Number.isFinite(parsedSalePrice)) {
      toast.error('sale price and cost price must be valid numbers')
      return
    }

    if (!userId) {
      toast.error('User not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)

    const getTzOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
      const minutes = String(absOffset % 60).padStart(2, '0');
      const sign = offset <= 0 ? '+' : '-';
      return `${sign}${hours}:${minutes}`;
    };

    // Menggunakan locale 'sv-SE' untuk mendapatkan format YYYY-MM-DD HH:mm:ss yang stabil
    const now = new Date().toLocaleString('sv-SE').replace(' ', 'T') + getTzOffset();

    const product = productMap.get(productId || '')

    const productName = product
      ? product.name
      : manualName

    if (!productId && !manualName.trim()) {
      toast.error('Please enter a product name for manual entry')
      setLoading(false)
      return
    }

    const realSalePrice = product ? product.harga_jual : Number(salePrice)
    const realModalPrice = product ? product.harga_modal : Number(modalPrice || 0)

    const total = Number(qty) * realSalePrice
    const profit = (realSalePrice - realModalPrice) * Number(qty)

    // 🔥 VALIDASI STOCK DULU
    let stock = null

    if (productId) {
      const { data, error } = await supabase
        .from('Stock')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      stock = data

      if (!stock || stock.total < Number(qty)) {
        toast.error('Stock tidak cukup!')
        setLoading(false)
        return
      }
    }

    // 🔥 INSERT TRANSACTION
    const { error } = await supabase.from('Transactions').insert([
      {
        user_id: userId,
        product_id: productId || null,
        product_name: productName,
        qty: Number(qty),
        harga_jual: realSalePrice,
        harga_modal: realModalPrice,
        total,
        profit,
        mode: productId ? 'WITH_STOCK' : 'MANUAL',
        created_at: now,
      },
    ])

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 🔥 UPDATE STOCK
    if (stock) {
      await supabase
        .from('Stock')
        .update({ total: stock.total - Number(qty) })
        .eq('user_id', userId)
        .eq('id', stock.id)

      await supabase.from('Stock_logs').insert([
        {
          user_id: userId,
          product_id: productId,
          type: 'OUT',
          qty: Number(qty),
          created_at: now,
        },
      ])
    }

    toast.success('Transaksi berhasil 🚀')

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

    if (!userId) {
      toast.error('User not authenticated')
      setIsDeleting(false)
      return
    }
    const { error: deleteError } = await supabase.from('Transactions')
      .delete()
      .eq('id', trx.id)
      .eq('user_id', userId)

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
        .eq('user_id', userId)
        .maybeSingle()

      if (stock) {
        const { error: updateError } = await supabase
          .from('Stock')
          .update({ total: stock.total + trx.qty })
          .eq('id', stock.id)
          .eq('user_id', userId)

        if (updateError) {
          toast.error(updateError.message)
          setIsDeleting(false)
          return
        }

        await supabase.from('Stock_logs').insert([
          {
            user_id: userId,
            product_id: trx.product_id,
            type: 'IN',
            qty: trx.qty,
            created_at: new Date().toISOString(),
          },
        ])
      }

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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-slate-500">Mode:</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isWithStock ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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

                {productId === '' && (
                  <label className="grid gap-3 text-left md:col-span-2">
                    <span className="text-sm text-slate-400">Product name</span>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white disabled:opacity-50"
                    />
                  </label>
                )}

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
                  <h2 className="mt-2 text-2xl font-semibold text-white">{currencyFormatter.format(total)}</h2>
                </div>
                <div className="rounded-3xl bg-slate-950/50 p-6 border border-slate-800">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Expected Profit</p>
                  <h2 className="mt-2 text-2xl font-semibold text-emerald-400">{currencyFormatter.format(profit)}</h2>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
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

        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-400/80">History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {filterType === 'all' && 'Recent Activity'}
                {filterType === 'today' && 'Today\'s Sales'}
                {filterType === 'last7' && 'Last 7 Days'}
                {filterType === 'last30' && 'Last 30 Days'}
                {filterType === 'specific' && (startDate ? `Sales on ${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Specific Date')}
                {filterType === 'range' && (startDate && endDate ? `Sales from ${startDate} to ${endDate}` : 'Date Range')}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  if (e.target.value !== 'specific' && e.target.value !== 'range') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none transition-all focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 hover:bg-slate-900/80 cursor-pointer"
              >
                <option value="all">Recent activity</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="specific">Pick a Date</option>
                <option value="range">Date Range</option>
              </select>

              {(filterType === 'specific' || filterType === 'range') && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"
                  />
                  {filterType === 'range' && (
                    <>
                      <span className="text-slate-500 text-xs">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800/50 bg-slate-950/20">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-5 font-medium">Product</th>
                  <th className="px-6 py-5 font-medium text-center">Qty</th>
                  <th className="px-6 py-5 font-medium">Revenue</th>
                  <th className="px-6 py-5 font-medium">Profit</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Memuat data...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Tidak ada transaksi yang tercatat untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-medium">{productMap.get(t.product_id || '')?.name || t.product_name || 'Manual Sale'}</td>
                      <td className="px-6 py-4 text-center font-mono">{numberFormatter.format(t.qty)}</td>
                      <td className="px-6 py-4">{currencyFormatter.format(t.total)}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">{currencyFormatter.format(t.profit || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={isDeleting}
                          className="rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="border-t border-slate-800/50 bg-sky-900/50 text-slate-200">
                  <tr>
                    <td className="px-6 py-4 font-bold">Total</td>
                    <td className="px-6 py-4 text-center font-bold font-mono">{numberFormatter.format(totalDisplayedQty)}</td>
                    <td className="px-6 py-4 font-bold">{currencyFormatter.format(totalDisplayedRevenue)}</td>
                    <td className={`px-6 py-4 font-bold ${totalDisplayedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currencyFormatter.format(totalDisplayedProfit)}
                    </td>
                    <td className="px-6 py-4 text-right"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Daily Net Profit Report */}
      </div>
    </main>
  )
}