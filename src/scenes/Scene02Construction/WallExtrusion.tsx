import type { CSSProperties } from 'react'
import styles from './WallExtrusion.module.css'

/**
 * The walls of the drawn apartment, standing up out of their own floor plan.
 *
 * There is no model and no generated image here: the wall body is the plan's
 * own ink, closed into a solid and used as a mask, and the wall is a stack of
 * copies of that mask lifted along the board's normal with translateZ. The
 * browser applies the board's perspective to every copy, so the walls stand
 * exactly on the lines they were drawn as — registration is structural rather
 * than something that has to be measured and kept in sync.
 *
 * The stack reads as a solid because each copy is a fraction of a pixel above
 * the last; --rise animates from zero, which is what makes them grow.
 */

/** Copies in the stack. Enough to read as a solid, few enough to composite. */
const SLABS = 26

export function WallExtrusion() {
  return (
    <div className={styles.walls} data-story-walls aria-hidden="true">
      {/* Cast onto the drawing, at the board's own level. */}
      <span className={`${styles.slab} ${styles.shade}`} style={{ '--i': 0 } as CSSProperties} />

      {Array.from({ length: SLABS }, (_, index) => (
        <span
          key={index}
          className={styles.slab}
          style={{ '--i': index } as CSSProperties}
        />
      ))}
      {/* The top surface, a shade brighter than the body it caps. */}
      <span className={`${styles.slab} ${styles.cap}`} style={{ '--i': SLABS } as CSSProperties} />
    </div>
  )
}
