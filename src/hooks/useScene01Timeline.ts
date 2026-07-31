import gsap from 'gsap'
import type { ActOptions } from './storyTargets'

/**
 * Act 1 — the sheet, the words, and the plan being drawn on it.
 *
 * The five plan layers are not faded in: each is revealed behind a travelling
 * soft edge along its own axis, in the order an architect works — outline,
 * structure, staircase, openings, then the dimension chains. Stages overlap
 * slightly so the drawing never stops moving.
 */

/** Fractions of act 1: [start, end] of each layer's stroke. */
const STROKES: Array<[number, number]> = [
  [0.14, 0.36], // exterior footprint
  [0.32, 0.52], // structural interior walls
  [0.5, 0.6], // staircase
  [0.57, 0.75], // doors, windows, fittings
  [0.72, 0.9], // dimensions and annotation
]

export function buildDrawingAct({ timeline, position, duration, targets, compact }: ActOptions) {
  const { lift, shadow, plan, planLayers, content, subline } = targets

  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  /* Initial state — an empty sheet, lying still. */
  if (planLayers.length) gsap.set(planLayers, { '--draw': 0 })

  /*
   * The first scroll answers immediately: the sheet lifts a few pixels and its
   * shadow deepens and spreads, as if it were being picked up. It is the
   * smallest possible move that proves the scroll is doing something.
   */
  if (lift) {
    timeline.to(lift, { yPercent: -0.4, scale: 1.004, duration: span(0.04), ease: 'power2.out' }, position)
  }
  if (shadow) {
    timeline.to(
      shadow,
      { opacity: 0.4, yPercent: 20, scale: 1.09, duration: span(0.04), ease: 'power2.out' },
      position,
    )
  }

  /* The drawing itself. */
  planLayers.forEach((layer, index) => {
    const [start, end] = STROKES[index] ?? STROKES[STROKES.length - 1]
    timeline.to(
      layer,
      { '--draw': 1, duration: span(end - start), ease: 'none' },
      at(start),
    )
  })

  /*
   * A calm 2.5D drift over the whole act — the sheet is a physical thing on a
   * table, not a picture. Small enough to stay subliminal.
   */
  if (lift) {
    timeline.to(
      lift,
      {
        yPercent: compact ? -1.2 : -2.1,
        scale: 1.012,
        duration: span(0.9),
        ease: 'power1.inOut',
      },
      at(0.06),
    )
  }
  if (shadow) {
    timeline.to(
      shadow,
      { opacity: 0.34, yPercent: 26, scale: 1.13, duration: span(0.9), ease: 'power1.inOut' },
      at(0.06),
    )
  }

  /* The supporting line arrives once the plan reads as a plan. */
  if (subline) {
    timeline.to(subline, { opacity: 1, y: 0, duration: span(0.1), ease: 'power2.out' }, at(0.58))
  }

  /* The words step back before the camera moves in. */
  if (content) {
    timeline.to(content, { opacity: 0, y: -14, duration: span(0.12), ease: 'power2.inOut' }, at(0.86))
  }
  if (plan) {
    /* The finished plan is held, alone on the sheet, before the camera moves. */
    timeline.to(plan, { opacity: 1, duration: span(0.02), ease: 'none' }, at(0.9))
  }
}
