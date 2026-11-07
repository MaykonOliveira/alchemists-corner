"""Primitivas de pixel art usadas pelos arquivos-fonte da arte (art/*.py).

Toda a arte é exportada como PNG em src/assets/sprites; o jogo só carrega as imagens.
"""
from __future__ import annotations
import math
from PIL import Image

# ---------------------------------------------------------------------------
# Paleta (PRD 6.2): madeira castanha, verdes musgo/folha, âmbar e dourado para luz,
# azul profundo/turquesa/violeta para magia, creme/pergaminho/carvão/cobre na interface,
# terracota para atenção e verde suave para sucesso.
# ---------------------------------------------------------------------------
P = {
    'ink': '#1c1216', 'shadow': '#2a1c1c',
    # madeira
    'w0': '#2b1a12', 'w1': '#3e2619', 'w2': '#5a3822', 'w3': '#7a4d2c', 'w4': '#9a6638', 'w5': '#c08a4e', 'w6': '#dcae6e',
    # reboco (parede)
    'p0': '#5c4034', 'p1': '#735242', 'p2': '#8a6550', 'p3': '#9e785e', 'p4': '#b48c6c', 'p5': '#c9a47e',
    # pedra
    's0': '#262026', 's1': '#3a3238', 's2': '#544a50', 's3': '#716668', 's4': '#938684', 's5': '#b4a8a0',
    # verdes
    'g0': '#1e2e1a', 'g1': '#2f4a24', 'g2': '#466e30', 'g3': '#6b9a3c', 'g4': '#9cc75a', 'g5': '#cfe88a',
    # âmbar / ouro / luz
    'a0': '#6a3414', 'a1': '#a0561e', 'a2': '#d0842e', 'a3': '#e8a840', 'a4': '#f6cf5e', 'a5': '#ffeaa0', 'a6': '#fff8dc',
    # azuis mágicos
    'b0': '#161a3c', 'b1': '#232f68', 'b2': '#3450a8', 'b3': '#4f86d8', 'b4': '#86c0f0', 'b5': '#c8e8ff',
    # turquesa
    't0': '#123a3c', 't1': '#1d5e5c', 't2': '#2c8a80', 't3': '#45b4a4', 't4': '#84dcc8', 't5': '#cff6e8',
    # violeta
    'v0': '#24163a', 'v1': '#3e2662', 'v2': '#5e3c92', 'v3': '#8a62c0', 'v4': '#b896e4', 'v5': '#e6d2fa',
    # vermelhos / terracota
    'r0': '#3e1418', 'r1': '#6a1e22', 'r2': '#9a2e2e', 'r3': '#c8443e', 'r4': '#e8705a', 'r5': '#ffb09a',
    'tc0': '#6e2c20', 'tc1': '#8a3a2a', 'tc2': '#b9533a', 'tc3': '#d4734e',
    # creme / pergaminho
    'c0': '#7e6440', 'c1': '#a68a5c', 'c2': '#c8ae7c', 'c3': '#e0cb98', 'c4': '#f3e6c8', 'c5': '#fffaf0',
    # carvão / metal / cobre
    'k0': '#18141a', 'k1': '#2a2326', 'k2': '#3e363c', 'k3': '#58505a', 'k4': '#7a7280',
    'cu0': '#5e2c18', 'cu1': '#8a4424', 'cu2': '#b8693a', 'cu3': '#dc9256', 'cu4': '#f4c08a',
    # pele
    'sk0': '#4a2a1c', 'sk1': '#7a4a30', 'sk2': '#b07650', 'sk3': '#e0a882', 'sk4': '#f6d2b0',
    # céu e vidro
    'sky0': '#7ab4dc', 'sky1': '#a4d0ea', 'sky2': '#c4e2ee', 'sky3': '#e2f0ea',
    'gl0': '#3a4c54', 'gl1': '#6a8a92', 'gl2': '#a6c8cc', 'gl3': '#d8f0f0',
    'white': '#ffffff',
    # cores das poções (iguais às de src/domain/data/recipes.ts) com sombras e luzes
    'pr0': '#7a1c26', 'pr1': '#b02e36', 'pr2': '#d8484a', 'pr3': '#f27a6e', 'pr4': '#ffc0b0',
    'py0': '#7a4a10', 'py1': '#b87a1c', 'py2': '#e8b03a', 'py3': '#f8d470', 'py4': '#fff0b8',
    'pb0': '#1a2e6a', 'pb1': '#2e5aa8', 'pb2': '#5aa0e0', 'pb3': '#94ccf4', 'pb4': '#d4f0ff',
    'pg0': '#14482e', 'pg1': '#21784e', 'pg2': '#3fae78', 'pg3': '#7ad6a0', 'pg4': '#c8f4d8',
    'pv0': '#36205e', 'pv1': '#5e3c98', 'pv2': '#9a6ad0', 'pv3': '#c49ae8', 'pv4': '#ecdaff',
    'pl0': '#7a6416', 'pl1': '#bca02a', 'pl2': '#f0d860', 'pl3': '#fcee9c', 'pl4': '#fffbe0',
}

def rgba(c):
    if c is None:
        return None
    if isinstance(c, tuple):
        return c
    c = P.get(c, c)
    c = c.lstrip('#')
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)

PALETTE_SET = {rgba(v)[:3] for v in P.values()}


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.p = self.im.load()

    def px(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            self.p[x, y] = rgba(c)

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.p[x, y]
        return (0, 0, 0, 0)

    def opaque(self, x, y):
        return self.get(x, y)[3] > 0

    def rect(self, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.px(xx, yy, c)

    def hline(self, x, y, n, c):
        self.rect(x, y, n, 1, c)

    def vline(self, x, y, n, c):
        self.rect(x, y, 1, n, c)

    def frame(self, x, y, w, h, c):
        self.hline(x, y, w, c); self.hline(x, y + h - 1, w, c)
        self.vline(x, y, h, c); self.vline(x + w - 1, y, h, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for dy in range(-ry, ry + 1):
            half = round(rx * math.sqrt(max(0.0, 1 - (dy * dy) / (ry * ry + 0.01))))
            self.hline(cx - half, cy + dy, half * 2 + 1, c)

    def dither(self, x, y, w, h, c, density=0.5, phase=0):
        """Padrão ordenado (Bayer 4x4) para gradientes discretos."""
        bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                if (bayer[(yy + phase) % 4][xx % 4] + 0.5) / 16 < density:
                    self.px(xx, yy, c)

    def blit(self, other, x, y):
        for yy in range(other.h):
            for xx in range(other.w):
                c = other.p[xx, yy]
                if c[3]:
                    self.px(x + xx, y + yy, c)

    def sprite(self, rows, colors, x=0, y=0):
        """Desenha um sprite descrito em texto (um caractere por pixel, '.' = vazio)."""
        rows = [r for r in rows.strip().split('\n')]
        rows = [r.strip() for r in rows]
        width = len(rows[0])
        for i, r in enumerate(rows):
            assert len(r) == width, f'linha {i} com largura {len(r)} != {width}: {r!r}'
            for j, ch in enumerate(r):
                if ch != '.' and ch != ' ':
                    self.px(x + j, y + i, colors[ch])
        return width, len(rows)

    def outline(self, color='ink', diagonal=False):
        """Contorno externo de 1px em volta dos pixels opacos (in-place, sem crescer o canvas)."""
        src = [[self.opaque(x, y) for x in range(self.w)] for y in range(self.h)]
        n = [(-1, 0), (1, 0), (0, -1), (0, 1)] + ([(-1, -1), (1, 1), (-1, 1), (1, -1)] if diagonal else [])
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x]:
                    continue
                for dx, dy in n:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < self.w and 0 <= yy < self.h and src[yy][xx]:
                        self.px(x, y, color)
                        break

    def recolor(self, mapping):
        m = {rgba(k)[:3]: rgba(v) for k, v in mapping.items()}
        for y in range(self.h):
            for x in range(self.w):
                c = self.p[x, y]
                if c[3] and c[:3] in m:
                    self.p[x, y] = m[c[:3]]

    def flipped(self):
        out = Canvas(self.w, self.h)
        out.im = self.im.transpose(Image.FLIP_LEFT_RIGHT)
        out.p = out.im.load()
        return out


def shade_shape(cv, inside, ramp, light=(-0.55, -0.75), x0=0, y0=0, w=None, h=None, cx=None, cy=None, rx=None, ry=None,
                cylinder=False, bands=None):
    """Pinta uma forma (função inside(x,y)) com sombreado esférico/cilíndrico quantizado na rampa dada."""
    w = w or cv.w; h = h or cv.h
    cx = cx if cx is not None else x0 + w / 2 - 0.5
    cy = cy if cy is not None else y0 + h / 2 - 0.5
    rx = rx or w / 2; ry = ry or h / 2
    lx, ly = light
    n = len(ramp)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if not inside(x, y):
                continue
            nx = (x - cx) / rx
            ny = 0 if cylinder else (y - cy) / ry
            nz = math.sqrt(max(0.0, 1 - min(1.0, nx * nx + ny * ny)))
            d = -(nx * lx + ny * ly) * 0.9 + nz * 0.55
            t = max(0.0, min(0.999, (d + 0.35) / 1.25))
            idx = int(t * n)
            if bands:
                idx = bands(x, y, idx)
            cv.px(x, y, ramp[max(0, min(n - 1, idx))])


def check_palette(img, name):
    bad = set()
    for c in img.getdata():
        if c[3] and c[:3] not in PALETTE_SET and c[3] == 255:
            bad.add(c[:3])
    if bad:
        raise SystemExit(f'{name}: cores fora da paleta: {sorted(bad)[:8]}')


def outline_mask(cv):
    """Contorno branco de 1px (canvas 2px maior), tingido em jogo para hover/acionado."""
    out = Canvas(cv.w + 2, cv.h + 2)
    for y in range(-1, cv.h + 1):
        for x in range(-1, cv.w + 1):
            if cv.opaque(x, y):
                continue
            if cv.opaque(x - 1, y) or cv.opaque(x + 1, y) or cv.opaque(x, y - 1) or cv.opaque(x, y + 1):
                out.px(x + 1, y + 1, 'white')
    return out
