import { createContext } from 'react'
import type { CurrencyLanguage } from '../../lib/utils'

export type CurrencyRateState = {
  base: string
  target: string
  rate: number
  date: string | null
  source: string
  isLoading: boolean
}

export interface CurrencyContextType extends CurrencyRateState {
  language: CurrencyLanguage
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)
