import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { MessageKey } from '../../i18n/messages'
import a11y from '../../styles/a11y.module.css'
import { SectionHeading } from '../Sheet/SectionHeading'
import { Sheet } from '../Sheet/Sheet'
import { MEMBER } from './profile.data'
import styles from './ContactCard.module.css'

/** Fallback für Kontexte ohne Clipboard-API (z. B. http im lokalen Netz). */
function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}

/**
 * Erlaubt einen Zeilenumbruch hinter dem „@“, statt die Adresse mitten im Wort zu
 * zerreißen. `<wbr>` fügt keinen Text ein — Kopieren und Auswählen bleiben unverändert.
 */
function breakable(text: string) {
  const at = text.indexOf('@')
  if (at === -1) return text
  return (
    <>
      {text.slice(0, at + 1)}
      <wbr />
      {text.slice(at + 1)}
    </>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = legacyCopy(text)
    }
    // Nur bestätigen, was wirklich passiert ist.
    if (!ok) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <button
        type="button"
        className={styles.copy}
        data-copied={copied ? '' : undefined}
        aria-label={`${t('contact.copy')}: ${label}`}
        onClick={copy}
      >
        <span aria-hidden="true">{copied ? t('contact.copied') : t('contact.copy')}</span>
      </button>
      <span className={a11y.srOnly} aria-live="polite">
        {copied ? t('contact.copied') : ''}
      </span>
    </>
  )
}

interface Row {
  key: MessageKey
  lines: readonly string[]
  copy: string
  href?: string
}

const ROWS: readonly Row[] = [
  {
    key: 'contact.email',
    lines: [MEMBER.email],
    copy: MEMBER.email,
    href: `mailto:${MEMBER.email}`,
  },
  {
    key: 'contact.phone',
    lines: [MEMBER.phone],
    copy: MEMBER.phone,
    href: `tel:${MEMBER.phone.replaceAll(' ', '')}`,
  },
  {
    key: 'contact.address',
    lines: MEMBER.address,
    copy: MEMBER.address.join(', '),
  },
]

export function ContactCard() {
  const { t } = useI18n()

  return (
    <section className={styles.section} aria-labelledby="contact-title">
      <SectionHeading id="contact-title" index="02">
        {t('contact.title')}
      </SectionHeading>

      <Sheet as="div" tilt data-reveal>
        <dl className={styles.list}>
          {ROWS.map((row) => {
            const label = t(row.key)
            return (
              <div className={styles.row} key={row.key}>
                <dt className={styles.label}>{label}</dt>
                <dd className={styles.value}>
                  {row.href ? (
                    <a href={row.href}>{breakable(row.lines[0])}</a>
                  ) : (
                    row.lines.map((line) => <span key={line}>{line}</span>)
                  )}
                </dd>
                <dd className={styles.action}>
                  <CopyButton text={row.copy} label={label} />
                </dd>
              </div>
            )
          })}
        </dl>
      </Sheet>
    </section>
  )
}
