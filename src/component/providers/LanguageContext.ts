import { createContext } from 'react'
import type { Language } from '../../lib/i18n'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)
