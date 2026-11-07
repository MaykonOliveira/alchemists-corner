"""Pacote G: os três quadros da história de abertura.

1. A carta do antigo dono, com a chave da loja, à luz de vela.
2. A loja empoeirada no dia em que você chega.
3. O caldeirão aceso, as prateleiras cheias e o gato de volta ao balcão.
"""
import math
from pix import Canvas, P, PALETTE_SET, rgba
import objects as O
import items as I
import cat as CAT
from room import draw_room

W, H = 192, 108
# Quadros da loja: recorte maior da cena (mesma proporção 16:9).
CW, CH = 256, 144

PLACES = [  # (sprite, x, y) iguais aos da cena
    (O.cabinet, 2, 38), (O.shelf, 108, 22), (O.shelf, 170, 22), (O.board, 238, 32),
    (O.door, 300, 28), (O.cauldron, 46, 128), (O.counter, 150, 128), (O.register, 243, 117),
]

_PAL = sorted(PALETTE_SET)


def _nearest(rgb):
    return min(_PAL, key=lambda c: (c[0] - rgb[0]) ** 2 * 3 + (c[1] - rgb[1]) ** 2 * 4 + (c[2] - rgb[2]) ** 2 * 2)


def _tint(cv, f, tint=(0, 0, 0), amount=0.0):
    """Escurece (f < 1) e puxa para um tom, sempre voltando para a paleta."""
    cache = {}
    for y in range(cv.h):
        for x in range(cv.w):
            c = cv.p[x, y]
            if not c[3]:
                continue
            key = c[:3]
            if key not in cache:
                r, g, b = (v * f * (1 - amount) + t * amount for v, t in zip(key, tint))
                cache[key] = _nearest((r, g, b))
            cv.p[x, y] = cache[key] + (255,)
    return cv


def _shop(lit):
    room = draw_room()
    for fn, x, y in PLACES:
        room.blit(fn(), x, y)
    if lit:
        board_y = O.SHELF_BOARDS
        recipes = list(I.LIQ)
        n = 0
        for sx in (108, 170):
            for b in board_y:
                for i in range(6):
                    if (i + b) % 4 == 3:
                        continue
                    pot = I.potion_small(recipes[n % len(recipes)])
                    n += 1
                    room.blit(pot, sx + 6 + i * 8, 22 + b - pot.h)
        sign = O.sign(True)
        room.blit(sign, 321 - sign.w // 2, 58)
        cat = CAT.cat_sit(0)
        room.blit(cat, 205 - cat.w // 2, 128 - cat.h + 2)
    else:
        sign = O.sign(False)
        room.blit(sign, 321 - sign.w // 2, 58)
    return room


def _crop(src, x0, y0, w=W, h=H):
    out = Canvas(w, h)
    for y in range(h):
        for x in range(w):
            out.p[x, y] = src.get(x0 + x, y0 + y)
    return out


def _glow(cv, cx, cy, r, warm=(255, 196, 92), strength=0.55):
    """Luz quente: puxa os pixels perto da fonte para o âmbar (com degraus de Bayer) e volta para a paleta."""
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    cache = {}
    for y in range(max(0, int(cy - r)), min(cv.h, int(cy + r) + 1)):
        for x in range(max(0, int(cx - r)), min(cv.w, int(cx + r) + 1)):
            c = cv.p[x, y]
            if not c[3]:
                continue
            d = math.hypot(x - cx, y - cy) / r
            if d >= 1:
                continue
            a = (1 - d) ** 1.4 * strength
            a = round((a + (bayer[y % 4][x % 4] / 16 - 0.5) * 0.12) * 6) / 6  # degraus
            if a <= 0:
                continue
            key = (c[:3], a)
            if key not in cache:
                cache[key] = _nearest(tuple(v + (w - v) * a for v, w in zip(c[:3], warm)))
            cv.p[x, y] = cache[key] + (255,)


def frame_letter():
    """Quadro 1: a carta e a chave sobre a mesa, à luz de vela, com a lua na janela."""
    c = Canvas(W, H)
    # parede escura com reboco
    c.rect(0, 0, W, H, 'w0')
    c.dither(0, 0, W, 70, 'w1', 0.35)
    # janela com lua
    c.rect(14, 10, 42, 40, 'w2'); c.rect(17, 13, 36, 34, 'b0'); c.dither(17, 13, 36, 34, 'b1', 0.3)
    c.ellipse(42, 24, 6, 6, 'c4'); c.ellipse(44, 22, 5, 5, 'b0')
    for sx, sy in ((22, 18), (28, 40), (47, 38), (35, 16)):
        c.px(sx, sy, 'b5')
    c.vline(35, 13, 34, 'w2'); c.hline(17, 30, 36, 'w2')
    # vela
    c.rect(150, 40, 10, 32, 'c4'); c.vline(150, 40, 32, 'c3'); c.vline(159, 40, 32, 'c2')
    c.rect(148, 70, 14, 3, 'cu1'); c.rect(146, 72, 18, 2, 'cu0')
    c.px(155, 39, 'k1'); c.px(155, 38, 'k1')
    c.ellipse(155, 33, 3, 5, 'a3'); c.ellipse(155, 34, 2, 3, 'a5'); c.px(155, 35, 'a6')
    _glow(c, 155, 34, 40, strength=0.5)
    c.ellipse(155, 33, 3, 5, 'a3'); c.ellipse(155, 34, 2, 3, 'a5'); c.px(155, 35, 'a6')
    # mesa
    c.rect(0, 72, W, 36, 'w3')
    for y in (78, 88, 99):
        c.hline(0, y, W, 'w2')
    c.dither(0, 72, W, 36, 'w4', 0.18)
    c.hline(0, 72, W, 'w5')
    # carta (pergaminho)
    lx, ly, lw, lh = 52, 62, 70, 40
    c.rect(lx + 2, ly + 2, lw, lh, 'w1')
    c.rect(lx, ly, lw, lh, 'c3'); c.dither(lx, ly, lw, lh, 'c4', 0.4)
    c.frame(lx, ly, lw, lh, 'c1')
    for i, n in enumerate((48, 56, 40, 52, 30)):
        c.hline(lx + 7, ly + 7 + i * 5, n, 'c0')
    c.hline(lx + 40, ly + 33, 22, 'w2')  # assinatura
    # selo de cera
    c.ellipse(lx + lw - 12, ly + lh - 9, 6, 6, 'r1'); c.ellipse(lx + lw - 12, ly + lh - 9, 5, 5, 'r2')
    c.ellipse(lx + lw - 13, ly + lh - 10, 2, 2, 'r3'); c.px(lx + lw - 14, ly + lh - 11, 'r4')
    # chave de latão
    kx, ky = 128, 88
    c.ellipse(kx, ky, 5, 5, 'a1'); c.ellipse(kx, ky, 3, 3, 'w3'); c.px(kx - 2, ky - 3, 'a4')
    c.rect(kx + 5, ky - 1, 22, 3, 'a2'); c.hline(kx + 5, ky - 1, 22, 'a4'); c.hline(kx + 5, ky + 1, 22, 'a0')
    c.rect(kx + 22, ky + 2, 3, 4, 'a2'); c.rect(kx + 17, ky + 2, 2, 3, 'a2')
    # brilhos mágicos saindo da carta
    for sx, sy, col in ((60, 54, 'v4'), (74, 48, 'b4'), (96, 52, 'a5'), (110, 44, 'v4'), (86, 40, 'b5')):
        c.px(sx, sy, col); c.px(sx - 1, sy, 'v2'); c.px(sx + 1, sy, 'v2'); c.px(sx, sy - 1, 'v2'); c.px(sx, sy + 1, 'v2')
    return c


def frame_dusty():
    """Quadro 2: a loja fechada, escura e cheia de pó."""
    src = _tint(_shop(False), 0.55, (40, 34, 52), 0.25)
    c = _crop(src, 0, 36, CW, CH)
    # teias nos cantos de cima
    for i in range(14):
        c.px(i, 0 + i // 2, 's4'); c.px(i // 2, i, 's4')
    for r in (6, 11):
        for a in range(0, 90, 12):
            x = int(r * math.cos(math.radians(a))); y = int(r * math.sin(math.radians(a)))
            c.px(x, y, 's3')
    for i in range(16):
        c.px(c.w - 1 - i, i // 2, 's4'); c.px(c.w - 1 - i // 2, i, 's4')
    # poeira no ar e um raio de luz entrando pela porta
    for y in range(c.h):
        for x in range(c.w):
            if (x * 13 + y * 7) % 97 == 0:
                c.px(x, y, 's4')
    for y in range(0, c.h):
        x0 = 196 + y // 3
        for x in range(x0, x0 + 10):
            if (x + y) % 3 == 0 and c.opaque(x, y):
                c.px(x, y, 'c1')
    return c


def frame_lit():
    """Quadro 3: o caldeirão aceso, poções nas prateleiras e o gato no balcão."""
    src = _shop(True)
    # poção borbulhando na boca do caldeirão
    src.ellipse(70, 137, 15, 2, 't2'); src.hline(60, 136, 18, 't3'); src.hline(64, 135, 8, 't4')
    _glow(src, 70, 124, 62, strength=0.32)
    # bolhas e vapor do caldeirão
    for bx, by, col in ((62, 124, 't4'), (70, 118, 't5'), (78, 122, 't3'), (66, 110, 't4'), (74, 104, 't5')):
        src.ellipse(bx, by, 1, 1, col)
    c = _crop(src, 0, 36, CW, CH)
    for sx, sy, col in ((20, 14, 'a5'), (98, 8, 'a4'), (150, 20, 'a5'), (236, 12, 'a4'), (60, 70, 'a5')):
        c.px(sx, sy, col); c.px(sx - 1, sy, 'a3'); c.px(sx + 1, sy, 'a3'); c.px(sx, sy - 1, 'a3'); c.px(sx, sy + 1, 'a3')
    return c


def frames():
    return {'story-1': frame_letter(), 'story-2': frame_dusty(), 'story-3': frame_lit()}
