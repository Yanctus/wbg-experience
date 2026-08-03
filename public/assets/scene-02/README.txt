Scene 02 assets.

Expected files in this folder:

  building_wireframe.png          drives the construction sequence
  building_white.png              solid massing (not yet used)
  construction_lines_overlay.png  axes and annotations (not yet used)
  building_shadow_soft.png        contact shadow (not yet used)

No configuration is needed. Each file is probed at runtime by decoding it,
so a layer appears as soon as its file is committed here and stays out of
the DOM while it is missing — no flag to flip.

building_wireframe.webp is a derivative, not a source: a 2048px re-encode
of the PNG, about a twentieth of its size and indistinguishable at the size
it is ever painted. It is preferred over the PNG when present, so if the
PNG is replaced this file has to be regenerated from it (or deleted, in
which case the PNG is used directly).

Two notes for building_wireframe.png:

- A near-white background is fine. The layer composites with
  mix-blend-mode: multiply, so a white field reads as transparent and only
  the line work darkens the plan. Real alpha works equally well.
- The staged reveal assumes the building spans roughly 22% to 87% of the
  image height, measured from the bottom. If it is framed differently,
  adjust BUILDING_EXTENT in src/hooks/useScene02Animation.ts — those two
  numbers re-time all five construction stages.
