import { useId, useState } from 'react'
import { LANGUAGES } from '../../i18n/languages'
import type { MessageKey } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'
import { SectionHeading } from '../Sheet/SectionHeading'
import { Sheet } from '../Sheet/Sheet'
import styles from './SettingsCard.module.css'

type NotifyKey = 'mail' | 'post' | 'repair'

const SWITCHES: readonly { id: NotifyKey; label: MessageKey }[] = [
  { id: 'mail', label: 'settings.notifyMail' },
  { id: 'post', label: 'settings.notifyPost' },
  { id: 'repair', label: 'settings.notifyRepair' },
]

/**
 * Einstellungen: Sprachwahl und Benachrichtigungen.
 *
 * Beides sind native Formularelemente (Radio-Gruppe, Checkbox mit
 * `role="switch"`) — dadurch funktionieren Pfeiltasten, Leertaste und
 * Screenreader ohne eigene Logik; das Aussehen liegt allein in CSS.
 * Die Benachrichtigungen sind vorerst lokaler Zustand ohne Backend.
 */
export function SettingsCard() {
  const { t, lang, setLang } = useI18n()
  const [notify, setNotify] = useState<Record<NotifyKey, boolean>>({
    mail: true,
    post: true,
    repair: false,
  })
  const hintId = useId()

  return (
    <section className={styles.section} aria-labelledby="settings-title">
      <SectionHeading id="settings-title" index="03">
        {t('settings.title')}
      </SectionHeading>

      <Sheet as="div" tilt data-reveal>
        <fieldset className={styles.group} aria-describedby={hintId}>
          <legend className={styles.legend}>{t('settings.language')}</legend>
          <p className={styles.hint} id={hintId}>
            {t('settings.languageHint')}
          </p>
          <div className={styles.languages}>
            {LANGUAGES.map((item) => (
              <label className={styles.language} key={item.code} lang={item.htmlLang}>
                <input
                  className={styles.radio}
                  type="radio"
                  name="language"
                  value={item.code}
                  checked={item.code === lang}
                  onChange={() => setLang(item.code)}
                />
                <span className={styles.languageName}>{item.name}</span>
                <span className={styles.languageShort}>{item.short}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>{t('settings.notifications')}</legend>
          <div className={styles.switches}>
            {SWITCHES.map((item) => (
              <label className={styles.switchRow} key={item.id}>
                <span>{t(item.label)}</span>
                <input
                  className={styles.switch}
                  type="checkbox"
                  role="switch"
                  checked={notify[item.id]}
                  onChange={() => setNotify((state) => ({ ...state, [item.id]: !state[item.id] }))}
                />
              </label>
            ))}
          </div>
        </fieldset>
      </Sheet>
    </section>
  )
}
