import { useEffect } from 'react'
import ProfilePage from './components/Profile/ProfilePage'
import Scene01 from './components/Scene01/Scene01'
import { useHashRoute } from './hooks/useHashRoute'
import { I18nProvider } from './i18n/I18nProvider'

/**
 * Zwei Routen, per Hash: `#/profil` zeigt die Profilseite, alles andere die Szene.
 * Der Sprach-Provider sitzt über beiden, damit die Wahl beim Wechseln erhalten bleibt.
 */
export default function App() {
  const route = useHashRoute()

  // Eine neue „Seite“ beginnt oben, nicht an der alten Scrollposition.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return <I18nProvider>{route === '/profil' ? <ProfilePage /> : <Scene01 />}</I18nProvider>
}
