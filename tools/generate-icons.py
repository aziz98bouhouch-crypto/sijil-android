"""يولّد أيقونات PWA وأندرويد من تصميم icon.svg دون مكتبات خارجية غير Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

GREEN = (15, 118, 110, 255)
CREAM = (247, 251, 250, 255)
ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "app" / "public"
AND = ROOT / "app" / "resources" / "android"


def font(size: int):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def draw_mark(d: ImageDraw.ImageDraw, s: int, ox: int = 0, oy: int = 0, scale: float = 1.0):
    """كتاب مفتوح + HG، مرسوم بإحداثيات icon.svg النسبية."""
    def p(x, y):
        return (ox + x * s * scale, oy + y * s * scale)

    d.polygon([p(0.1875, 0.406), p(0.5, 0.25), p(0.8125, 0.406), p(0.5, 0.5625)], fill=CREAM)
    d.polygon([p(0.5, 0.25), p(0.8125, 0.406), p(0.8125, 0.469), p(0.5, 0.625), p(0.1875, 0.469), p(0.1875, 0.406)],
              fill=(230, 246, 244, 110))
    for x in (0.273, 0.676):
        d.rounded_rectangle([p(x, 0.484), p(x + 0.051, 0.703)], radius=int(0.02 * s * scale), fill=CREAM)
    size = max(7, int(0.148 * s * scale))
    f = font(size)
    text = "HG"
    box = d.textbbox((0, 0), text, font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    tx = ox + (s * scale - tw) / 2 - box[0]
    ty = oy + 0.77 * s * scale - box[1]
    d.text((tx, ty), text, font=f, fill=CREAM, stroke_width=max(1, size // 26), stroke_fill=CREAM)


def full_icon(size: int, rounded: bool = True) -> Image.Image:
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(0.1875 * S), fill=GREEN)
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=GREEN)
    draw_mark(d, S)
    return img.resize((size, size), Image.LANCZOS)


def maskable(size: int) -> Image.Image:
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), GREEN)
    d = ImageDraw.Draw(img)
    scale = 0.62
    off = (1 - scale) / 2
    draw_mark(d, S, off * S, off * S, scale)
    return img.resize((size, size), Image.LANCZOS)


def foreground(size: int) -> Image.Image:
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    scale = 0.56
    off = (1 - scale) / 2
    draw_mark(d, S, off * S, off * S, scale)
    return img.resize((size, size), Image.LANCZOS)


def round_icon(size: int) -> Image.Image:
    icon = full_icon(size, rounded=False)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(icon, (0, 0), mask)
    return out


def main():
    PUB.mkdir(parents=True, exist_ok=True)
    full_icon(512).save(PUB / "icon-512.png", optimize=True)
    full_icon(192).save(PUB / "icon-192.png", optimize=True)
    maskable(512).save(PUB / "icon-maskable-512.png", optimize=True)
    full_icon(180, rounded=False).save(PUB / "apple-touch-icon.png", optimize=True)

    dens = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for name, px in dens.items():
        folder = AND / f"mipmap-{name}"
        folder.mkdir(parents=True, exist_ok=True)
        full_icon(px).save(folder / "ic_launcher.png", optimize=True)
        round_icon(px).save(folder / "ic_launcher_round.png", optimize=True)
        foreground(int(px * 2.25)).save(folder / "ic_launcher_foreground.png", optimize=True)
    full_icon(1024).save(ROOT / "app" / "resources" / "icon.png", optimize=True)
    print("icons:", PUB, AND)


if __name__ == "__main__":
    main()
