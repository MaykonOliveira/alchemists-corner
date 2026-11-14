"""Primitivas do visual vetorial: cada desenho é um SVG em unidades lógicas (as mesmas da cena 384×216),
renderizado em K× pelo resvg. Requer: pip install pillow resvg-py"""
import io
from PIL import Image, ImageFilter, ImageChops
import resvg_py

K = 4  # pixels por unidade lógica nos spritesheets vetoriais

# Paleta do visual vetorial cozy.
OUT = '#4a2b3a'      # contorno
WOOD = '#c98a4e'; WOOD_D = '#a2643a'; WOOD_L = '#e5ad6c'; WOOD_DD = '#7a452b'
PLUM = '#6d4fb5'; PLUM_D = '#4d3690'; PLUM_L = '#9a7fe6'; PLUM_LL = '#c7b5f5'
TEAL = '#3ecdb9'; TEAL_D = '#209c93'; TEAL_L = '#8ff0de'
GOLD = '#ffc94d'; GOLD_D = '#e59a1f'; GOLD_L = '#ffe9a3'
CORAL = '#ff7a5c'; CORAL_D = '#d9523c'; ROSE = '#ff9fb5'; RED = '#e8504a'
LEAF = '#62c66b'; LEAF_D = '#3c9a52'; LEAF_L = '#a4e58a'
CREAM = '#fff3dc'; CREAM_D = '#f1d9b0'; WALL = '#f3cfa3'; WALL_D = '#e4b888'
STONE = '#b9b3c6'; STONE_D = '#8a84a0'; STONE_L = '#dcd8e6'
SKY = '#9adcf7'; SKY_L = '#d5f2ff'; NAVY = '#33407f'; BLUE = '#5aa8f2'
SKIN = ['#ffd9b8', '#f2b98c', '#c98a5e', '#8f5a3c']
WHITE = '#ffffff'; INK = '#3a2233'

_uid = [0]


def uid(p='g'):
    _uid[0] += 1
    return f'{p}{_uid[0]}'


def _st(fill, stroke, sw, extra=''):
    if 'fill=' in extra:
        s = ''
    else:
        s = f' fill="{fill}"' if fill is not None else ' fill="none"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"'
    return s + (' ' + extra if extra else '')


def rect(x, y, w, h, fill, r=0, stroke=OUT, sw=0.6, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}"{_st(fill, stroke, sw, extra)}/>'


def ell(cx, cy, rx, ry, fill, stroke=OUT, sw=0.6, extra=''):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{_st(fill, stroke, sw, extra)}/>'


def circ(cx, cy, r, fill, stroke=OUT, sw=0.6, extra=''):
    return ell(cx, cy, r, r, fill, stroke, sw, extra)


def path(d, fill, stroke=OUT, sw=0.6, extra=''):
    return f'<path d="{d}"{_st(fill, stroke, sw, extra)}/>'


def poly(pts, fill, stroke=OUT, sw=0.6, extra=''):
    return f'<polygon points="{" ".join(f"{x},{y}" for x, y in pts)}"{_st(fill, stroke, sw, extra)}/>'


def line(x1, y1, x2, y2, stroke=OUT, sw=0.6, extra=''):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" {extra}/>'


def g(body, transform='', extra=''):
    t = f' transform="{transform}"' if transform else ''
    return f'<g{t} {extra}>{"".join(body) if isinstance(body, (list, tuple)) else body}</g>'


def lin(stops, x1=0, y1=0, x2=0, y2=1):
    """Degradê linear; devolve (defs, 'url(#id)')."""
    i = uid('l')
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity=\"{a}\"" if a is not None else ""}/>'
                for o, c, a in [(st + (None,))[:3] if len(st) == 2 else st for st in stops])
    return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>', f'url(#{i})'


def rad(stops, cx=0.5, cy=0.5, r=0.5):
    i = uid('r')
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"{f" stop-opacity=\"{a}\"" if a is not None else ""}/>'
                for o, c, a in [(st + (None,))[:3] if len(st) == 2 else st for st in stops])
    return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>', f'url(#{i})'


def star(cx, cy, r, fill=GOLD, stroke=None, sw=0.4, points=4, inner=0.42, rot=0):
    import math
    pts = []
    for n in range(points * 2):
        a = math.pi * n / points - math.pi / 2 + rot
        rr = r if n % 2 == 0 else r * inner
        pts.append((round(cx + math.cos(a) * rr, 2), round(cy + math.sin(a) * rr, 2)))
    return poly(pts, fill, stroke, sw)


def shine(x, y, w, h, op=0.45):
    """Reflexo claro arredondado."""
    return rect(x, y, w, h, WHITE, r=min(w, h) / 2, stroke=None, extra=f'opacity="{op}"')


def render(body, w, h, k=K, defs=''):
    """SVG (unidades lógicas w×h) → imagem RGBA de (w·k)×(h·k)."""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
           f'<defs>{defs}</defs>{"".join(body) if isinstance(body, (list, tuple)) else body}</svg>')
    png = resvg_py.svg_to_bytes(svg_string=svg, zoom=k)
    im = Image.open(io.BytesIO(bytes(png))).convert('RGBA')
    if im.size != (w * k, h * k):
        im = im.resize((w * k, h * k), Image.LANCZOS)
    return im


def outline_of(im, k=K):
    """Contorno branco do hover: anel em volta do desenho, numa tela 1 unidade lógica maior de cada lado."""
    w, h = im.size
    big = Image.new('L', (w + 2 * k, h + 2 * k), 0)
    big.paste(im.getchannel('A').point(lambda a: 255 if a > 40 else 0), (k, k))
    grow = big.filter(ImageFilter.MaxFilter(2 * (k - 1) + 1)).filter(ImageFilter.GaussianBlur(0.8))
    inner = big.filter(ImageFilter.GaussianBlur(0.8))
    ring = ImageChops.subtract(grow, inner)
    out = Image.new('RGBA', big.size, (255, 255, 255, 0))
    out.putalpha(ring)
    return out


def _cozy(c):
    """Aproxima uma cor do pixel art da paleta vetorial: contorno escuro vira ameixa, o resto ganha vida."""
    import colorsys
    r, g_, b, a = c
    if 0.299 * r + 0.587 * g_ + 0.114 * b < 62:
        return (0x4a, 0x2b, 0x3a, a)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g_ / 255, b / 255)
    r, g_, b = colorsys.hsv_to_rgb(h, min(1, s * 1.08), min(1, v * 1.12 + 0.03))
    return (int(r * 255), int(g_ * 255), int(b * 255), a)


def smooth_up(im, k=K, cozy=False):
    """Reserva para o que ainda não foi redesenhado: amplia o pixel art arredondando as formas."""
    im = im.convert('RGBA')
    w, h = im.size
    cols = {}
    idx = Image.new('L', (w, h), 0)
    px, ip = im.load(), idx.load()
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            if c[3] < 128:
                continue
            ip[x, y] = cols.setdefault(c, len(cols) + 1)
    if len(cols) > 254:
        return im.resize((w * k, h * k), Image.BICUBIC)
    s = 2
    big = idx.resize((w * k * s, h * k * s), Image.NEAREST).filter(ImageFilter.ModeFilter(k * s - 1))
    lut = {v: (_cozy(c) if cozy else c) for c, v in cols.items()}
    out = Image.new('RGBA', big.size, (0, 0, 0, 0))
    op, bp = out.load(), big.load()
    for y in range(big.size[1]):
        for x in range(big.size[0]):
            v = bp[x, y]
            if v:
                op[x, y] = lut.get(v, (0, 0, 0, 0))
    return out.resize((w * k, h * k), Image.LANCZOS)
