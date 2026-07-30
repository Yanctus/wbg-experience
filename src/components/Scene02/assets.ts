/**
 * Scene 02's asset manifest.
 *
 * Kept in its own module so Scene02.tsx exports nothing but its component —
 * mixing constants and components in one file breaks React Fast Refresh.
 */

export const SCENE_02_ASSETS = {
  /** The transparent wireframe of the building. Drives the build sequence. */
  wireframe: '/assets/scene-02/building_wireframe.png',
  /** Soft contact shadow, painted under the building. */
  shadow: '/assets/scene-02/building_shadow_soft.png',
  /** Solid white massing model. */
  solid: '/assets/scene-02/building_white.png',
  /** Axes, dimension lines and annotations. */
  constructionLines: '/assets/scene-02/construction_lines_overlay.png',
} as const

export type Scene02AssetKey = keyof typeof SCENE_02_ASSETS

/** Natural pixel size of the assets — used to reserve space and avoid reflow. */
export const EXPECTED_SIZE = { width: 1920, height: 1920 }

/**
 * Which of the four files are actually present.
 *
 * Probed at runtime with a HEAD request rather than gated behind a hand-flipped
 * flag: the scene then starts working the moment a file is committed, with
 * nothing to remember to switch on. A missing file resolves as `ok: false`
 * instead of logging a failed-resource error the way a real <img> 404 would.
 */
export async function probeAssets(): Promise<Set<Scene02AssetKey>> {
  const keys = Object.keys(SCENE_02_ASSETS) as Scene02AssetKey[]

  const results = await Promise.all(
    keys.map(async (key) => {
      try {
        const response = await fetch(SCENE_02_ASSETS[key], { method: 'HEAD' })
        /*
         * A dev server can answer a missing public file with the SPA fallback,
         * so an HTML content type counts as absent rather than present.
         */
        const type = response.headers.get('content-type') ?? ''
        return response.ok && !type.includes('text/html') ? key : null
      } catch {
        return null
      }
    }),
  )

  return new Set(results.filter((key): key is Scene02AssetKey => key !== null))
}
