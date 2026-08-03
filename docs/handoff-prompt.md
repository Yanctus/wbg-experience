# Übergabe-Prompt für eine neue Session mit Higgsfield-Zugriff

Kopiere den Block unten in eine neue Claude-Code-Session, in der der
Higgsfield-Connector aktiv ist. Hänge die Referenzbilder an, die du hast —
mindestens das Vier-Stufen-Bild (Grundriss → Wände → Details → Zuhause).

---

```
Projekt: wbg-experience, Branch claude/react-typescript-vite-setup-77puc4.
Arbeite ausschließlich auf diesem Branch.

LIES ZUERST, bevor du irgendetwas generierst:
- docs/higgsfield-poc.md    (Testlauf, Prompt, Prüfkriterien)
- docs/higgsfield-brief.md  (die vier Szene-03-Assets)
- docs/poc/README.md        (vorbereitete Startframes)
- src/assets/manifest.ts    (welche Assets die Seite erwartet)

STAND
Die Seite ist fertig gebaut und läuft: eine durchgehende Scroll-Geschichte auf
einer gepinnten Bühne und einer Timeline. Blatt Papier → Grundriss zeichnet
sich → Kamera fährt in die Zeichnung → Blatt kippt zur Präsentationsplatte →
Gebäude wächst aus dem Grundriss → Weißmodell. Die Szene-03-Assets fehlen und
sind in src/assets/manifest.ts als OPTIONAL deklariert: sobald sie unter
public/assets/scene-03/ liegen, werden sie zur Laufzeit erkannt, ohne
Codeänderung.

WICHTIGER BEFUND, den du kennen musst
Die beiden vorhandenen Referenzen zeigen NICHT dasselbe Gebäude:
- public/assets/scene-01/blueprint_master.png ist ein eingeschossiges Haus,
  14,20 x 10,80 m, eine Wohneinheit.
- public/assets/scene-02/building_wireframe.png ist ein fünfgeschossiger
  Wohnblock mit Balkonen.
Wände, die aus diesem Grundriss wachsen, können nur dieses Haus ergeben.
Das angehängte Vier-Stufen-Referenzbild ist maßgeblich: Das Gebäude soll zum
Grundriss passen, also die aufgeschnittene Wohnung, nicht der Block.

AUFGABE 1 — Testlauf, genau EIN Video
Generiere ein einziges Video nach docs/higgsfield-poc.md:
Bild-zu-Video, Startframe docs/poc/frame-01-empty-sheet.png, 4 Sekunden,
niedrigste Auflösungsstufe, 16:9, statische Kamera, 1 Variante, günstigstes
Modell. Prompt und Negativ-Prompt stehen in der Datei.
Danach SOFORT STOPPEN und berichten:
- verwendetes Modell
- verbrauchte Credits
- die fünf Prüfpunkte aus der Datei, einzeln beantwortet
- ob die Geometrie stabil blieb
Keine Alternativen, keine zweite Generierung, kein automatisches Weitermachen.

AUFGABE 2 — nur nach meiner ausdrücklichen Freigabe
Wenn ich den Testlauf freigebe, generiere die vier Bilder nach
docs/higgsfield-brief.md (photoreal, shadow, backdrop, foreground). Die
Gebäude-Prompts brauchen zwingend building_wireframe.png als Referenzbild.
Importiere jedes Ergebnis mit:
    python3 tools/import-scene-03.py <datei> <rolle>
Das Skript prüft Seitenverhältnis und Transparenz und lehnt beides ab, wenn es
nicht passt — überstimme es nicht, sondern generiere neu.

AUFGABE 3 — nur nach meiner ausdrücklichen Freigabe
Ersetze den fünfgeschossigen Block durch das Gebäude, das zum Grundriss gehört:
die aufgeschnittene Wohnung aus dem Referenzbild, in vier Stufen aufgebaut
(Grundriss, Wände, Details, möbliert). Zwei Wege, entscheide begründet:
a) Wandextrusion aus den vorhandenen Grundriss-Ebenen in public/assets/derived/
   — gestapelte Kopien der Wandmaske, abgedunkelte Flanken, Schlagschatten.
   Wände stehen dann konstruktionsbedingt exakt auf ihren gezeichneten Linien.
b) generierte Stufenbilder, registriert wie das jetzige Gebäude.
Danach die Bausequenz in src/hooks/useScene02Timeline.ts darauf umstellen.

REGELN
- Nur das Paket gsap plus @gsap/react. Kein Three.js, WebGL, Canvas-Rendering,
  kein Tailwind, keine weitere Animationsbibliothek.
- Die Quellbilder in public/assets/scene-01 und scene-02 nicht verändern.
  Abgeleitetes gehört nach public/assets/derived über tools/derive-assets.py.
- Kein Redesign der Seite, keine neuen Abschnitte, keine Service-Karten.
- Sparsam mit Credits: kein wiederholtes Generieren fast gleicher Assets.
- Nach jedem abgeschlossenen Schritt committen und pushen.
- Vor dem Melden prüfen: npx tsc --noEmit, npm run lint, npm run build,
  und die Sequenz auf Desktop, Tablet, Handy und mit prefers-reduced-motion.
```

---

## Was du anhängen solltest

| Bild | wozu |
| --- | --- |
| das Vier-Stufen-Bild (Grundriss → Wände → Details → Zuhause) | legt fest, wie das Gebäude aussehen soll |
| weitere Bau-Stadien-Vorlagen, falls vorhanden | im Projekt liegt keine |
| Fotos realer WBG-Gebäude, falls vorhanden | Material- und Farbreferenz für den Photoreal-Prompt |

Grundriss und Master-Wireframe liegen bereits im Repo und müssen nicht
angehängt werden.
