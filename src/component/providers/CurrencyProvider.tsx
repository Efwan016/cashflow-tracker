import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrencyForLanguage } from '../../lib/utils'
import { useLanguage } from './useLanguage'
import { CurrencyContext, type CurrencyRateState } from './CurrencyContext'

const BASE_CURRENCY = 'IDR'

const STATIC_IDR_RATES: Record<string, number> = {
  IDR: 1,
  USD: 1 / 16200,
  EUR: 1 / 17600,
  CNY: 1 / 2240,
  JPY: 1 / 105,
  RUB: 1 / 205,
  SAR: 1 / 4320,
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 12

type CachedRate = {
  target: string
  rate: number
  date: string | null
  source: string
  savedAt: number
}

type CurrencyRateResponse = {
  base?: string
  target?: string
  rate?: number
  date?: string | null
  source?: string
}

const cacheKey = (target: string) => `cashflow-currency-rate-${BASE_CURRENCY}-${target}`

const readCachedRate = (target: string): CachedRate | null => {
  try {
    const raw = localStorage.getItem(cacheKey(target))
    if (!raw) return null

    const cached = JSON.parse(raw) as CachedRate
    if (cached.target !== target || !Number.isFinite(cached.rate)) return null
    if (Date.now() - cached.savedAt > CACHE_TTL_MS) return null

    return cached
  } catch {
    return null
  }
}

const writeCachedRate = (rate: CachedRate) => {
  try {
    localStorage.setItem(cacheKey(rate.target), JSON.stringify(rate))
  } catch {
    // Ignore storage failures; conversion still works with in-memory state.
  }
}

const getFallbackRate = (target: string): CurrencyRateState => ({
  base: BASE_CURRENCY,
  target,
  rate: STATIC_IDR_RATES[target] ?? 1,
  date: null,
  source: target === BASE_CURRENCY ? 'base' : 'fallback',
  isLoading: false,
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage()
  const target = getCurrencyForLanguage(language)
  const [rateState, setRateState] = useState<CurrencyRateState>(() => getFallbackRate(target))

  useEffect(() => {
    let isMounted = true

    const loadRate = async () => {
      await Promise.resolve()

      if (!isMounted) return

      if (target === BASE_CURRENCY) {
        setRateState(getFallbackRate(target))
        return
      }

      const cached = readCachedRate(target)

      if (cached) {
        setRateState({
          base: BASE_CURRENCY,
          target,
          rate: cached.rate,
          date: cached.date,
          source: cached.source,
          isLoading: false,
        })
      } else {
        setRateState(prev => ({
          ...getFallbackRate(target),
          rate: prev.target === target ? prev.rate : STATIC_IDR_RATES[target] ?? 1,
          isLoading: true,
        }))
      }

      const { data, error } = await supabase.functions.invoke<CurrencyRateResponse>('currency-rate', {
        body: {
          base: BASE_CURRENCY,
          target,
        },
      })

      if (!isMounted) return

      if (error || !data || !Number.isFinite(data.rate)) {
        setRateState(prev => ({
          ...prev,
          isLoading: false,
          source: prev.source === 'api' ? 'api' : 'fallback',
        }))
        return
      }

      const apiRate = Number(data.rate)
      const nextRate = {
        target,
        rate: apiRate,
        date: data.date ?? null,
        source: data.source ?? 'api',
        savedAt: Date.now(),
      }

      writeCachedRate(nextRate)
      setRateState({
        base: data.base ?? BASE_CURRENCY,
        target,
        rate: apiRate,
        date: nextRate.date,
        source: nextRate.source,
        isLoading: false,
      })
    }

    loadRate()

    return () => {
      isMounted = false
    }
  }, [target])

  const value = useMemo(
    () => ({
      language,
      ...rateState,
    }),
    [language, rateState]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
