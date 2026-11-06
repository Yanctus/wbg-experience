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
  components/Scene01/      Scene01.tsx, Scene01.module.css, layers.ts
  hooks/                   useScene01Animation.ts
  styles/                  global.css
  App.tsx, main.tsx
```

Dateien unter `public/` werden unverändert ausgeliefert: Der Pfad im Code
entspricht exakt dem Pfad im Browser, ohne Hashing durch den Bundler.

## Zustand

Szene 01 ist reines Gerüst: Ebenen-Container, Asset-Inventar und die
GSAP-Anbindung stehen, eine Choreografie gibt es noch nicht.
`useScene01Animation` legt einen auf die Szene begrenzten `gsap.context()` an
und räumt ihn beim Unmount wieder ab — spätere Animationen kommen dort hinein.

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
