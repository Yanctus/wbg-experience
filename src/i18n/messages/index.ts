import type { LangCode } from '../languages'
import { de } from './de'
import { it } from './it'
import { ksh } from './ksh'
import { ro } from './ro'
import { tr } from './tr'
import type { Messages } from './types'

export type { MessageKey, Messages } from './types'

/** Schlüssel pro Sprache — `Record<LangCode, …>` erzwingt, dass keine Sprache fehlt. */
export const MESSAGES: Record<LangCode, Messages> = { de, ro, tr, it, ksh }
