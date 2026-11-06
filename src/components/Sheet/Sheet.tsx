import type { HTMLAttributes } from 'react'
import styles from './Sheet.module.css'

interface SheetProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside'
  /** Opt-in: Karte neigt sich leicht zum Mauszeiger (siehe useProfileAnimation). */
  tilt?: boolean
}

/**
 * Eine „Pergamentkarte“: halbtransparentes Transparentpapier über dem Plan,
 * mit Haarlinie, weichem Schatten und Schnittmarken an den Ecken.
 */
export function Sheet({ as: Tag = 'section', tilt = false, className, children, ...rest }: SheetProps) {
  return (
    <Tag
      className={className ? `${styles.sheet} ${className}` : styles.sheet}
      data-tilt={tilt ? '' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
