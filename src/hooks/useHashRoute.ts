import { useSyncExternalStore } from 'react'

/**
 * Minimaler Hash-Router: `#/profil` → `/profil`, alles andere → `/`.
 *
 * Bewusst ohne Router-Bibliothek (der Stack ist festgelegt) und ohne History-API:
 * Hash-Routen funktionieren auf jedem statischen Hosting ohne Rewrite-Regeln.
 * Folge: Innerhalb der Seiten dürfen keine `#anker`-Links verwendet werden,
 * sie würden die Route wechseln.
 */
function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getSnapshot() {
  const path = window.location.hash.replace(/^#/, '').replace(/\/+$/, '')
  return path === '' ? '/' : path
}

export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/')
}
