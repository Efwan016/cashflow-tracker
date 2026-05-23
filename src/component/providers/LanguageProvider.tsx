import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { getDefaultLanguage, setLanguage as saveLanguage, type Language, getTranslation } from '../../lib/i18n'
import { LanguageContext } from './LanguageContext'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageSate] = useState<Language>(() => getDefaultLanguage())

  useEffect(() => {
    // Apply language to document
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageSate(lang)
    saveLanguage(lang)
  }

  const t = (key: string) => {
    return getTranslation(language, key)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
