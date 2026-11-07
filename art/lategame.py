"""Melhorias do late game que aparecem na loja: estufa, alambique, despensa encantada, vitral e sino."""
from pix import Canvas

# Posições no mundo lógico 384x216 (a cena lê de layout.json).
POS = {
    'greenhouse': (46, 52),     # vasos no parapeito da janela
    'alembic': (96, 127),       # ao lado do caldeirão
    'cabinet-runes': (2, 38),   # sobre o armário
    'vitral': (52, 24),         # vidraças de cima da janela
    'bell': (343, 28),          # ao lado da porta
}


def _pot(c, x, y, w, col_dark, col, col_light):
    c.rect(x, y, w, 7, col); c.vline(x + w - 1, y, 7, col_dark); c.hline(x, y + 6, w, col_dark)
    c.rect(x - 1, y - 2, w + 2, 2, col_light); c.hline(x - 1, y - 1, w + 2, col)
    c.vline(x + 1, y + 1, 4, col_light)


def greenhouse():
    """Estufa: três vasos de ervas fresquinhas no parapeito (folha lunar, hortelã e mandrágora)."""
    c = Canvas(60, 20)
    # folha lunar (prateada) no vaso de terracota
    for i, (dx, h) in enumerate([(4, 9), (7, 12), (10, 10), (13, 7)]):
        c.vline(dx, 11 - h + 2, h, 'g3')
        c.px(dx - 1, 13 - h, 'g5'); c.px(dx + 1, 14 - h, 'g4'); c.px(dx, 12 - h, 'c5')
    c.px(7, 1, 'c5'); c.px(8, 2, 'b5')
    _pot(c, 3, 12, 12, 'tc0', 'tc2', 'tc3')
    # hortelã (verde vivo) no vaso de cobre
    for dx, dy in [(24, 6), (27, 3), (30, 5), (33, 7), (26, 9), (31, 9)]:
        c.rect(dx, dy, 3, 2, 'g4'); c.px(dx, dy, 'g5'); c.px(dx + 2, dy + 1, 'g2')
    for dx in (25, 28, 31, 34):
        c.vline(dx, 8, 4, 'g2')
    _pot(c, 23, 12, 13, 'cu0', 'cu2', 'cu3')
    # mandrágora: folhas em tufo e a carinha espiando do vaso
    for dx, h in [(46, 6), (48, 9), (50, 7), (52, 5)]:
        c.vline(dx, 9 - h + 1, h, 'g2'); c.px(dx - 1, 10 - h, 'g4'); c.px(dx + 1, 10 - h, 'g3')
    c.rect(45, 8, 9, 5, 'w4'); c.hline(45, 8, 9, 'w5'); c.px(47, 10, 'ink'); c.px(51, 10, 'ink'); c.hline(48, 11, 3, 'r2')
    _pot(c, 43, 12, 13, 'v0', 'v2', 'v3')
    c.px(48, 15, 'a4'); c.px(49, 14, 'a5')
    c.outline('ink')
    return c


def alembic():
    """Alambique de prata: caldeirinha de cobre, pescoço longo, serpentina e frasco coletor."""
    c = Canvas(30, 44)
    # pés e base de pedra
    c.rect(1, 38, 18, 6, 's2'); c.hline(1, 38, 18, 's4'); c.hline(1, 43, 18, 's0')
    c.rect(4, 36, 2, 3, 'k1'); c.rect(14, 36, 2, 3, 'k1')
    # caldeirinha de cobre (bojo)
    c.ellipse(10, 29, 8, 7, 'cu1')
    c.ellipse(9, 28, 7, 6, 'cu2')
    c.ellipse(8, 27, 4, 3, 'cu3'); c.px(6, 25, 'cu4'); c.px(7, 25, 'cu4'); c.px(6, 26, 'white')
    c.hline(3, 32, 15, 'cu0')
    # tampa prateada e pescoço longo
    c.rect(7, 19, 7, 4, 's4'); c.hline(7, 19, 7, 's5'); c.vline(13, 19, 4, 's2')
    c.rect(9, 6, 3, 13, 's4'); c.vline(9, 6, 13, 's5'); c.vline(11, 6, 13, 's2')
    c.ellipse(10, 6, 3, 3, 's4'); c.px(9, 4, 's5'); c.px(10, 4, 'white')
    # cano descendo até a serpentina
    for i in range(10):
        c.rect(12 + i, 6 + i, 2, 2, 's3'); c.px(12 + i, 6 + i, 's5')
    # serpentina (espiral de cobre)
    for y in (17, 21, 25):
        c.hline(19, y, 7, 'cu2'); c.hline(19, y + 1, 7, 'cu0'); c.px(19, y, 'cu4')
        c.vline(25, y, 4, 'cu1')
    # frasco coletor com o destilado brilhando
    c.rect(20, 34, 7, 8, 'gl2'); c.rect(21, 36, 5, 5, 'a4'); c.hline(21, 36, 5, 'a5'); c.px(21, 37, 'white')
    c.rect(22, 30, 3, 4, 'gl2'); c.px(23, 29, 'cu2')
    c.vline(23, 27, 3, 'cu1')
    c.outline('ink')
    return c


def cabinet_runes():
    """Despensa encantada: runas violeta no armário (o brilho é somado na cena)."""
    c = Canvas(40, 98)
    glyphs = [
        ['.v.', 'vvv', '.v.'],
        ['v.v', '.v.', 'v.v'],
        ['vv.', '.v.', '.vv'],
        ['.v.', 'v.v', '.v.'],
    ]
    spots = [(3, 2), (34, 2), (2, 60), (35, 60), (18, 59), (18, 92)]
    for i, (x, y) in enumerate(spots):
        g = glyphs[i % len(glyphs)]
        for yy, row in enumerate(g):
            for xx, ch in enumerate(row):
                if ch == 'v':
                    c.px(x + xx, y + yy, 'v4' if (xx + yy) % 2 else 'v5')
    # fio de luz mágica correndo pela moldura
    for y in range(8, 58, 3):
        c.px(2, y, 'v3'); c.px(37, y, 'v3')
    c.hline(4, 6, 32, 'v3')
    for x in range(5, 36, 6):
        c.px(x, 6, 'v5')
    return c


def vitral():
    """Vitral arcano nas duas vidraças de cima da janela (46x22, com o montante no meio)."""
    c = Canvas(46, 22)
    pane_w = 22
    cols = [['b3', 'v3', 'a4', 'r3', 't3'], ['v3', 'a4', 't3', 'b3', 'r3']]
    for p, x0 in enumerate((0, 25)):
        w = pane_w if p == 0 else 21
        cx, cy = x0 + w / 2 - 0.5, 21
        for y in range(22):
            for x in range(x0, x0 + w):
                dx, dy = x - cx, (y - cy) * 1.05
                r = (dx * dx + dy * dy) ** 0.5
                ring = int(r // 5)
                ang = (dx / (r + 0.01))
                seg = int((ang + 1) * 2.5)
                col = cols[p][(ring + seg) % 5]
                c.px(x, y, col)
        # chumbo do vitral (anéis e raios)
        for y in range(22):
            for x in range(x0, x0 + w):
                dx, dy = x - cx, (y - cy) * 1.05
                r = (dx * dx + dy * dy) ** 0.5
                if abs(r % 5 - 0) < 0.6 or abs(dx) < 0.6 or abs(abs(dx) - abs(dy)) < 0.6:
                    c.px(x, y, 'k1')
        # sol dourado no centro de baixo
        for y in range(17, 22):
            for x in range(x0, x0 + w):
                if (x - cx) ** 2 + (y - 21.5) ** 2 < 13:
                    c.px(x, y, 'a5' if (x - cx) ** 2 + (y - 21.5) ** 2 < 5 else 'a3')
        # brilhos
        c.px(x0 + 3, 2, 'white'); c.px(x0 + 4, 3, 'white'); c.px(x0 + w - 4, 5, 'white')
    return c


def bell(frame=0):
    """Sino encantado ao lado da porta (2 quadros: parado e balançando)."""
    c = Canvas(14, 20)
    c.hline(0, 1, 9, 'k2'); c.vline(0, 0, 4, 'k1'); c.px(8, 2, 'k2'); c.vline(7, 2, 3, 'k2')
    dx = 0 if frame == 0 else 2
    bx = 3 + dx
    c.vline(bx + 4, 4, 2, 'k2')
    c.rect(bx + 2, 6, 5, 2, 'a3')
    c.rect(bx + 1, 8, 7, 4, 'a3'); c.rect(bx, 12, 9, 3, 'a3')
    c.vline(bx + 2, 7, 7, 'a5'); c.vline(bx + 7, 8, 6, 'a1'); c.hline(bx, 14, 9, 'a1')
    c.px(bx + 3, 8, 'a6')
    c.rect(bx + 4, 15, 2, 2, 'cu1')
    c.px(bx + 4, 10, 'v4'); c.px(bx + 5, 11, 'v5')  # runa
    c.outline('ink')
    return c
