import gsap from 'gsap'

/**
 * Scene 02's choreography — the building constructed out of the floor plan.
 *
 * It is added to the *same* master timeline as scene 01 and the dive, rather
 * than getting its own ScrollTrigger. That is what keeps the handover seamless:
 * there is one pin and one scrubbed timeline for the whole experience, so the
 * enlarged plan simply stays where the dive left it while the building grows on
 * top of it. A second trigger would re-pin and produce exactly the hard cut the
 * sequence is designed to avoid.
 */

export type Scene02Targets = {
  /** The floor plan itself — it fades back but never fully disappears. */
  plan?: HTMLElement
  /** Blurred copy of the plan's heaviest ink, used to lift the walls. */
  wallGlow?: HTMLElement
  /** Shared transform target for every building layer. */
  building?: HTMLElement
  wireframe?: HTMLElement
  lines?: HTMLElement
  solid?: HTMLElement
  shadow?: HTMLElement
}

type BuildOptions = {
  timeline: gsap.core.Timeline
  /** Position on the master timeline where scene 02 begins (0…1). */
  position: number
  /** How much of the master timeline scene 02 occupies. */
  duration: number
  targets: Scene02Targets
  compact: boolean
}

/**
 * Where the building sits inside its own image, as fractions of the image
 * height measured from the bottom, and where the storeys divide within that.
 *
 * Only the two extents depend on how the asset is framed — if the wireframe is
 * delivered with different margins, correcting those two numbers re-times every
 * stage. The stops in between are proportions of the building itself: a taller
 * ground floor, three similar upper storeys, then the roof and its details as a
 * shallow final band.
 */
const BUILDING_EXTENT = { bottom: 0.22, top: 0.87 }

const STAGE_STOPS = [
  { at: 0.0, label: 'foundation' },
  { at: 0.3, label: 'ground floor' },
  { at: 0.44, label: 'first upper floor' },
  { at: 0.58, label: 'second upper floor' },
  { at: 0.86, label: 'remaining upper floors' },
  { at: 1.0, label: 'roof and rooftop details' },
]

/** Maps a stop within the building to a `--reveal` percentage on the image. */
function revealAt(stop: number): string {
  const { bottom, top } = BUILDING_EXTENT
  const fraction = bottom + stop * (top - bottom)
  /*
   * The last stop is pushed past the image edge so the feathered band clears
   * the roof completely instead of leaving it half-masked.
   */
  const overshoot = stop >= 1 ? 0.14 : 0
  return `${((fraction + overshoot) * 100).toFixed(2)}%`
}

export function buildScene02Intro({
  timeline,
  position,
  duration,
  targets,
  compact,
}: BuildOptions) {
  const { plan, wallGlow, building, wireframe, lines, solid, shadow } = targets

  /* Fractions of scene 02's own stretch, so the beats read as a storyboard. */
  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  const revealTargets = [wireframe, lines].filter(Boolean) as HTMLElement[]
  const bodyLayers = [shadow, solid, ...revealTargets].filter(Boolean) as HTMLElement[]

  /* ------------------------------------------------- initial state */

  if (revealTargets.length) {
    gsap.set(revealTargets, { '--reveal': revealAt(0) })
  }
  if (bodyLayers.length) {
    gsap.set(bodyLayers, { opacity: 0 })
  }
  if (building) {
    gsap.set(building, { yPercent: compact ? 1.4 : 2.2, scale: 0.986 })
  }
  if (wallGlow) {
    gsap.set(wallGlow, { opacity: 0 })
  }

  /*
   * 0 – 10 %: nothing moves. The plan is held fullscreen and fully visible so
   * the dive has somewhere to land before construction starts.
   */

  /*
   * 6 – 22 %: the heaviest lines in the plan lift slightly — the walls the
   * building is about to stand on. Subtle by design: this is emphasis, not a
   * glow effect.
   */
  if (wallGlow) {
    timeline.to(
      wallGlow,
      { opacity: compact ? 0.44 : 0.52, duration: span(0.16), ease: 'power2.out' },
      at(0.06),
    )
  }

  /*
   * 18 – 26 %: the wireframe is brought in over the plan. It is still fully
   * masked, so this only establishes the layer — the reveal below is what makes
   * the building appear.
   */
  if (bodyLayers.length) {
    timeline.to(bodyLayers, { opacity: 1, duration: span(0.08), ease: 'power1.inOut' }, at(0.18))
  }

  /*
   * 20 – 94 %: the storeys, bottom to top. Each stage eases in and out of its
   * own stop and is followed by a short hold, which is what makes the building
   * read as constructed in stages rather than extruded in one continuous push.
   */
  if (revealTargets.length) {
    const windows: Array<[number, number]> = [
      [0.2, 0.34], // ground floor
      [0.37, 0.49], // first upper floor
      [0.52, 0.63], // second upper floor
      [0.66, 0.81], // remaining upper floors
      [0.84, 0.94], // roof and rooftop details
    ]

    windows.forEach(([start, end], index) => {
      const stop = STAGE_STOPS[index + 1]
      timeline.to(
        revealTargets,
        {
          '--reveal': revealAt(stop.at),
          duration: span(end - start),
          ease: 'power2.inOut',
        },
        at(start),
      )
    })
  }

  /*
   * 20 – 100 %: the plan recedes. It is deliberately still legible for most of
   * the construction — dropping to a trace only at the very end — so the
   * building never stops looking like it came out of this drawing. Lowering the
   * opacity of a multiply layer lowers its contrast at the same time, which is
   * why no filter animation is needed here.
   *
   * Skipped when no building is present: fading the drawing away with nothing
   * to hand over to would just empty the screen, so the scene degrades to
   * "the plan holds, with its walls emphasised".
   */
  if (plan && revealTargets.length) {
    timeline.to(plan, { opacity: 0.62, duration: span(0.34), ease: 'power1.inOut' }, at(0.2))
    timeline.to(plan, { opacity: 0.34, duration: span(0.24), ease: 'power1.inOut' }, at(0.56))
    timeline.to(plan, { opacity: 0.08, duration: span(0.18), ease: 'power2.inOut' }, at(0.82))
  }

  /* The wall emphasis retires with the drawing it belongs to — but only if
     there is a building taking over; otherwise it stays as the closing state. */
  if (wallGlow && revealTargets.length) {
    timeline.to(wallGlow, { opacity: 0, duration: span(0.3), ease: 'power1.inOut' }, at(0.58))
  }

  /*
   * 20 – 100 %: a slow lift and a fraction of growth across the whole build, so
   * the building feels like it is rising out of the paper rather than being
   * unmasked in place. Small enough to stay subliminal.
   */
  if (building && revealTargets.length) {
    timeline.to(
      building,
      {
        yPercent: compact ? -1.2 : -2,
        scale: 1.022,
        duration: span(0.8),
        ease: 'power1.inOut',
      },
      at(0.2),
    )
  }
}
