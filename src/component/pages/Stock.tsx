import { useEffect, useMemo, useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { createNumberFormatter } from '../../lib/utils'
import type { Product } from './Dashboard'

type StockRecord = {
    id: string
    product_id: string
    total: number
    product_name?: string
}


export default function Stock() {
    const [stockItems, setStockItems] = useState<StockRecord[]>([])
    const [productId, setProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editQty, setEditQty] = useState('')
    const [editName, setEditName] = useState('')
    const [sortBy, setSortBy] = useState('name-asc')

    const [products, setProducts] = useState<Product[]>([])
    
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const sortedStockItems = useMemo(() => {
        const sorted = [...stockItems].sort((a, b) => {
            const nameA = a.product_name ?? a.product_id
            const nameB = b.product_name ?? b.product_id
            switch (sortBy) {
                case 'name-asc': return nameA.localeCompare(nameB)
                case 'name-desc': return nameB.localeCompare(nameA)
                case 'qty-desc': return b.total - a.total
                case 'qty-asc': return a.total - b.total
                default: return 0
            }
        })
        return sorted
    }, [stockItems, sortBy])

    const paginatedItems = useMemo(() => {
        return sortedStockItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    }, [sortedStockItems, currentPage])

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

    const loadStock = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('User not found')
                setLoading(false)
                return
            }

            const [stockResponse, productsData] = await Promise.all([
                supabase
                    .from('Stock')
                    .select('id, product_id, total')
                    .eq('user_id', user?.id),
                supabase
                    .from('Product')
                    .select('id, name')
                    .eq('user_id', user?.id)
            ])

            if (productsData.error) throw productsData.error
            if (stockResponse.error) throw stockResponse.error

            setProducts((productsData.data ?? []) as Product[])


            const productMap = new Map(
                (productsData.data ?? []).map((p) => [p.id, p])
            )

            const merged = (stockResponse.data ?? []).map((stock) => ({
                ...stock,
                product_name: productMap.get(stock.product_id)?.name
            }))

            setStockItems(merged)

        } catch {
            setError('Unable to load stock items: ' + ('Unknown error'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null
        let timeout: ReturnType<typeof setTimeout>
        let isMounted = true

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !isMounted) return

            await loadStock()
            if (!isMounted) return

            // subscribe realtime
            channel = supabase
                // Gunakan suffix random agar tidak bentrok antar render/session
                .channel(`stock-changes-${user.id}-${Math.random().toString(36).substring(7)}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // INSERT, UPDATE, DELETE semua
                        schema: 'public',
                        table: 'Stock',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        // debounce biar gak spam
                        clearTimeout(timeout)
                        timeout = setTimeout(() => {
                            loadStock()
                        }, 300)
                    }
                )
                .subscribe()
        }

        init()

        return () => {
            isMounted = false
            if (channel) supabase.removeChannel(channel)
            clearTimeout(timeout)
        }
    }, [loadStock])

    const num = useMemo(() => createNumberFormatter(), []);

    const totalStock = useMemo(() => stockItems.reduce((sum, item) => sum + item.total, 0), [stockItems])

    const handleSubmit = async () => {
        setError('')
        setSuccess('')

        if (!productId || !quantity) {
            setError('Please enter product and quantity.')
            return
        }

        const parsedQty = Number(quantity)
        if (!Number.isFinite(parsedQty) || parsedQty === 0) {
            setError('Quantity must not be zero.')
            return
        }

        setSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('User not found.')
                return
            }

            const { error } = await supabase.rpc('update_stock', {
                p_product_id: productId,
                p_qty: parsedQty,
                p_user_id: user.id
            })

            if (error) throw error

            setSuccess(`Stock ${parsedQty > 0 ? 'added' : 'reduced'} successfully`)
            setProductId('')
            setQuantity('')

        } catch {
            setError('Failed to update stock.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async (item: StockRecord) => {
        setError('')
        setSuccess('')

        const newTotal = Number(editQty)
        if (editQty === '') {
            setError('Quantity cannot be empty')
            return
        }

        const delta = newTotal - item.total

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('User not found')
            return
        }


        if (!Number.isFinite(newTotal)) {
            setError('Invalid quantity')
            return
        }

        if (delta === 0 && editName === item.product_name) {
            setError('No changes detected')
            return
        }

        // update name kalau berubah aja
        if (editName !== item.product_name && !editName.trim()) {
            setError('Product name cannot be empty')
            return
        }
        try {

            if (editName !== item.product_name) {
                const { error: nameError } = await supabase
                    .from('Product')
                    .update({ name: editName.trim() })
                    .eq('id', item.product_id)
                    .eq('user_id', user.id)

                if (nameError) throw nameError
            }
            if (delta !== 0) {
                const { error: stockError } = await supabase.rpc('update_stock', {
                    p_product_id: item.product_id,
                    p_qty: delta,
                    p_user_id: user.id
                })
                if (stockError) throw stockError
            }

            setSuccess(`Updated successfully`)
            setEditingId(null)
            setEditQty('')
            setEditName('')
            await loadStock()
        } catch {
            setError('Failed to update product or stock')
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                    <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Stock management</p>
                    <h1 className="mt-3 text-4xl font-semibold text-white">Track stock levels and inventory</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                        Use this page to manage product stock counts. Each change is recorded in the stock table and can be reviewed in stock logs.
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
                                    <span className="text-sm text-slate-400">Product ID</span>
                                    <select
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)} // Tambahkan kelas Tailwind untuk konsistensi
                                        className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                    >
                                        <option value="">Pilih product</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-3 text-left">
                                    <span className="text-sm text-slate-400">Quantity to add</span>
                                    <input
                                        type="number"
                                        min={-1000}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="+10 / -5"
                                        className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </label>

                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-400">Stock items are stored in the <span className="font-semibold text-white">stocks</span> table.</p>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Saving…' : 'Update stock'}
                                </button>
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
                        <div className="space-y-5">
                            <div>
                                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory</p>
                                <h2 className="mt-3 text-2xl font-semibold text-white">Stock overview</h2>
                            </div>
                            <div className="grid gap-4">
                                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                                    <p className="text-sm text-slate-400">Stock items</p>
                                    <p className="mt-3 text-3xl font-semibold text-white">{stockItems.length}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                                    <p className="text-sm text-slate-400">Total quantity</p>
                                    <p className="mt-3 text-3xl font-semibold text-white">{num.format(totalStock)}</p>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 text-sm text-slate-300">
                                Keep stock counts updated so your expense and revenue reports match available inventory.
                            </div>
                            <NavLink
                                to="/stock-logs"
                                className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-slate-800"
                            >
                                Review stock logs
                            </NavLink>
                        </div>
                    </aside>
                </div>

                <div className="mt-10 overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Live inventory</p>
                            <h2 className="mt-3 text-2xl font-semibold text-white">Current stock list</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer"
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="qty-desc">Quantity (High-Low)</option>
                                <option value="qty-asc">Quantity (Low-High)</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
                        <table className="w-full text-left text-sm text-slate-200">
                            <thead className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Product</th>
                                    <th className="px-6 py-4 font-semibold text-center">Quantity</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">
                                            Loading stock items...
                                        </td>
                                    </tr>
                                ) : stockItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500 italic">
                                            No stock items found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                {editingId === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1 text-xs text-white focus:border-sky-500 outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-medium text-slate-100">{item.product_name ?? item.product_id}</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {editingId === item.id ? (
                                                    <input
                                                        type="number"
                                                        value={editQty}
                                                        onChange={(e) => setEditQty(e.target.value)}
                                                        className="w-20 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-center text-xs text-white focus:border-sky-500 outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-mono text-slate-100">{num.format(item.total)}</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                {item.total < 5 ? (
                                                    <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 border border-rose-500/20">Low Stock</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">In Stock</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {editingId === item.id ? (
                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(null)
                                                                setEditQty('')
                                                                setEditName('')
                                                            }}
                                                            className="text-xs font-bold text-slate-500 hover:text-slate-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(item.id)
                                                            setEditQty(item.total.toString())
                                                            setEditName(item.product_name || '')
                                                        }}
                                                        className="rounded-full bg-sky-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/60 border-t border-slate-800">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">PREV</button>
                            <div className="flex items-center gap-1">
                                {getPageRange(currentPage, Math.ceil(sortedStockItems.length / itemsPerPage)).map((p, i) => (
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
                                disabled={currentPage * itemsPerPage >= sortedStockItems.length}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="text-xs font-bold text-sky-400 disabled:text-slate-600 transition-colors">NEXT</button>
                        </div>
                    </div>
                </div>
            </div>
        </main >
    )
}
