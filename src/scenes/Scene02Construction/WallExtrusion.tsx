import type { CSSProperties } from 'react'
import styles from './WallExtrusion.module.css'

/**
 * The apartment standing up out of its own floor plan.
 *
 * There is no model and no generated image here. The wall body is the plan's
 * own ink, closed into a solid and used as a mask, and the wall is a stack of
 * copies of that mask lifted along the board's normal with translateZ. The
 * browser applies the board's perspective to every copy, so the walls stand
 * exactly on the lines they were drawn as — registration is structural rather
 * than something measured and kept in sync.
 *
 * The stack reads as a solid because each copy sits a fraction of a pixel above
 * the last; --rise animates from zero, which is what makes the walls grow. The
 * roof is the same trick with one copy: the building's outline, held above the
 * walls and lowered onto them.
 */

/**
 * Copies in the stack. The count trades banding against compositing cost: at
 * full height the gap between copies has to stay under about two screen
 * pixels, which the slab's slight blur then closes.
 */
const SLABS = 46

export function WallExtrusion() {
  return (
    <div className={styles.walls} data-story-walls aria-hidden="true">
      {/* Cast onto the drawing, at the board's own level. */}
      <span className={`${styles.slab} ${styles.shade}`} style={{ '--i': 0 } as CSSProperties} />

      {Array.from({ length: SLABS }, (_, index) => (
        <span key={index} className={styles.slab} style={{ '--i': index } as CSSProperties} />
      ))}

      {/* The wall heads, a shade brighter than the body they cap. */}
      <span className={`${styles.slab} ${styles.cap}`} style={{ '--i': SLABS } as CSSProperties} />

      {/* The roof, lowered onto the finished walls. */}
      <span className={styles.roofShade} data-story-roof-shade />
      <span className={styles.roof} data-story-roof />
    </div>
  )
}
