import gsap from 'gsap'
import { ASSETS_READY } from '../components/Scene02/assets'

/**
 * Scene 02's choreography.
 *
 * It is added to the *same* master timeline as scene 01 and the dive, rather
 * than getting its own ScrollTrigger. That is what keeps the handover seamless:
 * there is one pin and one scrubbed timeline for the whole experience, so the
 * enlarged blueprint simply stays where the dive left it while scene 02 builds
 * on top of it. A second trigger would re-pin and produce exactly the hard cut
 * the scene is designed to avoid.
 */

export type Scene02Targets = {
  shadow?: HTMLElement
  solid?: HTMLElement
  wireframe?: HTMLElement
  lines?: HTMLElement
}

type BuildOptions = {
  /** The master timeline. */
  timeline: gsap.core.Timeline
  /** Position on the master timeline where scene 02 begins (0…1). */
  position: number
  /** How much of the master timeline scene 02 occupies. */
  duration: number
  targets: Scene02Targets
}

/**
 * Builds scene 02's intro: the building assembles the way a drawing does —
 * shadow first so it is grounded, then the massing, then the line drawing over
 * it, and finally the dimensions and annotations.
 *
 * While the assets are missing the layers are empty, so there is nothing to
 * animate and the tweens are skipped entirely — no wasted work and no tweens
 * on zero-size elements. The order and timing below are the contract the
 * assets will drop into.
 */
export function buildScene02Intro({ timeline, position, duration, targets }: BuildOptions) {
  const layers = [targets.shadow, targets.solid, targets.wireframe, targets.lines].filter(
    Boolean,
  ) as HTMLElement[]

  if (!layers.length) return

  if (!ASSETS_READY) {
    /*
     * Placeholders only. Hold the layers hidden so that when the assets are
     * added the scene starts from a defined state instead of flashing in.
     */
    gsap.set(layers, { opacity: 0 })
    return
  }

  const { shadow, solid, wireframe, lines } = targets

  gsap.set(layers, { opacity: 0 })
  if (solid) gsap.set(solid, { yPercent: 1.5, scale: 0.985 })
  if (wireframe) gsap.set(wireframe, { scale: 0.99 })

  const step = duration / 4

  if (shadow) {
    timeline.to(shadow, { opacity: 0.5, duration: step, ease: 'power2.out' }, position)
  }
  if (solid) {
    timeline.to(
      solid,
      { opacity: 1, yPercent: 0, scale: 1, duration: step * 1.6, ease: 'power2.out' },
      position + step * 0.35,
    )
  }
  if (wireframe) {
    timeline.to(
      wireframe,
      { opacity: 0.9, scale: 1, duration: step * 1.4, ease: 'power2.out' },
      position + step * 1.3,
    )
  }
  if (lines) {
    timeline.to(
      lines,
      { opacity: 0.75, duration: step * 1.3, ease: 'power2.out' },
      position + step * 2.2,
    )
  }
}
