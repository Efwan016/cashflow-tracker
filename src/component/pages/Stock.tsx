import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type StockRecord = {
    id: string
    product_id: string
    total: number
    product_name?: string
}

const productTableName = 'Product'

async function fetchProducts() {
    const { data, error } = await supabase.from(productTableName).select('id, name, harga_modal, harga_jual')
    if (error) throw error
    return data ?? []
}

export default function Stock() {
    const [stockItems, setStockItems] = useState<StockRecord[]>([])
    const [productId, setProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<any[]>([])

    useEffect(() => {
        async function loadStock() {
            setLoading(true)
            try {
                const [stockResponse, productsData] = await Promise.all([
                    supabase
                        .from('Stock')
                        .select('id, product_id, total')
                        .order('product_id', { ascending: true }),
                    fetchProducts(),
                ])

                setProducts(productsData) 

                if (stockResponse.error) {
                    throw stockResponse.error
                }

                const productMap = new Map(productsData.map((product) => [product.id, product]))
                const mergedStocks = (stockResponse.data ?? []).map((stock) => {
                    const product = productMap.get(stock.product_id)
                    return {
                        ...stock,
                        product_name: product?.name,
                    }
                })
                setStockItems(mergedStocks)
            } catch (loadError: any) {
                setError('Unable to load stock items: ' + (loadError?.message ?? 'Unknown error'))
            } finally {
                setLoading(false)
            }
        }
        loadStock()
    }, [])

    const totalStock = useMemo(() => stockItems.reduce((sum, item) => sum + item.total, 0), [stockItems])

   const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!productId || !quantity) {
        setError('Please enter product and quantity.')
        return
    }

    const parsedQty = Number(quantity)

    if (!Number.isFinite(parsedQty) || parsedQty < 0) {
        setError('Quantity must be valid.')
        return
    }

    setLoading(true)

    try {
        const { data: existingStock, error: fetchError } = await supabase
            .from('Stock')
            .select('id, total')
            .eq('product_id', productId)
            .maybeSingle()

        if (fetchError) throw fetchError

        if (existingStock) {
            const { error: updateError } = await supabase
                .from('Stock')
                .update({ total: existingStock.total + parsedQty })
                .eq('id', existingStock.id)

            if (updateError) throw updateError
        } else {
            const { error: insertError } = await supabase
                .from('Stock')
                .insert([
                    {
                        product_id: productId,
                        total: parsedQty,
                    },
                ])

            if (insertError) throw insertError
        }

        const { data } = await supabase
            .from('Stock')
            .select('id, product_id, total')

        const productMap = new Map(products.map(p => [p.id, p]))

        const merged = (data ?? []).map(stock => ({
            ...stock,
            product_name: productMap.get(stock.product_id)?.name
        }))

        setStockItems(merged)
        setSuccess('Stock updated')
        setProductId('')
        setQuantity('')
    } catch (err: any) {
        setError(err.message)
    } finally {
        setLoading(false)
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
                                        onChange={(e) => setProductId(e.target.value)}
                                        className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white"
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
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0"
                                        className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </label>
                               
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-400">Stock items are stored in the <span className="font-semibold text-white">stocks</span> table.</p>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? 'Saving…' : 'Update stock'}
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
                                    <p className="mt-3 text-3xl font-semibold text-white">{totalStock.toLocaleString('id-ID')}</p>
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
                        <p className="text-sm text-slate-400">Updated from the Supabase stocks table.</p>
                    </div>

                    <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
                        <table className="w-full text-left text-sm text-slate-200">
                            <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                                <tr>
                                    <th className="px-4 py-4">Product</th>
                                    <th className="px-4 py-4">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-slate-400">
                                            Loading stock items...
                                        </td>
                                    </tr>
                                ) : stockItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-slate-400">
                                            No stock items found.
                                        </td>
                                    </tr>
                                ) : (
                                    stockItems.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-800 last:border-none">
                                            <td className="px-4 py-4 text-slate-100">{item.product_name ?? item.product_id}</td>
                                            <td className="px-4 py-4 text-slate-100">{item.total.toLocaleString('id-ID')}</td>
                                            
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
