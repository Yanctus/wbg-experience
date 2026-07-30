import { useCallback, useEffect, useRef, useState } from 'react'
import { Scene02 } from '../Scene02/Scene02'
import { useScene01Animation } from '../../hooks/useScene01Animation'
import styles from './Scene01.module.css'

/**
 * Decorative layers of the scene, in paint order (back to front).
 * The paths are also used for preloading, so every asset is requested exactly
 * once — the <img> tags below reuse the very same URLs from the HTTP cache.
 */
const ASSETS = {
  background: '/assets/scene-01/background_paper_base.png',
  shadow: '/assets/scene-01/shadow_soft_paper.png',
  paper: '/assets/scene-01/paper_sheet_main.png',
  blueprint: '/assets/scene-01/blueprint_master.png',
  light: '/assets/scene-01/light_overlay_soft_top_left.png',
  grain: '/assets/scene-01/grain_overlay.png',
  dust: '/assets/scene-01/dust_particles_overlay.png',
} as const

const ASSET_LIST = Object.values(ASSETS)

/** Hard ceiling for the loading state so a failing asset can never trap the page. */
const LOADER_TIMEOUT_MS = 6000

const NATURAL_WIDTH = 1536
const NATURAL_HEIGHT = 1024

export function Scene01() {
  const rootRef = useRef<HTMLElement>(null)

  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let settled = 0

    const settle = () => {
      settled += 1
      if (cancelled) return
      setLoaded(settled)
      if (settled >= ASSET_LIST.length) setReady(true)
    }

    // Resolve on error as well: a missing asset must not block the scene.
    ASSET_LIST.forEach((src) => {
      const img = new Image()
      img.onload = settle
      img.onerror = settle
      img.src = src
    })

    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, LOADER_TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useScene01Animation(rootRef, ready)

  const progress = Math.round((loaded / ASSET_LIST.length) * 100)

  return (
    <>
      <Loader progress={progress} ready={ready} />

      <section ref={rootRef} className={styles.scene} aria-labelledby="scene01-title">
        <div className={styles.viewport} data-scene-viewport>
          <div className={styles.stage} data-scene-stage>
            {/* 1 — paper background, fills the viewport */}
            <div className={styles.background} data-scene-background aria-hidden="true">
              <img
                src={ASSETS.background}
                alt=""
                width={NATURAL_WIDTH}
                height={NATURAL_HEIGHT}
                decoding="async"
                fetchPriority="high"
              />
            </div>

            {/* 2 — soft shadow, sits below the sheet and moves on its own */}
            <div className={styles.shadowAnchor} aria-hidden="true">
              <div className={styles.shadow} data-scene-shadow>
                <img
                  src={ASSETS.shadow}
                  alt=""
                  width={NATURAL_WIDTH}
                  height={NATURAL_HEIGHT}
                  decoding="async"
                />
              </div>
            </div>

            {/* 3 + 4 — sheet and blueprint share one transform so they stay locked together */}
            <div className={styles.paperPerspective} aria-hidden="true">
              {/*
                Scene 02 tilts the whole sheet back into a presentation angle.
                .paperBoard supplies the perspective for that move and .paperTilt
                is its sole transform target, so the tilt composes with — rather
                than fights — the dive's camera and scene 01's 2.5D pose. Both
                start untransformed, so nothing before scene 02 is affected.
              */}
              <div className={styles.paperBoard}>
                <div className={styles.paperTilt} data-scene-tilt>
                  {/*
                    The anchor holds the static pose. GSAP is the sole writer of
                    .paperStage's transform — sharing one element would make GSAP
                    absorb the centring offset and then animate it away.
                  */}
                  <div className={styles.paperAnchor} data-scene-paper-anchor>
                {/* The dive's camera — see useScene01Animation. */}
                <div className={styles.paperCamera} data-scene-camera>
                  <div className={styles.paperStage} data-scene-paper-stage>
                    <div className={styles.paperParallax} data-scene-paper-parallax>
                      <div className={styles.paper} data-scene-paper>
                        <img
                          src={ASSETS.paper}
                          alt=""
                          width={NATURAL_WIDTH}
                          height={NATURAL_HEIGHT}
                          decoding="async"
                          fetchPriority="high"
                        />
                      </div>

                      {/*
                        Scene 02 fades this in to turn the sheet into a clean
                        presentation board: it covers the paper texture and its
                        imperfections with a flat, slightly brighter surface,
                        while sitting *under* the printed plan so the drawing
                        stays on top of it.
                      */}
                      <div className={styles.boardSurface} data-scene-board-surface />

                      {/*
                        One element carries the reveal, the opacity and the
                        multiply blend. Nesting those in separate wrappers would
                        create an extra stacking context and isolate the blend
                        from the sheet, which makes the plan show up as a bright
                        rectangle.
                      */}
                      <div className={styles.blueprint} data-scene-blueprint>
                        <img
                          src={ASSETS.blueprint}
                          alt=""
                          width={NATURAL_WIDTH}
                          height={NATURAL_HEIGHT}
                          decoding="async"
                        />

                        {/*
                          Probes marking the drawn building's outline, living in
                          the plan's own coordinate space. Scene 02 measures where
                          these three points land on screen once the board is
                          tilted, and places the wireframe on them — so the walls
                          stand on the printed footprint at any viewport, and the
                          browser does the perspective maths for us.
                        */}
                        <span className={styles.planProbe} data-scene-plan-centre />
                        <span className={styles.planProbe} data-scene-plan-left />
                        <span className={styles.planProbe} data-scene-plan-right />
                      </div>

                      {/*
                        Scene 02's wall emphasis. It lives here, as a sibling of
                        the plan inside the camera, because it has to stay
                        pixel-registered with the plan through the dive's
                        rotation and 2.25x scale — the same asset, the same box,
                        the same rotation, so registration is structural rather
                        than something that has to be kept in sync.
                      */}
                      <div className={styles.wallGlow} data-scene-wall-glow>
                        <img
                          src={ASSETS.blueprint}
                          alt=""
                          width={NATURAL_WIDTH}
                          height={NATURAL_HEIGHT}
                          decoding="async"
                        />
                        <span className={styles.wallGlowTint} />
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 — typography */}
            <div className={styles.content} data-scene-content>
              {/*
                The opening line. It occupies the headline's own optical
                position and is absolutely placed, so handing over to the
                headline is a cross-fade in one spot rather than a reflow.
                The inner span carries the load-in so the scroll-out on the
                outer element can never fight it for the same property.
              */}
              <p className={styles.intro} data-scene-intro>
                <span className={styles.introInner} data-scene-intro-inner>
                  {/*
                    Both sentences open on the same two words. Splitting them
                    off is what lets the opening line *become* the headline:
                    the tail leaves, and these words travel up into the
                    headline's first line rather than being swapped for it.
                  */}
                  <span className={styles.introShared} data-scene-intro-shared>
                    Jedes Zuhause
                  </span>
                  <span className={styles.introTail} data-scene-intro-tail>
                    {' '}
                    war einmal nur eine Zeichnung.
                  </span>
                </span>
              </p>

              <p className={styles.eyebrow} data-scene-eyebrow>
                WBG Mieterschutz eG
              </p>

              <h1 id="scene01-title" className={styles.title} data-scene-title>
                <span className={styles.titleLine}>Jedes Zuhause</span>
                <span className={styles.titleLine}>beginnt mit</span>
                <span className={styles.titleLine}>einer Idee.</span>
              </h1>

              <p className={styles.subline} data-scene-subline>
                Aus Planung entsteht Zuhause.
              </p>
            </div>

            {/*
              Scroll affordance. A label, a hairline and a single dot that
              travels it — no arrow, no bounce. It sits above the sheet because
              it is an invitation to act, and it is gone before the sheet ever
              reaches it.
            */}
            <div className={styles.scrollHint} data-scene-hint>
              <span className={styles.scrollHintInner} data-scene-hint-inner>
                <span className={styles.scrollHintLabel}>Geschichte entdecken</span>
                <span className={styles.scrollHintLine} data-scene-hint-line>
                  <span className={styles.scrollHintDot} data-scene-hint-dot />
                </span>
              </span>
            </div>

            {/* 6 — scene 02 grows on the enlarged blueprint */}
            <Scene02 />

            {/* 7 — warm light from the top left */}
            <div className={styles.light} data-scene-light aria-hidden="true">
              <img
                src={ASSETS.light}
                alt=""
                width={NATURAL_WIDTH}
                height={NATURAL_HEIGHT}
                decoding="async"
              />
            </div>

            {/* 8 — paper grain */}
            <div className={styles.grain} aria-hidden="true">
              <img
                src={ASSETS.grain}
                alt=""
                width={NATURAL_WIDTH}
                height={NATURAL_HEIGHT}
                decoding="async"
              />
            </div>

            {/* 9 — dust */}
            <div className={styles.dust} data-scene-dust aria-hidden="true">
              <img
                src={ASSETS.dust}
                alt=""
                width={NATURAL_WIDTH}
                height={NATURAL_HEIGHT}
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

type LoaderProps = {
  progress: number
  ready: boolean
}

/**
 * Plain loading state: no spinner, just a label and a thin progress line.
 * It is removed from the DOM only after its fade-out finished, so the scene
 * underneath never jumps.
 */
function Loader({ progress, ready }: LoaderProps) {
  const [hidden, setHidden] = useState(false)

  const handleTransitionEnd = useCallback(() => {
    if (ready) setHidden(true)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    // Fallback in case the browser skips the transition (e.g. reduced motion).
    const timeout = window.setTimeout(() => setHidden(true), 1200)
    return () => window.clearTimeout(timeout)
  }, [ready])

  if (hidden) return null

  return (
    <div
      className={styles.loader}
      data-ready={ready ? 'true' : 'false'}
      onTransitionEnd={handleTransitionEnd}
      role="status"
      aria-live="polite"
    >
      <p className={styles.loaderLabel}>Szene wird vorbereitet</p>
      <div className={styles.loaderTrack}>
        <span className={styles.loaderBar} style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <p className={styles.loaderValue}>{progress}%</p>
    </div>
  )
}
