import type { Messages } from './types'

/**
 * Kölsch (ISO 639-3: ksh).
 *
 * ⚠️ PRÜFUNG DURCH MUTTERSPRACHLER NÖTIG.
 * Kölsch hat keine verbindliche Rechtschreibung; es gibt Schreibweisen-
 * Traditionen (u. a. die der „Akademie för uns kölsche Sproch“) und viele
 * Ortsvarianten. Diese Fassung hält sich an die üblichen Muster:
 *   g → j am Wortanfang (Jeschäff, jezeichent, Jang), -schaft → -schaff,
 *   „nicht/sind/ist“ → nit/sin/es, „in dem“ → em, „von“ → vun, „für“ → för,
 *   Infinitive auf -e (wähle, springe, kopiere).
 * Fachwörter, die im Kölner Alltag ohnehin hochdeutsch bleiben (Profil,
 * Kontakt, E-Mail, Telefon, Bad), sind unverändert übernommen.
 * Unsicher und deshalb besonders zu prüfen: Mi/Ming (mein), Sigg-/Sick-Wörter
 * wurden bewusst vermieden, ebenso „Aandeile“, „Metglied sid“, „Jang“.
 */
export const ksh: Messages = {
  'meta.title': 'Mi Profil – WBG Mieterschutz eG',
  'a11y.skip': 'Zom Inhalt springe',
  'nav.home': 'Zeröck zom Aanfang',
  'lang.switch': 'Sproch wähle',
  'demo.badge': 'Beispill-Date',

  'profile.eyebrow': 'Metglieder-Berich',
  'profile.title': 'Mi Profil',
  'profile.status': 'Aktiv dobei',
  'profile.memberNo': 'Metgliedsnummer',
  'profile.since': 'Metglied sid',
  'profile.district': 'Veedel',

  'stats.title': 'Op ene Blick',
  'stats.shares': 'Jeschäffs-Aandeile',
  'stats.years': 'Johre als Metglied',
  'stats.area': 'Wonnfläch',
  'stats.requests': 'Offe Saache',

  'home.title': 'Ming Wonnung',
  'home.floor': '2. Stock',
  'home.hint': 'Zemmer aanklicke, för et em Plan ze markeere.',
  'room.living': 'Wonne & Esse',
  'room.kitchen': 'Köch',
  'room.bedroom': 'Schlofzemmer',
  'room.kids': 'Kinderzemmer',
  'room.bath': 'Bad',
  'room.hall': 'Jang',

  'contact.title': 'Kontakt',
  'contact.email': 'E-Mail',
  'contact.phone': 'Telefon',
  'contact.address': 'Adress',
  'contact.copy': 'Kopiere',
  'contact.copied': 'Kopiert',

  'settings.title': 'Enstellunge',
  'settings.language': 'Sproch',
  'settings.languageHint': 'Jilt hee.',
  'settings.notifications': 'Meldunge',
  'settings.notifyMail': 'Neuigkeite per E-Mail',
  'settings.notifyPost': 'Wichtige Breef per Post',
  'settings.notifyRepair': 'Stand vun de Reparatur-Meldunge',

  'activity.title': 'Zoletz passeet',
  'activity.bill': 'Avrechnung vun de Nevvekoste 2025 litt parat',
  'activity.repair': 'Reparatur-Meldung „Wasserhahn em Bad“ es erledigt',
  'activity.share': 'Jeschäffs-Aandeil jezeichent',

  'footer.note': 'All Aanjabe hee sin nor Beispill-Date.',
}
