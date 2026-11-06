import { useI18n } from '../../i18n/useI18n'
import { SectionHeading } from '../Sheet/SectionHeading'
import { ACTIVITY } from './profile.data'
import styles from './ActivityTimeline.module.css'

/** Zeitstrahl der letzten Aktivitäten; die Linie wächst beim Scrollen (data-timeline-line). */
export function ActivityTimeline() {
  const { t, formatDate } = useI18n()

  return (
    <section className={styles.section} aria-labelledby="activity-title">
      <SectionHeading id="activity-title" index="04">
        {t('activity.title')}
      </SectionHeading>

      <div className={styles.wrap}>
        <span className={styles.line} aria-hidden="true" data-timeline-line />
        <ol className={styles.list}>
          {ACTIVITY.map((item) => (
            <li className={styles.item} key={item.id} data-reveal>
              <span className={styles.node} aria-hidden="true" />
              <time className={styles.date} dateTime={item.date}>
                {formatDate(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
              <p className={styles.text}>{t(item.key)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
