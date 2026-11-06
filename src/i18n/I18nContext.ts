import { createContext } from 'react'
import type { LangCode, Language } from './languages'
import type { MessageKey } from './messages'

export interface I18nValue {
  lang: LangCode
  language: Language
  setLang: (code: LangCode) => void
  /** Übersetzt einen Schlüssel. Unbekannte Schlüssel gibt es dank Typen nicht. */
  t: (key: MessageKey) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string
}

export const I18nContext = createContext<I18nValue | null>(null)
