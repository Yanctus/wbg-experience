"""
Derives the layered web assets from the two accepted source drawings.

Nothing here invents architecture: every output is a masked or re-weighted copy
of `blueprint_master.png` or `building_wireframe.png`, so the plan and the
building keep their exact geometry, camera and framing. The sources are never
written to — outputs go to public/assets/derived/.

The plan is split into the five stages an architect would draw it in. The split
is found in the drawing rather than hand-drawn: the building's interior is
recovered by closing the wall strokes and filling the resulting outline, which
separates "inside the building" from the dimension chains and the title block
around it, and ink weight separates structure from fittings.

Run:  python3 tools/derive-assets.py
"""

import os

import numpy as np
import scipy.ndimage as ndi
from PIL import Image

SRC_PLAN = 'public/assets/scene-01/blueprint_master.png'
SRC_BUILDING = 'public/assets/scene-02/building_wireframe.png'
OUT = 'public/assets/derived'

# Ink weights measured on the master plan: structural walls are the darkest
# stroke, fittings and openings sit in the mid range, dimensions and annotation
# are the lightest.
WALL_MAX = 118
DETAIL_MAX = 205
ANY_INK_MAX = 240

#: Widest wall opening to bridge when recovering the building outline, in px of
#: the master plan. Sized above the widest door and below the smallest room.
CLOSE = 55
#: How far a wall may sit from open air and still count as an exterior wall.
SKIN = 13

INK = (38, 34, 29)


def ink(lum: np.ndarray, ceiling: float) -> np.ndarray:
    """Ink coverage in 0..1: 0 at the ceiling, 1 at full black."""
    return np.clip((ceiling - lum) / ceiling, 0, 1)


def largest(mask: np.ndarray) -> np.ndarray:
    labels, count = ndi.label(mask)
    if count == 0:
        return mask
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    return labels == (int(np.argmax(sizes)) + 1)


def save(alpha: np.ndarray, name: str, tint=INK) -> None:
    h, w = alpha.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = tint
    rgba[..., 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(
        f'{OUT}/{name}.webp', 'WEBP', quality=92, method=6, exact=True
    )
    print(f'  {name}.webp {os.path.getsize(f"{OUT}/{name}.webp") / 1024:7.1f} kB')


def derive_plan() -> None:
    lum = np.array(Image.open(SRC_PLAN).convert('L')).astype(float)

    wall_ink = ink(lum, WALL_MAX)
    wall = wall_ink > 0.12

    # The building's own area, as an outline that door openings cannot leak
    # through. Everything outside it is annotation by definition.
    inside = largest(ndi.binary_fill_holes(ndi.binary_closing(wall, np.ones((CLOSE, CLOSE)))))
    open_air = ndi.binary_dilation(~inside, np.ones((SKIN, SKIN)))

    exterior = wall & open_air
    interior = wall & ~open_air

    detail_ink = ink(lum, DETAIL_MAX)
    detail = (detail_ink > 0.1) & ~wall & inside

    # The staircase is the densest hatch inside the building — a run of evenly
    # spaced treads no room or fitting comes close to. Found rather than
    # hard-coded, so a re-exported plan cannot be silently mis-staged.
    density = ndi.uniform_filter(detail.astype(float), size=45)
    stair = largest(density > 0.06)
    stair = ndi.binary_dilation(stair, np.ones((21, 21))) & inside
    ys, xs = np.where(stair)
    print(f'  staircase at x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}')

    any_ink = ink(lum, ANY_INK_MAX)

    print('plan layers:')
    save(wall_ink * exterior, 'plan-1-footprint')
    save(wall_ink * (interior & ~stair), 'plan-2-walls')
    save(np.maximum(wall_ink, detail_ink) * stair, 'plan-3-stair')
    save(detail_ink * (detail & ~stair), 'plan-4-openings')
    save(any_ink * ~inside, 'plan-5-annotation')


def derive_building() -> None:
    src = Image.open(SRC_BUILDING).convert('RGBA').resize((2048, 2048), Image.LANCZOS)
    b = np.array(src).astype(float)
    alpha = b[..., 3] / 255
    lum = b[..., :3].mean(2)

    # Line work, lifted off the near-white field it was drawn on.
    line = np.clip((250 - lum) / 110, 0, 1) * alpha
    lines = np.zeros((2048, 2048, 4), np.uint8)
    lines[..., 0], lines[..., 1], lines[..., 2] = (44, 41, 36)
    lines[..., 3] = (np.clip(line * 1.7, 0, 1) * 255).astype(np.uint8)
    line_img = Image.fromarray(lines, 'RGBA')
    line_img.save(f'{OUT}/building-wireframe.webp', 'WEBP', quality=92, method=6, exact=True)

    # The white model is the master's own silhouette filled with a warm white
    # and a faint top-to-bottom shading, with the same edges laid back over it.
    # Identical geometry by construction — it is the master's alpha channel.
    solid = np.zeros((2048, 2048, 4), np.uint8)
    shade = 247 - 15 * np.linspace(0, 1, 2048)[:, None]
    solid[..., 0] = np.clip(shade + 3, 0, 255)
    solid[..., 1] = np.clip(shade + 1, 0, 255)
    solid[..., 2] = np.clip(shade - 3, 0, 255)
    solid[..., 3] = (ndi.binary_erosion(alpha > 0.5, np.ones((3, 3))) * 255).astype(np.uint8)
    white = Image.fromarray(solid, 'RGBA')
    white.alpha_composite(line_img)
    white.save(f'{OUT}/building-white.webp', 'WEBP', quality=92, method=6, exact=True)

    print('building layers:')
    for name in ('building-wireframe', 'building-white'):
        print(f'  {name}.webp {os.path.getsize(f"{OUT}/{name}.webp") / 1024:7.1f} kB')


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    derive_plan()
    derive_building()


if __name__ == '__main__':
    main()
