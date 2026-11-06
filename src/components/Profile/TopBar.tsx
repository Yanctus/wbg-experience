import { useI18n } from '../../i18n/useI18n'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import styles from './TopBar.module.css'

export function TopBar() {
  const { t } = useI18n()

  return (
    <header className={styles.bar} data-bar data-intro="bar">
      <a className={styles.brand} href="#/" aria-label={`WBG Mieterschutz eG – ${t('nav.home')}`}>
        <span className={styles.mark}>WBG</span>
        <span className={styles.brandText}>Mieterschutz eG</span>
      </a>

      <div className={styles.actions}>
        <a className={styles.home} href="#/">
          {t('nav.home')}
        </a>
        <LanguageSwitcher />
      </div>
    </header>
  )
}
