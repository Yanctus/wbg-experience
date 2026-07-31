import { BUILDING_SIZE, type OptionalKey } from '../../assets/manifest'
import styles from './Scene03Reality.module.css'

type Props = {
  /** The optional assets that are actually on disk, keyed by role. */
  available: ReadonlyMap<OptionalKey, string>
}

/**
 * Scene 03 — the model becomes a place.
 *
 * Every layer here is optional. The photoreal master and the environment are
 * generated assets that may not exist yet, and mounting a broken image would
 * be worse than mounting nothing: without them the story still resolves — the
 * white model holds, the board recedes and the light warms — and the moment
 * the files land they are picked up with no code change.
 *
 * The layers are probed by the parent so they mount in the same commit the
 * timeline is built in; a layer that appears one render later would never be
 * part of the timeline at all.
 */
export function Scene03Reality({ available }: Props) {
  const src = (key: OptionalKey) => available.get(key)

  return (
    <div className={styles.scene} data-story-reality aria-hidden="true">
      {/* Far plane — moves least under the forward glide. */}
      {src('backdrop') && (
        <div className={styles.backdrop} data-story-backdrop>
          <img src={src('backdrop')} alt="" decoding="async" loading="lazy" />
        </div>
      )}

      {/*
        The building's own plane. Same box and same footprint anchor as the
        white model in scene 02, so the material change cannot move the camera.
      */}
      <div className={styles.building} data-story-real-anchor>
        {src('buildingShadow') && (
          <div className={styles.layer} data-story-real-shadow>
            <img
              src={src('buildingShadow')}
              alt=""
              width={BUILDING_SIZE.width}
              height={BUILDING_SIZE.height}
              decoding="async"
              loading="lazy"
            />
          </div>
        )}

        {src('photoreal') && (
          <div className={`${styles.layer} ${styles.material}`} data-story-photoreal>
            <img
              src={src('photoreal')}
              alt=""
              width={BUILDING_SIZE.width}
              height={BUILDING_SIZE.height}
              decoding="async"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Near plane — moves most, and passes the viewer as they enter. */}
      {src('foreground') && (
        <div className={styles.foreground} data-story-foreground>
          <img src={src('foreground')} alt="" decoding="async" loading="lazy" />
        </div>
      )}

      {/* Daylight warming over the finished world. */}
      <div className={styles.daylight} data-story-daylight />
    </div>
  )
}
