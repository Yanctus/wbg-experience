import type { MessageKey } from '../../i18n/messages'

/**
 * Beispieldaten für die Profilseite. Alles hier ist erfunden: „Mustermann“,
 * die Domain example.org (für Beispiele reserviert) und eine Telefonnummer aus
 * dem Bereich, den die Bundesnetzagentur für fiktive Zwecke freihält.
 * Sobald es ein Backend gibt, wird dieses Modul durch echte Daten ersetzt.
 */
export const MEMBER = {
  firstName: 'Alex',
  lastName: 'Mustermann',
  number: '04711',
  since: '2019-04-01',
  district: 'Nippes',
  shares: 4,
  openRequests: 1,
  email: 'alex.mustermann@example.org',
  phone: '+49 221 4710123',
  address: ['Beispielstraße 12', '50678 Köln'],
} as const

export const INITIALS = `${MEMBER.firstName[0]}${MEMBER.lastName[0]}`

export interface ActivityItem {
  id: string
  /** ISO-Datum; wird je Sprache formatiert. */
  date: string
  key: MessageKey
}

/** Neueste zuerst. */
export const ACTIVITY: readonly ActivityItem[] = [
  { id: 'repair', date: '2026-10-21', key: 'activity.repair' },
  { id: 'bill', date: '2026-09-12', key: 'activity.bill' },
  { id: 'share', date: '2026-03-02', key: 'activity.share' },
]

/** Volle Jahre seit einem ISO-Datum. */
export function yearsSince(iso: string, now: Date = new Date()): number {
  const start = new Date(iso)
  let years = now.getFullYear() - start.getFullYear()
  const anniversary = new Date(now.getFullYear(), start.getMonth(), start.getDate())
  if (now < anniversary) years -= 1
  return Math.max(0, years)
}
