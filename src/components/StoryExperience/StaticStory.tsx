import { BUILDING, BUILDING_SIZE } from '../../assets/manifest'
import styles from './StaticStory.module.css'

/**
 * The story for readers who asked for reduced motion.
 *
 * The pinned, scrubbed sequence is switched off for them, which would leave the
 * two later acts unseen — so the same key states are laid out as a short,
 * readable page instead: the finished model, and every word the animated
 * version speaks. It is display:none unless the preference is set, so it costs
 * nothing to anyone else.
 */
export function StaticStory() {
  return (
    <section className={styles.static} aria-label="Die Geschichte in Kurzform">
      <figure className={styles.figure}>
        <img
          src={BUILDING.white}
          alt="Architekturmodell des Wohngebäudes"
          width={BUILDING_SIZE.width}
          height={BUILDING_SIZE.height}
          decoding="async"
          loading="lazy"
        />
      </figure>

      <h2 className={styles.title}>Aus einer Zeichnung entsteht Wirklichkeit.</h2>

      <h2 className={styles.title}>Ein Gebäude wird erst durch Menschen zu einem Zuhause.</h2>
      <p className={styles.body}>
        Wir schaffen Wohnraum, der bleibt. Für Nachbarschaften, die wachsen. Und für Menschen, die
        sich zuhause fühlen sollen.
      </p>
    </section>
  )
}
