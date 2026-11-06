import { useScene01Animation } from '../../hooks/useScene01Animation'
import { SCENE_01_LAYERS, layerSrc } from './layers'
import styles from './Scene01.module.css'

/**
 * Szene 01 — technisches Grundgerüst.
 *
 * Stellt den Ebenen-Container und die GSAP-Anbindung bereit. Gerendert wird
 * vorerst nur die deckende Hintergrundebene; die übrigen Ebenen sind im
 * Inventar (`layers.ts`) hinterlegt, aber deaktiviert, solange ihre PNGs keinen
 * Alphakanal haben. Noch ohne Animation.
 */
export default function Scene01() {
  const scope = useScene01Animation<HTMLElement>()

  const visible = SCENE_01_LAYERS.filter((l) => l.status === 'opaque')
  const pending = SCENE_01_LAYERS.filter((l) => l.status === 'needsAlpha')

  return (
    <main className={styles.scene} ref={scope}>
      <section className={styles.stage}>
        {visible.map((layer) => (
          <img
            key={layer.id}
            className={styles.layer}
            data-layer={layer.id}
            src={layerSrc(layer)}
            alt={layer.label}
            draggable={false}
          />
        ))}

        <div className={styles.hud}>
          <h1 className={styles.title}>WBG Experience</h1>
          <p className={styles.subtitle}>
            Grundgerüst — React&nbsp;+&nbsp;TypeScript&nbsp;+&nbsp;Vite&nbsp;+&nbsp;GSAP
            ScrollTrigger&nbsp;+&nbsp;CSS&nbsp;Modules
          </p>
          {pending.length > 0 && (
            <p className={styles.warning}>
              {pending.length} von {SCENE_01_LAYERS.length} Ebenen sind deaktiviert: Die
              PNGs haben keinen Alphakanal. Details via <code>npm run check:assets</code>.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
