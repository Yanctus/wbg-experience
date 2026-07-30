/**
 * Scene 02 — begins on the enlarged blueprint left behind by the dive.
 *
 * The blueprint is not a backdrop that scene 02 sits in front of: it *is* the
 * world at this point, filling the viewport. Scene 02's own layers are placed
 * on top of it at their natural resolution, so they stay sharp instead of being
 * scaled up with the sheet.
 *
 * The four building assets do not exist yet, so the layers below are empty,
 * correctly stacked placeholders — deliberately with no stand-in graphics. See
 * ./assets.ts for the manifest and the flag that switches them on.
 */
import { ASSETS_READY, EXPECTED_SIZE, SCENE_02_ASSETS } from './assets'
import styles from './Scene02.module.css'

export function Scene02() {
  return (
    <div className={styles.scene} data-scene-02 aria-hidden="true">
      {/* 1 — contact shadow */}
      <div className={styles.layer} data-scene-02-shadow>
        {ASSETS_READY && (
          <img
            src={SCENE_02_ASSETS.shadow}
            alt=""
            width={EXPECTED_SIZE.width}
            height={EXPECTED_SIZE.height}
            decoding="async"
          />
        )}
      </div>

      {/* 2 — solid massing */}
      <div className={styles.layer} data-scene-02-solid>
        {ASSETS_READY && (
          <img
            src={SCENE_02_ASSETS.solid}
            alt=""
            width={EXPECTED_SIZE.width}
            height={EXPECTED_SIZE.height}
            decoding="async"
          />
        )}
      </div>

      {/* 3 — wireframe */}
      <div className={styles.layer} data-scene-02-wireframe>
        {ASSETS_READY && (
          <img
            src={SCENE_02_ASSETS.wireframe}
            alt=""
            width={EXPECTED_SIZE.width}
            height={EXPECTED_SIZE.height}
            decoding="async"
          />
        )}
      </div>

      {/* 4 — construction lines and annotations */}
      <div className={styles.layer} data-scene-02-lines>
        {ASSETS_READY && (
          <img
            src={SCENE_02_ASSETS.constructionLines}
            alt=""
            width={EXPECTED_SIZE.width}
            height={EXPECTED_SIZE.height}
            decoding="async"
          />
        )}
      </div>
    </div>
  )
}
