"""Build a 2.5D scene the way the reference video reads, using moviepy.

The reference is a 3D render: a modelled character in a modelled room. That
character cannot be produced here — there is no GPU, no local model, and the
MiniMax account that could generate one reports an insufficient balance. Saying
otherwise would be a claim I cannot honour.

What the rest of that video is made of IS reachable, and it is most of why the
frame works:

  · panels floating in perspective rather than lying flat on the page
  · type with real extrusion — a stack of offset copies, not a flat word
  · depth: near layers move further than far ones as the camera pushes in
  · debris drifting through the space on its own paths
  · a warm neutral room instead of a coloured page

So this composes those. A real screenshot goes on the hero panel, so the one
thing that must be true stays true.

    python scene3d.py --shot public/screens/trial-reels-insights.png \
        --line "ادیت زدن رو بلد نباشی" --out out/scene.mp4 --seconds 4
"""
import argparse
import math
import os

import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
from moviepy import VideoClip

W, H = 1080, 1920
FONT = r"C:\Windows\Fonts\segoeuib.ttf"

# The room, sampled from the reference: warm neutral, brighter behind the
# subject, falling off to the corners. Not a colour — a lit space.
WALL_NEAR = (214, 208, 198)
WALL_FAR = (150, 143, 133)


def persian(text):
    """Shaped and reordered, or Persian renders as disconnected letters backwards."""
    return get_display(arabic_reshaper.reshape(text))


def room(w=W, h=H):
    """A lit backdrop with a floor, so panels have something to stand in."""
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    x = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    # radial falloff toward the corners
    d = np.sqrt((x - 0.5) ** 2 + ((y - 0.42) * 0.8) ** 2) / 0.75
    d = np.clip(d, 0, 1)[..., None]
    near = np.array(WALL_NEAR, dtype=np.float32)
    far = np.array(WALL_FAR, dtype=np.float32)
    img = near * (1 - d) + far * d
    # floor: a darker band with a soft horizon
    horizon = int(h * 0.72)
    fade = np.clip((np.arange(h) - horizon) / (h * 0.10), 0, 1)[:, None, None]
    img = img * (1 - fade * 0.22)
    return img.astype(np.uint8)


def extruded(text, size, fill=(250, 249, 245), edge=(38, 34, 30), depth=14, max_w=None):
    """Type with thickness: offset copies behind a stroked face."""
    shaped = persian(text)
    # Shrink to fit rather than overflow — a hook cut off at the margin is a
    # hook nobody read.
    probe = Image.new("RGBA", (10, 10))
    while size > 34:
        f = ImageFont.truetype(FONT, size)
        b = ImageDraw.Draw(probe).textbbox((0, 0), shaped, font=f, stroke_width=size // 16)
        if max_w is None or (b[2] - b[0]) + depth * 2 <= max_w:
            break
        size -= 4
    font = ImageFont.truetype(FONT, size)
    pad = size + depth * 2
    probe = Image.new("RGBA", (10, 10))
    box = ImageDraw.Draw(probe).textbbox((0, 0), shaped, font=font, stroke_width=size // 16)
    tw, th = box[2] - box[0], box[3] - box[1]
    img = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ox, oy = pad - box[0], pad - box[1]
    # The extrusion runs down-left, matching the reference's key light.
    for k in range(depth, 0, -1):
        t = k / depth
        shade = tuple(int(c * (0.42 + 0.30 * (1 - t))) for c in edge)
        d.text((ox - k * 0.9, oy + k), shaped, font=font, fill=shade + (255,))
    d.text((ox, oy), shaped, font=font, fill=fill + (255,),
           stroke_width=max(2, size // 18), stroke_fill=edge + (255,))
    return img


def perspective(rgba, tilt=0.16, turn=0.10, scale=1.0):
    """Stand a flat layer up in space: a keystone plus a slight turn."""
    a = np.array(rgba)
    h, w = a.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dx, dy = w * turn, h * tilt
    dst = np.float32([[dx, dy * 0.35], [w - dx * 0.25, 0],
                      [w - dx * 0.55, h - dy * 0.30], [dx * 0.55, h]])
    m = cv2.getPerspectiveTransform(src, dst)
    out = cv2.warpPerspective(a, m, (w, h), flags=cv2.INTER_LANCZOS4,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    if scale != 1.0:
        out = cv2.resize(out, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_LANCZOS4)
    return Image.fromarray(out)


def panel(shot_path, width=700):
    """The hero: a real screenshot, framed and stood up in the space."""
    im = Image.open(shot_path).convert("RGB")
    ratio = im.height / im.width
    im = im.resize((width, int(width * ratio)), Image.LANCZOS)
    bez = 16
    card = Image.new("RGBA", (im.width + bez * 2, im.height + bez * 2), (24, 26, 32, 255))
    rounded = Image.new("L", card.size, 0)
    ImageDraw.Draw(rounded).rounded_rectangle([0, 0, card.size[0] - 1, card.size[1] - 1],
                                              radius=34, fill=255)
    card.putalpha(rounded)
    card.paste(im, (bez, bez))
    return card


def paper_specks(n, seed=7):
    """Debris paths. Seeded: the same render twice must give the same frames."""
    rng = np.random.default_rng(seed)
    return [{
        "x": rng.uniform(-0.1, 1.1), "y": rng.uniform(-0.2, 1.2),
        "vx": rng.uniform(-0.05, 0.05), "vy": rng.uniform(0.04, 0.16),
        "size": rng.uniform(14, 46), "rot": rng.uniform(0, 360),
        "spin": rng.uniform(-90, 90), "depth": rng.uniform(0.3, 1.0),
    } for _ in range(n)]


def build(shot, line, seconds, out, fps=30):
    bg = room()
    hero = panel(shot)
    text = extruded(line, 120, depth=16, max_w=int(W * 0.86))
    specks = paper_specks(26)

    def frame(t):
        p = t / seconds
        # One slow push-in. Layers move by their depth, which is what sells space.
        cam = 1.0 + 0.09 * p
        canvas = Image.fromarray(bg).convert("RGBA")

        # far debris, behind the panel
        d = ImageDraw.Draw(canvas)
        for s in specks:
            if s["depth"] > 0.62:
                continue
            _speck(canvas, s, t, cam)

        # hero panel, tilted, pushed by the camera
        ph = perspective(hero, tilt=0.13, turn=0.09, scale=cam * 0.98)
        canvas.alpha_composite(ph, (int(W * 0.5 - ph.width * 0.52),
                                    int(H * 0.40 - ph.height * 0.5)))

        # near debris, in front
        for s in specks:
            if s["depth"] <= 0.62:
                continue
            _speck(canvas, s, t, cam)

        # type last, largest parallax, so it reads as closest to the viewer
        tw = perspective(text, tilt=0.05, turn=0.03, scale=cam * 1.04)
        canvas.alpha_composite(tw, (int(W * 0.5 - tw.width * 0.5),
                                    int(H * 0.60)))
        return np.array(canvas.convert("RGB"))

    def _speck(canvas, s, t, cam):
        x = (s["x"] + s["vx"] * t) % 1.2 - 0.1
        y = (s["y"] + s["vy"] * t) % 1.4 - 0.2
        size = s["size"] * (0.6 + s["depth"]) * cam
        sheet = Image.new("RGBA", (int(size), int(size * 1.3)), (246, 244, 238, 235))
        ImageDraw.Draw(sheet).rectangle([0, 0, sheet.width - 1, sheet.height - 1],
                                        outline=(190, 186, 178, 255), width=1)
        sheet = sheet.rotate(s["rot"] + s["spin"] * t, expand=True,
                             resample=Image.BICUBIC)
        if s["depth"] < 0.5:
            sheet = sheet.filter_blur() if hasattr(sheet, "filter_blur") else sheet
        canvas.alpha_composite(sheet, (int(x * W), int(y * H)))

    clip = VideoClip(frame, duration=seconds)
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    clip.write_videofile(out, fps=fps, codec="libx264", audio=False, preset="medium",
                         ffmpeg_params=["-crf", "19", "-pix_fmt", "yuv420p"], logger=None)
    print(f"{out}  {seconds}s  {W}x{H}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--shot", required=True)
    ap.add_argument("--line", required=True)
    ap.add_argument("--seconds", type=float, default=4.0)
    ap.add_argument("--out", default="out/scene.mp4")
    a = ap.parse_args()
    build(a.shot, a.line, a.seconds, a.out)
