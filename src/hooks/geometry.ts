/**
 * Measured geometry of the two source artworks, and the maths the camera needs.
 * Kept apart from the choreography so the numbers can be re-measured without
 * touching timing.
 */

/**
 * The sheet's four actual corners as fractions of its image box, traced from
 * paper_sheet_main.png. The sheet is neither axis-aligned nor a true rectangle
 * — its top edge sits at +4.4°, its bottom at +7.4°.
 */
export const SHEET_CORNERS = [
  { x: 0.1616, y: 0.0545 },
  { x: 0.9264, y: 0.1431 },
  { x: 0.8834, y: 0.9179 },
  { x: 0.0697, y: 0.7601 },
]

/** Rotation of the plan inside the sheet's frame. */
export const PLAN_ROTATION = 4.4

/** The camera's transform-origin, matching .camera's transform-origin in CSS. */
export const CAMERA_ORIGIN = { x: 0.495, y: 0.48 }

/**
 * Safety margin on top of the exact covering scale — absorbs sub-pixel
 * rounding and the deckled edge's few pixels of raggedness, which the traced
 * polygon smooths over.
 */
export const ENTER_OVERFILL = 1.04

/** Where the master building's own ground outline sits inside its image. */
export const FOOTPRINT = { centreX: 0.5459, centreY: 0.5442, width: 0.8301 }

/**
 * Smallest scale at which the sheet, rotated to its final angle, completely
 * contains the viewport.
 *
 * A bounding-box calculation is not enough: the sheet ends up a rotated
 * trapezoid, so scaling until its *box* covers the viewport still leaves the
 * corners short and a sliver of the room shows through. This works on the real
 * silhouette — for every edge of the quad it asks how far that edge has to be
 * pushed out to clear the furthest viewport corner, and takes the worst case.
 */
export function sheetCoverScale(
  boxWidth: number,
  boxHeight: number,
  vw: number,
  vh: number,
): number {
  const theta = (-PLAN_ROTATION * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  const corners = SHEET_CORNERS.map(({ x, y }) => {
    const ux = (x - CAMERA_ORIGIN.x) * boxWidth
    const uy = (y - CAMERA_ORIGIN.y) * boxHeight
    return { x: ux * cos - uy * sin, y: ux * sin + uy * cos }
  })

  /* Viewport corners, relative to the origin's final resting point. */
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

    /* Inward normal of this edge (the quad is wound clockwise on screen). */
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

/** Reads a `<number>vh` custom property, falling back if it is absent. */
export function readLength(styles: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(styles.getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}
