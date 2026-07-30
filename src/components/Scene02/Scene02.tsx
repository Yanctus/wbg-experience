/**
 * Scene 02 — the building is constructed out of the fullscreen floor plan.
 *
 * The plan is not a backdrop that scene 02 sits in front of: after the dive it
 * *is* the world, filling the viewport. Scene 02's layers are placed on top of
 * it at their natural resolution, so they stay sharp instead of being scaled up
 * with the sheet, and the plan stays faintly visible underneath the whole way.
 *
 * Layers are mounted only once their file is actually present (see ./assets.ts),
 * so the sequence degrades to "plan only" rather than to broken images.
 */
import { EXPECTED_SIZE } from './assets'
import type { Scene02AssetKey } from './assets'
import styles from './Scene02.module.css'

type Scene02Props = {
  /**
   * Which assets exist. Probed by the parent rather than here, and for a
   * structural reason: the scroll animation looks these layers up by selector
   * when it is built, so a layer that mounts later than the timeline simply is
   * not in it — the building never appears and the whole construction half of
   * the sequence silently does nothing. Probing upstream keeps mount and
   * timeline build in the same commit.
   */
  available: ReadonlyMap<Scene02AssetKey, string>
}

export function Scene02({ available }: Scene02Props) {
  const src = (key: Scene02AssetKey) => available.get(key)

  return (
    <div className={styles.scene} data-scene-02 aria-hidden="true">
      {/*
        One transform target for the whole building, so the slight rise and
        scale that makes it look like it is lifting out of the drawing applies
        to every layer at once and they never drift apart.
      */}
      <div className={styles.building} data-scene-02-building>
        {/* Contact shadow, grounding the building on the plan. */}
        {src('shadow') && (
          <div className={styles.layer} data-scene-02-shadow>
            <img
              src={src('shadow')}
              alt=""
              width={EXPECTED_SIZE.width}
              height={EXPECTED_SIZE.height}
              decoding="async"
            />
          </div>
        )}

        {/* Solid massing — not part of this sequence yet, ready for the next. */}
        {src('solid') && (
          <div className={styles.layer} data-scene-02-solid>
            <img
              src={src('solid')}
              alt=""
              width={EXPECTED_SIZE.width}
              height={EXPECTED_SIZE.height}
              decoding="async"
            />
          </div>
        )}

        {/*
          The wireframe carries the construction sequence. Its mask is a
          soft-edged gradient driven by --reveal, so the storeys rise out of the
          plan behind a feathered edge instead of a hard clipping line.
        */}
        {src('wireframe') && (
          <div className={`${styles.layer} ${styles.reveal}`} data-scene-02-wireframe>
            <img
              src={src('wireframe')}
              alt=""
              width={EXPECTED_SIZE.width}
              height={EXPECTED_SIZE.height}
              decoding="async"
            />
          </div>
        )}

        {/* Axes and annotations — ready for the next stage of the story. */}
        {src('constructionLines') && (
          <div className={`${styles.layer} ${styles.reveal}`} data-scene-02-lines>
            <img
              src={src('constructionLines')}
              alt=""
              width={EXPECTED_SIZE.width}
              height={EXPECTED_SIZE.height}
              decoding="async"
            />
          </div>
        )}
      </div>
    </div>
  )
}
