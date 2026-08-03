import { useCallback, useEffect, useRef, useState } from 'react'
import { CRITICAL, PAPER, PAPER_SIZE, probeOptional, type OptionalKey } from '../../assets/manifest'
import { useStoryTimeline } from '../../hooks/useStoryTimeline'
import { Scene01Drawing } from '../../scenes/Scene01Drawing/Scene01Drawing'
import { Scene03Reality } from '../../scenes/Scene03Reality/Scene03Reality'
import { Header } from '../Header/Header'
import { ScrollIndicator } from '../ScrollIndicator/ScrollIndicator'
import { StaticStory } from './StaticStory'
import styles from './StoryExperience.module.css'

/** Hard ceiling for the loading state, so a failing asset can never trap the page. */
const LOADER_TIMEOUT_MS = 6000

const NO_OPTIONAL: ReadonlyMap<OptionalKey, string> = new Map()

/**
 * The whole story: one section, one pinned stage, one scrubbed timeline.
 *
 * Everything the visitor sees lives on this single stage, which is why the
 * sequence has no seams — there is no second scene to cut to. The paper, the
 * plan, the building and the world are layers of one composition, and scrolling
 * moves the one timeline that owns all of them.
 */
export function StoryExperience() {
  const rootRef = useRef<HTMLElement>(null)

  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)
  const [optional, setOptional] = useState<ReadonlyMap<OptionalKey, string>>(NO_OPTIONAL)

  useEffect(() => {
    let cancelled = false
    let settled = 0
    let probed = false

    /*
     * The stage is handed to the timeline only once the optional layers can be
     * mounted in the same commit: the timeline collects its targets by selector
     * while it is built, so a layer that appears one render later is missing
     * from it for good.
     */
    const start = () => {
      if (!cancelled && probed && settled >= CRITICAL.length) setReady(true)
    }

    const settle = () => {
      settled += 1
      if (cancelled) return
      setLoaded(settled)
      start()
    }

    // Resolve on error as well: a missing asset must not block the story.
    CRITICAL.forEach((src) => {
      const img = new Image()
      img.onload = settle
      img.onerror = settle
      img.src = src
    })

    probeOptional().then((found) => {
      if (cancelled) return
      probed = true
      setOptional(found)
      start()
    })

    const timeout = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, LOADER_TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  /* Rebuilds the choreography if the probe answers after the loader gave up. */
  const optionalKey = [...optional.keys()].sort().join(',')

  useStoryTimeline(rootRef, ready, optionalKey)

  const progress = Math.round((loaded / CRITICAL.length) * 100)

  return (
    <>
      <Loader progress={progress} ready={ready} />
      <Header />

      <section ref={rootRef} className={styles.story} aria-labelledby="story-title" id="top">
        <div className={styles.viewport} data-story-viewport>
          <div className={styles.stage} data-story-stage>
            {/* The room the sheet lies in. */}
            <div className={styles.room} data-story-room aria-hidden="true">
              <img
                src={PAPER.background}
                alt=""
                width={PAPER_SIZE.width}
                height={PAPER_SIZE.height}
                decoding="async"
                fetchPriority="high"
              />
            </div>

            <div className={styles.shadowAnchor} aria-hidden="true">
              <div className={styles.shadow} data-story-shadow>
                <img
                  src={PAPER.shadow}
                  alt=""
                  width={PAPER_SIZE.width}
                  height={PAPER_SIZE.height}
                  decoding="async"
                />
              </div>
            </div>

            <Scene01Drawing />
            <Scene03Reality available={optional} />

            {/* ------------------------------------------------ typography */}

            <div className={styles.content} data-story-content>
              {/*
                The opening line stands where the headline will stand, so the
                handover is a transformation in one place rather than a reflow.
                Both sentences open on the same two words: those words are split
                off so the first line can *become* the second — the tail leaves
                and the shared words travel up into the headline.
              */}
              <p className={styles.intro} data-story-intro>
                <span className={styles.introInner} data-story-intro-inner>
                  <span className={styles.introShared} data-story-intro-shared>
                    Jedes Zuhause
                  </span>
                  <span className={styles.introTail} data-story-intro-tail>
                    {' '}
                    war einmal nur eine Zeichnung.
                  </span>
                </span>
              </p>

              <p className={styles.eyebrow} data-story-eyebrow>
                WBG Mieterschutz eG
              </p>

              <h1 id="story-title" className={styles.title} data-story-title>
                <span className={styles.titleLine}>Jedes Zuhause</span>
                <span className={styles.titleLine}>beginnt mit</span>
                <span className={styles.titleLine}>einer Idee.</span>
              </h1>

              <p className={styles.subline} data-story-subline>
                Aus Planung entsteht Zuhause.
              </p>
            </div>

            {/* Arrives only as the white model completes. */}
            <div className={styles.act2} data-story-act2>
              <h2 className={styles.act2Title}>Aus einer Zeichnung entsteht Wirklichkeit.</h2>
            </div>

            {/* The closing thought, once the building is a place. */}
            <div className={styles.act3} data-story-act3>
              <h2 className={styles.act3Title}>
                Ein Gebäude wird erst durch Menschen zu einem Zuhause.
              </h2>
              <p className={styles.act3Body}>
                Wir schaffen Wohnraum, der bleibt. Für Nachbarschaften, die wachsen. Und für
                Menschen, die sich zuhause fühlen sollen.
              </p>
            </div>

            <ScrollIndicator />

            {/* ------------------------------------------------- atmosphere */}

            <div className={styles.light} data-story-light aria-hidden="true">
              <img
                src={PAPER.light}
                alt=""
                width={PAPER_SIZE.width}
                height={PAPER_SIZE.height}
                decoding="async"
              />
            </div>

            <div className={styles.grain} aria-hidden="true">
              <img
                src={PAPER.grain}
                alt=""
                width={PAPER_SIZE.width}
                height={PAPER_SIZE.height}
                decoding="async"
                loading="lazy"
              />
            </div>

            <div className={styles.dust} data-story-dust aria-hidden="true">
              <img
                src={PAPER.dust}
                alt=""
                width={PAPER_SIZE.width}
                height={PAPER_SIZE.height}
                decoding="async"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <StaticStory />
    </>
  )
}

type LoaderProps = {
  progress: number
  ready: boolean
}

/**
 * Plain loading state: no spinner, a label and a thin progress line. It is
 * removed only after its fade-out finished, so the stage underneath never jumps.
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
