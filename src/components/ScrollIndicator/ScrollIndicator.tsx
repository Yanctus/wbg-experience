import styles from './ScrollIndicator.module.css'

/**
 * The invitation to scroll: a label, a hairline and a single dot travelling it.
 * No arrow, no bounce — it should read as an instruction to a reader, not as a
 * button. It is gone long before the sheet grows into its place.
 */
export function ScrollIndicator() {
  return (
    <div className={styles.hint} data-story-hint>
      <span className={styles.inner} data-story-hint-inner>
        <span className={styles.label}>Geschichte entdecken</span>
        <span className={styles.line} data-story-hint-line>
          <span className={styles.dot} data-story-hint-dot />
        </span>
      </span>
    </div>
  )
}
