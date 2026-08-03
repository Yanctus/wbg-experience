/**
 * Every asset the story can use, in one place.
 *
 * `optional` assets are probed at runtime and simply left out when they are not
 * on disk, so the sequence degrades gracefully instead of showing broken
 * images — the Higgsfield-generated photoreal and environment layers drop in
 * here without a code change.
 */

/** Sources kept as-is. */
export const PAPER = {
  background: '/assets/scene-01/background_paper_base.png',
  shadow: '/assets/scene-01/shadow_soft_paper.png',
  sheet: '/assets/scene-01/paper_sheet_main.png',
  light: '/assets/scene-01/light_overlay_soft_top_left.png',
  grain: '/assets/scene-01/grain_overlay.png',
  dust: '/assets/scene-01/dust_particles_overlay.png',
} as const

/**
 * The plan, split into the order an architect draws it in. Derived from
 * blueprint_master.png by tools/derive-assets.py — same drawing, same
 * geometry, one transparent layer per stage.
 */
export const PLAN_LAYERS = [
  { key: 'footprint', src: '/assets/derived/plan-1-footprint.webp', axis: 'x' },
  { key: 'walls', src: '/assets/derived/plan-2-walls.webp', axis: 'y' },
  { key: 'stair', src: '/assets/derived/plan-3-stair.webp', axis: 'y-up' },
  { key: 'openings', src: '/assets/derived/plan-4-openings.webp', axis: 'x' },
  { key: 'annotation', src: '/assets/derived/plan-5-annotation.webp', axis: 'x' },
] as const

export type PlanLayer = (typeof PLAN_LAYERS)[number]

/** Natural size of the plan and paper artwork. */
export const PAPER_SIZE = { width: 1536, height: 1024 }

/** Natural size of the building artwork (square, master framing). */
export const BUILDING_SIZE = { width: 2048, height: 2048 }

export const BUILDING = {
  /** Line drawing of the master building. Drives the construction sequence. */
  wireframe: '/assets/derived/building-wireframe.webp',
  /** The same silhouette as a white massing model. */
  white: '/assets/derived/building-white.webp',
} as const

/**
 * Assets that do not exist yet. Each is probed before it is mounted, so the
 * story runs without them and picks them up the moment they land.
 */
export const OPTIONAL = {
  /** Photoreal master building — identical camera, geometry and framing. */
  photoreal: '/assets/scene-03/building_photoreal.webp',
  /** Contact shadow under the building. */
  buildingShadow: '/assets/scene-03/building_shadow.webp',
  /** Sky or architectural backdrop, far plane. */
  backdrop: '/assets/scene-03/backdrop.webp',
  /** Landscaping in front of the building, near plane. */
  foreground: '/assets/scene-03/foreground.webp',
} as const

export type OptionalKey = keyof typeof OPTIONAL

/**
 * Which optional assets are actually present.
 *
 * Probed by decoding the image rather than with a HEAD request: static hosts
 * and CDNs may answer HEAD with 405, a cross-origin context fails the fetch
 * outright, and a dev server answers a missing public file with its HTML
 * fallback — each of which makes a file that is right there look absent. A
 * decode cannot be wrong in either direction, and the <img> reuses the very
 * same response from cache.
 */
export function probeOptional(): Promise<Map<OptionalKey, string>> {
  const keys = Object.keys(OPTIONAL) as OptionalKey[]

  const decodes = (src: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img.naturalWidth > 0)
      img.onerror = () => resolve(false)
      img.src = src
    })

  return Promise.all(
    keys.map(async (key): Promise<[OptionalKey, string] | null> =>
      (await decodes(OPTIONAL[key])) ? [key, OPTIONAL[key]] : null,
    ),
  ).then((found) => new Map(found.filter((e): e is [OptionalKey, string] => e !== null)))
}

/** Loaded before the story starts — everything the opening frame needs. */
export const CRITICAL: readonly string[] = [
  PAPER.background,
  PAPER.shadow,
  PAPER.sheet,
  PAPER.light,
  ...PLAN_LAYERS.map((layer) => layer.src),
]
