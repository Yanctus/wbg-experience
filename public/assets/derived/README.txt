Derived web assets — generated, not authored.

Everything in this folder is produced by tools/derive-assets.py from the two
accepted source drawings:

  ../scene-01/blueprint_master.png   the cleaned floor plan
  ../scene-02/building_wireframe.png the accepted master building

Nothing here invents architecture. Each file is a masked or re-weighted copy of
a source, so geometry, camera, framing and proportions are identical by
construction.

  plan-1-footprint.webp   exterior walls
  plan-2-walls.webp       structural interior walls
  plan-3-stair.webp       staircase
  plan-4-openings.webp    doors, windows and fittings
  plan-5-annotation.webp  dimension chains, title block, north arrow
  building-wireframe.webp line drawing of the master, on real transparency
  building-white.webp     the same silhouette as a white massing model

Regenerate after replacing either source:

  python3 tools/derive-assets.py

Still to come from Higgsfield (see src/assets/manifest.ts, OPTIONAL) — the
story runs without them and picks each up the moment it is committed:

  ../scene-03/building_photoreal.webp
  ../scene-03/building_shadow.webp
  ../scene-03/backdrop.webp
  ../scene-03/foreground.webp
