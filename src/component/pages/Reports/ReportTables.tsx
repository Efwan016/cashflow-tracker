import { useNavigate } from 'react-router-dom'
import { Pagination } from '../../components/Pagination'
import { useLanguage } from '../../providers/useLanguage'
import type { ReportTablesProps } from '../../../types/types'

export default function ReportTables({
  loading,
  error,
  txTotal,
  stockTotal,
  pagedTransactions,
  pagedStocks,
  txPage,
  stockPage,
  itemsPerPage,
  onTxPageChange,
  onStockPageChange,
  getProductName,
  num,
  fmt,
  productDetails,
}: ReportTablesProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const safeNumber = (value: number | null | undefined) => Number(value ?? 0)

  return (
    <section className="mt-10 grid gap-6">
      <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Revenue report')}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('Recent transactions')}</h2>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Latest sales within your selected period.')}</p>
            <button
              onClick={() => navigate('/transactions')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
            >
              {t('View All Transactions →')}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90">
          <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-200">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <tr>
                <th className="px-4 py-4">{t('Product')}</th>
                <th className="px-4 py-4">{t('Qty')}</th>
                <th className="px-4 py-4">{t('Sale')}</th>
                <th className="px-4 py-4">{t('Profit')}</th>
                <th className="px-4 py-4">{t('Total')}</th>
                <th className="px-4 py-4">{t('Date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">{t('Loading report data...')}</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-rose-300">{error}</td>
                </tr>
              ) : txTotal === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">{t('No transactions available for this date range.')}</td>
                </tr>
              ) : (
                pagedTransactions.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate('/transactions')}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{getProductName(item)}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{num.format(item.qty)}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.harga_jual)}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.profit != null ? item.profit : safeNumber(item.total) - safeNumber(item.harga_modal) * safeNumber(item.qty))}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(item.total)}</td>
                    <td className="px-4 py-4 text-right text-slate-500 dark:text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && txTotal > itemsPerPage && (
          <div className="mt-4">
            <Pagination currentPage={txPage} totalItems={txTotal} itemsPerPage={itemsPerPage} onPageChange={onTxPageChange} />
          </div>
        )}
      </div>

      <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">{t('Inventory report')}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('Current stock overview')}</h2>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('Active stock details and valuation.')}</p>
            <button
              onClick={() => navigate('/inventory')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
            >
              {t('View All Stock →')}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90">
          <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-200">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <tr>
                <th className="px-4 py-4">{t('Product')}</th>
                <th className="px-4 py-4">{t('Qty')}</th>
                <th className="px-4 py-4">{t('Cost value')}</th>
                <th className="px-4 py-4">{t('Retail value')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">{t('Loading stock data...')}</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-rose-300">{error}</td>
                </tr>
              ) : stockTotal === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">{t('No stock records found.')}</td>
                </tr>
              ) : (
                pagedStocks.map((item) => {
                  const product = productDetails.get(item.product_id)
                  const modalPrice = safeNumber(item.harga_modal ?? product?.harga_modal)
                  const jualPrice = safeNumber(item.harga_jual ?? product?.harga_jual)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate('/inventory')}
                      className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{product?.name ?? item.product_id}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{num.format(item.total)}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(modalPrice * item.total)}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-100">{fmt.format(jualPrice * item.total)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && stockTotal > itemsPerPage && (
          <div className="mt-4">
            <Pagination currentPage={stockPage} totalItems={stockTotal} itemsPerPage={itemsPerPage} onPageChange={onStockPageChange} />
          </div>
        )}
      </div>
    </section>
  )
}
