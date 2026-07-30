import gsap from 'gsap'

/**
 * Scene 02 — the drawing becomes the foundation the building is built on.
 *
 * Six phases on the *same* master timeline as scene 01 and the dive, never a
 * second ScrollTrigger: one pin and one scrubbed timeline for the whole
 * experience is what keeps this a single continuous transformation instead of a
 * sequence of scenes. Nothing before the fullscreen plan is touched.
 *
 *   1  the plan is held fullscreen, so the viewer can read it
 *   2  the whole sheet tilts back into an architectural presentation angle
 *   3  the paper becomes a clean presentation board, the plan still printed on it
 *   4  the building grows out of the plan, storey by storey
 *   5  the plan recedes into the board it is printed on
 *   6  a quiet close: pale board, complete wireframe
 */

export type Scene02Targets = {
  /** Whole-sheet tilt target — perspective comes from its parent. */
  tilt?: HTMLElement
  /** The ground the board is presented against. */
  stage?: HTMLElement
  /** The printed plan. */
  plan?: HTMLElement
  /** Flat surface that turns the paper into a presentation board. */
  boardSurface?: HTMLElement
  /** Blurred copy of the plan's heaviest ink, used to lift the walls. */
  wallGlow?: HTMLElement
  /** The paper texture, held back as the board takes over. */
  paper?: HTMLElement
  /** Scene 01's typography, which the drawing back off re-exposes. */
  content?: HTMLElement
  /** Probes on the drawn building's outline, in the plan's own space. */
  planCentre?: HTMLElement
  planLeft?: HTMLElement
  planRight?: HTMLElement
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
  /** Computed pull-back that lands the tilted board inside the viewport. */
  boardScale: () => number
}

/**
 * The presentation angle. The brief asks for 55–65°; 58° reads as a drawing
 * board seen from standing height without foreshortening the plan so far that it
 * stops being readable.
 */
const BOARD_TILT = 58
const BOARD_TILT_COMPACT = 52

/*
 * As the sheet tilts it also settles downwards, which together with the computed
 * pull-back turns it from a surface filling the screen into a board with visible
 * edges — the thing the building can then be seen standing on.
 */
const BOARD_SETTLE_Y = 13
const BOARD_SETTLE_Y_COMPACT = 6

/**
 * Construction stages, as fractions of the wireframe asset's height measured
 * from its bottom edge. Read off the asset itself: its footprint starts at
 * 0.247, the balcony slabs land at 0.40 / 0.49 / 0.58 / 0.67, the parapet at
 * 0.75, and the roof with its rooftop boxes tops out at 0.87.
 *
 * If the asset is ever re-exported with different margins, these are the only
 * numbers that need revisiting.
 */
const REVEAL_START = 0.24

/**
 * The wireframe's own footprint, measured from the asset's alpha channel: its
 * ground outline spans 83.01% of the image width, and — by the parallelogram
 * rule on the two extreme bottom corners — its centre sits at (54.59%, 54.42%).
 *
 * Registering *that* point onto the plan's outline is what makes the walls stand
 * on the drawing instead of hovering at some fixed height above it.
 */
const FOOTPRINT = { centreX: 0.5459, centreY: 0.5442, width: 0.8301 }
const STAGES = [0.4, 0.49, 0.58, 0.75, 0.95]

/** Windows for each stage, as fractions of scene 02: rise, then a short hold. */
const STAGE_WINDOWS: Array<[number, number]> = [
  [0.44, 0.55],
  [0.57, 0.66],
  [0.68, 0.76],
  [0.78, 0.87],
  [0.88, 0.96],
]

const reveal = (fraction: number) => `${(fraction * 100).toFixed(2)}%`

export function buildScene02Intro({
  timeline,
  position,
  duration,
  targets,
  compact,
  boardScale,
}: BuildOptions) {
  const { tilt, stage, plan, boardSurface, wallGlow, paper, building, content } = targets
  const { wireframe, lines, solid, shadow } = targets

  /* Fractions of scene 02's own stretch, so the beats read as a storyboard. */
  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  const revealTargets = [wireframe, lines].filter(Boolean) as HTMLElement[]
  const bodyLayers = [shadow, solid, ...revealTargets].filter(Boolean) as HTMLElement[]
  const hasBuilding = revealTargets.length > 0

  const settleY = compact ? BOARD_SETTLE_Y_COMPACT : BOARD_SETTLE_Y
  const tiltAngle = compact ? BOARD_TILT_COMPACT : BOARD_TILT

  /*
   * Puts the wireframe on the plan's printed footprint.
   *
   * The three probes live inside the plan, so their screen positions *are* the
   * footprint's perspective projection — the browser has already done that
   * maths, homography and all.
   *
   * Deliberately a plain measurement with nothing forced: it is called from the
   * timeline at the point where the board is already sitting in its finished
   * pose. Measuring earlier, or forcing a pose to measure it, reads the plan
   * before the dive's camera has been applied and lands the building on the
   * small scene 01 sheet instead.
   */
  const place = () => {
    const { planCentre, planLeft, planRight } = targets
    if (!building || !planCentre || !planLeft || !planRight) return

    const centre = planCentre.getBoundingClientRect()
    const left = planLeft.getBoundingClientRect()
    const right = planRight.getBoundingClientRect()

    const planWidth = Math.hypot(right.left - left.left, right.top - left.top)
    if (!planWidth) return

    building.style.setProperty('--plan-x', `${centre.left.toFixed(2)}px`)
    building.style.setProperty('--plan-y', `${centre.top.toFixed(2)}px`)
    building.style.setProperty('--building-size', `${(planWidth / FOOTPRINT.width).toFixed(2)}px`)
  }

  /*
   * Measured once per layout rather than per frame — three rect reads force a
   * synchronous layout, which is not something to do on every scroll tick.
   */
  let needsPlacement = true
  const ensurePlaced = () => {
    if (!needsPlacement) return
    place()
    needsPlacement = false
  }

  /* ------------------------------------------------- initial state */

  if (revealTargets.length) gsap.set(revealTargets, { '--reveal': reveal(REVEAL_START) })
  if (bodyLayers.length) gsap.set(bodyLayers, { opacity: 0 })
  if (building) gsap.set(building, { yPercent: compact ? 1.2 : 1.8, scale: 0.988 })
  if (wallGlow) gsap.set(wallGlow, { opacity: 0 })
  if (boardSurface) gsap.set(boardSurface, { opacity: 0 })

  /*
   * Phase 1 — 0 to 8 %: nothing moves. The plan is held fullscreen so the dive
   * has somewhere to land and the viewer gets a moment to read the drawing.
   */

  /*
   * Phase 2 — 8 to 34 %: the sheet tilts back into the presentation angle and
   * settles into frame. One long eased move, no staging, so it reads as a single
   * deliberate gesture rather than a mechanism.
   */
  if (tilt) {
    timeline.to(
      tilt,
      {
        rotateX: tiltAngle,
        yPercent: settleY,
        scale: boardScale,
        duration: span(0.26),
        ease: 'power2.inOut',
      },
      at(0.08),
    )
  }

  /*
   * The dive covered the headline by growing the sheet over it. Now that the
   * sheet draws back off the edges of the screen, that cover is gone — so the
   * typography is retired here, early in the tilt, before any of it can peek out
   * from behind the receding board.
   */
  if (content) {
    timeline.to(content, { opacity: 0, duration: span(0.1), ease: 'power1.inOut' }, at(0.07))
  }

  /*
   * The plan's heaviest lines lift while it is still flat — the walls the
   * building is about to stand on. Deliberately slight: emphasis, not an effect.
   */
  if (wallGlow) {
    timeline.to(
      wallGlow,
      { opacity: compact ? 0.4 : 0.48, duration: span(0.14), ease: 'power2.out' },
      at(0.05),
    )
  }

  /*
   * Phase 3 — 30 to 48 %: paper becomes presentation board. The flat surface
   * fades in over the texture while the paper layer itself is held back, so
   * grain and blotches recede and the sheet reads as a museum board. The plan is
   * printed on top of it and is not touched here.
   */
  if (boardSurface) {
    timeline.to(boardSurface, { opacity: 0.94, duration: span(0.18), ease: 'power1.inOut' }, at(0.3))
  }
  if (paper) {
    timeline.to(paper, { opacity: 0.72, duration: span(0.18), ease: 'power1.inOut' }, at(0.3))
  }
  /*
   * The surround is lifted towards the board's own tone at the same time. It
   * turns the desk-grey ground into gallery light, and it is also what stops the
   * board's far edge from cutting a hard seam across the building: the wireframe
   * is transparent, so wherever it crosses that edge the backdrop shows through
   * it. Bringing the two tones together makes the crossing almost invisible.
   */
  if (stage) {
    timeline.to(
      stage,
      { backgroundColor: '#f4f1ec', duration: span(0.22), ease: 'power1.inOut' },
      at(0.3),
    )
  }
  /* The wall emphasis belongs to the paper drawing, so it retires with it. */
  if (wallGlow) {
    timeline.to(wallGlow, { opacity: 0, duration: span(0.16), ease: 'power1.inOut' }, at(0.32))
  }

  /*
   * Phase 4 — 44 to 96 %: the building grows out of the plan, bottom to top.
   * Each stage rises to its own storey and is followed by a short hold, so the
   * walls read as built rather than extruded. The mask edge is feathered, so no
   * stage ever lands as a hard line.
   */
  if (bodyLayers.length) {
    /* Seats the building on the footprint just before it becomes visible. */
    timeline.to(
      bodyLayers,
      { opacity: 1, duration: span(0.06), ease: 'power1.inOut', onUpdate: ensurePlaced },
      at(0.4),
    )
  }

  if (hasBuilding) {
    STAGE_WINDOWS.forEach(([start, end], index) => {
      timeline.to(
        revealTargets,
        {
          '--reveal': reveal(STAGES[index]),
          duration: span(end - start),
          ease: 'power2.inOut',
          /* Also here, not just on the fade-in: a reader who lands deep in the
             page — a restored scroll position, a jump — never renders a frame in
             that earlier window, and would otherwise get an unplaced building.
             The flag makes every call after the first a no-op. */
          onUpdate: ensurePlaced,
        },
        at(start),
      )
    })
  }

  /*
   * Phase 5 — 46 to 96 %: the plan recedes into the board it is printed on. It
   * stays clearly legible through most of the construction and only drops to a
   * trace at the end, so the building never stops looking like it came out of
   * this drawing. Reducing the opacity of a multiply layer reduces its contrast
   * at the same time, so no filter animation is needed.
   *
   * Skipped without a building: fading the drawing away with nothing to hand
   * over to would only empty the board.
   */
  if (plan && hasBuilding) {
    timeline.to(plan, { opacity: 0.66, duration: span(0.28), ease: 'power1.inOut' }, at(0.46))
    timeline.to(plan, { opacity: 0.32, duration: span(0.2), ease: 'power1.inOut' }, at(0.74))
    timeline.to(plan, { opacity: 0.07, duration: span(0.14), ease: 'power2.inOut' }, at(0.88))
  }

  /* The board keeps cleaning up as the drawing leaves it. */
  if (boardSurface && hasBuilding) {
    timeline.to(boardSurface, { opacity: 1, duration: span(0.2), ease: 'power1.inOut' }, at(0.76))
  }

  /*
   * Phase 6 — the building's own slow lift across the whole build, so it reads
   * as rising out of the board rather than being unmasked in place. Small enough
   * to stay subliminal.
   */
  if (building && hasBuilding) {
    timeline.to(
      building,
      {
        yPercent: compact ? -0.9 : -1.5,
        scale: 1.016,
        duration: span(0.54),
        ease: 'power1.inOut',
      },
      at(0.42),
    )
  }

  /*
   * Handed back so the caller can invalidate the placement on a refresh. The
   * board's pose is already final by then if the reader is past the tilt, so it
   * re-measures immediately; otherwise it waits for the timeline to reach the
   * point where measuring is meaningful.
   */
  return (boardIsSettled: boolean) => {
    needsPlacement = true
    if (boardIsSettled) ensurePlaced()
  }
}
