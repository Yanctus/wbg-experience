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

      const titleLines = title ? Array.from(title.children) : []
      const texts = [eyebrow, subline].filter(Boolean) as HTMLElement[]

      /*
       * Reduced motion: everything is shown in its final, readable state.
       * No pinning, no scrubbing, no dive, no parallax. The scene is also
       * collapsed to a single viewport height in CSS.
       */
      if (reduced || !motion) {
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

      // 0 – 10 %: the scene stays calm and almost empty.

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

      // 20 – 40 %: the eyebrow arrives first, then the headline lines.
      if (eyebrow) {
        scene01.to(eyebrow, { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.2)
      }
      if (titleLines.length) {
        scene01.to(
          titleLines,
          { opacity: 1, y: 0, duration: 0.09, ease: 'power2.out', stagger: 0.035 },
          0.27,
        )
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
          scrub: 1,
          pin: viewport,
          /* .scene already reserves the scroll distance, so no extra spacing. */
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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

      buildScene02Intro({
        timeline: master,
        position: scene01Share + diveShare,
        duration: scene02Share,
        compact,
        targets: {
          plan: blueprint,
          wallGlow: pick('[data-scene-wall-glow]'),
          building: pick('[data-scene-02-building]'),
          wireframe: pick('[data-scene-02-wireframe]'),
          lines: pick('[data-scene-02-lines]'),
          solid: pick('[data-scene-02-solid]'),
          shadow: pick('[data-scene-02-shadow]'),
        },
      })

      /* --------------------------------------------- mouse parallax */

      /*
       * Off on touch devices, narrow viewports and under reduced motion — the
       * condition is part of matchMedia, so a resize rebuilds instead of
       * leaving a stale listener behind.
       */
      if (!canParallax) return

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
      }
    })

    return () => {
      mm.revert()
    }
  }, [rootRef, enabled])
}
