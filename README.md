# WBG Mieterschutz eG — Experience-Site

Eine filmische One-Page-Site für die Wohnungsbaugenossenschaft Mieterschutz eG
(Köln, gegründet 1925): scroll-gescrubbter Rundgang durch die Siedlung mit
3D-Parallax-Ebenen, Kapitel-Navigation und den Kernthemen der Genossenschaft
(Geschichte, Werte, Geschäftsanteile, Mitglied werden).

## Stack

- [Vite](https://vitejs.dev) + TypeScript, kein Framework
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) für
  Pinning + Scrubbing, [Lenis](https://lenis.darkroom.engineering/) für den
  Smooth Scroll
- Fraunces (Display) + Instrument Sans (Body), self-hosted via Fontsource

## Entwickeln

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Type-Check + Produktions-Build nach dist/
```

## Generierte Medien

Hero-Bild und der vierteilige Rundgang-Film (Quartier → Eingang →
Gemeinschaft → Garten) sind mit Higgsfield generiert (Nano Banana /
Seedance 2.0, verkettete Clips über extrahierte Endframes, zu einem
durchgehenden Film montiert und all-intra re-encodiert, damit das
Scroll-Scrubbing ruckelfrei seekt).

Die Dateien liegen auf dem Higgsfield-CDN und sind in
`src/assets.manifest.json` verzeichnet. Die Site bevorzugt lokale Kopien
unter `public/assets/` und fällt sonst auf die CDN-URLs zurück.

```bash
npm run fetch-assets   # lädt die CDN-Medien nach public/assets/
```

`public/assets/hero-placeholder.jpg` ist eingecheckt und dient als sofortiger
Blur-up-Platzhalter, damit die Seite auch ganz ohne Netzwerk steht.

## Platzhalter für den Go-Live

Mit `data-placeholder` markiert bzw. offensichtlich generisch:

- Telefonnummer & E-Mail des Mitgliederbüros (`index.html`, Abschnitt
  „Mitglied werden")
- Namen von Vorstand und Aufsichtsrat (Footer)
- Links zu Impressum, Datenschutz und Satzung (Footer)
- Das Formular sendet noch nirgendwohin — es zeigt clientseitig eine
  Bestätigung (`src/main.ts`)
- Zeitstrahl-Eintrag „19xx" in der Geschichte: echtes Datum einsetzen

## Barrierefreiheit

`prefers-reduced-motion` deaktiviert Pinning, Scrubbing und Parallax; der
Rundgang wird dann als stehendes Bild mit abspielbarem Video (Controls)
gezeigt, alle Inhalte bleiben ohne Animation sichtbar.
