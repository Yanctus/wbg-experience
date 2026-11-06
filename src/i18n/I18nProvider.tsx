import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue } from './I18nContext'
import { STORAGE_KEY, detectLanguage, getLanguage, type LangCode } from './languages'
import { MESSAGES } from './messages'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(detectLanguage)

  const setLang = useCallback((code: LangCode) => {
    setLangState(code)
    try {
      window.localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Speicher gesperrt: Die Wahl gilt dann nur für diese Sitzung.
    }
  }, [])

  const value = useMemo<I18nValue>(() => {
    const language = getLanguage(lang)
    const messages = MESSAGES[lang]
    return {
      lang,
      language,
      setLang,
      t: (key) => messages[key],
      formatNumber: (n, options) => new Intl.NumberFormat(language.formatLocale, options).format(n),
      formatDate: (d, options) =>
        new Intl.DateTimeFormat(language.formatLocale, options).format(
          typeof d === 'string' ? new Date(d) : d,
        ),
    }
  }, [lang, setLang])

  return <I18nContext value={value}>{children}</I18nContext>
}
