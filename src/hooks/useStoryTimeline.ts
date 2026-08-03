import { useEffect } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { readLength } from './geometry'
import type { StoryTargets } from './storyTargets'
import { buildDrawingAct } from './useScene01Timeline'
import { buildConstructionAct, buildEnterAct } from './useScene02Timeline'
import { buildRealityAct } from './useScene03Timeline'

/**
 * ScrollTrigger is part of the `gsap` package and must never be installed
 * separately. Registration happens once at module scope; the guard keeps a
 * second evaluation (HMR, multiple importers) from re-registering.
 */
let registered = false

if (!registered) {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
  registered = true
}

/** Maximum mouse offsets in pixels. Deliberately tiny. */
const MOUSE_RANGE = { sheet: 4, plan: 6, light: 8 }

const CONDITIONS = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
  compact: '(max-width: 720px)',
  canParallax: '(min-width: 1025px) and (hover: hover) and (pointer: fine)',
}

/**
 * The whole story on one pinned stage and one scrubbed timeline.
 *
 * There is deliberately no second ScrollTrigger: a second pin would re-seat the
 * stage and put a seam exactly where the story must not have one. The four acts
 * are sub-ranges of the same timeline, and the scroll distances they occupy are
 * read from CSS, so the choreography and the page height can never disagree.
 *
 * @param revision Changes when optional layers mount, so the timeline is rebuilt
 *                 around what is actually in the DOM — it collects its targets
 *                 by selector as it is built, and a layer that appears later
 *                 would otherwise never be part of it.
 */
export function useStoryTimeline(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  revision = '',
) {
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

      const targets: StoryTargets = {
        stage: pick('[data-story-stage]'),
        room: pick('[data-story-room]'),
        shadow: pick('[data-story-shadow]'),
        tilt: pick('[data-story-tilt]'),
        camera: pick('[data-story-camera]'),
        lift: pick('[data-story-lift]'),
        sheet: pick('[data-story-sheet]'),
        board: pick('[data-story-board]'),
        plan: pick('[data-story-plan]'),
        planLayers: q('[data-story-plan-layer]') as HTMLElement[],
        walls: pick('[data-story-walls]'),
        planCentre: pick('[data-story-plan-centre]'),
        planLeft: pick('[data-story-plan-left]'),
        planRight: pick('[data-story-plan-right]'),
        building: pick('[data-story-building]'),
        wireframe: pick('[data-story-wireframe]'),
        white: pick('[data-story-white]'),
        realAnchor: pick('[data-story-real-anchor]'),
        photoreal: pick('[data-story-photoreal]'),
        realShadow: pick('[data-story-real-shadow]'),
        backdrop: pick('[data-story-backdrop]'),
        foreground: pick('[data-story-foreground]'),
        ground: pick('[data-story-ground]'),
        daylight: pick('[data-story-daylight]'),
        content: pick('[data-story-content]'),
        subline: pick('[data-story-subline]'),
        act2: pick('[data-story-act2]'),
        act3: pick('[data-story-act3]'),
        light: pick('[data-story-light]'),
        dust: pick('[data-story-dust]'),
        hint: pick('[data-story-hint]'),
      }

      const viewport = pick('[data-story-viewport]')
      const introInner = pick('[data-story-intro-inner]')
      const introShared = pick('[data-story-intro-shared]')
      const introTail = pick('[data-story-intro-tail]')
      const hintInner = pick('[data-story-hint-inner]')
      const hintLine = pick('[data-story-hint-line]')
      const hintDot = pick('[data-story-hint-dot]')
      const title = pick('[data-story-title]')
      const eyebrow = pick('[data-story-eyebrow]')
      const titleLines = (title ? Array.from(title.children) : []) as HTMLElement[]

      /*
       * Reduced motion: no pin, no scrub, no camera. Every key state of the
       * story is simply shown, in order, in its readable form.
       */
      if (reduced || !motion) {
        gsap.set([targets.hint, pick('[data-story-intro]')].filter(Boolean), { autoAlpha: 0 })
        gsap.set([eyebrow, targets.subline, title].filter(Boolean), { opacity: 1, y: 0 })
        gsap.set(titleLines, { opacity: 1, y: 0 })
        if (targets.planLayers.length) gsap.set(targets.planLayers, { '--draw': 1 })
        /* The shadow's own resting pose. Left untouched it paints its whole
           near-white plate over the room instead of a shadow under the sheet. */
        if (targets.shadow) gsap.set(targets.shadow, { opacity: 0.3, yPercent: 19, scale: 1.06 })
        for (const act of [targets.act2, targets.act3]) {
          if (act) gsap.set(act, { opacity: 0 })
        }
        return
      }

      /* ---------------------------------------------- initial state */

      gsap.set([eyebrow, targets.subline].filter(Boolean), { opacity: 0, y: 18 })
      gsap.set(titleLines, { opacity: 0, y: 20 })
      if (title) gsap.set(title, { opacity: 1 })
      if (targets.shadow) gsap.set(targets.shadow, { opacity: 0.3, yPercent: 19, scale: 1.06 })
      if (introInner) gsap.set(introInner, { opacity: 0, y: 14 })
      if (hintInner) gsap.set(hintInner, { opacity: 0, y: 8 })

      /* ------------------------------------------- the opening line */

      /*
       * The first sentence is not swapped for the headline — it becomes it.
       * The tail leaves, and the two words both sentences share travel up and
       * grow into the headline's first line, which then takes over in place.
       */
      const arrival = gsap.timeline({ defaults: { ease: 'power2.out' } })
      const titleLine1 = titleLines[0]

      if (introInner) arrival.to(introInner, { opacity: 1, y: 0, duration: 1.3 }, 0.8)
      if (hintInner) arrival.to(hintInner, { opacity: 1, y: 0, duration: 1.1 }, 1.9)

      const HOLD_UNTIL = 4.4

      if (introTail) {
        arrival.to(introTail, { opacity: 0, duration: 0.75, ease: 'power2.inOut' }, HOLD_UNTIL)
      }

      if (introShared && titleLine1) {
        /*
         * The headline's first line is parked 20px low until it takes over, so
         * its live rect is not where the words have to land. Both rects are
         * corrected by whatever transform GSAP currently holds, which gives the
         * two resting boxes — the only pair whose difference is the travel.
         */
        const restingRect = (el: HTMLElement) => {
          const rect = el.getBoundingClientRect()
          return {
            left: rect.left - (Number(gsap.getProperty(el, 'x')) || 0),
            top: rect.top - (Number(gsap.getProperty(el, 'y')) || 0),
            height: rect.height,
          }
        }
        const measure = () => ({ from: restingRect(introShared), to: restingRect(titleLine1) })

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
         * The swap, once the travel has landed. The first line drops its offset
         * before the cross-fade rather than sliding it off during it, which
         * would make the two copies drift apart in the one moment both are
         * visible. Lines two and three keep the offset — they arrive later.
         */
        const LANDED = HOLD_UNTIL + 1.7
        arrival.set(titleLine1, { y: 0 }, LANDED)
        arrival.to(titleLine1, { opacity: 1, duration: 0.24, ease: 'none' }, LANDED)
        arrival.to(introShared, { opacity: 0, duration: 0.24, ease: 'none' }, LANDED)

        if (titleLines.length > 1) {
          arrival.to(
            titleLines.slice(1),
            { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out', stagger: 0.14 },
            HOLD_UNTIL + 1.84,
          )
        }
        if (eyebrow) arrival.to(eyebrow, { opacity: 1, y: 0, duration: 0.9 }, HOLD_UNTIL + 1.72)
      }

      /* ------------------------------------------------ ambient life */

      const ambient: gsap.core.Timeline[] = []

      if (targets.lift) {
        ambient.push(
          gsap.timeline({ repeat: -1, yoyo: true }).to(targets.lift, {
            scale: 1.0038,
            duration: 6.5,
            ease: 'sine.inOut',
          }),
        )
      }
      if (hintLine && hintDot) {
        ambient.push(
          gsap.timeline({ repeat: -1, repeatDelay: 1 }).fromTo(
            hintDot,
            { y: 0, opacity: 0 },
            {
              y: () => hintLine.offsetHeight - hintDot.offsetHeight,
              opacity: 1,
              duration: 2.6,
              ease: 'none',
              onComplete: () => gsap.set(hintDot, { opacity: 0 }),
            },
          ),
        )
      }

      /* ------------------------------------------------ the master */

      const styles = getComputedStyle(root)
      const vh = window.innerHeight / 100
      const lengths = {
        drawing: readLength(styles, '--act-drawing', 300) * vh,
        enter: readLength(styles, '--act-enter', 170) * vh,
        construction: readLength(styles, '--act-construction', 380) * vh,
        reality: readLength(styles, '--act-reality', 300) * vh,
      }
      const total = lengths.drawing + lengths.enter + lengths.construction + lengths.reality

      /*
       * Act boundaries as fractions of one timeline of duration 1, so the
       * scrub maps scroll distance to story time exactly as the CSS lays it out.
       */
      const master = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          pin: viewport,
          /* .story already reserves the distance — a spacer would double it. */
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            /* Once the reader has started, the opening stops waiting. */
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

      const act = (start: number, length: number) => ({
        timeline: master,
        position: start / total,
        duration: length / total,
        targets,
        compact,
      })

      let cursor = 0
      buildDrawingAct(act(cursor, lengths.drawing))
      cursor += lengths.drawing
      buildEnterAct(act(cursor, lengths.enter))
      cursor += lengths.enter
      const reseat = buildConstructionAct(act(cursor, lengths.construction))
      const constructionStart = cursor / total
      cursor += lengths.construction
      buildRealityAct(act(cursor, lengths.reality))

      /* The timeline has to fill its whole range or ScrollTrigger stretches it. */
      master.to({}, { duration: Math.max(0.001, 1 - master.duration()) }, master.duration())

      /* A refresh re-measures the footprint, but only where that is meaningful. */
      const onRefresh = () => reseat?.(master.progress() > constructionStart + 0.1)
      ScrollTrigger.addEventListener('refresh', onRefresh)

      /* ---------------------------------------------- mouse parallax */

      let cleanupParallax: (() => void) | undefined

      if (canParallax) {
        const move = {
          sheet: targets.lift ? gsap.quickTo(targets.lift, 'x', { duration: 0.7 }) : undefined,
          sheetY: targets.lift ? gsap.quickTo(targets.lift, 'y', { duration: 0.7 }) : undefined,
          plan: targets.plan ? gsap.quickTo(targets.plan, 'x', { duration: 0.7 }) : undefined,
          planY: targets.plan ? gsap.quickTo(targets.plan, 'y', { duration: 0.7 }) : undefined,
          light: targets.light ? gsap.quickTo(targets.light, 'x', { duration: 0.9 }) : undefined,
          lightY: targets.light ? gsap.quickTo(targets.light, 'y', { duration: 0.9 }) : undefined,
        }

        const onMove = (event: PointerEvent) => {
          /* Only while the sheet is still a sheet — the camera owns it later. */
          if (master.progress() > 0.28) return
          const nx = (event.clientX / window.innerWidth - 0.5) * 2
          const ny = (event.clientY / window.innerHeight - 0.5) * 2
          move.sheet?.(nx * MOUSE_RANGE.sheet)
          move.sheetY?.(ny * MOUSE_RANGE.sheet)
          move.plan?.(nx * (MOUSE_RANGE.plan - MOUSE_RANGE.sheet))
          move.planY?.(ny * (MOUSE_RANGE.plan - MOUSE_RANGE.sheet))
          move.light?.(nx * -MOUSE_RANGE.light)
          move.lightY?.(ny * -MOUSE_RANGE.light)
        }

        window.addEventListener('pointermove', onMove, { passive: true })
        cleanupParallax = () => window.removeEventListener('pointermove', onMove)
      }

      return () => {
        ScrollTrigger.removeEventListener('refresh', onRefresh)
        cleanupParallax?.()
        arrival.kill()
        for (const loop of ambient) loop.kill()
      }
    })

    return () => mm.revert()
  }, [rootRef, enabled, revision])
}
