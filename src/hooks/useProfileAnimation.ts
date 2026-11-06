import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ScrollTrigger ist Teil des `gsap`-Pakets. Mehrfaches Registrieren ist harmlos.
gsap.registerPlugin(ScrollTrigger)

/**
 * Strichlänge pro Element zur Laufzeit messen und als Dash-Muster setzen:
 * So „zeichnet“ sich jede Linie (Wand, Möbel, Maßlinie) von selbst ein.
 */
const strokeLength = (_index: number, target: Element) =>
  (target as SVGGeometryElement).getTotalLength()

const DASH_FROM = { strokeDasharray: strokeLength, strokeDashoffset: strokeLength }
const DASH_TO = { strokeDashoffset: 0, clearProps: 'strokeDasharray,strokeDashoffset' }

/**
 * Animationen der Profilseite. Die Elemente werden über `data-*`-Attribute
 * angesprochen (CSS-Modules benennen Klassen um):
 *
 *   data-bar            Kopfleiste (bekommt Hintergrund beim Scrollen)
 *   data-intro=…        Auftakt: bar | ring | fade
 *   data-line           Namenszeilen, die aus einer Maske hochfahren
 *   data-cell           Zellen des Schriftfelds
 *   data-reveal         Einblenden beim Scrollen
 *   data-rule           Maßlinien, die sich aufziehen
 *   data-count          Zahlen, die hochzählen
 *   data-plan …         Grundriss: data-draw / data-fade / data-marker
 *   data-timeline-line  Zeitstrahl-Linie, wächst mit dem Scrollen
 *   data-grid           Rasterhintergrund (leichter Parallax)
 *   data-light          Lichtfleck, folgt dem Mauszeiger
 *   data-tilt           Karten, die sich zum Zeiger neigen
 *
 * Wichtig: Versteckt wird ausschließlich per GSAP (`from`/`set`), nie per CSS.
 * Läuft die Animation nicht (reduzierte Bewegung), ist deshalb alles sichtbar.
 *
 * @param formatLocale  Locale für die Zahlen beim Hochzählen
 * @param lang          Sprachcode; bei Wechsel ändern sich Textlängen → ScrollTrigger neu messen
 */
export function useProfileAnimation<T extends HTMLElement = HTMLDivElement>(
  formatLocale: string,
  lang: string,
): RefObject<T | null> {
  const scope = useRef<T>(null)
  // Per Ref, damit ein Sprachwechsel die laufende Animation nicht neu aufbaut.
  const locale = useRef(formatLocale)

  useEffect(() => {
    locale.current = formatLocale
  }, [formatLocale])

  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return

    const mm = gsap.matchMedia()

    // Immer aktiv (keine Bewegung): Kopfleiste bekommt ab 24 px Scroll einen Hintergrund.
    // Bewusst ein schlichter Listener: Ein ScrollTrigger mit `end: 'max'` gilt am
    // exakten Seitenende als inaktiv, die Leiste würde dort wieder durchsichtig.
    const bar = root.querySelector<HTMLElement>('[data-bar]')
    const updateBar = () => bar?.toggleAttribute('data-scrolled', window.scrollY > 24)
    window.addEventListener('scroll', updateBar, { passive: true })
    updateBar()

    /* -------------------------------------------------- Bewegung erlaubt */
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        // 1) Auftakt
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-intro="bar"]', { yPercent: -100, opacity: 0, duration: 0.9 })
          .fromTo(
            '[data-intro="ring"]',
            DASH_FROM,
            { ...DASH_TO, duration: 1.5, ease: 'power2.inOut' },
            0.1,
          )
          .from('[data-intro="fade"]', { opacity: 0, y: 18, duration: 0.9, stagger: 0.09 }, 0.15)
          .from('[data-line]', { yPercent: 110, duration: 1.15, stagger: 0.12, ease: 'power4.out' }, 0.25)
          .from('[data-cell]', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.7)

        // 2) Abschnitte blenden beim Scrollen ein (in Gruppen, damit Nachbarn gestaffelt kommen).
        //    Versteckt wird NUR über `opacity`, nie über `visibility` (autoAlpha): Sonst wären
        //    Schalter, Buttons und Radios unfokussierbar, und Tastaturnutzer kämen mit Tab
        //    nie über die Kopfleiste hinaus.
        const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]')
        gsap.set(reveals, { opacity: 0, y: 36 })
        ScrollTrigger.batch(reveals, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }),
        })

        // Was Fokus bekommt, muss sofort sichtbar sein — auch wenn der Scrolltrigger
        // noch nicht ausgelöst hat (Tastatur springt schneller als die Animation).
        const revealOnFocus = (event: FocusEvent) => {
          const section = (event.target as Element).closest<HTMLElement>('[data-reveal]')
          if (section) gsap.to(section, { opacity: 1, y: 0, duration: 0.4, overwrite: 'auto' })
        }
        root.addEventListener('focusin', revealOnFocus)

        // 3) Maßlinien ziehen sich auf
        for (const rule of gsap.utils.toArray<HTMLElement>('[data-rule]')) {
          gsap.from(rule, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.2,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: rule, start: 'top 94%', once: true },
          })
        }

        // 4) Zahlen zählen hoch. Der Text wird über den vorhandenen Textknoten
        //    geschrieben, damit React ihn bei einem Sprachwechsel weiter besitzt.
        const counters = gsap.utils.toArray<HTMLElement>('[data-count]').flatMap((el) => {
          const node = el.firstChild
          if (!node) return []
          const target = Number(el.dataset.value)
          const decimals = Number(el.dataset.decimals ?? 0)
          const write = (value: number) => {
            node.nodeValue = new Intl.NumberFormat(locale.current, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            }).format(value)
          }

          const state = { value: 0 }
          write(0)
          ScrollTrigger.create({
            trigger: el,
            start: 'top 94%',
            once: true,
            onEnter: () =>
              gsap.to(state, {
                value: target,
                duration: 1.8,
                ease: 'power3.out',
                onUpdate: () => write(state.value),
                onComplete: () => write(target),
              }),
          })
          return [() => write(target)]
        })

        // 5) Grundriss zeichnet sich: erst Wände, dann Details, Maße, zuletzt die Marken
        const plan = root.querySelector('[data-plan]')
        if (plan) {
          gsap
            .timeline({
              scrollTrigger: { trigger: plan, start: 'top 78%', once: true },
              defaults: { ease: 'power2.inOut' },
            })
            .fromTo(
              plan.querySelectorAll('[data-draw="wall"]'),
              DASH_FROM,
              { ...DASH_TO, duration: 1.3, stagger: 0.035 },
            )
            .fromTo(
              plan.querySelectorAll('[data-draw="dim"]'),
              DASH_FROM,
              { ...DASH_TO, duration: 0.8, stagger: 0.03 },
              0.35,
            )
            .fromTo(
              plan.querySelectorAll('[data-draw="detail"]'),
              DASH_FROM,
              { ...DASH_TO, duration: 0.9, stagger: 0.02 },
              0.7,
            )
            .from(plan.querySelectorAll('[data-fade]'), { opacity: 0, duration: 0.5 }, 1.0)
            .from(
              plan.querySelectorAll('[data-marker]'),
              {
                scale: 0,
                transformOrigin: '50% 50%',
                duration: 0.5,
                stagger: 0.07,
                ease: 'back.out(2.2)',
              },
              1.6,
            )
        }

        // 6) Zeitstrahl wächst mit dem Scrollen
        const line = root.querySelector<HTMLElement>('[data-timeline-line]')
        if (line?.parentElement) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: 'top center',
              ease: 'none',
              scrollTrigger: {
                trigger: line.parentElement,
                start: 'top 72%',
                end: 'bottom 62%',
                scrub: 0.6,
              },
            },
          )
        }

        // 7) Rasterhintergrund wandert minimal langsamer als der Inhalt
        gsap.to('[data-grid]', {
          yPercent: -5,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: true },
        })

        // Wird die Bewegung später abgeschaltet, sollen die Zahlen ihren Endwert zeigen.
        return () => {
          root.removeEventListener('focusin', revealOnFocus)
          for (const restore of counters) restore()
        }
      },
      root,
    )

    /* -------------------------- Bewegung erlaubt und Maus vorhanden (Desktop) */
    mm.add(
      '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
      () => {
        const cleanups: Array<() => void> = []

        // Lichtfleck: folgt dem Zeiger mit Trägheit. Ruht der Zeiger, kostet das nichts.
        const light = root.querySelector<HTMLElement>('[data-light]')
        if (light) {
          const current = { x: window.innerWidth * 0.14, y: window.innerHeight * 0.06 }
          const target = { ...current }
          const onMove = (event: PointerEvent) => {
            target.x = event.clientX
            target.y = event.clientY
          }
          const tick = () => {
            const dx = target.x - current.x
            const dy = target.y - current.y
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return
            current.x += dx * 0.09
            current.y += dy * 0.09
            light.style.setProperty('--lx', `${current.x.toFixed(1)}px`)
            light.style.setProperty('--ly', `${current.y.toFixed(1)}px`)
          }
          window.addEventListener('pointermove', onMove, { passive: true })
          gsap.ticker.add(tick)
          cleanups.push(() => {
            window.removeEventListener('pointermove', onMove)
            gsap.ticker.remove(tick)
            light.style.removeProperty('--lx')
            light.style.removeProperty('--ly')
          })
        }

        // Karten neigen sich leicht zum Zeiger; der Lichtreflex wandert mit.
        for (const card of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
          gsap.set(card, { transformPerspective: 1100 })
          const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' })
          const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' })

          const onMove = (event: PointerEvent) => {
            const box = card.getBoundingClientRect()
            const x = (event.clientX - box.left) / box.width
            const y = (event.clientY - box.top) / box.height
            rotateY((x - 0.5) * 6)
            rotateX(-(y - 0.5) * 6)
            card.style.setProperty('--sx', `${(x * 100).toFixed(1)}%`)
            card.style.setProperty('--sy', `${(y * 100).toFixed(1)}%`)
          }
          const onLeave = () => {
            rotateX(0)
            rotateY(0)
            card.style.removeProperty('--sx')
            card.style.removeProperty('--sy')
          }

          card.addEventListener('pointermove', onMove)
          card.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            card.removeEventListener('pointermove', onMove)
            card.removeEventListener('pointerleave', onLeave)
          })
        }

        return () => {
          for (const cleanup of cleanups) cleanup()
        }
      },
      root,
    )

    return () => {
      mm.revert()
      window.removeEventListener('scroll', updateBar)
    }
  }, [])

  // Andere Sprache = andere Textlängen = andere Positionen. Nach dem Rendern neu messen.
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [lang])

  return scope
}
