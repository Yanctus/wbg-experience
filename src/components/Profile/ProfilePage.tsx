import type { MouseEvent } from 'react'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { useProfileAnimation } from '../../hooks/useProfileAnimation'
import { useI18n } from '../../i18n/useI18n'
import a11y from '../../styles/a11y.module.css'
import { Sheet } from '../Sheet/Sheet'
import { ActivityTimeline } from './ActivityTimeline'
import { Avatar } from './Avatar'
import { ContactCard } from './ContactCard'
import { CountUp } from './CountUp'
import { HomeSection } from './HomeSection'
import { SettingsCard } from './SettingsCard'
import { TopBar } from './TopBar'
import { TOTAL_AREA } from './floorPlan'
import { INITIALS, MEMBER, yearsSince } from './profile.data'
import styles from './ProfilePage.module.css'

/**
 * Profilseite im Papier-und-Plan-Look des Projekts.
 *
 * Aufbau: Kopfleiste → Auftakt mit Namen und „Schriftfeld“ (wie der Planstempel
 * auf einer Bauzeichnung) → Kennzahlen → Wohnung als Grundriss → Kontakt und
 * Einstellungen → Aktivitäten. Alle Texte kommen aus `i18n`, alle Daten aus
 * `profile.data.ts` (Beispieldaten).
 */
export default function ProfilePage() {
  const { t, language, formatDate } = useI18n()
  useDocumentMeta(t('meta.title'), language.htmlLang)
  const scope = useProfileAnimation<HTMLDivElement>(language.formatLocale, language.code)

  // Hash-Router: ein echter #anker würde die Route wechseln, daher per Skript fokussieren.
  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById('inhalt')?.focus()
  }

  return (
    <div className={styles.page} ref={scope}>
      <a className={a11y.skipLink} href="#inhalt" onClick={skipToContent}>
        {t('a11y.skip')}
      </a>

      {/* Hintergrund: Papier, Raster, Vignette, Lichtfleck, Korn — alles rein dekorativ. */}
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.paper} />
        <div className={styles.grid} data-grid />
        <div className={styles.vignette} />
        <div className={styles.light} data-light />
        <div className={styles.grain} />
      </div>

      <TopBar />

      <main className={styles.main} id="inhalt" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="profile-title">
          <div className={styles.identity}>
            <div className={styles.avatarRow} data-intro="fade">
              <Avatar initials={INITIALS} />
              <div>
                <p className={styles.eyebrow}>{t('profile.eyebrow')}</p>
                <p className={styles.demo}>{t('demo.badge')}</p>
              </div>
            </div>

            <h1 className={styles.title} id="profile-title">
              <span className={styles.kicker} data-intro="fade">
                {t('profile.title')}
              </span>
              <span className={styles.nameLine}>
                <span data-line>{MEMBER.firstName}</span>
              </span>
              <span className={styles.nameLine}>
                <span data-line>{MEMBER.lastName}</span>
              </span>
            </h1>
          </div>

          {/* Schriftfeld: gleiche Anordnung wie der Planstempel auf einer Zeichnung. */}
          <Sheet as="aside" tilt className={styles.titleBlock} aria-label={t('profile.title')}>
            <dl className={styles.cells}>
              <div className={`${styles.cell} ${styles.cellWide}`} data-cell>
                <dt>{t('profile.memberNo')}</dt>
                <dd className={styles.memberNo}>{MEMBER.number}</dd>
              </div>
              <div className={styles.cell} data-cell>
                <dt>{t('profile.since')}</dt>
                <dd>{formatDate(MEMBER.since, { month: 'long', year: 'numeric' })}</dd>
              </div>
              <div className={styles.cell} data-cell>
                <dt>{t('profile.district')}</dt>
                <dd>{MEMBER.district}</dd>
              </div>
            </dl>
            <p className={styles.status} data-cell>
              <span className={styles.dot} aria-hidden="true" />
              {t('profile.status')}
            </p>
          </Sheet>
        </section>

        <section className={styles.stats} aria-labelledby="stats-title">
          <h2 className={a11y.srOnly} id="stats-title">
            {t('stats.title')}
          </h2>
          <div className={styles.rule} aria-hidden="true" data-rule />
          <ul className={styles.statGrid}>
            <li className={styles.stat} data-reveal>
              <p className={styles.statNum}>
                <CountUp value={MEMBER.shares} />
              </p>
              <p className={styles.statLabel}>{t('stats.shares')}</p>
            </li>
            <li className={styles.stat} data-reveal>
              <p className={styles.statNum}>
                <CountUp value={yearsSince(MEMBER.since)} />
              </p>
              <p className={styles.statLabel}>{t('stats.years')}</p>
            </li>
            <li className={styles.stat} data-reveal>
              <p className={styles.statNum}>
                <CountUp value={TOTAL_AREA} decimals={1} />
                <span className={styles.unit}>&nbsp;m²</span>
              </p>
              <p className={styles.statLabel}>{t('stats.area')}</p>
            </li>
            <li className={styles.stat} data-reveal>
              <p className={styles.statNum}>
                <CountUp value={MEMBER.openRequests} />
              </p>
              <p className={styles.statLabel}>{t('stats.requests')}</p>
            </li>
          </ul>
        </section>

        <HomeSection />

        <div className={styles.duo}>
          <ContactCard />
          <SettingsCard />
        </div>

        <ActivityTimeline />
      </main>

      <footer className={styles.footer}>
        <p>{t('footer.note')}</p>
        <p>WBG Mieterschutz eG</p>
      </footer>
    </div>
  )
}
