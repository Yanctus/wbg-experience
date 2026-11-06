/** Basis-Pfad der Szenen-Assets. Liegt unter `public/`, wird also 1:1 ausgeliefert. */
export const ASSET_BASE = '/assets/scene-01'

/**
 * `opaque`     – Vollflächige Ebene, Transparenz wird nicht gebraucht.
 * `needsAlpha` – Ebene soll freigestellt über anderen liegen, die Datei hat aber
 *                keinen Alphakanal (siehe `npm run check:assets`).
 */
export type LayerStatus = 'opaque' | 'needsAlpha'

export interface SceneLayer {
  id: string
  file: string
  label: string
  status: LayerStatus
}

/** Vollständiges Ebenen-Inventar von Szene 01, Reihenfolge = Stapelreihenfolge. */
export const SCENE_01_LAYERS: SceneLayer[] = [
  { id: 'background', file: 'background_paper_base.png', label: 'Papier-Hintergrund', status: 'opaque' },
  { id: 'shadow', file: 'shadow_soft_paper.png', label: 'Weicher Schlagschatten', status: 'needsAlpha' },
  { id: 'sheet', file: 'paper_sheet_main.png', label: 'Freigestelltes Papierblatt', status: 'needsAlpha' },
  { id: 'blueprint', file: 'blueprint_master.png', label: 'Grundriss / Blueprint', status: 'needsAlpha' },
  { id: 'light', file: 'light_overlay_soft_top_left.png', label: 'Lichtstimmung oben links', status: 'needsAlpha' },
  { id: 'dust', file: 'dust_particles_overlay.png', label: 'Staubpartikel', status: 'needsAlpha' },
  { id: 'grain', file: 'grain_overlay.png', label: 'Filmkorn', status: 'needsAlpha' },
]

export const layerSrc = (layer: SceneLayer) => `${ASSET_BASE}/${layer.file}`
