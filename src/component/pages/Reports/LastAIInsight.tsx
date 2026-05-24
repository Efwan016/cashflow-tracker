import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useLanguage } from '../../providers/useLanguage'
import type { ReportInsightResponse } from '../../../types/types'

interface LastAIInsightProps {
  revenue: number
  grossProfit: number
  expenses: number
  netProfit: number
  expenseRatio: number
  bestSellingProduct: string | null
  mostProfitableProduct: string | null
  lowStockCount: number
}

export default function LastAIInsight({
  revenue,
  grossProfit,
  expenses,
  netProfit,
  expenseRatio,
  bestSellingProduct,
  mostProfitableProduct,
  lowStockCount,
}: LastAIInsightProps) {
  const { language, t } = useLanguage()
  const [insight, setInsight] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatInsightLines = (value: string) =>
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) =>
        line
          .replace(/^[-*•\s]+/, '')
          .replace(/\*\*/g, '')
          .replace(/__/g, '')
          .replace(/`/g, '')
          .trim(),
      )

  const insightLines = insight ? formatInsightLines(insight) : []

  const handleGenerateInsight = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'generate-report-insight',
        {
          body: {
            revenue,
            grossProfit,
            expenses,
            netProfit,
            expenseRatio,
            bestSellingProduct,
            mostProfitableProduct,
            lowStockCount,
            language,
          },
        },
      )

      if (invokeError) {
        throw invokeError
      }

      const response = data as ReportInsightResponse

      if (response.error) {
        throw new Error(response.error)
      }

      setInsight(response.insight)
      setGeneratedAt(response.generatedAt)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('Failed to generate insight')
      setError(errorMessage)
      console.error('AI Insight Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleString(language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/10 transition-colors dark:border-slate-700 dark:bg-slate-950/95">
      <div className="flex flex-col gap-6 sm:gap-4">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-500 dark:text-amber-400">
                {t('AI Powered')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {t('Last AI Insight')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {t('Get AI-powered business insights powered by Gemini. Analyze your report data and receive practical recommendations to improve your business performance.')}
              </p>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleGenerateInsight}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition duration-200 hover:-translate-y-0.5 hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-600 sm:w-auto"
        >
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('Generating insight...')}
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v20m10-10H2" />
              </svg>
              {t('Generate AI Insight')}
            </>
          )}
        </button>

        {/* Error State */}
        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {t('Failed to generate insight')}
                </p>
                <p className="mt-1 text-xs text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!insight && !error && !loading && (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900/30">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01"
              />
            </svg>
            <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t('No insight generated yet')}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t('Click the button above to generate an AI-powered business insight')}
            </p>
          </div>
        )}

        {/* Success State */}
        {insight && !error && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg
                    className="h-5 w-5 text-amber-600 dark:text-amber-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {t('AI Insight Generated')}
                  </p>
                  {insightLines.length > 0 ? (
                    <ul className="space-y-3 text-sm leading-6 text-amber-800 dark:text-amber-300">
                      {insightLines.map((line, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-amber-600 dark:bg-amber-300" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-6 text-amber-800 dark:text-amber-300">
                      {insight}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {generatedAt && (
              <div className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                <span>
                  {t('Generated on')}{' '}
                  <time dateTime={generatedAt} className="font-semibold">
                    {formatTimestamp(generatedAt)}
                  </time>
                </span>
                <button
                  onClick={handleGenerateInsight}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium transition hover:bg-slate-100 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  {t('Regenerate')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
