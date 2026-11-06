import { useEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ScrollTrigger ist Teil des `gsap`-Pakets und wird hier einmalig global
// registriert. GSAP ignoriert wiederholte Aufrufe.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/**
 * Hält die GSAP-Verdrahtung für Szene 01.
 *
 * Aktuell bewusst nur Grundgerüst: Der Hook legt einen `gsap.context()` an,
 * der auf das Wurzelelement der Szene begrenzt ist, und räumt ihn beim Unmount
 * wieder ab — inklusive React StrictMode, der Effekte im Dev-Modus doppelt
 * ausführt. Spätere Animationen werden innerhalb des Contexts ergänzt; damit
 * sind Selektoren automatisch auf die Szene begrenzt und werden sauber
 * zurückgesetzt.
 *
 * @returns Ref, der auf das Wurzelelement der Szene gesetzt wird.
 */
export function useScene01Animation<T extends HTMLElement = HTMLDivElement>(): RefObject<T | null> {
  const scope = useRef<T>(null)

  useEffect(() => {
    const root = scope.current
    if (!root) return

    const context = gsap.context(() => {
      // Noch keine Animation. Platzhalter für die spätere Choreografie, z. B.:
      //
      // gsap.to('[data-layer="sheet"]', {
      //   yPercent: -10,
      //   ease: 'none',
      //   scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      // })
    }, root)

    return () => context.revert()
  }, [])

  return scope
}
