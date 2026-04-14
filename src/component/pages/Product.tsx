import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/types'

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        setError('Unable to load products: ' + error.message)
        setProducts([])
      } else {
        setProducts(data ?? [])
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  const refreshProducts = async () => {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .order('id', { ascending: true })

    if (!error) {
      setProducts(data ?? [])
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!name.trim() || !costPrice || !salePrice) {
      setError('Please fill in all product fields.')
      return
    }

    const parsedCost = Number(costPrice)
    const parsedSale = Number(salePrice)

    if (!Number.isFinite(parsedCost) || parsedCost < 0 || !Number.isFinite(parsedSale) || parsedSale < 0) {
      setError('Harga modal and harga jual must be valid non-negative numbers.')
      return
    }

    setLoading(true)

    const { data: existingProduct, error: existingError } = await supabase
      .from('Product')
      .select('id')
      .eq('name', name)
      .maybeSingle()

    if (existingError) {
      setError('Unable to check product existence: ' + existingError.message)
      setLoading(false)
      return
    }

    if (existingProduct) {
      const { error: updateError } = await supabase
        .from('Product')
        .update({ harga_modal: parsedCost, harga_jual: parsedSale })
        .eq('id', existingProduct.id)

      if (updateError) {
        setError('Unable to update product: ' + updateError.message)
        setLoading(false)
        return
      }
      setSuccess('Product updated successfully.')
    } else {
      const { error: insertError } = await supabase.from('Product').insert([
        {
          name,
          harga_modal: parsedCost,
          harga_jual: parsedSale,
        },
      ])

      if (insertError) {
        setError('Unable to create product: ' + insertError.message)
        setLoading(false)
        return
      }
      setSuccess('Product created successfully.')
    }

    await refreshProducts()
    setName('')
    setCostPrice('')
    setSalePrice('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-[0_30px_120px_-50px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">Product catalog</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Manage your products</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Add or update product records with cost and sale prices. All pages will use this product catalog for stock and transaction workflows.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
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
                  <span className="text-sm text-slate-400">Product name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Product name"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Harga modal</span>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="grid gap-3 text-left">
                  <span className="text-sm text-slate-400">Harga jual</span>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0"
                    className="rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-4 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">Product catalog uses <span className="font-semibold text-white">Product</span> table so all modules can access the same product data.</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Saving…' : 'Save product'}
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Catalog tips</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Product-driven workflow</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <p>Use products to standardize stock, transactions, and reporting across the app.</p>
                <p>When product data is available, stock and transaction pages can auto-fill prices.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 text-sm text-slate-300">
                Product IDs should be unique. Updating an existing ID will overwrite its name and prices.
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Product list</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Current catalog</h2>
            </div>
            <p className="text-sm text-slate-400">Pulled from the Product table.</p>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Product ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Harga modal</th>
                  <th className="px-4 py-4">Harga jual</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-slate-400">
                      Loading product catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-slate-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{product.id}</td>
                      <td className="px-4 py-4 text-slate-100">{product.name}</td>
                      <td className="px-4 py-4 text-slate-100">Rp {product.harga_modal.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-4 text-slate-100">Rp {product.harga_jual.toLocaleString('id-ID')}</td>
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
