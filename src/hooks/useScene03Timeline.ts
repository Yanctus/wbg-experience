import gsap from 'gsap'
import type { ActOptions } from './storyTargets'

/**
 * Act 3 — the model becomes a place, and the viewer walks into it.
 *
 * The camera does not move to a new subject: the white model stays exactly
 * where it is and materials arrive on it behind a diagonal edge, so glass, roof
 * and facade land on a building that never shifts by a pixel. Only once it is
 * real does the world open up and the whole composition glide forward.
 *
 * Every layer here is optional. Without the generated assets the act still
 * resolves — the board recedes, the light warms and the closing words arrive
 * over the white model — which is a quieter ending, not a broken one.
 */
export function buildRealityAct({ timeline, position, duration, targets, compact }: ActOptions) {
  const {
    stage,
    tilt,
    board,
    sheet,
    plan,
    building,
    white,
    wireframe,
    photoreal,
    realShadow,
    backdrop,
    foreground,
    ground,
    daylight,
    act2,
    act3,
    light,
    dust,
  } = targets

  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  const hasWorld = Boolean(photoreal)

  /* The second act's words leave before the materials arrive. */
  if (act2) {
    timeline.to(act2, { opacity: 0, y: -14, duration: span(0.08), ease: 'power2.inOut' }, at(0.04))
  }

  /* --- materials ------------------------------------------------------- */

  if (photoreal) {
    gsap.set(photoreal, { '--wipe': 0, opacity: 1 })
    /*
     * One long travelling edge rather than a crossfade: the real building is
     * uncovered across the facade, so the change reads as material landing on
     * the model instead of one picture dissolving into another.
     */
    timeline.to(photoreal, { '--wipe': 1, duration: span(0.34), ease: 'power1.inOut' }, at(0.06))
  }
  if (realShadow) {
    timeline.to(realShadow, { opacity: 1, duration: span(0.26), ease: 'power1.out' }, at(0.14))
  }
  if (photoreal && wireframe) {
    timeline.to(wireframe, { opacity: 0, duration: span(0.16), ease: 'power1.inOut' }, at(0.12))
  }
  if (photoreal && white) {
    /* Held under the real facade until the wipe has fully passed it. */
    timeline.to(white, { opacity: 0, duration: span(0.1), ease: 'power1.inOut' }, at(0.34))
  }

  /* --- the board gives way to a world ---------------------------------- */

  if (tilt) {
    /* The presentation angle relaxes towards eye level as the world opens. */
    timeline.to(
      tilt,
      { rotateX: compact ? 30 : 34, duration: span(0.34), ease: 'power1.inOut' },
      at(0.16),
    )
  }
  for (const layer of [plan, board, sheet]) {
    if (!layer) continue
    timeline.to(layer, { opacity: 0, duration: span(0.24), ease: 'power1.inOut' }, at(0.2))
  }
  if (backdrop) {
    timeline.to(backdrop, { opacity: 1, duration: span(0.3), ease: 'power1.inOut' }, at(0.18))
  }
  if (foreground) {
    timeline.to(foreground, { opacity: 1, duration: span(0.26), ease: 'power1.inOut' }, at(0.26))
  }
  if (stage) {
    timeline.to(
      stage,
      { backgroundColor: hasWorld ? '#e9e6df' : '#f4f1ec', duration: span(0.3), ease: 'power1.inOut' },
      at(0.2),
    )
  }

  /* Daylight develops: gallery light becomes an afternoon. */
  if (ground) {
    timeline.to(ground, { opacity: 1, duration: span(0.26), ease: 'power1.out' }, at(0.18))
  }
  if (daylight) {
    timeline.to(daylight, { opacity: 1, duration: span(0.3), ease: 'power1.inOut' }, at(0.24))
  }
  if (light) {
    timeline.to(light, { opacity: 0.5, duration: span(0.3), ease: 'power1.inOut' }, at(0.24))
  }
  if (dust) {
    timeline.to(dust, { opacity: 0.2, duration: span(0.3), ease: 'power1.inOut' }, at(0.24))
  }

  /* --- entering -------------------------------------------------------- */

  /*
   * A slow forward glide, built from three planes moving at three speeds. It is
   * layered 2.5D, not a fly-through: the near planting passes the viewer, the
   * building grows gently, the backdrop barely moves — which is exactly how
   * depth reads to the eye at walking pace.
   */
  const glide = compact ? 0.55 : 1
  if (backdrop) {
    timeline.to(backdrop, { scale: 1 + 0.04 * glide, duration: span(0.44), ease: 'power1.inOut' }, at(0.5))
  }
  if (building) {
    timeline.to(
      building,
      { scale: 1 + 0.08 * glide, yPercent: -11 * glide, duration: span(0.44), ease: 'power1.inOut' },
      at(0.5),
    )
  }
  if (foreground) {
    timeline.to(
      foreground,
      { scale: 1 + 0.3 * glide, yPercent: 5 * glide, duration: span(0.44), ease: 'power1.inOut' },
      at(0.5),
    )
  }

  /* --- the closing thought --------------------------------------------- */

  if (act3) {
    timeline.fromTo(
      act3,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: span(0.12), ease: 'power2.out' },
      at(0.64),
    )
  }
}
