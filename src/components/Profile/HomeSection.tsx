import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { SectionHeading } from '../Sheet/SectionHeading'
import { Sheet } from '../Sheet/Sheet'
import { FloorPlan } from './FloorPlan'
import { ROOMS, TOTAL_AREA, type RoomId } from './floorPlan'
import styles from './HomeSection.module.css'

/**
 * „Meine Wohnung“: Grundriss plus Raumbuch.
 *
 * Plan und Raumbuch teilen sich den Zustand: Was in der Liste gewählt oder
 * überfahren wird, leuchtet im Plan auf — und umgekehrt. Die Liste besteht aus
 * echten Buttons und trägt damit die gesamte Tastatur- und Screenreader-Bedienung.
 */
export function HomeSection() {
  const { t, formatNumber } = useI18n()
  const [active, setActive] = useState<RoomId | null>('living')
  const [hover, setHover] = useState<RoomId | null>(null)

  const highlighted = hover ?? active
  const area = (value: number) =>
    formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const toggle = (id: RoomId) => setActive((current) => (current === id ? null : id))

  return (
    <section className={styles.section} aria-labelledby="home-title">
      <SectionHeading id="home-title" index="01">
        {t('home.title')}
      </SectionHeading>

      <div className={styles.layout}>
        <Sheet className={styles.planSheet} data-reveal>
          <FloorPlan highlighted={highlighted} onHover={setHover} onSelect={toggle} />
        </Sheet>

        <Sheet className={styles.bookSheet} data-reveal>
          <p className={styles.floor}>{t('home.floor')}</p>
          <p className={styles.hint}>{t('home.hint')}</p>

          <ul className={styles.book}>
            {ROOMS.map((room, index) => (
              <li key={room.id}>
                <button
                  type="button"
                  className={styles.row}
                  data-on={highlighted === room.id ? '' : undefined}
                  aria-pressed={active === room.id}
                  onClick={() => toggle(room.id)}
                  onPointerEnter={() => setHover(room.id)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(room.id)}
                  onBlur={() => setHover(null)}
                >
                  <span className={styles.num}>{index + 1}</span>
                  <span className={styles.name}>{t(room.messageKey)}</span>
                  <span className={styles.area}>{area(room.area)}&nbsp;m²</span>
                </button>
              </li>
            ))}
          </ul>

          <p className={styles.total}>
            <span>{t('stats.area')}</span>
            <strong>{area(TOTAL_AREA)}&nbsp;m²</strong>
          </p>
        </Sheet>
      </div>
    </section>
  )
}
