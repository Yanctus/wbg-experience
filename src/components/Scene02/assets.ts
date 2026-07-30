/**
 * Scene 02's asset manifest.
 *
 * Kept in its own module so Scene02.tsx exports nothing but its component —
 * mixing constants and components in one file breaks React Fast Refresh.
 */

/** Drop location for the upcoming assets. */
export const SCENE_02_ASSETS = {
  /** Soft contact shadow, painted under the building. */
  shadow: '/assets/scene-02/building_shadow_soft.png',
  /** Solid white massing model. */
  solid: '/assets/scene-02/building_white.png',
  /** Line drawing of the same building, sits over the solid. */
  wireframe: '/assets/scene-02/building_wireframe.png',
  /** Axes, dimension lines and annotations, frontmost. */
  constructionLines: '/assets/scene-02/construction_lines_overlay.png',
} as const

/**
 * Set to true once the four files above are present in
 * `public/assets/scene-02/`.
 *
 * Kept false so the scene never requests a file that is not there — a 404 would
 * put an error in the console and a broken-image box on the blueprint. Nothing
 * else needs changing: the markup, the stacking order and the choreography in
 * useScene02Animation.ts are already wired for these four layers.
 */
export const ASSETS_READY = false

/** Natural pixel size of the upcoming assets — update when they arrive. */
export const EXPECTED_SIZE = { width: 1536, height: 1024 }
