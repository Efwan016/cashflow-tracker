import { useContext, useMemo } from 'react'
import { createCurrencyFormatter } from '../../lib/utils'
import { CurrencyContext } from './CurrencyContext'
import { useLanguage } from './useLanguage'

export function useCurrencyFormatter() {
  const currency = useContext(CurrencyContext)
  const { language } = useLanguage()

  return useMemo(
    () => createCurrencyFormatter(language, currency?.rate ?? 1),
    [currency?.rate, language]
  )
}

export function useCurrencyRate() {
  const currency = useContext(CurrencyContext)

  if (!currency) {
    throw new Error('useCurrencyRate must be used within CurrencyProvider')
  }

  return currency
}
