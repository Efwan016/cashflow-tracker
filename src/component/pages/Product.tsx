import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../types/types'

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetMessage = () => {
    setError('')
    setSuccess('')
  }

  const currencyFormatter = useMemo(() => {
    const currency = navigator.language.includes('ID') ? 'IDR' : 'USD';
    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    });
  }, []);

  const getUserId = async () => {
    const { data } = await supabase.auth.getUser()
    return data?.user?.id ?? null
  }

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name)
        case 'name-desc': return b.name.localeCompare(a.name)
        case 'modal-asc': return a.harga_modal - b.harga_modal
        case 'modal-desc': return b.harga_modal - a.harga_modal
        case 'sale-asc': return a.harga_jual - b.harga_jual
        case 'sale-desc': return b.harga_jual - a.harga_jual
        default: return 0
      }
    })
  }, [products, sortBy])

  const fetchProducts = useCallback(async () => {
    const userId = await getUserId()
    if (!userId) return

    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setError('') // ✅ reset error kalau sukses
      setProducts(data ?? [])
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const init = async () => {
      setLoading(true)
      await fetchProducts()
      if (!ignore) setLoading(false)
    }

    init()

    return () => {
      ignore = true
    }
  }, [fetchProducts])

  const handleSubmit = async () => {
    resetMessage()

    const userId = await getUserId()
    if (!userId) {
      setError('User not found')
      return
    }

    if (!name.trim() || !costPrice || !salePrice) {
      setError('Please fill in all product fields.')
      return
    }

    const parsedCost = Number(costPrice)
    const parsedSale = Number(salePrice)

    if (
      !Number.isFinite(parsedCost) ||
      parsedCost < 0 ||
      !Number.isFinite(parsedSale) ||
      parsedSale < 0
    ) {
      setError('Harga tidak valid.')
      return
    }

    setSubmitting(true)

    try {
      const { data: existingProduct, error: checkError } = await supabase
        .from('Product')
        .select('id')
        .eq('name', name.trim())
        .eq('user_id', userId)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingProduct) {
        const { error } = await supabase
          .from('Product')
          .update({
            harga_modal: parsedCost,
            harga_jual: parsedSale,
          })
          .eq('id', existingProduct.id)
          .eq('user_id', userId)

        if (error) throw error

        setSuccess('Product updated.')
      } else {
        const { error } = await supabase
          .from('Product')
          .insert([
            {
              name,
              harga_modal: parsedCost,
              harga_jual: parsedSale,
              user_id: userId,
            },
          ])

        if (error) throw error

        setSuccess('Product created.')
      }

      await fetchProducts()

      setName('')
      setCostPrice('')
      setSalePrice('')
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirmed = async (id: string) => {
    resetMessage()

    const userId = await getUserId()
    if (!userId) {
      setError('User not found')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('Product')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

      setSuccess('Product deleted.')
      toast.success('Product deleted successfully 🚀')

      await fetchProducts()
    } catch {
      setError('Failed to delete product')
      toast.error('Failed to delete product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    const customId = "confirm-delete-product";
    toast.info(
      <div className="space-y-4">
        <p className="font-medium text-slate-100">Yakin mau hapus product ini?</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-3xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400 transition"
            onClick={() => {
              toast.dismiss(customId)
              handleDeleteConfirmed(id)
            }}
          >
            Hapus
          </button>
          <button
            type="button"
            className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            onClick={() => toast.dismiss(customId)}
          >
            Batal
          </button>
        </div>
      </div>,
      { toastId: customId, autoClose: false, closeOnClick: false, closeButton: false, draggable: false }
    )
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
                  disabled={loading || submitting}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Save product'}
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
            <div className="flex items-center gap-3">
               <span className="text-xs text-slate-500">Sort:</span>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs text-white outline-none focus:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer"
               >
                 <option value="name-asc">Alphabet (A-Z)</option>
                 <option value="name-desc">Alphabet (Z-A)</option>
                 <option value="modal-desc">Modal (High-Low)</option>
                 <option value="modal-asc">Modal (Low-High)</option>
                 <option value="sale-desc">Jual (High-Low)</option>
                 <option value="sale-asc">Jual (Low-High)</option>
               </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/90">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Product ID</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Harga modal</th>
                  <th className="px-4 py-4">Harga jual</th>
                  <th className="px-4 py-4">Action</th>
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
                  sortedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-800 last:border-none">
                      <td className="px-4 py-4 text-slate-100">{product.id}</td>
                      <td className="px-4 py-4 text-slate-100">{product.name}</td>
                      <td className="px-4 py-4 text-slate-100">{currencyFormatter.format(product.harga_modal)}</td>
                      <td className="px-4 py-4 text-slate-100">{currencyFormatter.format(product.harga_jual)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={submitting}
                          className="rounded-xl bg-rose-500/20 px-3 py-1 text-sm text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
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
