# WBG Experience

Technisches Grundgerüst für eine scrollgesteuerte Szenen-Experience.

## Stack

| Baustein | Einsatz |
| --- | --- |
| React 19 + TypeScript | Komponenten |
| Vite 8 | Dev-Server und Build |
| GSAP + ScrollTrigger | Scroll-Animationen |
| CSS Modules | Komponenten-Styles |

ScrollTrigger ist Teil des `gsap`-Pakets und wird daraus importiert — kein
separates Paket. Bewusst **nicht** im Stack: Tailwind, Framer Motion, Lenis,
Three.js.

## Loslegen

```bash
npm install
npm run dev     # Dev-Server auf http://localhost:5173
```

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server mit Hot Reload |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Produktions-Build lokal ausliefern |
| `npm run lint` | oxlint |
| `npm run check:assets` | PNG-Transparenzprüfung (siehe unten) |

## Struktur

```
public/assets/scene-01/    Bild-Ebenen, über feste Pfade /assets/scene-01/… geladen
public/assets/scene-02/    noch ungenutzt
scripts/                   check-png-alpha.mjs
src/
  components/
    Scene01/               Szene 01 (Gerüst): Scene01.tsx, .module.css, layers.ts
    Profile/               Profilseite: ProfilePage, FloorPlan, HomeSection, …
    Sheet/                 „Pergamentkarte“ und Abschnitts-Überschrift (geteilt)
    LanguageSwitcher/      Sprachumschalter
  hooks/                   useScene01Animation, useProfileAnimation,
                           useHashRoute, useDocumentMeta
  i18n/                    Sprachsystem (siehe unten)
  styles/                  global.css, a11y.module.css
  App.tsx, main.tsx
```

Dateien unter `public/` werden unverändert ausgeliefert: Der Pfad im Code
entspricht exakt dem Pfad im Browser, ohne Hashing durch den Bundler.

## Zustand

Szene 01 ist reines Gerüst: Ebenen-Container, Asset-Inventar und die
GSAP-Anbindung stehen, eine Choreografie gibt es noch nicht.
`useScene01Animation` legt einen auf die Szene begrenzten `gsap.context()` an
und räumt ihn beim Unmount wieder ab — spätere Animationen kommen dort hinein.

## Profilseite

Erreichbar unter **`/#/profil`** (Link auf der Startseite). Routing per Hash,
bewusst ohne Router-Bibliothek — Folge: Innerhalb der Seiten keine `#anker`-Links
verwenden, sie würden die Route wechseln.

Gestaltung: die Papier-Palette des Projekts, dazu ein einziges kühles
Blaupausen-Blau für alles Interaktive. Statt Standard-Karten gibt es
„Pergamentblätter“ mit Schnittmarken, ein Schriftfeld wie der Planstempel auf
einer Bauzeichnung und die Wohnung als Grundriss, der sich beim Scrollen
einzeichnet — mit Raumbuch, das mit dem Plan verbunden ist. Papierkorn und
Lichtfleck entstehen per CSS/SVG; die PNG-Ebenen mit eingebranntem Schachbrett
(siehe unten) werden dafür nicht gebraucht. Genutzt wird nur das saubere
`background_paper_base.png`.

Alle Daten sind **Beispieldaten** (`Profile/profile.data.ts`) und auf der Seite
als solche gekennzeichnet. Sobald es ein Backend gibt, wird dieses Modul ersetzt.

Bedienung und Barrierefreiheit: alles per Tastatur erreichbar, Plan-Auswahl über
echte Buttons, Sprachwahl als native Radiogruppe, `prefers-reduced-motion`
schaltet sämtliche Animationen ab (alle Inhalte stehen dann sofort da).
Wichtig dafür: Versteckt wird in `useProfileAnimation` nur per `opacity`, nie per
`visibility` — sonst wären Bedienelemente unterhalb des Bildschirms für Tab
unerreichbar.

## Sprachen

Deutsch (Quellsprache), Română, Türkçe, Italiano, Kölsch — ohne i18n-Bibliothek.

```
src/i18n/
  languages.ts       Register: Code, lang-Attribut, Eigenname, Zahlenformat
  messages/de.ts     Quellsprache; ihre Schlüssel definieren die Typen
  messages/ro|tr|it|ksh.ts
  I18nProvider.tsx, useI18n.ts
```

`messages/types.ts` leitet die Schlüssel aus `de.ts` ab: Fehlt in irgendeiner
Sprache ein Schlüssel oder ist einer falsch geschrieben, bricht der Build. Eine
neue Sprache ergänzen = Datei anlegen, in `messages/index.ts` und `languages.ts`
eintragen.

Hinweise:

- **Kölsch braucht eine Prüfung durch Muttersprachler.** Es gibt keine verbindliche
  Rechtschreibung; die Fassung folgt den gängigen Mustern und ist in
  `messages/ksh.ts` im Kopfkommentar dokumentiert, samt der unsichersten Stellen.
- Rumänisch, Türkisch und Italienisch sind Standardsprachen und im UI-Register
  übersetzt; Rechtsbegriffe der Genossenschaft (Geschäftsanteile, Nebenkosten)
  sollten vor dem Go-Live trotzdem gegengelesen werden.
- Das `lang`-Attribut am `<html>`-Element wird mitgeführt. Für Türkisch ist das
  zwingend: Nur damit macht `text-transform: uppercase` aus „i“ ein „İ“.
- Bewusst keine Sätze mit eingebautem Datum oder Zahl (z. B. „seit 2019“): Im
  Türkischen hängt das Suffix am Klang der Zahl, das lässt sich nicht per
  Platzhalter lösen. Stattdessen stehen Bezeichnung und Wert getrennt.
- Die Wahl wird in `localStorage` gespeichert; ohne Wahl gilt die erste
  unterstützte Browsersprache, sonst Deutsch. Szene 01 ist noch nicht übersetzt.

## Assets: fehlende Transparenz

`npm run check:assets` prüft jede PNG-Datei darauf, ob sie einen echten
Alphakanal hat oder ob das Transparenz-Schachbrett als sichtbares Muster in die
RGB-Pixel eingebrannt wurde. Das Skript dekodiert die PNGs selbst (nur Node-
Bordmittel) und vergleicht die mittlere Helligkeit der beiden Schachbrett-
Paritäten über alle Kachelgrößen von 4 bis 64 Pixeln. Ein eingebranntes Muster
erzeugt bei genau einer Kachelgröße einen Ausschlag weit über dem Median.

Stand jetzt haben **alle sieben Dateien in `scene-01` keinen Alphakanal**
(8-bit RGB), bei sechs davon ist zusätzlich ein Schachbrett sichtbar
eingebrannt. Sie sind daher nicht als freigestellte Ebenen übereinanderlegbar.
Im Inventar (`src/components/Scene01/layers.ts`) sind sie als `needsAlpha`
markiert und bleiben ausgeblendet, bis sie als echte RGBA-PNGs vorliegen.
Gerendert wird vorerst nur der deckende Hintergrund.

`scene-02/building_wireframe.png` zeigt, wie es aussehen soll: RGBA mit 61,5 %
vollständig transparenten Pixeln.
