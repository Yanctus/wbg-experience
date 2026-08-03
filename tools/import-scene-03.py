"""
Takes a Higgsfield download and puts it into the story as a scene 03 layer.

It checks the two things that actually break the sequence — the aspect ratio and
the transparency — before writing anything, because both fail silently at
runtime: a building on an opaque background blanks the frame, and a non-square
building lands off the footprint it is supposed to stand on.

Usage:
    python3 tools/import-scene-03.py <downloaded-file> <role>

Roles: photoreal | shadow | backdrop | foreground
"""

import os
import sys

from PIL import Image

OUT_DIR = 'public/assets/scene-03'

ROLES = {
    #  role:        (filename,                  size,         ratio, needs alpha)
    'photoreal': ('building_photoreal.webp', (2048, 2048), 1 / 1, True),
    'shadow': ('building_shadow.webp', (2048, 2048), 1 / 1, True),
    'backdrop': ('backdrop.webp', (2560, 1440), 16 / 9, False),
    'foreground': ('foreground.webp', (2560, 1440), 16 / 9, True),
}


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[2] not in ROLES:
        print(__doc__)
        raise SystemExit(2)

    source, role = sys.argv[1], sys.argv[2]
    name, size, ratio, needs_alpha = ROLES[role]

    img = Image.open(source).convert('RGBA')
    got = img.width / img.height
    if abs(got - ratio) > 0.02:
        raise SystemExit(
            f'aspect ratio is {got:.3f}, expected {ratio:.3f} — regenerate at the '
            f'right ratio rather than cropping, or the building lands off the plan'
        )

    transparent = (img.getchannel('A').getextrema()[0]) < 250
    if needs_alpha and not transparent:
        raise SystemExit(
            'no transparency found — run Remove Background in Higgsfield first, '
            'otherwise this layer paints a rectangle over the scene'
        )

    if needs_alpha:
        alpha = img.getchannel('A')
        box = alpha.getbbox()
        if box:
            w, h = img.size
            print(
                f'  content occupies x {box[0] / w:.2%}..{box[2] / w:.2%}, '
                f'y {box[1] / h:.2%}..{box[3] / h:.2%}'
            )
            if role == 'photoreal':
                print('  reference is  x 12.96%..96.22%, y 13.04%..75.17% — these should match')

    os.makedirs(OUT_DIR, exist_ok=True)
    target = os.path.join(OUT_DIR, name)
    img.resize(size, Image.LANCZOS).save(target, 'WEBP', quality=90, method=6, exact=True)
    print(f'wrote {target}  {os.path.getsize(target) / 1024:.0f} kB')


if __name__ == '__main__':
    main()
