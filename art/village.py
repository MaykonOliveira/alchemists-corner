"""Fase 4 (pacote W): obras da vila, 48x40, em 4 estados cada (terreno, fundação, paredes, pronta).

Saída: src/assets/sprites/village.png (grade 4 colunas x 6 linhas) + village.json.
"""
from pix import Canvas

W, H = 48, 40
GROUND = 34  # linha onde começa o chão


def _ground(c):
    c.rect(0, GROUND, W, H - GROUND, 'g2')
    c.hline(0, GROUND, W, 'g3')
    c.dither(0, GROUND + 1, W, H - GROUND - 1, 'g1', 0.25)


def fonte():
    c = Canvas(W, H)
    _ground(c)
    c.rect(14, 30, 20, 2, 'p2')
    c.ellipse(24, 30, 14, 4, 's2')
    c.ellipse(24, 29, 13, 3, 's4')
    c.ellipse(24, 29, 11, 2, 'b3')
    c.hline(16, 28, 6, 'b5')
    c.rect(22, 16, 4, 12, 's3')
    c.vline(22, 16, 12, 's4')
    c.ellipse(24, 16, 6, 2, 's4')
    c.ellipse(24, 15, 5, 1, 'b3')
    for x, y in ((18, 13), (30, 13), (16, 18), (32, 18), (24, 9), (21, 11), (27, 11)):
        c.px(x, y, 'b4')
    c.rect(23, 10, 2, 4, 'b5')
    return c


def ponte():
    c = Canvas(W, H)
    c.rect(0, 28, W, 12, 'b2')
    c.dither(0, 28, W, 12, 'b3', 0.3)
    c.hline(0, 28, W, 'b4')
    c.rect(0, GROUND + 2, 8, 4, 'g2'); c.rect(40, GROUND + 2, 8, 4, 'g2')
    # arco de pedra
    for x in range(2, 46):
        top = 18 + int(((x - 24) / 22) ** 2 * 4)
        c.vline(x, top, 4, 's3')
        c.px(x, top, 's5')
    c.ellipse(24, 30, 14, 8, 'b2')
    c.dither(10, 26, 28, 6, 'b3', 0.3)
    for x in range(4, 46, 6):
        c.vline(x, 14 + int(((x - 24) / 22) ** 2 * 4), 4, 'w3')
    c.hline(2, 14, 44, 'w4')
    return c


def mercado():
    c = Canvas(W, H)
    _ground(c)
    for i, x in enumerate((2, 18, 34)):
        c.rect(x + 1, 22, 12, 12, 'w3')
        c.rect(x + 2, 24, 10, 6, 'w1')
        for k, col in enumerate(('a3', 'g4', 'r4', 'pv2', 'a4')):
            c.px(x + 3 + k * 2, 25, col); c.px(x + 4 + k * 2, 26, col)
        stripe = ('r3', 'c5') if i != 1 else ('b3', 'c5')
        for k in range(14):
            c.vline(x + k, 16, 5, stripe[(k // 2) % 2])
        c.hline(x, 21, 14, 'w1')
        c.vline(x + 1, 21, 13, 'w2'); c.vline(x + 12, 21, 13, 'w2')
    return c


def biblioteca():
    c = Canvas(W, H)
    _ground(c)
    c.rect(6, 14, 36, 20, 'p4')
    c.dither(6, 14, 36, 20, 'p3', 0.2)
    for x in (9, 17, 29, 37):
        c.rect(x, 16, 3, 18, 'c4'); c.vline(x, 16, 18, 'c5')
    c.rect(21, 22, 6, 12, 'w1'); c.rect(22, 23, 4, 11, 'w2')
    # telhado triangular
    for y in range(0, 9):
        c.hline(24 - y * 2 - 4, 6 + y, (y * 2 + 4) * 2, 'r2')
    c.hline(4, 14, 40, 'c3')
    c.rect(21, 9, 6, 4, 'b2'); c.px(22, 10, 'a4'); c.px(24, 10, 'r4'); c.px(25, 11, 'g4')
    return c


def relogio():
    c = Canvas(W, H)
    _ground(c)
    c.rect(16, 8, 16, 26, 's3')
    c.dither(16, 8, 16, 26, 's2', 0.2)
    c.vline(16, 8, 26, 's4')
    c.rect(21, 27, 6, 7, 'w1')
    c.ellipse(24, 15, 5, 5, 'c5'); c.ellipse(24, 15, 4, 4, 'c4')
    c.vline(24, 12, 4, 'k1'); c.hline(24, 15, 3, 'k1')
    for y in range(0, 7):
        c.hline(24 - (y + 2), 1 + y, (y + 2) * 2, 'b1')
    c.px(24, 0, 'a4')
    c.rect(19, 21, 3, 3, 'a3'); c.rect(26, 21, 3, 3, 'a3')
    return c


def jardim():
    c = Canvas(W, H)
    _ground(c)
    for x in (6, 18, 30, 42):
        c.vline(x, 18, 16, 'k2')
        c.rect(x - 2, 14, 5, 5, 'r2'); c.rect(x - 1, 15, 3, 3, 'a4'); c.px(x, 16, 'a6')
    c.hline(6, 18, 37, 'k3')
    for x, col in ((3, 'r4'), (11, 'pv3'), (14, 'a4'), (23, 'r4'), (26, 'pv3'), (35, 'a4'), (38, 'r4'), (45, 'pv3')):
        c.px(x, 32, col); c.px(x, 33, 'g4'); c.px(x - 1, 31, col); c.px(x + 1, 31, col)
    c.ellipse(24, 30, 6, 2, 'g3')
    return c


BUILDINGS = {'fonte': fonte, 'ponte': ponte, 'mercado': mercado, 'biblioteca': biblioteca, 'relogio': relogio, 'jardim': jardim}


def _scaffold(c, top):
    for x in (4, 22, 42):
        c.vline(x, top, GROUND - top, 'w4')
    for y in range(top, GROUND, 6):
        c.hline(4, y, 39, 'w3')


def lot():
    c = Canvas(W, H)
    _ground(c)
    c.vline(8, 24, 10, 'w2'); c.rect(4, 22, 10, 6, 'w4'); c.hline(5, 24, 8, 'w1'); c.hline(5, 26, 6, 'w1')
    for x in (16, 30, 44):
        c.vline(x, 30, 4, 'w3'); c.px(x, 29, 'r3')
    c.hline(16, 31, 29, 'a4')
    return c


def foundation(build):
    c = lot()
    c.rect(6, 30, 36, 4, 's2'); c.hline(6, 30, 36, 's4')
    _scaffold(c, 18)
    return c


def walls(build):
    done = build()
    c = Canvas(W, H)
    _ground(c)
    cut = 20
    for y in range(cut, H):
        for x in range(W):
            px = done.get(x, y)
            if px and px[3]:
                c.px(x, y, px)
    _scaffold(c, 10)
    c.rect(36, 26, 6, 8, 'c3'); c.frame(36, 26, 6, 8, 'w2')
    return c


def frames():
    out = {}
    for name, fn in BUILDINGS.items():
        out[f'{name}-0'] = lot()
        out[f'{name}-1'] = foundation(fn)
        out[f'{name}-2'] = walls(fn)
        out[f'{name}-3'] = fn()
    return out
