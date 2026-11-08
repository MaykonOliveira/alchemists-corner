"""Decoração da loja (fase 3, pacote K): tapetes, quadros, luminárias, plantas e o toldo da janela.

Posições na cena (src/game/phaser/scenes/ShopScene.ts):
- tapete: cobre o tapete do cenário em (146, 178), 124x32
- quadro: cobre o quadrinho do cenário em (27, 17), 18x16
- luminária: pendurada entre as estantes em (173, 9)
- planta: no chão à direita do tapete, em (276, 186)
- toldo: sanefa sobre a janela em (46, 14), desenhada em tons claros e tingida na cor escolhida
"""
from pix import Canvas

RUG_W, RUG_H = 124, 32
POS = {'rug': (146, 178), 'frame': (27, 17), 'lamp': (173, 9), 'plant': (276, 186), 'awning': (46, 14)}


def _rug(base, edge, inner, dots, motif, kind):
    c = Canvas(RUG_W, RUG_H)
    x, y, w, h = 0, 2, RUG_W, 28
    c.rect(x, y, w, h, edge)
    c.rect(x + 1, y + 1, w - 2, h - 2, base)
    c.dither(x + 1, y + 1, w - 2, h - 2, edge, 0.18)
    c.frame(x + 3, y + 3, w - 6, h - 6, dots)
    c.frame(x + 5, y + 5, w - 10, h - 10, edge)
    c.rect(x + 6, y + 6, w - 12, h - 12, inner)
    c.dither(x + 6, y + 6, w - 12, h - 12, base, 0.15)
    my = y + h // 2
    for px in range(x + 14, x + w - 10, 16):
        if kind == 'leaf':
            c.hline(px - 4, my, 9, motif); c.hline(px - 3, my - 1, 7, motif); c.hline(px - 2, my - 2, 5, motif)
            c.hline(px - 3, my + 1, 7, motif); c.px(px, my - 3, dots); c.px(px, my, dots)
        elif kind == 'star':
            c.hline(px - 3, my, 7, motif); c.vline(px, my - 3, 7, motif); c.px(px - 1, my - 1, motif); c.px(px + 1, my + 1, motif)
            c.px(px + 1, my - 1, motif); c.px(px - 1, my + 1, motif); c.px(px, my, 'white')
            c.px(px + 7, my - 4, dots); c.px(px - 6, my + 4, dots)
        else:  # losango
            for dy in range(-4, 5):
                half = 4 - abs(dy)
                c.hline(px - half, my + dy, half * 2 + 1, motif if abs(dy) < 4 else dots)
            c.rect(px - 1, my - 1, 3, 3, base)
    for px in range(x + 8, x + w - 6, 6):
        c.px(px, y + 7, dots); c.px(px, y + h - 8, dots)
    for px in range(0, w, 2):
        c.vline(px, 0, 2, 'c3'); c.vline(px, y + h, 2, 'c3')
    return c


def rug_musgo():
    return _rug('g2', 'g0', 'g1', 'g4', 'g3', 'leaf')


def rug_vinho():
    return _rug('r2', 'r0', 'r1', 'a4', 'a3', 'diamond')


def rug_estrelas():
    return _rug('v2', 'v0', 'b0', 'v4', 'a4', 'star')


def _frame(paint):
    c = Canvas(18, 16)
    c.rect(0, 0, 18, 16, 'w1')
    c.frame(0, 0, 18, 16, 'a2'); c.hline(0, 0, 18, 'a4'); c.vline(0, 0, 16, 'a3')
    c.rect(2, 2, 14, 12, 'c4')
    paint(c)
    c.frame(1, 1, 16, 14, 'w2')
    return c


def frame_caldeirao():
    def p(c):
        c.rect(2, 2, 14, 12, 't1'); c.rect(2, 10, 14, 4, 'w2')
        c.ellipse(9, 9, 4, 3, 'k1'); c.hline(6, 6, 7, 'k3'); c.rect(7, 6, 5, 1, 'pg2')
        c.px(8, 4, 'pg3'); c.px(10, 3, 'pg4'); c.px(5, 12, 'a3'); c.px(13, 12, 'a3')
    return _frame(p)


def frame_gato():
    def p(c):
        c.rect(2, 2, 14, 12, 'v1'); c.dither(2, 2, 14, 12, 'v2', 0.3)
        c.ellipse(9, 11, 4, 3, 'a2'); c.ellipse(9, 7, 3, 3, 'a2')
        c.px(7, 4, 'a2'); c.px(11, 4, 'a2'); c.px(8, 7, 'g4'); c.px(10, 7, 'g4'); c.px(9, 8, 'r4')
        c.hline(7, 10, 5, 'a4')
    return _frame(p)


def frame_mapa():
    def p(c):
        c.rect(2, 2, 14, 12, 'c3'); c.dither(2, 2, 14, 12, 'c2', 0.3)
        c.rect(4, 4, 4, 3, 'g3'); c.rect(10, 7, 4, 4, 'g3'); c.hline(3, 10, 5, 'b3')
        c.px(6, 8, 'r3'); c.px(7, 9, 'r3'); c.px(8, 9, 'r3'); c.px(9, 8, 'r3'); c.px(12, 5, 'r3')
        c.px(13, 3, 'k2'); c.px(13, 4, 'k2'); c.px(12, 4, 'k2'); c.px(14, 4, 'k2')
    return _frame(p)


def frame_amizade():
    def p(c):
        c.rect(2, 2, 14, 12, 'pp3')
        c.rect(5, 5, 3, 2, 'r3'); c.rect(10, 5, 3, 2, 'r3'); c.rect(5, 6, 8, 3, 'r3'); c.rect(6, 9, 6, 1, 'r3'); c.rect(7, 10, 4, 1, 'r3'); c.px(9, 11, 'r3')
        c.px(6, 6, 'r5'); c.hline(3, 12, 12, 'a3')
    return _frame(p)


def frame_neve():
    def p(c):
        c.rect(2, 2, 14, 8, 'b2'); c.rect(2, 10, 14, 4, 'c5')
        for xx, top in ((5, 5), (9, 4), (13, 6)):
            for dy in range(10 - top):
                c.hline(xx - dy // 2, top + dy, dy + 1, 'g1')
            c.px(xx, top, 'c5')
        c.px(4, 3, 'white'); c.px(11, 3, 'white'); c.px(14, 4, 'white'); c.px(7, 6, 'white')
    return _frame(p)


def _chain(c, x, n):
    for yy in range(0, n, 2):
        c.px(x, yy, 'k3'); c.px(x, yy + 1, 'k2')


def lamp_lua():
    c = Canvas(12, 26)
    _chain(c, 6, 9)
    c.ellipse(6, 16, 5, 6, 'a4'); c.ellipse(8, 15, 4, 5, None)
    for yy in range(10, 23):
        for xx in range(0, 12):
            if c.opaque(xx, yy) and (xx - 8) ** 2 / 16 + (yy - 15) ** 2 / 25 < 1:
                c.p[xx, yy] = (0, 0, 0, 0)
    c.px(3, 13, 'a6'); c.px(2, 16, 'a5'); c.px(3, 20, 'a3')
    c.px(10, 12, 'a5'); c.px(11, 19, 'a5')
    return c


def lamp_cristal():
    c = Canvas(14, 26)
    _chain(c, 7, 8)
    c.hline(2, 8, 11, 'a3'); c.hline(3, 9, 9, 'a2')
    for i, xx in enumerate(range(3, 12, 2)):
        h = 8 + (2 - abs(i - 2)) * 3
        c.vline(xx, 10, h, ('b4', 'v4', 't4', 'pp2', 'b5')[i]); c.px(xx, 10 + h, 'white')
    c.rect(5, 10, 5, 3, 'a4')
    return c


def lamp_abobora():
    c = Canvas(14, 26)
    _chain(c, 7, 10)
    c.vline(7, 10, 3, 'g2')
    c.ellipse(7, 18, 6, 5, 'pf2'); c.ellipse(7, 18, 2, 5, 'pf1')
    c.rect(4, 16, 2, 2, 'a5'); c.rect(9, 16, 2, 2, 'a5'); c.hline(5, 20, 5, 'a5'); c.px(6, 21, 'pf1'); c.px(8, 21, 'pf1')
    return c


def lamp_sol():
    c = Canvas(16, 26)
    _chain(c, 8, 8)
    c.ellipse(8, 16, 4, 4, 'a4'); c.ellipse(8, 16, 2, 2, 'a6')
    for dx, dy in ((0, -7), (0, 7), (-7, 0), (7, 0), (-5, -5), (5, -5), (-5, 5), (5, 5)):
        c.px(8 + dx, 16 + dy, 'a3'); c.px(8 + dx * 6 // 7, 16 + dy * 6 // 7, 'a2')
    return c


def _pot(c, x, y, col='tc2', w=12):
    c.rect(x, y, w, 7, col); c.hline(x - 1, y, w + 2, 'tc3'); c.hline(x, y + 6, w, 'tc0'); c.vline(x + w - 2, y + 1, 5, 'tc1')


def plant_cogumelos():
    c = Canvas(16, 22)
    _pot(c, 2, 15)
    for x, y, h, col in ((4, 8, 7, 'b3'), (9, 5, 10, 't3'), (12, 10, 5, 'b4')):
        c.vline(x + 1, y + 2, h - 2, 'c4')
        c.hline(x - 1, y, 5, col); c.hline(x, y - 1, 3, col); c.hline(x - 1, y + 1, 5, col); c.px(x, y - 1, 'b5')
    return c


def plant_cacto():
    c = Canvas(16, 22)
    _pot(c, 2, 15, 'c1')
    c.rect(6, 4, 4, 11, 'g2'); c.vline(7, 4, 11, 'g3'); c.rect(2, 8, 3, 2, 'g2'); c.rect(2, 6, 2, 3, 'g2'); c.rect(11, 9, 3, 2, 'g2'); c.rect(12, 6, 2, 4, 'g2')
    for yy in range(5, 15, 3):
        c.px(9, yy, 'g5')
    c.rect(6, 1, 4, 3, 'v4'); c.px(7, 0, 'v5'); c.px(8, 2, 'a5')
    return c


def plant_flores():
    c = Canvas(18, 22)
    c.rect(2, 14, 14, 7, 'w4'); c.hline(1, 14, 16, 'w5')
    for xx in range(3, 16, 3):
        c.vline(xx, 15, 6, 'w2')
    for x, y, col in ((4, 9, 'r4'), (8, 6, 'a4'), (12, 9, 'pp2'), (6, 11, 'v4'), (11, 12, 'r4'), (14, 7, 'b4')):
        c.vline(x, y + 2, 13 - y, 'g2')
        c.rect(x - 1, y, 3, 3, col); c.px(x, y + 1, 'a5')
    return c


def awning():
    """Sanefa listrada da janela, em tons claros (a cena tinge na cor do toldo)."""
    c = Canvas(62, 8)
    for x in range(62):
        stripe = (x // 6) % 2 == 0
        h = 6 if (x % 6) not in (0, 5) else 5
        for y in range(h):
            c.px(x, y, ('white' if y < 4 else 'c4') if stripe else ('c3' if y < 4 else 'c2'))
    c.hline(0, 0, 62, 'c2')
    return c


def frames():
    return {
        'rug-musgo': rug_musgo(), 'rug-vinho': rug_vinho(), 'rug-estrelas': rug_estrelas(),
        'frame-caldeirao': frame_caldeirao(), 'frame-gato': frame_gato(), 'frame-mapa': frame_mapa(),
        'frame-amizade': frame_amizade(), 'frame-neve': frame_neve(),
        'lamp-lua': lamp_lua(), 'lamp-cristal': lamp_cristal(), 'lamp-abobora': lamp_abobora(), 'lamp-sol': lamp_sol(),
        'plant-cogumelos': plant_cogumelos(), 'plant-cacto': plant_cacto(), 'plant-flores': plant_flores(),
        'awning': awning(),
    }
