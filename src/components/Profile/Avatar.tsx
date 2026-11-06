import styles from './Avatar.module.css'

/**
 * Monogramm im Zielkreuz: ein Ring, der sich beim Laden einzeichnet
 * (`data-intro="ring"`, siehe useProfileAnimation), ein langsam kreisender
 * gestrichelter Orbit und vier Fadenkreuz-Marken wie auf einem Plan.
 */
export function Avatar({ initials }: { initials: string }) {
  return (
    <div className={styles.avatar} aria-hidden="true">
      <svg className={styles.svg} viewBox="0 0 120 120">
        <circle className={styles.orbit} cx="60" cy="60" r="52" />
        <circle className={styles.track} cx="60" cy="60" r="56" />
        <circle className={styles.arc} cx="60" cy="60" r="56" data-intro="ring" />
        <path className={styles.cross} d="M60 0v9M60 111v9M0 60h9M111 60h9" />
      </svg>
      <span className={styles.letters}>{initials}</span>
    </div>
  )
}
