import { useEffect, useId, useRef, useState } from 'react'
import { LANGUAGES } from '../../i18n/languages'
import { useI18n } from '../../i18n/useI18n'
import styles from './LanguageSwitcher.module.css'

function GlobeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="10" cy="10" r="7.6" />
        <ellipse cx="10" cy="10" rx="3.2" ry="7.6" />
        <path d="M2.6 10h14.8M3.7 6.3h12.6M3.7 13.7h12.6" />
      </g>
    </svg>
  )
}

/**
 * Sprachumschalter als „Disclosure“: Ein Knopf öffnet eine Liste echter Buttons.
 * Das ist ohne eigene Pfeiltasten-Logik tastaturbedienbar (Tab, Enter, Escape)
 * und für Screenreader eindeutig; die aktive Sprache trägt `aria-current`.
 */
export function LanguageSwitcher() {
  const { lang, language, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={styles.root} ref={root}>
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${t('lang.switch')}: ${language.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon />
        <span className={styles.code}>{language.short}</span>
        <svg
          className={styles.chevron}
          data-open={open ? '' : undefined}
          viewBox="0 0 10 10"
          width="9"
          height="9"
          aria-hidden="true"
        >
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel} id={panelId}>
          <ul className={styles.list}>
            {LANGUAGES.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  lang={item.htmlLang}
                  className={styles.option}
                  aria-current={item.code === lang ? 'true' : undefined}
                  onClick={() => {
                    setLang(item.code)
                    setOpen(false)
                    trigger.current?.focus()
                  }}
                >
                  <span>{item.name}</span>
                  <span className={styles.short}>{item.short}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
