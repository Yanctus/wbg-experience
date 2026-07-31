import { PAPER, PAPER_SIZE, PLAN_LAYERS } from '../../assets/manifest'
import styles from './Scene01Drawing.module.css'

/**
 * Scene 01 — the sheet of paper and the plan being drawn on it.
 *
 * The nesting is load-bearing and each wrapper has exactly one job, because
 * GSAP parses an existing `transform` (and the standalone `translate`/`rotate`
 * properties) into its own state: a static pose and an animated transform on
 * the same element makes GSAP absorb the pose and then animate it away.
 *
 *   .perspective  supplies the 3D camera for the tilt
 *     .tilt       rotateX only — scene 02 lays the board down
 *       .anchor   the static pose: size, centring, base rotation
 *         .camera the dive: scale and offset, growing the sheet past the frame
 *           .lift the calm 2.5D drift of scene 01
 *             .sheet + .plan
 */
export function Scene01Drawing() {
  return (
    <div className={styles.perspective} aria-hidden="true">
      <div className={styles.tilt} data-story-tilt>
        <div className={styles.anchor}>
          <div className={styles.camera} data-story-camera>
            <div className={styles.lift} data-story-lift>
              <div className={styles.sheet} data-story-sheet>
                <img
                  src={PAPER.sheet}
                  alt=""
                  width={PAPER_SIZE.width}
                  height={PAPER_SIZE.height}
                  decoding="async"
                  fetchPriority="high"
                />
              </div>

              {/*
                Scene 02 fades this in to turn the sheet into a presentation
                board: a flat, slightly brighter surface that covers the paper's
                texture while sitting *under* the drawing, so the plan stays on
                top of it. Cut to the sheet's own silhouette.
              */}
              <div className={styles.board} data-story-board />

              <div className={styles.plan} data-story-plan>
                {/*
                  One transparent layer per drawing stage. Each is revealed by a
                  feathered gradient mask driven by --draw, so the ink appears
                  progressively along the layer's own axis — the plan is drawn
                  rather than faded in.
                */}
                {PLAN_LAYERS.map((layer) => (
                  <img
                    key={layer.key}
                    className={styles.planLayer}
                    data-story-plan-layer={layer.key}
                    data-axis={layer.axis}
                    src={layer.src}
                    alt=""
                    width={PAPER_SIZE.width}
                    height={PAPER_SIZE.height}
                    decoding="async"
                  />
                ))}

                {/*
                  Three points in the plan's own coordinate space, marking the
                  drawn outline's centre and its two side mid-points. Scene 02
                  measures where they land on screen once the board is tilted
                  and stands the building on them, so the browser does the
                  perspective maths and the walls sit on the printed footprint
                  at any viewport.
                */}
                <span className={styles.probe} data-story-plan-centre />
                <span className={styles.probe} data-story-plan-left />
                <span className={styles.probe} data-story-plan-right />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
