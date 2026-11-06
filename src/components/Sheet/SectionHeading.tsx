import type { ReactNode } from 'react'
import styles from './SectionHeading.module.css'

interface SectionHeadingProps {
  id: string
  /** Laufende Blattnummer wie bei Plänen („02“). Sprachneutral, daher nicht übersetzt. */
  index: string
  children: ReactNode
}

export function SectionHeading({ id, index, children }: SectionHeadingProps) {
  return (
    <h2 id={id} className={styles.heading}>
      <span className={styles.index} aria-hidden="true">
        {index}
      </span>
      <span className={styles.text}>{children}</span>
      <span className={styles.rule} aria-hidden="true" data-rule />
    </h2>
  )
}
