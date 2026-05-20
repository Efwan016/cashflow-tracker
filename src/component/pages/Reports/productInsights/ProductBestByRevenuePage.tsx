import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useReportsData } from "../../../hooks/useReportsData"
import { Pagination } from "../../../components/Pagination"
import type { FilterType } from '../../../../types/types'

export default function ProductBestByRevenuePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const filterType = (searchParams.get('type') as FilterType) || 'today'
  const startDate = searchParams.get('start') || ''
  const endDate = searchParams.get('end') || ''

  const { productPerformance, loading, error, fmt, num } = useReportsData(filterType, startDate, endDate)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const sortedProducts = useMemo(() => {
    return [...productPerformance].sort((a, b) => b.revenue - a.revenue)
  }, [productPerformance])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedProducts, currentPage, itemsPerPage])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10 rounded-3xl sm:rounded-[40px] border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950/80 p-5 sm:p-8 shadow-xl backdrop-blur-xl transition-colors">
          <div className="flex items-start sm:items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/reports')}
              className="mt-1 sm:mt-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-bold">Product Insights</p>
              <h1 className="mt-2 text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Best Seller by Revenue</h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Detailed breakdown of products with the highest total revenue.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="mb-10 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {!loading && !error && sortedProducts.length === 0 && (
          <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/80">
            No sales recorded for this period.
          </div>
        )}

        {!loading && !error && sortedProducts.length > 0 && (
          <section className="mb-10 rounded-3xl sm:rounded-[40px] border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-950/80 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-5">Rank</th>
                    <th className="px-6 py-5">Product Name</th>
                    <th className="px-6 py-5">Revenue</th>
                    <th className="px-6 py-5">Profit</th>
                    <th className="px-6 py-5 text-center">Qty Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {paginatedProducts.map((item, index) => (
                    <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-100">
                          {((currentPage - 1) * itemsPerPage) + index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold">{item.name}</td>
                      <td className="px-6 py-5 font-black text-slate-900 dark:text-white">{fmt.format(item.revenue)}</td>
                      <td className="px-6 py-5 text-emerald-600 dark:text-emerald-400 font-bold">{fmt.format(item.profit)}</td>
                      <td className="px-6 py-5 text-center font-mono">{num.format(item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sortedProducts.length > itemsPerPage && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  currentPage={currentPage}
                  totalItems={sortedProducts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}