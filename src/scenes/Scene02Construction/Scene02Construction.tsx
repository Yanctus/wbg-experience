import { BUILDING, BUILDING_SIZE } from '../../assets/manifest'
import styles from './Scene02Construction.module.css'

/**
 * Scene 02 — the building growing out of the plan.
 *
 * Two versions of the same master, stacked in register: the line drawing that
 * is built floor by floor, and the white model that takes over from it. They
 * are the same silhouette at the same size — the white one is derived from the
 * other's own alpha channel — so the handover cannot shift the geometry.
 *
 * Both are positioned by the plan itself: the timeline measures where the drawn
 * outline lands on screen once the board is tilted and writes it here.
 */
export function Scene02Construction() {
  return (
    <div className={styles.scene} data-story-building-scene aria-hidden="true">
      <div className={styles.building} data-story-building>
        {/*
          The ground the building stands on once the presentation board has
          gone. Drawn rather than generated — a soft ellipse under the footprint
          is all it takes to stop the model from floating, and it costs neither
          an asset nor a request. It sits under both building layers, which is
          why it lives here rather than in the scene that fades it in.
        */}
        <div className={styles.ground} data-story-ground />

        <div className={`${styles.layer} ${styles.rise}`} data-story-wireframe>
          <img
            src={BUILDING.wireframe}
            alt=""
            width={BUILDING_SIZE.width}
            height={BUILDING_SIZE.height}
            decoding="async"
            loading="lazy"
          />
        </div>

        <div className={`${styles.layer} ${styles.rise}`} data-story-white>
          <img
            src={BUILDING.white}
            alt=""
            width={BUILDING_SIZE.width}
            height={BUILDING_SIZE.height}
            decoding="async"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
