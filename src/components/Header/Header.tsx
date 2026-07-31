import styles from './Header.module.css'

const LINKS = [
  { label: 'Wohnraum', href: '#wohnraum' },
  { label: 'Genossenschaft', href: '#genossenschaft' },
  { label: 'Service', href: '#service' },
  { label: 'Mieterbereich', href: '#mieterbereich' },
]

/**
 * Minimal transparent header.
 *
 * It carries no background of its own: the story sets --header-ink as the
 * scene brightness changes, so the type keeps its contrast from the bright
 * opening through to the darker material of scene 03 without ever drawing a
 * bar across the picture.
 */
export function Header() {
  return (
    <header className={styles.header} data-story-header>
      <a className={styles.brand} href="#top">
        <span className={styles.mark}>WBG</span>
        <span className={styles.brandText}>Mieterschutz eG</span>
      </a>

      <nav className={styles.nav} aria-label="Hauptnavigation">
        <ul>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
