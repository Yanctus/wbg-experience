/**
 * Scene 02's asset manifest.
 *
 * Kept in its own module so Scene02.tsx exports nothing but its component —
 * mixing constants and components in one file breaks React Fast Refresh.
 */

/**
 * Lighter derivatives, tried before the original.
 *
 * The wireframe ships as a 4096px PNG — 3.5 MB, which is half a minute on a
 * weak connection for a drawing that is never painted wider than about 950 CSS
 * pixels. The 2048px WebP next to it is a twentieth of that and visually
 * identical at display size. The PNG stays the source of truth: if it is
 * replaced, the WebP is regenerated from it (see README.txt), and if the WebP
 * is missing the probe below simply falls back.
 */
const PREFERRED: Partial<Record<Scene02AssetKey, string>> = {
  wireframe: '/assets/scene-02/building_wireframe.webp',
}

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
 * Probed by decoding the image rather than by asking the server about it. The
 * obvious implementation — a HEAD request — asks the wrong question in too many
 * places: static hosts and CDNs may answer HEAD with 405, a file:// or
 * cross-origin context fails the fetch outright, and a dev server answers a
 * missing public file with its HTML fallback. Every one of those makes a file
 * that is right there look absent, and an absent building silently empties the
 * whole second half of the sequence.
 *
 * A decode cannot lie in either direction: HTML does not decode as an image,
 * and an image that decodes is one the <img> below can draw. It also costs
 * nothing extra — the tag reuses this very response from the cache.
 */
export async function probeAssets(): Promise<Map<Scene02AssetKey, string>> {
  const keys = Object.keys(SCENE_02_ASSETS) as Scene02AssetKey[]

  const decodes = (src: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img.naturalWidth > 0)
      img.onerror = () => resolve(false)
      img.src = src
    })

  const results = await Promise.all(
    keys.map(async (key): Promise<[Scene02AssetKey, string] | null> => {
      const preferred = PREFERRED[key]
      if (preferred && (await decodes(preferred))) return [key, preferred]
      return (await decodes(SCENE_02_ASSETS[key])) ? [key, SCENE_02_ASSETS[key]] : null
    }),
  )

  return new Map(results.filter((entry): entry is [Scene02AssetKey, string] => entry !== null))
}
