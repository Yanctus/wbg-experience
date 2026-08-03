# Proof of concept — one 4-second clip

Purpose: find out whether the generator holds architectural geometry stable
while something is being built. Nothing here goes into the site.

## Before you spend anything: the two references are not the same building

- `public/assets/scene-01/blueprint_master.png` — a **single-storey house**,
  14,20 × 10,80 m, one dwelling: bedrooms, living/dining, kitchen, one
  staircase.
- `public/assets/scene-02/building_wireframe.png` — a **five-storey apartment
  block** with balconies on every floor, seen from a 3/4 aerial angle.

Walls grown from that plan can only ever produce that house. They cannot end as
the master block, whatever the prompt says. So the test can answer one of two
questions, not both:

1. *Does the generator keep a drawing stable while extruding it?* — grow the
   house from the plan, top-down, and ignore the master. This is what the
   storyboard below does.
2. *Does the generator keep the master block stable?* — a different test, with
   the wireframe as the start frame and no floor plan involved.

Question 1 is the one the site actually needs, because the site's construction
sequence stands the building on that printed footprint.

A third reference — a construction-stage inspiration image — is not in the
project. If one exists, upload it before generating; it is not needed for the
run below.

## Settings

| | |
| --- | --- |
| Mode | image-to-video |
| Start frame | `docs/poc/frame-01-empty-sheet.png` |
| Duration | 4 s — the shortest tier |
| Resolution | the lowest tier on offer; this is a look test, not a master |
| Aspect | 16:9 |
| Camera motion | **none** — pick the static / locked-off option if the model exposes one |
| Variants | 1 |

Use the cheapest video model available. If the interface recommends a model,
take the recommendation for the lowest tier rather than the highest-quality one:
a wobbling geometry shows up just as clearly at low resolution, and that is the
whole question.

## Prompt

```
Locked-off top-down shot of a single sheet of premium architectural paper on a
plain bright surface. The camera never moves.

Very fine dark grey architectural lines draw themselves onto the paper,
precisely and calmly, until a complete residential floor plan is finished: outer
walls first, then interior walls, then the staircase. Brief pause on the
finished drawing.

Then the outer structural walls rise vertically out of the drawn plan, as thin
clean white volumes standing exactly on the drawn lines. The remaining interior
walls follow. Finally a flat white roof slab settles gently onto the walls,
completing a clean white architectural massing model standing on the drawing.

The walls must stand exactly on the printed lines and must not drift, wobble,
bend or change proportion. The plan underneath stays visible the whole time.

Architecture competition visualization, museum quality, minimal, elegant, calm,
soft even daylight, no colour except paper white and graphite grey.
```

Negative, if the field exists:

```
camera movement, camera rotation, orbiting, zooming, handheld, perspective
change, tilting, hand, pencil, pen, drawing tool, person, text, numbers,
lettering, watermark, desk clutter, coffee cup, ruler, windows, glass,
balconies, furniture, colour, warm sunset, dramatic lighting, morphing walls,
melting geometry
```

## What to look at in the result

The point is not whether it is beautiful. Check, in this order:

1. **Do the walls stand on the drawn lines?** Freeze the last frame and compare
   the wall base against the printed plan under it. Drift of a wall thickness or
   more is a fail.
2. **Does the plan stay the same drawing?** Generators love to redraw a plan
   while animating it — rooms that change shape mid-clip are a fail.
3. **Does the camera hold?** Any drift, breathing or rotation is a fail: the
   site composites layers onto a fixed camera.
4. **Do proportions hold as the walls rise?** Rubbery growth, walls that taper
   or lean, a roof that arrives at a different size — all fails.
5. **Did it stop?** Windows, balconies, materials or people appearing after the
   roof means the model does not respect an end state.

If 1 to 4 hold, the approach is viable and worth a second, longer generation. If
1 or 2 fail, no amount of prompt work will fix it — the site's layer-and-mask
construction is then the correct route, and it already works.
