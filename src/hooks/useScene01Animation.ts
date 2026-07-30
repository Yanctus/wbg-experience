import { useEffect } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { buildScene02Intro } from './useScene02Animation'

/**
 * ScrollTrigger is part of the `gsap` package and must never be installed
 * separately. Registration happens once at module scope; the guard keeps a
 * second evaluation (HMR, multiple importers) from re-registering the plugin.
 */
let pluginsRegistered = false

if (!pluginsRegistered) {
  gsap.registerPlugin(ScrollTrigger)
  pluginsRegistered = true
}

/** Maximum mouse offsets in pixels, per the scene spec. */
const MOUSE_RANGE = {
  paper: 4,
  /* The blueprint rides inside the sheet, so it only adds the difference. */
  blueprintExtra: 2,
  light: 8,
}

/**
 * Media conditions. Everything motion-related is expressed here so that
 * gsap.matchMedia can build, tear down and rebuild the right variant whenever
 * the viewport or the user's motion preference changes.
 */
const CONDITIONS = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  compact: '(max-width: 720px)',
  canParallax: '(min-width: 1025px) and (hover: hover) and (pointer: fine)',
}

/**
 * Geometry measured from paper_sheet_main.png itself (see the traced polygon in
 * Scene01.module.css). The sheet is not axis-aligned in its own image and not
 * even a true rectangle — the top edge sits at +4.4°, the bottom at +7.4° — so
 * these are its four actual corners as fractions of the image box.
 */
const SHEET_CORNERS = [
  { x: 0.1616, y: 0.0545 },
  { x: 0.9264, y: 0.1431 },
  { x: 0.8834, y: 0.9179 },
  { x: 0.0697, y: 0.7601 },
]

/** Rotation of the plan inside blueprint_master.png's frame. */
const BLUEPRINT_ROTATION = 4.4

/** The camera's transform-origin, matching .paperCamera's transform-origin. */
const CAMERA_ORIGIN = { x: 0.495, y: 0.48 }

/**
 * Safety margin on top of the exact covering scale — absorbs sub-pixel
 * rounding and the deckled edge's few pixels of raggedness, which the traced
 * polygon smooths over.
 */
const DIVE_OVERFILL = 1.04

/**
 * Smallest scale at which the sheet, rotated to its final angle, completely
 * contains the viewport.
 *
 * A bounding-box calculation is not enough here: the sheet ends up a rotated
 * trapezoid, so scaling until its *box* covers the viewport still leaves the
 * corners short and a sliver of desk shows through. This works on the real
 * silhouette instead — for every edge of the quad it asks how far that edge has
 * to be pushed out to clear the furthest viewport corner, and takes the worst
 * case.
 */
function sheetCoverScale(boxWidth: number, boxHeight: number, vw: number, vh: number): number {
  /*
   * Corner offsets from the camera's transform-origin, rotated by the sheet's
   * final angle. The camera's rotation is defined to cancel the anchor's, so
   * what is left is always the plan's own -4.4°, whatever the breakpoint.
   */
  const theta = (-BLUEPRINT_ROTATION * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const corners = SHEET_CORNERS.map(({ x, y }) => {
    const ux = (x - CAMERA_ORIGIN.x) * boxWidth
    const uy = (y - CAMERA_ORIGIN.y) * boxHeight
    return { x: ux * cos - uy * sin, y: ux * sin + uy * cos }
  })

  /* Viewport corners, relative to the origin's final resting point (its centre). */
  const half = [
    { x: -vw / 2, y: -vh / 2 },
    { x: vw / 2, y: -vh / 2 },
    { x: vw / 2, y: vh / 2 },
    { x: -vw / 2, y: vh / 2 },
  ]

  let required = 1

  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i]
    const b = corners[(i + 1) % corners.length]

    /* Inward normal of this edge (the quad is wound clockwise in screen space). */
    let nx = -(b.y - a.y)
    let ny = b.x - a.x
    const length = Math.hypot(nx, ny)
    if (!length) continue
    nx /= length
    ny /= length

    /* Distance from the origin to the edge; flip the normal if it points out. */
    let distance = nx * a.x + ny * a.y
    if (distance < 0) {
      nx = -nx
      ny = -ny
      distance = -distance
    }
    if (distance <= 0) continue

    for (const corner of half) {
      required = Math.max(required, (nx * corner.x + ny * corner.y) / distance)
    }
  }

  return required
}

/**
 * Diagonal wipe used to reveal the blueprint. The top edge runs ahead of the
 * bottom edge, so the plan appears from the top left towards the bottom right —
 * closer to a plan being drawn than a plain opacity fade.
 */
function diagonalClip(progress: number): string {
  const lag = 45
  const x = -30 + progress * (160 + lag)
  return `polygon(-30% -30%, ${x}% -30%, ${x - lag}% 130%, -30% 130%)`
}

/** Reads a `<number>vh` custom property, falling back if it is absent. */
function readLength(styles: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(styles.getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

export function useScene01Animation(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || !enabled) return

    const mm = gsap.matchMedia()
    const q = gsap.utils.selector(root)
    const pick = (selector: string) => q(selector)[0] as HTMLElement | undefined

    mm.add(CONDITIONS, (context) => {
      const { motion, reduced, compact, canParallax } = context.conditions as Record<
        keyof typeof CONDITIONS,
        boolean
      >

      const background = pick('[data-scene-background]')
      const shadow = pick('[data-scene-shadow]')
      const camera = pick('[data-scene-camera]')
      const paperStage = pick('[data-scene-paper-stage]')
      const paperParallax = pick('[data-scene-paper-parallax]')
      const blueprint = pick('[data-scene-blueprint]')
      const eyebrow = pick('[data-scene-eyebrow]')
      const title = pick('[data-scene-title]')
      const subline = pick('[data-scene-subline]')
      const light = pick('[data-scene-light]')
      const viewport = pick('[data-scene-viewport]')
      const paperAnchor = pick('[data-scene-paper-anchor]')
      const intro = pick('[data-scene-intro]')
      const introInner = pick('[data-scene-intro-inner]')
      const introShared = pick('[data-scene-intro-shared]')
      const introTail = pick('[data-scene-intro-tail]')
      const hint = pick('[data-scene-hint]')
      const hintInner = pick('[data-scene-hint-inner]')
      const hintLine = pick('[data-scene-hint-line]')
      const hintDot = pick('[data-scene-hint-dot]')

      const titleLines = title ? Array.from(title.children) : []
      const texts = [eyebrow, subline].filter(Boolean) as HTMLElement[]

      /*
       * Reduced motion: everything is shown in its final, readable state.
       * No pinning, no scrubbing, no dive, no parallax. The scene is also
       * collapsed to a single viewport height in CSS.
       */
      if (reduced || !motion) {
        gsap.set([intro, hint].filter(Boolean), { autoAlpha: 0 })
        gsap.set([...texts, title].filter(Boolean), { opacity: 1, y: 0 })
        gsap.set(titleLines, { opacity: 1, y: 0 })
        if (blueprint) gsap.set(blueprint, { clipPath: 'none', opacity: 1 })
        return
      }

      /* ------------------------------------------------ initial state */

      gsap.set(texts, { opacity: 0, y: 18 })
      gsap.set(titleLines, { opacity: 0, y: 20 })
      if (title) gsap.set(title, { opacity: 1 })
      if (blueprint) gsap.set(blueprint, { clipPath: diagonalClip(0), opacity: 0.06 })
      /*
       * The shadow blob sits in the middle of its frame, so it has to be pushed
       * well below the sheet to read as a cast shadow instead of hiding behind
       * it. GSAP is the only writer of this transform — the CSS side positions
       * the anchor, never the animated element.
       */
      if (shadow) gsap.set(shadow, { opacity: 0.3, xPercent: 1.5, yPercent: 19, scale: 1.06 })

      /*
       * ------------------------------------------------------ the opening
       *
       * A short, time-based arrival before any scrolling: the sheet is already
       * there, then the line settles onto it, then the invitation to scroll.
       * Staggered so the reader's eye lands on the paper first and the words
       * second — the drawing is the subject, the sentence introduces it.
       *
       * These animate the *inner* elements. The scroll timeline animates the
       * outer ones, so the arrival and the departure can never contend for the
       * same property on the same element.
       */
      if (introInner) gsap.set(introInner, { opacity: 0, y: 14 })
      if (hintInner) gsap.set(hintInner, { opacity: 0, y: 8 })

      const titleLine1 = titleLines[0] as HTMLElement | undefined

      /*
       * The opening line becomes the headline.
       *
       * Both sentences start on "Jedes Zuhause", so instead of trading one
       * block of text for another, the tail leaves and those two words travel
       * up into the headline's first line and grow to its size. The handover is
       * then a 0.2s cross-fade between two identical words sitting in the same
       * place — which reads as the sentence resolving into the headline rather
       * than as a swap.
       *
       * The geometry is measured, not assumed: the target line is in the DOM at
       * opacity 0, so it already has its final position, and the deltas are
       * function-based so they are read when the move begins — after any layout
       * settling, and correct at whatever size the window happens to be.
       */
      const arrival = gsap.timeline({ defaults: { ease: 'power2.out' } })

      if (introInner) {
        /* After the loader's own 700ms veil has lifted, not behind it. */
        arrival.to(introInner, { opacity: 1, y: 0, duration: 1.3 }, 0.8)
      }
      if (hintInner) {
        arrival.to(hintInner, { opacity: 1, y: 0, duration: 1.1 }, 1.9)
      }

      /* Roughly 2.3s of stillness on the sentence before it starts to move. */
      const HOLD_UNTIL = 4.4

      if (introTail) {
        arrival.to(introTail, { opacity: 0, duration: 0.75, ease: 'power2.inOut' }, HOLD_UNTIL)
      }

      if (introShared && titleLine1) {
        /*
         * The headline's first line is parked 20px low until it takes over, so
         * its live rect is *not* where the words have to land. Both rects are
         * therefore corrected by whatever transform GSAP currently holds on the
         * element, which gives the two resting boxes — the only pair whose
         * difference is the actual travel.
         */
        const restingRect = (el: HTMLElement) => {
          const rect = el.getBoundingClientRect()
          const dx = Number(gsap.getProperty(el, 'x')) || 0
          const dy = Number(gsap.getProperty(el, 'y')) || 0
          return { left: rect.left - dx, top: rect.top - dy, height: rect.height }
        }

        const measure = () => ({
          from: restingRect(introShared),
          to: restingRect(titleLine1),
        })

        arrival.to(
          introShared,
          {
            x: () => {
              const { from, to } = measure()
              return to.left - from.left
            },
            y: () => {
              const { from, to } = measure()
              return to.top + to.height / 2 - (from.top + from.height / 2)
            },
            scale: () => {
              const a = Number.parseFloat(getComputedStyle(introShared).fontSize)
              const b = Number.parseFloat(getComputedStyle(titleLine1).fontSize)
              return a > 0 ? b / a : 1
            },
            duration: 1.35,
            ease: 'power2.inOut',
          },
          HOLD_UNTIL + 0.35,
        )

        /*
         * The swap, once the travel has actually landed — 0.35s of lead-in plus
         * 1.35s of travel. Cross-fading any earlier trades the words over while
         * they are still short of the target, which lands as a visible jump.
         */
        const LANDED = HOLD_UNTIL + 1.7
        /*
         * The first line takes over in place: it drops its 20px offset before
         * the cross-fade rather than sliding it off during it, which would make
         * the two copies drift apart in exactly the moment they are both
         * visible. Lines two and three keep the offset — they arrive later.
         */
        arrival.set(titleLine1, { y: 0 }, LANDED)
        arrival.to(titleLine1, { opacity: 1, duration: 0.24, ease: 'none' }, LANDED)
        arrival.to(introShared, { opacity: 0, duration: 0.24, ease: 'none' }, LANDED)
      }

      /* The rest of the headline settles in behind the line that just arrived. */
      if (titleLines.length > 1) {
        arrival.to(
          titleLines.slice(1),
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out', stagger: 0.14 },
          HOLD_UNTIL + 1.84,
        )
      }
      if (eyebrow) {
        arrival.to(eyebrow, { opacity: 1, y: 0, duration: 0.9 }, HOLD_UNTIL + 1.72)
      }

      /*
       * The sheet breathes almost imperceptibly until the reader takes over.
       * It rides on .paperParallax, which owns only x and y for the mouse, so
       * nothing else is writing scale on that element.
       */
      const ambient: gsap.core.Timeline[] = []

      if (paperParallax) {
        ambient.push(
          gsap.timeline({ repeat: -1, yoyo: true }).to(paperParallax, {
            scale: 1.0038,
            duration: 6.5,
            ease: 'sine.inOut',
          }),
        )
      }

      /*
       * The dot travels the hairline once, fades, and begins again after a
       * pause — slow enough to read as an invitation rather than a signal.
       */
      if (hintDot && hintLine) {
        const travel = hintLine.offsetHeight - hintDot.offsetHeight
        ambient.push(
          gsap
            .timeline({ repeat: -1, repeatDelay: 1 })
            .fromTo(
              hintDot,
              { y: 0, opacity: 0 },
              { opacity: 1, duration: 0.6, ease: 'power1.out' },
              0,
            )
            .to(hintDot, { y: travel, duration: 2.6, ease: 'power1.inOut' }, 0)
            .to(hintDot, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 2),
        )
      }

      /* Depth is dialled right back on phones: no rotateX at all there. */
      const depth = compact ? 0 : 1

      /* ------------------------------------ where each stretch begins */

      const sceneStyles = getComputedStyle(root)
      const l1 = readLength(sceneStyles, '--scene-01-length', 350)
      const lDive = readLength(sceneStyles, '--transition-length', 190)
      const l2 = readLength(sceneStyles, '--scene-02-length', 90)
      const total = l1 + lDive + l2

      const scene01Share = l1 / total
      const diveShare = lDive / total
      const scene02Share = l2 / total

      /* ------------------------------------------- dive measurements */

      const anchorRotation = Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--paper-rotate'),
      )
      const baseRotation = Number.isFinite(anchorRotation) ? anchorRotation : -1.4

      /*
       * Measures the plan's resting geometry with every GSAP-written transform
       * temporarily cleared. Without that the values would be read through
       * whatever the timeline last rendered, and the dive would aim at a moving
       * target. The anchor's own `translate`/`rotate` are standalone properties
       * and stay applied — they are part of the pose we want to measure against.
       */
      const measureAtRest = () => {
        const animated = [camera, paperStage, paperParallax, blueprint].filter(
          Boolean,
        ) as HTMLElement[]
        const saved = animated.map((el) => el.style.transform)
        animated.forEach((el) => {
          el.style.transform = 'none'
        })

        const rect = blueprint?.getBoundingClientRect()
        const boxWidth = paperAnchor?.offsetWidth ?? 0
        const boxHeight = paperAnchor?.offsetHeight ?? 0

        animated.forEach((el, index) => {
          el.style.transform = saved[index]
        })

        return {
          /* Centre of the plan, which is also the camera's transform-origin. */
          centreX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          centreY: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
          boxWidth,
          boxHeight,
        }
      }

      /*
       * How far scene 02 has to pull the sheet back so the tilted board lands
       * inside the frame with its edges visible.
       *
       * It has to be computed, not a fixed factor: the dive's own covering scale
       * depends on the viewport's aspect (about 2.5x on a wide screen but over
       * 4x on a tall phone), so a constant would leave the board far wider than
       * the screen on mobile.
       */
      const SHEET_WIDTH_FRACTION = 0.8567
      const boardScale = () => {
        const { boxWidth } = measureAtRest()
        if (!boxWidth) return 1
        const width = diveScale() * boxWidth * SHEET_WIDTH_FRACTION
        /*
         * On a wide screen the board is pulled back inside the frame so its
         * edges read. A phone cannot have both: the building is registered to
         * the plan's printed footprint, so a board that fits a 390px width
         * leaves the building barely a hundred pixels tall. The board is
         * therefore allowed to bleed off the sides there, which keeps the
         * drawing and the building legible — the tilt still shows its near and
         * far edges, so it is still recognisably a board.
         */
        const target = window.innerWidth * (compact ? 2.3 : 0.92)
        return Math.min(1, target / width)
      }

      /* Scale at which the sheet's silhouette covers the viewport, with margin. */
      const diveScale = () => {
        const { boxWidth, boxHeight } = measureAtRest()
        if (!boxWidth || !boxHeight) return 1
        return (
          sheetCoverScale(boxWidth, boxHeight, window.innerWidth, window.innerHeight) *
          DIVE_OVERFILL
        )
      }

      /*
       * Translation that brings the plan's centre to the middle of the screen.
       * The camera lives inside the rotated anchor, so the viewport-space delta
       * has to be rotated into the anchor's frame before GSAP applies it.
       */
      const diveOffset = () => {
        const { centreX, centreY } = measureAtRest()
        const dx = window.innerWidth / 2 - centreX
        const dy = window.innerHeight / 2 - centreY
        const inverse = (-baseRotation * Math.PI) / 180
        return {
          x: dx * Math.cos(inverse) - dy * Math.sin(inverse),
          y: dx * Math.sin(inverse) + dy * Math.cos(inverse),
        }
      }

      /* --------------------------------------------- scene 01 beats */

      /*
       * Built on its own 0…1 scale so the percentages below read exactly as the
       * scene 01 brief specifies them, then time-scaled into its share of the
       * master timeline.
       */
      const scene01 = gsap.timeline({ defaults: { ease: 'none' } })
      const reveal = { progress: 0 }

      /*
       * The opening line resolves into the headline on its own, before any
       * scrolling, so nothing here touches it.
       */
      /* The invitation retires the moment it has been accepted. */
      if (hint) {
        scene01.to(hint, { opacity: 0, y: 10, duration: 0.05, ease: 'power2.in' }, 0)
      }

      /*
       * The first scroll is answered immediately: the sheet lifts a few pixels
       * and its shadow deepens a touch, so the very first gesture has a
       * physical consequence rather than waiting for a beat further down.
       */
      if (paperStage) {
        scene01.to(paperStage, { yPercent: -0.4, scale: 1.004, duration: 0.09 }, 0)
      }
      if (shadow) {
        scene01.to(shadow, { opacity: 0.4, yPercent: 20, scale: 1.09, duration: 0.09 }, 0)
      }

      // 10 – 30 %: the blueprint is wiped in diagonally.
      scene01.to(
        reveal,
        {
          progress: 1,
          duration: 0.2,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (blueprint) blueprint.style.clipPath = diagonalClip(reveal.progress)
          },
        },
        0.1,
      )
      if (blueprint) {
        scene01.to(blueprint, { opacity: 0.82, duration: 0.2, ease: 'power1.out' }, 0.1)
      }

      // 35 – 55 %: the sheet lifts a touch, the shadow drifts and deepens.
      if (paperStage) {
        scene01.to(paperStage, { yPercent: -1.4, scale: 1.014, duration: 0.2 }, 0.35)
      }
      if (shadow) {
        scene01.to(
          shadow,
          { opacity: 0.6, yPercent: 23, xPercent: 3.4, scale: 1.18, duration: 0.2 },
          0.35,
        )
      }

      // 50 – 75 %: the fine 2.5D move. Small enough never to read as a card flip.
      if (paperStage) {
        scene01.to(
          paperStage,
          {
            rotateX: 3.4 * depth,
            rotateZ: 0.9 * depth,
            xPercent: -1.1,
            scale: 1 + 0.026 * (depth || 0.5),
            duration: 0.25,
            ease: 'power1.inOut',
          },
          0.5,
        )
      }

      // 65 – 85 %: the headline steps back, the subline arrives.
      if (title) {
        scene01.to(title, { opacity: 0.74, y: -10, duration: 0.2, ease: 'power2.inOut' }, 0.65)
      }
      if (subline) {
        scene01.to(subline, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.71)
      }

      // 85 – 100 %: a little more contrast, the sheet settles almost straight.
      if (blueprint) {
        scene01.to(blueprint, { opacity: 1, duration: 0.15, ease: 'power2.out' }, 0.85)
      }
      if (paperStage) {
        scene01.to(
          paperStage,
          {
            rotateX: 1.2 * depth,
            rotateZ: 0.15 * depth,
            scale: 1 + 0.018 * (depth || 0.5),
            duration: 0.15,
            ease: 'power2.out',
          },
          0.85,
        )
      }
      if (shadow) {
        scene01.to(
          shadow,
          {
            opacity: 0.48,
            yPercent: 21.4,
            xPercent: 2.4,
            scale: 1.13,
            duration: 0.15,
            ease: 'power2.out',
          },
          0.85,
        )
      }

      /* ------------------------------------------------- the dive */

      /*
       * The sheet does not hand over to another scene — it becomes it. The
       * camera squares up to the plan, then keeps pushing in until the sheet has
       * grown past every edge of the viewport, while the desk it was lying on
       * fades out from under it. Nothing cross-fades: the typography is simply
       * overtaken by the advancing sheet, whose deckled edge does the covering.
       */
      const dive = gsap.timeline({ defaults: { ease: 'none' } })

      if (paperStage) {
        /*
         * Scene 01's 2.5D pose is unwound first, so the sheet is flat and the
         * camera's own transform is the only thing shaping it. This is also
         * what makes the measured rest pose the true end state.
         */
        dive.to(
          paperStage,
          {
            rotateX: 0,
            rotateZ: 0,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            duration: 0.42,
            ease: 'power2.inOut',
          },
          0,
        )
      }

      if (camera) {
        /* Rotate until the plan's own lines are square with the viewport. */
        dive.to(
          camera,
          {
            rotate: -(BLUEPRINT_ROTATION + baseRotation),
            duration: 0.46,
            ease: 'power2.inOut',
          },
          0,
        )
        /*
         * The push in. It runs almost the whole dive and outlasts the rotation,
         * so the movement reads as one continuous approach rather than a
         * rotate-then-zoom sequence.
         */
        dive.to(
          camera,
          {
            scale: diveScale,
            x: () => diveOffset().x,
            y: () => diveOffset().y,
            duration: 0.96,
            ease: 'power1.inOut',
          },
          0.04,
        )
      }

      /* The desk recedes: its light, its shadow and the paper it stood on. */
      if (background) {
        dive.to(background, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 0.16)
      }
      if (shadow) {
        dive.to(shadow, { opacity: 0, duration: 0.42, ease: 'power1.in' }, 0.12)
      }
      if (light) {
        /* A trace of light stays, so the new world is lit rather than flat. */
        dive.to(light, { opacity: 0.2, duration: 0.55, ease: 'power1.inOut' }, 0.18)
      }

      /*
       * Mouse parallax is wound out during the dive: a few pixels of drift is
       * life on a sheet on a desk, but multiplied by the dive's scale it would
       * make the whole world wobble.
       */
      const parallaxTargets = [paperParallax, blueprint].filter(Boolean) as HTMLElement[]
      if (parallaxTargets.length) {
        dive.to(parallaxTargets, { x: 0, y: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }, 0)
      }

      /* --------------------------------------------- master timeline */

      const master = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          /*
           * Enough smoothing to feel unhurried, little enough that the scene
           * has visibly caught up by the time a fast scroll stops — a longer
           * scrub leaves the reader looking at a state a second behind them.
           */
          scrub: 0.7,
          pin: viewport,
          /* .scene already reserves the scroll distance, so no extra spacing. */
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          /*
           * The breathing and the travelling dot belong to the resting state
           * only. Suspending them the moment the reader moves keeps the scene
           * free of anything running behind the scroll-driven work.
           */
          onUpdate: (self) => {
            /*
             * Someone who starts scrolling during the title sequence has
             * already made their choice — let it resolve quickly instead of
             * making them wait it out, but still resolve rather than cut.
             *
             * Gated on the actual scroll position: ScrollTrigger reports a
             * sub-pixel progress of its own during the first refresh, which is
             * enough to trip a progress-based test and skip the sequence on
             * load.
             */
            if (window.scrollY > 4 && arrival.isActive() && arrival.timeScale() === 1) {
              arrival.timeScale(3.2)
            }

            const resting = self.progress < 0.004
            for (const loop of ambient) {
              if (resting === loop.paused()) loop.paused(!resting)
            }
          },
        },
      })

      master.add(scene01.duration(scene01Share), 0)
      master.add(dive.duration(diveShare), scene01Share)

      /*
       * Reserves scene 02's stretch on the master timeline. Without it the
       * timeline would only be as long as its last real tween, and ScrollTrigger
       * would stretch scene 01 and the dive across the whole scroll distance —
       * so the dive would still be growing well into scene 02's territory. This
       * keeps the master exactly 1.0 long, which is what makes the shares above
       * map to the scroll lengths declared in CSS.
       */
      const hold = { progress: 0 }
      master.to(hold, { progress: 1, duration: scene02Share }, scene01Share + diveShare)

      const placeScene02Building = buildScene02Intro({
        timeline: master,
        position: scene01Share + diveShare,
        duration: scene02Share,
        compact,
        boardScale,
        targets: {
          tilt: pick('[data-scene-tilt]'),
          stage: pick('[data-scene-stage]'),
          content: pick('[data-scene-content]'),
          plan: blueprint,
          boardSurface: pick('[data-scene-board-surface]'),
          paper: pick('[data-scene-paper]'),
          wallGlow: pick('[data-scene-wall-glow]'),
          planCentre: pick('[data-scene-plan-centre]'),
          planLeft: pick('[data-scene-plan-left]'),
          planRight: pick('[data-scene-plan-right]'),
          building: pick('[data-scene-02-building]'),
          wireframe: pick('[data-scene-02-wireframe]'),
          lines: pick('[data-scene-02-lines]'),
          solid: pick('[data-scene-02-solid]'),
          shadow: pick('[data-scene-02-shadow]'),
        },
      })

      /*
       * The building is seated on the plan by measurement, so a layout change
       * has to invalidate that seat. Whether it can be re-measured straight away
       * depends on where the reader is: the plan only projects to its final
       * position once the board has finished tilting.
       */
      const reseatScene02Building = () => {
        const settled = master.progress() > scene01Share + diveShare + scene02Share * 0.36
        placeScene02Building(settled)
      }
      ScrollTrigger.addEventListener('refresh', reseatScene02Building)

      /* --------------------------------------------- mouse parallax */

      /*
       * Off on touch devices, narrow viewports and under reduced motion — the
       * condition is part of matchMedia, so a resize rebuilds instead of
       * leaving a stale listener behind.
       */
      if (!canParallax) {
        return () => {
          ScrollTrigger.removeEventListener('refresh', reseatScene02Building)
        }
      }

      const targets = [
        { el: paperParallax, range: MOUSE_RANGE.paper, duration: 0.8 },
        { el: blueprint, range: MOUSE_RANGE.blueprintExtra, duration: 0.9 },
        { el: light, range: MOUSE_RANGE.light, duration: 1.1 },
      ].filter((t): t is { el: HTMLElement; range: number; duration: number } => Boolean(t.el))

      const setters = targets.map(({ el, range, duration }) => ({
        x: gsap.quickTo(el, 'x', { duration, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration, ease: 'power3.out' }),
        range,
      }))

      const handlePointerMove = (event: PointerEvent) => {
        /* Once the dive is under way the world is no longer a sheet to nudge. */
        if (master.progress() > scene01Share) return

        const nx = (event.clientX / window.innerWidth) * 2 - 1
        const ny = (event.clientY / window.innerHeight) * 2 - 1
        for (const setter of setters) {
          setter.x(nx * setter.range)
          setter.y(ny * setter.range)
        }
      }

      window.addEventListener('pointermove', handlePointerMove, { passive: true })

      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        ScrollTrigger.removeEventListener('refresh', reseatScene02Building)
      }
    })

    return () => {
      mm.revert()
    }
  }, [rootRef, enabled])
}
