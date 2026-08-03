"""
Builds the start and end frames for the Higgsfield proof-of-concept clip.

Both frames are composed from the project's own assets, so the test starts from
the exact paper and the exact plan the site uses. Handing the generator a start
frame is also the cheapest way to run the test: image-to-video needs no prompt
budget for establishing the look, and it removes the largest source of drift.

Run:  python3 tools/make-poc-frames.py
"""

import os

import numpy as np
from PIL import Image

OUT = 'docs/poc'
SIZE = (1920, 1080)

BG = 'public/assets/scene-01/background_paper_base.png'
SHEET = 'public/assets/scene-01/paper_sheet_main.png'
PLAN = 'public/assets/scene-01/blueprint_master.png'

#: The sheet's silhouette inside its image, as the site's clip-path measures it.
#: Warmth separates the paper from the neutral checkerboard baked into the file.
WARM_MIN = 6


def cut_sheet() -> Image.Image:
    """The sheet, lifted off the checkerboard its PNG was saved with."""
    img = Image.open(SHEET).convert('RGB')
    a = np.array(img).astype(int)
    warm = (a[..., 0] - a[..., 2]) >= WARM_MIN
    alpha = (warm * 255).astype(np.uint8)
    out = np.dstack([np.array(img), alpha])
    return Image.fromarray(out, 'RGBA')


def compose(with_plan: bool, name: str) -> None:
    canvas = Image.open(BG).convert('RGB').resize(SIZE, Image.LANCZOS)

    sheet = cut_sheet()
    # Straightened and centred: the clip is specified top-down, so the frame
    # must not carry the site's slight rotation.
    scale = SIZE[1] * 0.82 / sheet.height
    sheet = sheet.resize((int(sheet.width * scale), int(sheet.height * scale)), Image.LANCZOS)

    if with_plan:
        plan = Image.open(PLAN).convert('RGBA')
        # Same box the site prints the plan in: inset 15/17/19/16 of the sheet.
        box = (
            int(sheet.width * 0.16),
            int(sheet.height * 0.15),
            int(sheet.width * (1 - 0.17)),
            int(sheet.height * (1 - 0.19)),
        )
        plan = plan.resize((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
        ink = np.array(plan).astype(float)
        # Ink only: the plan file has a white field, not an alpha channel.
        alpha = np.clip((246 - ink[..., :3].mean(2)) / 120, 0, 1)
        layer = np.zeros((plan.height, plan.width, 4), np.uint8)
        layer[..., 0], layer[..., 1], layer[..., 2] = (38, 34, 29)
        layer[..., 3] = (alpha * 255).astype(np.uint8)
        sheet.alpha_composite(Image.fromarray(layer, 'RGBA'), (box[0], box[1]))

    pos = ((SIZE[0] - sheet.width) // 2, (SIZE[1] - sheet.height) // 2)
    canvas.paste(sheet, pos, sheet)

    os.makedirs(OUT, exist_ok=True)
    path = f'{OUT}/{name}.png'
    canvas.save(path)
    print(f'  {path}  {SIZE[0]}x{SIZE[1]}  {os.path.getsize(path) / 1024:.0f} kB')


if __name__ == '__main__':
    print('proof-of-concept frames:')
    compose(False, 'frame-01-empty-sheet')
    compose(True, 'frame-03-plan-complete')
