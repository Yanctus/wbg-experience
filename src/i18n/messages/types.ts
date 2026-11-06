import type { de } from './de'

/** Alle gültigen Nachrichten-Schlüssel — abgeleitet aus der Quellsprache. */
export type MessageKey = keyof typeof de

/** Vollständiger Satz Übersetzungen: jede Sprache muss jeden Schlüssel liefern. */
export type Messages = Record<MessageKey, string>
