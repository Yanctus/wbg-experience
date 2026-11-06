import { useEffect } from 'react'

/**
 * Setzt Dokumenttitel und `lang` des <html>-Elements, solange die Seite
 * gezeigt wird, und stellt beides beim Verlassen wieder her.
 *
 * Das `lang`-Attribut ist mehr als Kosmetik: Es steuert Screenreader-Aussprache,
 * Silbentrennung und — für Türkisch entscheidend — die Großschreibung
 * (`text-transform: uppercase` macht nur mit `lang="tr"` aus „i“ ein „İ“).
 */
export function useDocumentMeta(title: string, htmlLang: string) {
  useEffect(() => {
    const previous = { title: document.title, lang: document.documentElement.lang }
    document.title = title
    document.documentElement.lang = htmlLang
    return () => {
      document.title = previous.title
      document.documentElement.lang = previous.lang
    }
  }, [title, htmlLang])
}
