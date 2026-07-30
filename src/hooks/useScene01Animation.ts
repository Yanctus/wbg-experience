import { useEffect } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * ScrollTrigger is part of the `gsap` package and must never be installed
 * separately. Registration happens once at module scope; the guard keeps a
 * second evaluation (HMR, multiple importers) from re-registering the plugin.
 */
let pluginsRegistered = false

if (!pluginsRegistered) {
  gsap.registerPlugin(ScrollTrigger)
  pluginsRegistered = true
}

/**
 * Animation hook for Scene 01.
 *
 * Currently a no-op placeholder that only establishes the lifecycle contract:
 * every tween/ScrollTrigger created inside the `gsap.context()` is reverted on
 * cleanup, so React Strict Mode's double mount in development cannot leak
 * duplicated animations or triggers.
 */
export function useScene01Animation(scopeRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return

    const ctx = gsap.context(() => {
      // Timelines and ScrollTriggers for Scene 01 will be defined here.
    }, scope)

    return () => {
      ctx.revert()
    }
  }, [scopeRef])
}
