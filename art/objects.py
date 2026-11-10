"""Móveis interativos, sinalização, efeitos e melhorias da loja."""
import math
from pix import Canvas, P, shade_shape

SHELF_BOARDS = [19, 39, 59]


def cabinet():
    c = Canvas(40, 98)
    c.rect(0, 3, 40, 95, 'w1')
    c.rect(2, 6, 36, 90, 'w3')
    # cornija
    c.rect(0, 0, 40, 6, 'w3'); c.hline(0, 0, 40, 'w5'); c.hline(0, 1, 40, 'w4'); c.hline(0, 5, 40, 'w0')
    c.hline(1, 3, 38, 'w2')
    for x in range(3, 38, 4):
        c.px(x, 3, 'a3')
    # portas de vidro
    for dx in (4, 21):
        c.rect(dx, 8, 15, 51, 'w1')
        c.rect(dx + 1, 9, 13, 49, 't0')
        c.dither(dx + 1, 9, 13, 49, 'gl0', 0.25)
        for sy in (25, 42):
            c.rect(dx + 1, sy, 13, 2, 'w4'); c.hline(dx + 1, sy, 13, 'w5')
        c.hline(dx + 1, 57, 13, 'w4')
    jars = [('g3', 'g4'), ('a3', 'a4'), ('t3', 't4'), ('g2', 'g3'), ('s3', 's4'), ('b2', 'b3'), ('r3', 'r4'), ('g4', 'g5'),
            ('v3', 'v4'), ('a2', 'a3'), ('t2', 't3'), ('cu2', 'cu3')]
    j = 0
    for sy in (17, 34, 50):
        for dx in (5, 10, 22, 28):
            a, b = jars[j % len(jars)]; j += 1
            tall = j % 3 == 0
            top = sy - (1 if tall else 0)
            c.rect(dx, top, 4, 8 - (top - sy) - (0 if tall else 0), 'gl2')
            c.rect(dx, top + 2, 4, 6 - (top - sy) + (top - sy), a)
            c.vline(dx + 3, top + 2, 6, 'gl0'); c.px(dx + 1, top + 3, b); c.px(dx, top + 2, 'gl3')
            c.hline(dx, top - 1, 4, 'cu2'); c.px(dx + 3, top - 1, 'cu1')
    # reflexos no vidro
    for dx in (5, 22):
        for i in range(6):
            c.px(dx + 1 + i // 2, 10 + 6 - i, 'gl3' if i % 2 else 'gl2')
    # puxadores das portas
    c.rect(18, 30, 1, 4, 'a3'); c.rect(21, 30, 1, 4, 'a3')
    # gavetas
    for i in range(3):
        y = 62 + i * 11
        c.rect(4, y, 32, 9, 'w4'); c.hline(4, y, 32, 'w5'); c.hline(4, y + 8, 32, 'w1'); c.vline(4, y, 9, 'w1'); c.vline(35, y, 9, 'w1')
        c.vline(19, y + 1, 7, 'w2')
        c.rect(9, y + 3, 5, 2, 'a3'); c.px(9, y + 3, 'a5'); c.rect(26, y + 3, 5, 2, 'a3'); c.px(26, y + 3, 'a5')
    c.vline(0, 3, 95, 'w0'); c.vline(39, 3, 95, 'w0'); c.vline(1, 6, 90, 'w4')
    c.rect(0, 96, 40, 2, 'ink')
    # pés
    c.rect(1, 95, 4, 3, 'w0'); c.rect(35, 95, 4, 3, 'w0')
    return c


def cabinet_labels():
    """Melhoria 'Armário organizado': etiquetas e frisos dourados."""
    c = Canvas(40, 98)
    for i in range(3):
        y = 62 + i * 11
        for x in (6, 23):
            c.rect(x, y + 1, 9, 6, 'c4'); c.hline(x, y + 6, 9, 'c1'); c.vline(x + 8, y + 1, 6, 'c2')
            c.hline(x + 2, y + 3, 5, 'c1'); c.px(x + 1, y + 1, 'a4')
    for sy in (25, 42):
        for x in (6, 12, 27, 33):
            c.px(x, sy - 1, 'a4')
    c.hline(4, 7, 32, 'a3')
    return c


def cauldron():
    c = Canvas(48, 48)
    # lareira de pedra
    c.rect(1, 31, 46, 17, 's1')
    for row in range(3):
        for i in range(6):
            x = 2 + i * 9 - (4 if row % 2 else 0)
            y = 32 + row * 5
            for xx in range(max(2, x), min(46, x + 8)):
                c.vline(xx, y, 4, 's3')
            if 2 <= x < 46:
                c.hline(max(2, x), y, min(8, 46 - x), 's4')
            c.hline(max(2, x), y + 3, min(8, 46 - max(2, x)), 's2')
    c.hline(1, 31, 46, 's4'); c.hline(1, 47, 46, 's0')
    # boca da fornalha
    c.rect(15, 37, 18, 11, 'ink'); c.ellipse(24, 37, 9, 3, 'ink')
    c.rect(16, 44, 16, 4, 'a0'); c.hline(16, 45, 16, 'a1')
    for x in range(17, 31, 3):
        c.px(x, 44, 'a3')
    c.hline(15, 47, 18, 'k1')
    # pés do caldeirão
    c.rect(10, 29, 3, 5, 'k1'); c.rect(35, 29, 3, 5, 'k1')
    # corpo sombreado (ferro)
    ramp = ['k0', 'k1', 'k1', 'k2', 'k2', 'k3']
    shade_shape(c, lambda x, y: (x - 23.5) ** 2 / 18.5 ** 2 + (y - 21) ** 2 / 12.5 ** 2 <= 1, ramp, x0=4, y0=8, w=40, h=26,
                cx=23.5, cy=19, rx=18.5, ry=12.5)
    c.px(14, 14, 'k4'); c.px(15, 13, 'white'); c.px(13, 16, 'k4')
    # alças
    for x in (2, 43):
        c.rect(x, 13, 3, 7, 'k1'); c.px(x + 1, 14, 'k3'); c.px(x + 1, 18, 'k0')
    # borda
    c.ellipse(24, 10, 20, 4, 'k2'); c.hline(6, 8, 36, 'k4'); c.hline(9, 7, 30, 'k3')
    c.ellipse(24, 10, 17, 3, 'k0')
    # líquido em repouso (turquesa)
    c.ellipse(24, 10, 16, 2, 't1'); c.ellipse(23, 10, 11, 1, 't2'); c.hline(16, 10, 6, 't3'); c.px(18, 9, 't4')
    c.px(29, 10, 't3')
    return c


def cauldron_bands():
    c = Canvas(48, 48)
    for y in (15, 25):
        for x in range(48):
            dx = (x - 23.5) / 18
            if abs(dx) > 1:
                continue
            yy = y + round(math.sqrt(1 - dx * dx) * 2)
            c.px(x, yy, 'cu1'); c.px(x, yy - 1, 'cu3' if x < 24 else 'cu2')
            if x % 6 == 0:
                c.px(x, yy - 1, 'cu4')
    c.rect(21, 17, 6, 6, 'a2'); c.rect(22, 18, 4, 4, 'a4'); c.px(22, 18, 'a6'); c.px(25, 21, 'a1')
    return c


def liquid():
    c = Canvas(33, 7)
    c.ellipse(16, 3, 16, 3, 'white')
    return c


def shelf():
    c = Canvas(56, 62)
    c.rect(0, 0, 56, 62, 'w1')
    c.rect(3, 2, 50, 58, 'w0')
    for x in range(6, 52, 7):
        c.vline(x, 2, 58, 'w1')
        c.vline(x + 1, 2, 58, 'shadow')
    c.dither(3, 2, 50, 58, 'w1', 0.15)
    # topo com cornija
    c.rect(0, 0, 56, 3, 'w4'); c.hline(0, 0, 56, 'w6'); c.hline(0, 2, 56, 'w2')
    for y in SHELF_BOARDS:
        c.rect(0, y, 56, 3, 'w4'); c.hline(0, y, 56, 'w6'); c.hline(0, y + 2, 56, 'w3')
        if y + 3 < 62:
            c.hline(0, y + 3, 56, 'ink'); c.dither(3, y + 4, 50, 2, 'ink', 0.35)
        # suportes em mão-francesa
        c.px(2, y + 3, 'w3'); c.px(53, y + 3, 'w3')
    c.dither(3, 3, 50, 3, 'ink', 0.4)
    c.rect(0, 0, 3, 62, 'w3'); c.vline(0, 0, 62, 'w2'); c.vline(1, 0, 62, 'w5')
    c.rect(53, 0, 3, 62, 'w3'); c.vline(55, 0, 62, 'w1'); c.vline(53, 0, 62, 'w4')
    return c


def board():
    c = Canvas(36, 32)
    c.rect(0, 0, 36, 32, 'w3'); c.frame(0, 0, 36, 32, 'w0'); c.hline(1, 1, 34, 'w5'); c.vline(1, 1, 30, 'w4')
    c.hline(1, 30, 34, 'w1'); c.vline(34, 1, 30, 'w1')
    c.rect(2, 2, 32, 28, 'cu2')
    c.dither(2, 2, 32, 28, 'cu1', 0.25)
    c.dither(2, 2, 32, 28, 'cu3', 0.12, phase=2)

    def note(x, y, w, h, pin, paper='c4', shade='c2'):
        c.rect(x + 1, y + 1, w, h, 'cu0')
        c.rect(x, y, w, h, paper)
        c.vline(x + w - 1, y + 1, h - 1, shade); c.hline(x, y + h - 1, w, shade)
        for ly in range(y + 3, y + h - 2, 2):
            c.hline(x + 1, ly, w - 3 - (ly % 3), 'c1')
        c.px(x + w // 2, y, pin); c.px(x + w // 2, y + 1, 'ink')
    note(4, 4, 11, 12, 'r3')
    note(18, 5, 13, 9, 't3', 'c3', 'c1')
    note(7, 18, 12, 9, 'a4')
    note(22, 17, 9, 10, 'v3', 'c4')
    # mapinha com X
    c.px(25, 22, 'r3'); c.px(27, 22, 'r3'); c.px(26, 23, 'r3'); c.px(25, 24, 'r3'); c.px(27, 24, 'r3')
    return c


def door():
    c = Canvas(42, 84)
    # arco de pedra
    c.ellipse(21, 13, 21, 13, 's2')
    c.rect(0, 13, 42, 71, 's2')
    for y in range(0, 84, 7):
        for x0, w in ((0, 5), (37, 5)):
            yy = y + (3 if x0 else 0)
            if yy < 10:
                continue
            c.rect(x0, yy, w, 6, 's3'); c.hline(x0, yy, w, 's4'); c.hline(x0, yy + 5, w, 's1')
    for i, a in enumerate(range(200, 341, 20)):
        rad = math.radians(a)
        x = 21 + math.cos(rad) * 18; y = 15 + math.sin(rad) * 13
        c.rect(int(x) - 2, int(y) - 1, 4, 3, 's3'); c.px(int(x) - 2, int(y) - 1, 's4')
    c.rect(19, 0, 4, 4, 's4'); c.px(19, 0, 's5')  # pedra-chave
    # vão
    c.ellipse(21, 15, 17, 11, 'w0'); c.rect(4, 15, 34, 69, 'w0')
    # folha da porta
    c.ellipse(21, 16, 16, 10, 'w3'); c.rect(5, 16, 32, 68, 'w3')
    for x in range(5, 37, 6):
        c.vline(x, 6, 78, 'w2')
        c.vline(x + 1, 6, 78, 'w4')
    c.ellipse(21, 16, 16, 10, None)
    for y in range(8, 84):
        for x in range(5, 37):
            if c.get(x, y)[:3] == (0, 0, 0):
                pass
    c.vline(5, 12, 72, 'w5')
    # vigia redonda
    c.ellipse(21, 19, 6, 6, 'k1'); c.ellipse(21, 19, 5, 5, 'sky1')
    c.rect(18, 21, 7, 3, 'c3'); c.hline(18, 20, 7, 'r2')
    c.hline(16, 19, 11, 'k1'); c.vline(21, 14, 11, 'k1')
    c.px(18, 16, 'white'); c.px(19, 15, 'white')
    # dobradiças de ferro
    for y in (32, 68):
        c.rect(5, y, 14, 3, 'k1'); c.hline(5, y, 14, 'k3'); c.rect(17, y - 1, 3, 5, 'k1')
        c.px(7, y + 1, 'k4'); c.px(12, y + 1, 'k4')
    # argola e maçaneta
    c.rect(31, 50, 4, 4, 'a3'); c.px(31, 50, 'a5'); c.px(34, 53, 'a1')
    c.ellipse(33, 57, 2, 2, 'a2'); c.px(33, 57, 'w3')
    c.hline(4, 83, 34, 'w0')
    return c


TINY_FONT = {
    # Letras extras para as placas em inglês (OPEN / CLOSED).
    'L': ['100', '100', '100', '100', '111'], 'N': ['101', '111', '111', '101', '101'],
    'P': ['110', '101', '110', '100', '100'], 'S': ['011', '100', '010', '001', '110'],
    'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
    'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
    'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
    'H': ['101', '101', '111', '101', '101'], 'O': ['010', '101', '101', '101', '010'],
    'R': ['110', '101', '110', '101', '101'], 'T': ['111', '010', '010', '010', '010'],
}


def tiny_text(c, text, x, y, col):
    for ch in text:
        for ry, row in enumerate(TINY_FONT[ch]):
            for rx, b in enumerate(row):
                if b == '1':
                    c.px(x + rx, y + ry, col)
        x += 4


def sign(open_, en=False):
    text = ('OPEN' if open_ else 'CLOSED') if en else ('ABERTO' if open_ else 'FECHADO')
    w = len(text) * 4 - 1 + 8
    c = Canvas(w, 14)
    c.vline(w // 2 - 4, 0, 4, 'k2'); c.vline(w // 2 + 4, 0, 4, 'k2'); c.px(w // 2, 0, 'k3')
    c.hline(w // 2 - 3, 0, 7, 'k2')
    c.rect(0, 3, w, 11, 'w1')
    face, hi, lo = ('g2', 'g3', 'g1') if open_ else ('tc1', 'tc2', 'tc0')
    c.rect(1, 4, w - 2, 9, face); c.hline(1, 4, w - 2, hi); c.hline(1, 12, w - 2, lo)
    tiny_text(c, text, 4, 6, 'ink')
    tiny_text(c, text, 4, 5, 'c4')
    c.px(1, 4, 'a3'); c.px(w - 2, 4, 'a3')
    return c


def counter():
    c = Canvas(116, 40)
    # tampo
    c.rect(0, 1, 116, 7, 'w5'); c.hline(0, 1, 116, 'w6'); c.hline(0, 0, 116, 'w1')
    c.hline(0, 6, 116, 'w4'); c.hline(0, 7, 116, 'w2')
    for x in range(8, 116, 23):
        c.hline(x, 3, 9, 'w4'); c.hline(x + 4, 4, 6, 'w4')
    # frente com almofadas
    c.rect(2, 8, 112, 30, 'w3')
    c.hline(2, 8, 112, 'w0'); c.dither(2, 9, 112, 2, 'w1', 0.5)
    for x in range(6, 108, 26):
        c.rect(x, 12, 22, 22, 'w2')
        c.hline(x, 12, 22, 'w1'); c.vline(x, 12, 22, 'w1')
        c.hline(x + 1, 33, 21, 'w4'); c.vline(x + 21, 13, 21, 'w4')
        c.rect(x + 3, 15, 16, 16, 'w3'); c.hline(x + 3, 15, 16, 'w4')
        # emblema: frasco dourado
        cx = x + 11
        c.rect(cx - 1, 18, 2, 2, 'a4'); c.rect(cx - 3, 20, 6, 6, 'a3'); c.rect(cx - 2, 26, 4, 1, 'a3')
        c.hline(cx - 2, 20, 4, 'a5'); c.px(cx - 2, 22, 'a6'); c.vline(cx + 2, 21, 5, 'a1')
        c.px(cx - 1, 17, 'w5')
    c.rect(0, 37, 116, 3, 'w0'); c.hline(0, 37, 116, 'w1')
    c.vline(2, 8, 30, 'w4'); c.vline(113, 8, 30, 'w1')
    # livro de receitas aberto
    c.rect(12, 0, 20, 2, 'c4'); c.rect(12, 2, 20, 3, 'c4')
    c.vline(21, 0, 5, 'c1'); c.vline(22, 0, 5, 'c2')
    for yy in (1, 3):
        c.hline(14, yy, 6, 'c1'); c.hline(24, yy, 6, 'c1')
    c.rect(11, 5, 22, 1, 'r1')
    c.px(15, 2, 'r3'); c.px(27, 2, 't2')
    # sininho de balcão
    c.rect(60, 2, 6, 3, 'a3'); c.hline(61, 1, 4, 'a4'); c.px(61, 2, 'a6'); c.hline(59, 5, 8, 'a1'); c.px(62, 0, 'a2')
    # vela acesa
    c.rect(88, -1, 2, 5, 'c4')
    c.rect(86, 4, 6, 1, 'cu2')
    return c


def register():
    c = Canvas(22, 18)
    c.rect(12, 0, 9, 6, 'cu2'); c.hline(12, 0, 9, 'cu3'); c.rect(13, 1, 7, 3, 'k1'); c.hline(14, 2, 4, 'a4')
    c.rect(1, 5, 20, 9, 'cu2'); c.hline(1, 5, 20, 'cu4'); c.hline(1, 6, 20, 'cu3'); c.vline(20, 6, 8, 'cu1')
    for i in range(4):
        for j in range(2):
            c.rect(3 + i * 4, 8 + j * 3, 3, 2, 'c4'); c.hline(3 + i * 4, 9 + j * 3, 3, 'c2')
    c.px(4, 8, 'r3')
    c.rect(0, 14, 22, 4, 'cu1'); c.hline(0, 14, 22, 'k1'); c.rect(9, 15, 4, 1, 'a4'); c.hline(0, 17, 22, 'cu0')
    return c


def shop_sign():
    c = Canvas(40, 18)
    c.vline(7, 0, 4, 'k2'); c.vline(32, 0, 4, 'k2')
    c.rect(0, 4, 40, 14, 'w1'); c.rect(1, 5, 38, 12, 'b1'); c.dither(1, 5, 38, 12, 'b0', 0.3)
    c.frame(2, 6, 36, 10, 'a3'); c.hline(2, 6, 36, 'a4')
    c.rect(18, 7, 4, 2, 'c4'); c.rect(17, 9, 6, 5, 't3'); c.hline(17, 9, 6, 't4'); c.px(18, 10, 'white'); c.vline(22, 10, 4, 't1')
    for x, y in ((7, 9), (11, 12), (28, 9), (32, 12)):
        c.px(x, y, 'a5'); c.px(x - 1, y, 'a3'); c.px(x + 1, y, 'a3'); c.px(x, y - 1, 'a3'); c.px(x, y + 1, 'a3')
    return c


def display_stand():
    c = Canvas(44, 30)
    c.rect(0, 8, 44, 4, 'w5'); c.hline(0, 8, 44, 'w6'); c.hline(0, 11, 44, 'w2')
    c.rect(2, 12, 40, 14, 'w3'); c.frame(2, 12, 40, 14, 'w0')
    c.rect(5, 14, 34, 10, 'tc2'); c.frame(5, 14, 34, 10, 'a3'); c.hline(6, 15, 32, 'tc3'); c.hline(6, 22, 32, 'tc0')
    for x in range(9, 37, 6):
        c.px(x, 18, 'a4'); c.px(x, 19, 'a3')
    c.rect(2, 26, 4, 4, 'w1'); c.rect(38, 26, 4, 4, 'w1')
    c.px(2, 26, 'w4'); c.px(38, 26, 'w4')
    return c


GARLAND_COLORS = ['a4', 'r4', 'b4', 'g4', 'v4']


def garland_bulbs():
    out = []
    for i, x in enumerate(range(28, 360, 12)):
        t = ((x - 28) % 96) / 96
        out.append((x, 14 + round(math.sin(t * math.pi) * 7), GARLAND_COLORS[i % 5]))
    return out


def garland():
    c = Canvas(384, 26)
    for x in range(28, 356):
        t = ((x - 28) % 96) / 96
        c.px(x, 13 + round(math.sin(t * math.pi) * 7), 'g1')
    for x, y, col in garland_bulbs():
        c.rect(x - 1, y, 3, 3, col); c.px(x - 1, y, 'white'); c.px(x, y - 1, 'k1')
    return c


# ----------------------------------------------------------------- pequenos

def empty_jar():
    c = Canvas(6, 8)
    c.hline(1, 0, 4, 'cu2'); c.rect(0, 1, 6, 7, 'gl1'); c.rect(1, 2, 4, 5, 'gl0'); c.px(1, 2, 'gl3'); c.hline(1, 7, 4, 'gl0')
    return c


def fire(frame):
    c = Canvas(14, 9)
    heights = [[4, 7, 5, 8, 6, 4, 7], [6, 5, 8, 6, 7, 5, 4], [5, 8, 6, 5, 8, 6, 5]][frame % 3]
    for i, hh in enumerate(heights):
        x = i * 2
        c.rect(x, 9 - hh, 2, hh, 'r3'); c.px(x + (frame + i) % 2, 9 - hh, 'tc2')
        c.rect(x, 9 - max(1, hh - 2), 2, max(1, hh - 2), 'a3')
        c.rect(x, 9 - max(1, hh - 4), 2, max(1, hh - 4), 'a5')
        if hh > 6:
            c.px(x, 9 - hh + 4, 'a6')
    return c


def glow(radius, color):
    size = radius * 2
    c = Canvas(size, size)
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - radius + 0.5, y - radius + 0.5) / radius
            level = 0 if d >= 1 else math.ceil((1 - d) * 4) / 4
            if level:
                c.p[x, y] = (*color, round(level * level * 110))
    return c


def dot(size, col):
    c = Canvas(size, size)
    r = size / 2
    c.ellipse(int(r), int(r), int(r - 0.5), int(r - 0.5), col)
    return c


def bubble():
    c = Canvas(17, 17)
    c.rect(2, 0, 13, 13, 'ink'); c.rect(0, 2, 17, 9, 'ink'); c.rect(1, 1, 15, 11, 'ink')
    c.rect(2, 1, 13, 11, 'c4'); c.rect(1, 2, 15, 9, 'c4')
    c.hline(2, 11, 13, 'c2'); c.vline(15, 3, 8, 'c2'); c.px(2, 2, 'c5'); c.px(3, 2, 'c5')
    c.rect(4, 13, 3, 2, 'ink'); c.px(5, 13, 'c4'); c.rect(2, 15, 2, 2, 'ink')
    return c


def marker():
    c = Canvas(7, 6)
    c.sprite("""
    kkkkkkk
    kaaaaak
    .kyyyk.
    ..kyk..
    ...k...
    """, {'k': 'ink', 'a': 'a5', 'y': 'a3'})
    return c


def coin():
    c = Canvas(7, 7)
    c.sprite("""
    .aaaaa.
    abbcbba
    abdbbba
    abdbbba
    abbbbea
    aebbbea
    .aaaaa.
    """, {'a': 'a1', 'b': 'a4', 'c': 'a6', 'd': 'a5', 'e': 'a3'})
    return c


def heart():
    c = Canvas(7, 6)
    c.sprite("""
    .rr.rr.
    rhrrrrr
    rrrrrrd
    .rrrrd.
    ..rrd..
    ...d...
    """, {'r': 'r3', 'h': 'r5', 'd': 'r2'})
    return c


def angry():
    c = Canvas(7, 7)
    c.sprite("""
    .x...x.
    xx...xx
    .......
    ...x...
    .......
    xx...xx
    .x...x.
    """, {'x': 'tc2'})
    return c


def sad():
    c = Canvas(5, 7)
    c.sprite("""
    ..b..
    ..b..
    .bbb.
    .bhb.
    bbhbb
    bbbbb
    .bbb.
    """, {'b': 'b3', 'h': 'b5'})
    return c


def sparkle():
    c = Canvas(5, 5)
    c.sprite("""
    ..y..
    ..a..
    yaway
    ..a..
    ..y..
    """, {'y': 'a3', 'a': 'a5', 'w': 'white'})
    return c


def badge():
    c = Canvas(9, 11)
    c.sprite("""
    ..kkkkk..
    .kaaaaak.
    kaaakaaak
    kaaakaaak
    kaaakaaak
    kaaaaaaak
    .kaakaak.
    ..kkkkk..
    ...k.k...
    ...k.k...
    ....k....
    """, {'k': 'ink', 'a': 'a4'})
    return c
