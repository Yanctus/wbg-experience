import { useEffect } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
 * Diagonal wipe used to reveal the blueprint. The top edge runs ahead of the
 * bottom edge, so the plan appears from the top left towards the bottom right —
 * closer to a plan being drawn than a plain opacity fade.
 */
function diagonalClip(progress: number): string {
  const lag = 45
  const x = -30 + progress * (160 + lag)
  return `polygon(-30% -30%, ${x}% -30%, ${x - lag}% 130%, -30% 130%)`
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

      const shadow = pick('[data-scene-shadow]')
      const paperStage = pick('[data-scene-paper-stage]')
      const paperParallax = pick('[data-scene-paper-parallax]')
      const blueprint = pick('[data-scene-blueprint]')
      const eyebrow = pick('[data-scene-eyebrow]')
      const title = pick('[data-scene-title]')
      const subline = pick('[data-scene-subline]')
      const light = pick('[data-scene-light]')
      const viewport = pick('[data-scene-viewport]')

      const titleLines = title ? Array.from(title.children) : []
      const texts = [eyebrow, subline].filter(Boolean) as HTMLElement[]

      /*
       * Reduced motion: everything is shown in its final, readable state.
       * No pinning, no scrubbing, no perspective, no parallax. The scene is
       * also collapsed to a single viewport height in CSS.
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

      const reveal = { progress: 0 }

      const timeline = gsap.timeline({
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

      /*
       * One continuous timeline on a 0…1 scale, so every position below maps
       * directly to the scroll percentages of the scene.
       */

      // 0 – 10 %: the scene stays calm and almost empty.

      // 10 – 30 %: the blueprint is wiped in diagonally.
      timeline.to(
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
        timeline.to(blueprint, { opacity: 0.82, duration: 0.2, ease: 'power1.out' }, 0.1)
      }

      // 20 – 40 %: the eyebrow arrives first, then the headline lines.
      if (eyebrow) {
        timeline.to(eyebrow, { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' }, 0.2)
      }
      if (titleLines.length) {
        timeline.to(
          titleLines,
          { opacity: 1, y: 0, duration: 0.09, ease: 'power2.out', stagger: 0.035 },
          0.27,
        )
      }

      // 35 – 55 %: the sheet lifts a touch, the shadow drifts and deepens.
      if (paperStage) {
        timeline.to(paperStage, { yPercent: -1.4, scale: 1.014, duration: 0.2 }, 0.35)
      }
      if (shadow) {
        timeline.to(
          shadow,
          { opacity: 0.6, yPercent: 23, xPercent: 3.4, scale: 1.18, duration: 0.2 },
          0.35,
        )
      }

      // 50 – 75 %: the fine 2.5D move. Small enough never to read as a card flip.
      if (paperStage) {
        timeline.to(
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
        timeline.to(title, { opacity: 0.74, y: -10, duration: 0.2, ease: 'power2.inOut' }, 0.65)
      }
      if (subline) {
        timeline.to(subline, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.71)
      }

      // 85 – 100 %: a little more contrast, the sheet settles almost straight,
      // and the scene comes to rest — an open state to hand over to scene 02.
      if (blueprint) {
        timeline.to(blueprint, { opacity: 1, duration: 0.15, ease: 'power2.out' }, 0.85)
      }
      if (paperStage) {
        timeline.to(
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
        timeline.to(
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
