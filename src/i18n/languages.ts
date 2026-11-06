export type LangCode = 'de' | 'ro' | 'tr' | 'it' | 'ksh'

export interface Language {
  code: LangCode
  /** Wert für das `lang`-Attribut (BCP 47). Kölsch hat den ISO-639-3-Code `ksh`. */
  htmlLang: string
  /** Eigenbezeichnung der Sprache — so erkennen Sprecher ihre Sprache sofort. */
  name: string
  /** Kurzkürzel für enge Stellen (Sprachumschalter). */
  short: string
  /**
   * Locale für Zahlen- und Datumsformate. Kölsch hat keine eigenen Formatregeln
   * in `Intl`; gesprochen wird es in Deutschland, daher gelten die deutschen.
   */
  formatLocale: string
}

/** Reihenfolge = Reihenfolge in allen Sprachwahl-Elementen. */
export const LANGUAGES: readonly Language[] = [
  { code: 'de', htmlLang: 'de', name: 'Deutsch', short: 'DE', formatLocale: 'de-DE' },
  { code: 'ro', htmlLang: 'ro', name: 'Română', short: 'RO', formatLocale: 'ro-RO' },
  { code: 'tr', htmlLang: 'tr', name: 'Türkçe', short: 'TR', formatLocale: 'tr-TR' },
  { code: 'it', htmlLang: 'it', name: 'Italiano', short: 'IT', formatLocale: 'it-IT' },
  { code: 'ksh', htmlLang: 'ksh', name: 'Kölsch', short: 'KSH', formatLocale: 'de-DE' },
]

export const DEFAULT_LANG: LangCode = 'de'

export const STORAGE_KEY = 'wbg-lang'

export function isLangCode(value: unknown): value is LangCode {
  return LANGUAGES.some((language) => language.code === value)
}

export function getLanguage(code: LangCode): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0]
}

/**
 * Startsprache: gespeicherte Wahl, sonst die erste unterstützte Browsersprache,
 * sonst Deutsch. Der Speicher kann gesperrt sein (privater Modus), daher try/catch.
 */
export function detectLanguage(): LangCode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLangCode(stored)) return stored
  } catch {
    // Speicher nicht verfügbar — weiter mit der Browsersprache.
  }

  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLangCode(base)) return base
  }
  return DEFAULT_LANG
}
