import gsap from 'gsap'
import { CAMERA_ORIGIN, ENTER_OVERFILL, FOOTPRINT, PLAN_ROTATION, sheetCoverScale } from './geometry'
import type { ActOptions, StoryTargets } from './storyTargets'

/**
 * Act 2 — entering the drawing, laying the board down, and building on it.
 *
 * Nothing here cuts. The camera keeps moving from act 1's sheet all the way
 * into the finished white model, because it is one timeline on one stage: the
 * sheet grows until it *is* the world, then the same sheet tilts back into a
 * presentation board and the building rises off it.
 */

/** Presentation angle of the board, in degrees. */
const TILT = 58
const TILT_COMPACT = 52
const SETTLE_Y = 13
/*
 * On a phone the board settles much lower in the frame. The building grows
 * upward from the plan's centre, so where the plan sits decides how much
 * headroom the roof gets — at the desktop's settle the top storeys would be
 * outside the viewport.
 */
const SETTLE_Y_COMPACT = 16

/** Height the wireframe is masked to when the first storey appears. */
const REVEAL_START = 0.24
/** Mask heights the construction stops at, as fractions of the image. */
const STAGES = [0.4, 0.49, 0.58, 0.75, 0.95]
/** When each stage runs, as fractions of the construction act. */
const STAGE_WINDOWS: Array<[number, number]> = [
  [0.42, 0.52],
  [0.54, 0.62],
  [0.64, 0.71],
  [0.73, 0.8],
  [0.82, 0.89],
]

const pct = (fraction: number) => `${(fraction * 100).toFixed(2)}%`

/**
 * Measures the sheet at rest, with GSAP's own transforms cleared, so the camera
 * maths starts from the CSS pose rather than from wherever the timeline
 * happens to have left it.
 */
function measureAtRest(camera: HTMLElement, lift?: HTMLElement) {
  const saved = [camera, lift].filter(Boolean) as HTMLElement[]
  const state = saved.map((el) => ({
    el,
    x: gsap.getProperty(el, 'x'),
    y: gsap.getProperty(el, 'y'),
    scale: gsap.getProperty(el, 'scale'),
    yPercent: gsap.getProperty(el, 'yPercent'),
  }))
  gsap.set(saved, { x: 0, y: 0, scale: 1, yPercent: 0 })
  const rect = camera.getBoundingClientRect()
  state.forEach((s) => gsap.set(s.el, { x: s.x, y: s.y, scale: s.scale, yPercent: s.yPercent }))
  return rect
}

/**
 * Stands the building on the plan's printed footprint.
 *
 * The three probes live inside the plan, so their screen positions *are* the
 * footprint's perspective projection — the browser has already done that maths,
 * homography and all. Deliberately a plain measurement with nothing forced: it
 * runs from the timeline at the point where the board is already in its final
 * pose. Measuring earlier, or forcing a pose to measure it, reads the plan
 * before the camera has been applied and lands the building on the small sheet.
 */
function placeOnFootprint(targets: StoryTargets) {
  const { planCentre, planLeft, planRight, building, realAnchor } = targets
  if (!planCentre || !planLeft || !planRight) return

  const centre = planCentre.getBoundingClientRect()
  const left = planLeft.getBoundingClientRect()
  const right = planRight.getBoundingClientRect()

  const planWidth = Math.hypot(right.left - left.left, right.top - left.top)
  if (!planWidth) return

  for (const seat of [building, realAnchor]) {
    if (!seat) continue
    seat.style.setProperty('--plan-x', `${centre.left.toFixed(2)}px`)
    seat.style.setProperty('--plan-y', `${centre.top.toFixed(2)}px`)
    seat.style.setProperty('--size', `${(planWidth / FOOTPRINT.width).toFixed(2)}px`)
  }
}

export function buildEnterAct({ timeline, position, duration, targets }: ActOptions) {
  const { camera, lift, sheet, room, shadow, light, plan, content, hint } = targets
  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  if (!camera) return

  /*
   * How far the sheet has to grow, and where it has to end up. Function-based
   * values so a resize re-measures instead of keeping a stale number: with
   * invalidateOnRefresh these are re-read on every ScrollTrigger refresh.
   */
  const scale = () => {
    const rect = measureAtRest(camera, lift)
    if (!rect.width) return 3
    return (
      sheetCoverScale(rect.width, rect.height, window.innerWidth, window.innerHeight) *
      ENTER_OVERFILL
    )
  }

  const offset = () => {
    const rect = measureAtRest(camera, lift)
    if (!rect.width) return { x: 0, y: 0 }
    /* Bring the camera's origin to the centre of the viewport. */
    return {
      x: window.innerWidth / 2 - (rect.left + rect.width * CAMERA_ORIGIN.x),
      y: window.innerHeight / 2 - (rect.top + rect.height * CAMERA_ORIGIN.y),
    }
  }

  /*
   * One continuous move: the sheet grows, straightens onto the plan's own
   * angle and slides its centre to the middle of the frame. No cut — the paper
   * simply becomes the world, and its edges leave the frame on the way.
   */
  timeline.to(
    camera,
    {
      scale,
      x: () => offset().x,
      y: () => offset().y,
      rotate: -PLAN_ROTATION,
      duration: span(0.86),
      ease: 'power2.inOut',
    },
    position,
  )

  /* The room around the sheet is left behind as the paper takes the frame. */
  if (room) {
    timeline.to(room, { opacity: 0, duration: span(0.5), ease: 'power1.in' }, at(0.24))
  }
  if (shadow) {
    timeline.to(shadow, { opacity: 0, duration: span(0.4), ease: 'power1.in' }, at(0.2))
  }
  if (light) {
    timeline.to(light, { opacity: 0.3, duration: span(0.6), ease: 'power1.inOut' }, at(0.2))
  }
  if (hint) {
    timeline.to(hint, { opacity: 0, duration: span(0.1), ease: 'none' }, position)
  }
  if (content) {
    timeline.to(content, { opacity: 0, duration: span(0.14), ease: 'power1.inOut' }, position)
  }

  /*
   * The paper stays physical for most of the move and only the last stretch
   * trades its texture for the flat board, so the viewer is inside the drawing
   * before the sheet stops looking like paper.
   */
  if (plan) {
    timeline.to(plan, { opacity: 1, duration: span(0.2), ease: 'none' }, at(0.7))
  }
  if (sheet) {
    timeline.to(sheet, { opacity: 0.94, duration: span(0.24), ease: 'power1.inOut' }, at(0.74))
  }
}

export function buildConstructionAct({
  timeline,
  position,
  duration,
  targets,
  compact,
}: ActOptions) {
  const { tilt, stage, sheet, board, plan, planLayers, building, wireframe, white, act2 } = targets

  const at = (fraction: number) => position + fraction * duration
  const span = (fraction: number) => fraction * duration

  const rise = [wireframe, white].filter(Boolean) as HTMLElement[]
  const hasBuilding = rise.length > 0

  /* ------------------------------------------------------ initial state */

  if (rise.length) gsap.set(rise, { '--reveal': pct(REVEAL_START), opacity: 0 })
  if (white) gsap.set(white, { opacity: 0 })
  if (building) gsap.set(building, { yPercent: compact ? 1.2 : 1.8, scale: 0.988 })
  if (board) gsap.set(board, { opacity: 0 })

  /*
   * Measured once per layout rather than per frame — three rect reads force a
   * synchronous layout, which is not something to do on every scroll tick. It
   * runs from the tweens that need it, so a reader who lands deep in the page
   * still gets a placed building.
   */
  let needsPlacement = true
  const ensurePlaced = () => {
    if (!needsPlacement) return
    placeOnFootprint(targets)
    needsPlacement = false
  }

  /* --- the board lies down ------------------------------------------- */

  if (tilt) {
    timeline.to(
      tilt,
      {
        rotateX: compact ? TILT_COMPACT : TILT,
        yPercent: compact ? SETTLE_Y_COMPACT : SETTLE_Y,
        scale: () => {
          /*
           * How much of the frame the settled board takes. The dive has already
           * grown the sheet past the viewport, so this pulls it back: enough
           * that the plan still reads, little enough that the building standing
           * on it keeps its roof and its base inside the frame. Narrow screens
           * need to pull back hardest — the building is tall and the plan is
           * wide, and only one of them can win.
           */
          const vw = window.innerWidth
          const share = compact ? 0.62 : vw <= 1024 ? 0.76 : 0.92
          /* offsetWidth, not the client rect: the layout box is what the scale
             is relative to, and a rect would already include this very scale on
             a refresh and feed back on itself. */
          return (vw * share) / (tilt.offsetWidth || vw)
        },
        duration: span(0.3),
        ease: 'power2.inOut',
      },
      at(0.04),
    )
  }

  /* --- paper becomes a presentation board ----------------------------- */

  if (board) {
    timeline.to(board, { opacity: 0.94, duration: span(0.16), ease: 'power1.inOut' }, at(0.26))
  }
  if (sheet) {
    timeline.to(sheet, { opacity: 0.7, duration: span(0.16), ease: 'power1.inOut' }, at(0.26))
  }
  /*
   * The surround is lifted to the board's own tone at the same time. It turns
   * the desk into gallery light, and it also stops the board's far edge from
   * cutting a seam across the building: the wireframe is transparent, so
   * wherever it crosses that edge the backdrop shows through it.
   */
  if (stage) {
    timeline.to(
      stage,
      { backgroundColor: '#f4f1ec', duration: span(0.2), ease: 'power1.inOut' },
      at(0.26),
    )
  }

  /* --- the building rises --------------------------------------------- */

  if (hasBuilding) {
    /* Seats it on the footprint in the frame before it becomes visible. */
    timeline.to(
      wireframe as HTMLElement,
      { opacity: 1, duration: span(0.05), ease: 'power1.inOut', onUpdate: ensurePlaced },
      at(0.36),
    )

    STAGE_WINDOWS.forEach(([start, end], index) => {
      timeline.to(
        rise,
        {
          '--reveal': pct(STAGES[index]),
          duration: span(end - start),
          ease: 'power2.inOut',
          onUpdate: ensurePlaced,
        },
        at(start),
      )
    })

    /*
     * The white model takes over from the line drawing. Both are masked to the
     * same height at every moment, so the surfaces arrive exactly where the
     * lines were — the model fills in rather than replacing anything.
     */
    if (white) {
      timeline.to(white, { opacity: 1, duration: span(0.12), ease: 'power1.inOut' }, at(0.84))
    }
    if (wireframe) {
      timeline.to(wireframe, { opacity: 0.28, duration: span(0.12), ease: 'power1.inOut' }, at(0.88))
    }

    /* A slow lift across the whole build, so it rises rather than unmasks. */
    if (building) {
      timeline.to(
        building,
        {
          yPercent: compact ? -0.9 : -1.5,
          scale: 1.016,
          duration: span(0.55),
          ease: 'power1.inOut',
        },
        at(0.38),
      )
    }
  }

  /*
   * The drawing recedes into the board it is printed on: clearly legible
   * through most of the construction, a trace by the end, so the building never
   * stops looking like it came out of this plan. The structural footprint is
   * held back longest, because that is what the walls stand on.
   */
  if (plan && hasBuilding) {
    const secondary = planLayers.slice(1)
    if (secondary.length) {
      timeline.to(secondary, { opacity: 0.4, duration: span(0.22), ease: 'power1.inOut' }, at(0.44))
      timeline.to(secondary, { opacity: 0.1, duration: span(0.16), ease: 'power1.inOut' }, at(0.74))
    }
    timeline.to(plan, { opacity: 0.62, duration: span(0.2), ease: 'power1.inOut' }, at(0.7))
    timeline.to(plan, { opacity: 0.12, duration: span(0.14), ease: 'power2.inOut' }, at(0.86))
  }

  /* The headline arrives only as the white model completes. */
  if (act2) {
    timeline.fromTo(
      act2,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: span(0.09), ease: 'power2.out' },
      at(0.87),
    )
  }

  /* Handed back so a refresh can re-measure once the board is settled. */
  return (boardIsSettled: boolean) => {
    needsPlacement = true
    if (boardIsSettled) ensurePlaced()
  }
}
