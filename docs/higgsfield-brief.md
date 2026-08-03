# Higgsfield-Briefing — die vier fehlenden Szene-03-Assets

Es werden **vier Bilder** gebraucht, kein Video. Die Scroll-Sequenz steuert die
Bewegung selbst; ein Clip würde sie ersetzen statt ergänzen.

Alles ist bereits eingebaut. Sobald die Dateien unter `public/assets/scene-03/`
liegen, werden sie zur Laufzeit erkannt und die Szene spielt sie — ohne
Codeänderung. Fehlt eine, läuft die Geschichte ohne sie weiter.

## Die Referenz

`public/assets/scene-02/building_wireframe.png` — 4096 × 4096, quadratisch.
**Immer als Referenz-/Ausgangsbild hochladen.** Ohne sie kommt ein anderes Haus
zurück, und die Sequenz blendet dann zwei verschiedene Gebäude ineinander.

Das Gebäude liegt in diesem Quadrat exakt so:

| Kante | Position im Bild |
| --- | --- |
| links | 12,96 % |
| rechts | 96,22 % |
| oben (Dachkante) | 13,04 % |
| unten (Bodenkontakt) | 75,17 % |

Breite 83,25 %, Höhe 62,13 % des Rahmens. Diese Werte müssen erhalten bleiben —
das Weißmodell und das reale Gebäude werden übereinander gelegt und mit einer
wandernden Kante getauscht. Verschiebt sich das Haus im Rahmen, springt die
Kamera sichtbar.

## Ausgabe

| Datei | Format | Größe | Hintergrund |
| --- | --- | --- | --- |
| `building_photoreal.webp` | 1:1 | 2048 × 2048 | transparent |
| `building_shadow.webp` | 1:1 | 2048 × 2048 | transparent |
| `backdrop.webp` | 16:9 | 2560 × 1440 | deckend |
| `foreground.webp` | 16:9 | 2560 × 1440 | transparent |

Nach dem Download:

    python3 tools/import-scene-03.py ~/Downloads/dateiname.png photoreal

Das Skript prüft Seitenverhältnis und Transparenz, skaliert, konvertiert nach
WebP und legt die Datei am richtigen Ort ab.

## Prompts

### 1 — Photorealistisches Gebäude (Pflicht)

Werkzeug: Bild-zu-Bild / Referenzbild = `building_wireframe.png`.
Referenzstärke hoch (Struktur erhalten, ~0,75–0,85 Ähnlichkeit).

> Photorealistic architectural visualization of the exact building in the
> reference line drawing. Keep the identical geometry, identical camera angle,
> identical perspective, identical roof shape, identical window positions,
> identical balconies, identical proportions and identical framing — do not
> redesign, do not add or remove floors, do not move the camera.
>
> Materials: warm light grey rendered facade, matte anthracite flat roof with a
> slim shadow gap, dark grey window frames, deep reflective glazing with a soft
> sky reflection, slender balconies with clear glass balustrades and thin metal
> handrails, subtle vertical facade texture.
>
> Soft overcast late afternoon daylight from the upper left, gentle contact
> shadows, no harsh sun, calm neutral colour grading, modern German
> co-operative residential architecture, architectural photography, high detail,
> no people, no cars, no trees, no ground plane, no sky, no background.
>
> Isolated building on a fully transparent background, square 1:1 frame, the
> building occupying the same area of the frame as in the reference.

Danach in Higgsfield: **Remove Background**, dann **Upscale** auf 2048.

Negativ, falls das Feld existiert:
`different building, extra floors, changed roofline, changed window grid, new camera angle, tilted horizon, people, cars, trees, sky, ground, text, watermark, HDR look, warm sunset, blue hour`

### 2 — Bodenschatten (Pflicht, wenn 1 vorhanden)

Referenzbild ebenfalls das Wireframe.

> Only the soft contact shadow that the building in the reference image casts on
> flat ground. No building, no walls, no roof — just the shadow shape.
> Diffuse overcast shadow, soft edges, darkest directly under the footprint and
> fading outward, neutral cool grey, low opacity.
> Same camera angle, same perspective and same footprint position as the
> reference. Fully transparent background, square 1:1 frame.

Fällt das Ergebnis unbrauchbar aus: weglassen. Es gibt eine gezeichnete
CSS-Ellipse als Rückfall, die bereits im Bild ist.

### 3 — Hintergrund / ferne Ebene (optional)

Ohne Referenzbild, reines Text-zu-Bild.

> Quiet neutral German residential neighbourhood seen from a distance, softly
> out of focus, calm overcast afternoon light. Low modern apartment blocks in
> muted warm grey and beige far in the background, wide open sky in soft warm
> white, no strong colours, no landmarks, no people, no cars.
> Extremely restrained, almost minimal, architectural magazine photography,
> shallow depth of field, wide 16:9 frame, nothing in the centre foreground.

Wichtig: **unscharf und ereignislos.** Diese Ebene liegt hinter dem Gebäude und
darf keine Aufmerksamkeit ziehen.

### 4 — Vordergrund / nahe Ebene (optional)

> Foreground landscaping strip only, seen slightly from above: low ornamental
> grasses, a clipped hedge and a narrow strip of light grey paving, muted green
> and warm grey, soft overcast light, no flowers, no people, no furniture.
> Occupying only the lower third of the frame, empty and fully transparent
> above. Transparent background, wide 16:9 frame, softly out of focus.

Diese Ebene zieht beim Vorwärtsgleiten am schnellsten am Betrachter vorbei —
sie darf ruhig unscharf sein, aber der obere Bildteil muss wirklich leer sein.

## Was nicht funktioniert

- Ein Prompt ohne Referenzbild für das Gebäude. Das Ergebnis ist immer ein
  anderes Haus, egal wie genau der Text ist.
- Ein Rendering auf Boden und Himmel. Beides gehört auf eigene Ebenen, sonst
  lässt sich das Gebäude nicht freistellen und nicht separat bewegen.
- Eingebrannter Text, Logos, Bemaßung oder Wasserzeichen.
- Ein anderes Seitenverhältnis als 1:1 beim Gebäude — dann stimmt die
  Registrierung auf den Grundriss nicht mehr.
