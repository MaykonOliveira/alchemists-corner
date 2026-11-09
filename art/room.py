"""Cenário de fundo da loja (384x216): paredes, piso, janela, decoração fixa e primeiro plano."""
import random
from pix import Canvas

W, H, FLOOR_Y = 384, 216, 112


def wood_plank_floor(c, r):
    # Tábuas horizontais com veios, pregos e luz da janela vindo da esquerda.
    rows = [('w3', 'w4', 'w2'), ('w4', 'w5', 'w3')]
    for i, y in enumerate(range(FLOOR_Y, H, 7)):
        base, hi, dark = rows[i % 2] if i > 0 else ('w2', 'w3', 'w1')  # primeira fileira na sombra da parede
        c.rect(0, y, W, 7, base)
        c.hline(0, y, W, 'w1')
        c.hline(0, y + 1, W, hi)
        off = (i * 37) % 61
        for x in range(off - 61, W, 61):
            c.vline(x, y + 1, 6, 'w1')
            c.px(x + 1, y + 1, hi)
            c.px(x + 3, y + 3, 'w1'); c.px(x - 3, y + 3, 'w1')  # pregos
        for _ in range(26):  # veios
            gx = r.randrange(W); gy = y + 2 + r.randrange(4); n = 3 + r.randrange(9)
            c.hline(gx, gy, n, dark)
            if r.random() < 0.3:
                c.hline(gx + n, gy - 1 if gy > y + 2 else gy + 1, 2, dark)
        for _ in range(4):  # nós da madeira
            kx = r.randrange(W); ky = y + 3 + r.randrange(2)
            c.rect(kx, ky, 2, 1, 'w1'); c.px(kx - 1, ky, dark); c.px(kx + 2, ky, dark)
    # Sombra no fundo do piso (encontro com a parede) e perto da câmera (vinheta)
    c.hline(0, FLOOR_Y, W, 'w0')


def plaster_wall(c, r):
    c.rect(24, 10, 336, 76, 'p3')
    # Gradiente: sombra sob a viga e luz quente na faixa central
    c.dither(24, 10, 336, 6, 'p1', 0.75)
    c.dither(24, 16, 336, 6, 'p2', 0.5)
    c.dither(24, 22, 336, 8, 'p2', 0.2)
    c.dither(24, 70, 336, 14, 'p2', 0.3)
    for _ in range(900):
        x = 24 + r.randrange(336); y = 12 + r.randrange(72)
        c.px(x, y, r.choice(['p2', 'p2', 'p4']))
    # Rachaduras finas
    for sx, sy in [(206, 60), (344, 22), (92, 74)]:
        x, y = sx, sy
        for _ in range(10):
            c.px(x, y, 'p1'); x += r.choice([-1, 0, 1]); y += 1


def stone_patch(c, sx, sy, cols, rows):
    """Pedras aparentes onde o reboco caiu, com borda irregular."""
    for j in range(rows):
        for i in range(cols):
            if (i == 0 and j == rows - 1) or (i == cols - 1 and j == 0):
                continue
            x = sx + i * 10 + (5 if j % 2 else 0); y = sy + j * 6
            c.rect(x, y, 9, 5, 's3')
            c.hline(x, y, 9, 's4'); c.px(x, y + 1, 's4')
            c.hline(x + 1, y + 4, 8, 's1'); c.vline(x + 8, y + 1, 4, 's2')
            c.px(x + 3, y + 2, 's2')
    c.frame(sx - 1, sy - 1, cols * 10 + 6, rows * 6 + 1, None)


def wainscot(c):
    c.rect(24, 84, 336, 28, 'w2')
    c.hline(24, 84, 336, 'w5'); c.hline(24, 85, 336, 'w4'); c.hline(24, 86, 336, 'w1')
    for x in range(28, 356, 24):
        c.rect(x, 89, 21, 18, 'w3')
        c.hline(x, 89, 21, 'w1'); c.vline(x, 89, 18, 'w1')
        c.hline(x + 1, 106, 20, 'w4'); c.vline(x + 20, 90, 17, 'w4')
        c.rect(x + 3, 92, 15, 12, 'w2')
        c.hline(x + 3, 92, 15, 'w1')
        c.dither(x + 4, 93, 13, 10, 'w3', 0.25)
    c.rect(24, 108, 336, 4, 'w1')
    c.hline(24, 108, 336, 'w3')
    c.hline(24, 111, 336, 'w0')


def side_walls(c):
    for x in range(24):
        bottom = FLOOR_Y + (24 - x)
        wain = 84 + int((24 - x) * 0.6)
        c.vline(x, 0, wain, 'p1' if x % 3 else 'p0')
        c.vline(x, wain, bottom - wain, 'w1')
        c.px(x, wain, 'w3')
        rx = W - 1 - x
        c.vline(rx, 0, wain, 'p1' if x % 3 else 'p0')
        c.vline(rx, wain, bottom - wain, 'w1')
        c.px(rx, wain, 'w3')
    c.dither(0, 0, 24, 112, 'p0', 0.35)
    c.dither(W - 24, 0, 24, 112, 'p0', 0.35)
    # quinas com pilares de madeira
    for x in (22, W - 26):
        c.rect(x, 0, 4, FLOOR_Y + 1, 'w2')
        c.vline(x, 0, FLOOR_Y + 1, 'w1'); c.vline(x + 1, 0, FLOOR_Y + 1, 'w4'); c.vline(x + 3, 0, FLOOR_Y + 1, 'w0')


def ceiling(c):
    c.rect(0, 0, W, 10, 'w1')
    c.hline(0, 1, W, 'w2'); c.hline(0, 2, W, 'w3'); c.hline(0, 3, W, 'w2')
    c.hline(0, 8, W, 'w0'); c.hline(0, 9, W, 'ink')
    for x in range(10, W, 64):
        c.rect(x, 0, 9, 14, 'w2')
        c.vline(x, 0, 13, 'w4'); c.vline(x + 1, 0, 13, 'w3'); c.vline(x + 8, 0, 13, 'w0')
        c.hline(x, 13, 9, 'ink')
        c.px(x + 4, 11, 'k3')  # cavilha


def window(c, x, y):
    w = h = 50
    # céu em faixas com dithering
    sky = ['sky1', 'sky1', 'sky2', 'sky2', 'sky3']
    for i in range(h - 4):
        c.hline(x + 2, y + 2 + i, w - 4, sky[min(4, i // 7)])
    for i, (a, b) in enumerate([('sky1', 'sky2'), ('sky2', 'sky3')]):
        c.dither(x + 2, y + 2 + 12 + i * 14, w - 4, 3, b, 0.5)
    # nuvem
    for cx, cy in [(x + 12, y + 8), (x + 34, y + 12)]:
        c.rect(cx, cy, 8, 2, 'sky3'); c.rect(cx + 2, cy - 1, 4, 1, 'sky3'); c.hline(cx + 1, cy + 2, 6, 'sky2')
    # torre distante
    c.rect(x + 30, y + 10, 5, 14, 'p4'); c.rect(x + 29, y + 7, 7, 3, 'v2'); c.px(x + 32, y + 6, 'v2')
    c.px(x + 32, y + 13, 'a4')
    houses = [(x + 2, 14, 18, 'c3', 'r2', 'c2'), (x + 16, 12, 23, 'v4', 'v1', 'v3'), (x + 28, 20, 16, 'c4', 'w3', 'c3')]
    for hx, hw, hh, wall, roof, wd in houses:
        top = y + h - 10 - hh
        c.rect(hx, top, hw, hh, wall)
        c.vline(hx + hw - 1, top, hh, wd)
        for i in range(5):
            c.hline(hx - 2 + i, top - 5 + i, hw + 4 - i * 2, roof)
        c.hline(hx - 2, top - 1, hw + 4, 'ink')
        c.rect(hx + 3, top + 4, 4, 5, 'b1'); c.rect(hx + 4, top + 5, 2, 3, 'a4')
        c.rect(hx + hw - 7, top + hh - 8, 4, 8, 'w1')
        c.px(hx + 4, top + 3, 'w2'); c.hline(hx + 2, top + 9, 6, 'w2')
    # rua e passeio
    c.rect(x + 2, y + h - 10, w - 4, 8, 's3')
    for i in range(22):
        c.rect(x + 3 + (i * 7) % (w - 7), y + h - 9 + (i % 3) * 2 + (i // 7) % 2, 2, 1, 's4')
    c.hline(x + 2, y + h - 10, w - 4, 's2')
    # poste
    c.vline(x + 41, y + 20, 20, 'k1')
    c.rect(x + 39, y + 16, 5, 5, 'k1'); c.rect(x + 40, y + 17, 3, 3, 'a5'); c.hline(x + 38, y + 15, 7, 'k1')
    window_front(c, x, y)


# Vidro da janela na sala (x, y, largura, altura): o que aparece atrás dele é a rua.
WINDOW_POS = (50, 22)
WINDOW_GLASS = (52, 24, 46, 46)
# Peça da frente da janela (moldura, montantes, reflexos, cortinas, parapeito e vasos), exportada
# à parte para quem passa na rua ficar ATRÁS dela. Posição na sala e tamanho do recorte.
WINDOW_FRONT_POS = (43, 15)
WINDOW_FRONT_SIZE = (64, 63)


def window_front_sprite():
    fx, fy = WINDOW_FRONT_POS
    c = Canvas(*WINDOW_FRONT_SIZE)
    window_front(c, WINDOW_POS[0] - fx, WINDOW_POS[1] - fy)
    return c


def window_front(c, x, y):
    w = h = 50
    # moldura
    c.frame(x, y, w, h, 'w0')
    c.frame(x + 1, y + 1, w - 2, h - 2, 'w3')
    c.rect(x + w // 2 - 1, y + 1, 3, h - 2, 'w3'); c.vline(x + w // 2 + 1, y + 1, h - 2, 'w1')
    c.rect(x + 1, y + h // 2 - 1, w - 2, 3, 'w3'); c.hline(x + 1, y + h // 2 + 1, w - 2, 'w1')
    c.hline(x + 1, y + 1, w - 2, 'w4')
    # reflexos no vidro
    for i in range(5):
        c.px(x + 5 + i, y + 9 - i, 'white')
        c.px(x + 7 + i, y + 9 - i, 'sky3')
    for i in range(4):
        c.px(x + 30 + i, y + 33 - i, 'white')
    # cortinas
    for side, cx in ((0, x - 4), (1, x + w - 2)):
        for i in range(h + 4):
            sway = [0, 0, 1, 1, 1, 0][i % 6] if i > 10 else 0
            c.hline(cx + sway, y - 4 + i, 6, 'tc2')
            c.px(cx + sway + (1 if side else 4), y - 4 + i, 'tc3')
            c.px(cx + sway + (4 if side else 1), y - 4 + i, 'tc1')
        c.rect(cx, y + 18, 6, 2, 'a3')
    c.rect(x - 7, y - 6, w + 14, 2, 'k1'); c.px(x - 7, y - 7, 'k2'); c.px(x + w + 6, y - 7, 'k2')
    # parapeito com vasos
    c.rect(x - 4, y + h, w + 8, 3, 'w5'); c.hline(x - 4, y + h, w + 8, 'w6')
    c.hline(x - 4, y + h + 3, w + 8, 'w1'); c.hline(x - 3, y + h + 4, w + 6, 'shadow')
    pot(c, x + 5, y + h - 7, 'tc2')
    for lx, ly, n, col in [(x + 6, y + h - 13, 6, 'g3'), (x + 9, y + h - 16, 9, 'g4'), (x + 12, y + h - 12, 5, 'g2')]:
        c.vline(lx, ly, n, col); c.px(lx - 1, ly + 1, col); c.px(lx + 1, ly + 2, 'g5')
    c.px(x + 9, y + h - 17, 'r4'); c.px(x + 10, y + h - 17, 'r3'); c.px(x + 9, y + h - 18, 'r4')
    pot(c, x + 36, y + h - 6, 'cu2', small=True)
    for i in range(5):
        c.px(x + 37 + i % 3, y + h - 9 - i // 2, 'g4' if i % 2 else 'g3')


def pot(c, x, y, col, small=False):
    w = 6 if small else 9
    hh = 6 if small else 7
    c.rect(x, y, w, hh, col)
    c.hline(x - 1, y, w + 2, 'tc3' if col == 'tc2' else 'cu3')
    c.vline(x + w - 1, y + 1, hh - 1, 'tc1' if col == 'tc2' else 'cu1')
    c.hline(x, y + hh - 1, w, 'tc0' if col == 'tc2' else 'cu0')


def hanging_herbs(c, x, y):
    c.hline(x, y + 4, 46, 'c1'); c.px(x, y + 3, 'k2'); c.px(x + 45, y + 3, 'k2')
    bunches = [('g3', 'g4'), ('g2', 'g3'), ('c2', 'c3'), ('g3', 'g5'), ('v2', 'v3'), ('g2', 'g4')]
    for i, (a, b) in enumerate(bunches):
        bx = x + 3 + i * 7
        c.vline(bx + 2, y + 4, 3, 'c1')
        c.rect(bx + 1, y + 7, 3, 1, 'tc1')
        c.rect(bx, y + 8, 5, 3, a); c.rect(bx + 1, y + 11, 3, 3, a); c.px(bx + 2, y + 14, a)
        c.px(bx + 1, y + 8, b); c.px(bx + 3, y + 9, b); c.px(bx + 2, y + 11, b)
        c.px(bx + 4, y + 10, 'g1' if a != 'v2' else 'v1')


def lantern(c, x, y, chain):
    for i in range(chain):
        c.px(x + 3, y + i, 'k2' if i % 2 else 'k3')
    ly = y + chain
    c.rect(x + 1, ly, 5, 1, 'k2'); c.rect(x, ly + 1, 7, 2, 'k1'); c.px(x + 3, ly - 1, 'k3')
    c.rect(x + 1, ly + 3, 5, 7, 'a3'); c.rect(x + 2, ly + 4, 3, 5, 'a5'); c.px(x + 3, ly + 5, 'a6')
    c.vline(x, ly + 3, 7, 'k1'); c.vline(x + 6, ly + 3, 7, 'k1'); c.vline(x + 3, ly + 3, 7, 'a2')
    c.rect(x, ly + 10, 7, 2, 'k1'); c.px(x + 3, ly + 12, 'k2')


def wall_shelf(c, x, y):
    """Prateleirinha de parede com livros, vela e cristal (decoração)."""
    c.rect(x, y, 24, 3, 'w4'); c.hline(x, y, 24, 'w5'); c.hline(x, y + 3, 24, 'w0')
    c.rect(x + 2, y + 3, 2, 4, 'w1'); c.rect(x + 20, y + 3, 2, 4, 'w1')
    books = [('r2', 9), ('b2', 11), ('g2', 8), ('a2', 10)]
    bx = x + 1
    for col, hh in books:
        c.rect(bx, y - hh, 3, hh, col); c.hline(bx, y - hh + 2, 3, 'a4'); c.vline(bx + 2, y - hh, hh, 'ink')
        bx += 3
    c.rect(bx, y - 4, 7, 4, 'v2'); c.hline(bx, y - 4, 7, 'v3'); c.px(bx + 6, y - 2, 'v1')  # livro deitado
    # vela
    c.rect(x + 20, y - 6, 2, 6, 'c4'); c.px(x + 20, y - 7, 'a5'); c.px(x + 20, y - 8, 'a3'); c.px(x + 21, y - 1, 'c2')
    # cristal
    c.px(x + 17, y - 5, 't4'); c.vline(x + 16, y - 4, 4, 't3'); c.vline(x + 17, y - 4, 4, 't2'); c.vline(x + 18, y - 3, 3, 't1')


def moon_chart(c, x, y):
    """Mapa das fases da lua emoldurado."""
    c.rect(x, y, 18, 16, 'w1'); c.rect(x + 1, y + 1, 16, 14, 'b1')
    c.dither(x + 1, y + 1, 16, 14, 'b0', 0.3)
    c.frame(x, y, 18, 16, 'a2'); c.hline(x, y, 18, 'a4')
    for i, cx in enumerate([x + 3, x + 7, x + 11, x + 15]):
        c.rect(cx - 1, y + 5, 2, 2, 'c4')
        if i in (0, 3):
            c.px(cx - 1 if i == 0 else cx, y + 5, 'b1'); c.px(cx - 1 if i == 0 else cx, y + 6, 'b1')
    c.px(x + 4, y + 11, 'a4'); c.px(x + 12, y + 10, 'a4'); c.px(x + 8, y + 12, 'c4')
    c.hline(x + 3, y + 3, 12, 'b2')


def rug(c, x, y, w, h):
    c.rect(x, y, w, h, 'tc0')
    c.rect(x + 1, y + 1, w - 2, h - 2, 'tc2')
    c.dither(x + 1, y + 1, w - 2, h - 2, 'tc1', 0.2)
    c.frame(x + 3, y + 3, w - 6, h - 6, 'a3')
    c.frame(x + 5, y + 5, w - 10, h - 10, 'tc1')
    c.rect(x + 6, y + 6, w - 12, h - 12, 'b1')
    c.dither(x + 6, y + 6, w - 12, h - 12, 'b2', 0.2)
    my = y + h // 2
    for px in range(x + 12, x + w - 8, 12):
        for dy in range(-3, 4):
            half = 3 - abs(dy)
            c.hline(px - half, my + dy, half * 2 + 1, 'a3' if abs(dy) < 3 else 'a2')
        c.px(px, my, 'tc2')
    for px in range(x + 8, x + w - 6, 6):
        c.px(px, y + 7, 'a4'); c.px(px, y + h - 8, 'a4')
    for px in range(x, x + w, 2):
        c.vline(px, y - 2, 2, 'c3'); c.vline(px, y + h, 2, 'c3')


def crate(c, x, y, w, h):
    c.rect(x, y, w, h, 'w3')
    c.frame(x, y, w, h, 'w0')
    c.hline(x + 1, y + 1, w - 2, 'w5'); c.vline(x + 1, y + 1, h - 2, 'w4')
    c.rect(x + 2, y + 2, w - 4, 2, 'w4'); c.rect(x + 2, y + h - 4, w - 4, 2, 'w4')
    c.hline(x + 2, y + 4, w - 4, 'w1'); c.hline(x + 2, y + h - 5, w - 4, 'w1')
    for i in range(h - 9):
        xx = x + 3 + int(i * (w - 6) / max(1, h - 10))
        c.px(xx, y + 5 + i, 'w1'); c.px(xx + 1, y + 5 + i, 'w4')
    for dx, dy in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)):
        c.px(x + dx, y + dy, 'k3')


def barrel(c, x, y):
    w, h = 22, 30
    for yy in range(h):
        bulge = 1 if 6 < yy < h - 6 else 0
        for xx in range(-bulge, w + bulge):
            t = (xx + 1) / (w + 2)
            col = 'w2' if t < 0.18 else 'w4' if t < 0.45 else 'w3' if t < 0.8 else 'w2'
            c.px(x + xx, y + yy, col)
        for sx in range(4, w, 5):
            c.px(x + sx, y + yy, 'w1')
    c.ellipse(x + 10, y + 1, 10, 2, 'w4'); c.ellipse(x + 10, y + 1, 8, 1, 'w3')
    for by in (y + 4, y + h - 7):
        c.hline(x - 1, by, w + 2, 'k1'); c.hline(x - 1, by + 1, w + 2, 'k2'); c.px(x + 5, by, 'k3'); c.px(x + 16, by, 'k3')
    c.hline(x, y + h - 1, w, 'w0')
    # colher de pau apoiada e trapo
    c.vline(x + 15, y - 9, 10, 'w5'); c.rect(x + 14, y - 11, 3, 2, 'w5')


def sack(c, cx, cy):
    c.ellipse(cx, cy, 9, 8, 'c1'); c.ellipse(cx - 1, cy - 1, 8, 7, 'c2'); c.ellipse(cx - 2, cy - 2, 5, 4, 'c3')
    c.rect(cx - 3, cy - 11, 6, 4, 'c1'); c.rect(cx - 2, cy - 11, 4, 3, 'c2')
    c.hline(cx - 3, cy - 8, 6, 'tc1')
    for i in range(5):
        c.px(cx - 4 + i * 2, cy + 7, 'a4' if i % 2 else 'a3')  # grãos dourados caídos
    c.dither(cx - 9, cy + 7, 19, 2, 'w1', 0.5)


def big_plant(c, x, y):
    pot(c, x, y + 12, 'tc2')
    c.rect(x, y + 12, 14, 14, 'tc2'); c.hline(x - 1, y + 12, 16, 'tc3'); c.hline(x - 1, y + 13, 16, 'tc1')
    c.vline(x + 12, y + 14, 12, 'tc1'); c.hline(x, y + 25, 14, 'tc0'); c.vline(x + 1, y + 14, 10, 'tc3')
    c.rect(x + 4, y + 18, 6, 3, 'a3'); c.hline(x + 4, y + 18, 6, 'a4')
    leaves = [(-6, 2, 1), (-3, -6, 0), (4, -9, 1), (9, -4, 0), (12, 3, 1), (1, -1, 0), (6, 4, 1), (-4, 7, 0)]
    for lx, ly, k in leaves:
        bx, by = x + 4 + lx, y + 4 + ly
        a, b = ('g3', 'g4') if k else ('g2', 'g3')
        c.rect(bx, by, 7, 3, a); c.hline(bx + 1, by - 1, 5, a); c.hline(bx + 1, by + 3, 4, 'g1')
        c.hline(bx + 1, by + 1, 5, b); c.px(bx + 6, by + 1, 'g5')
    c.vline(x + 7, y + 3, 9, 'g1'); c.vline(x + 6, y + 6, 6, 'g2')


def floor_shadows(c):
    # Sombras de contato debaixo dos móveis (os móveis são desenhados por cima).
    c.rect(152, 168, 114, 2, 'w2'); c.hline(156, 170, 106, 'w2')
    c.rect(48, 176, 46, 2, 'w2')
    c.rect(2, 136, 42, 2, 'w2')


def draw_room():
    r = random.Random(7)
    c = Canvas(W, H)
    wood_plank_floor(c, r)
    plaster_wall(c, r)
    stone_patch(c, 270, 68, 2, 2)
    stone_patch(c, 226, 13, 3, 2)
    wainscot(c)
    side_walls(c)
    ceiling(c)
    window(c, 50, 22)
    hanging_herbs(c, 110, 10)
    lantern(c, 104, 10, 14)
    lantern(c, 286, 10, 10)
    wall_shelf(c, 276, 50)
    moon_chart(c, 27, 17)
    # tapete da porta
    c.rect(300, FLOOR_Y + 1, 42, 6, 'g2'); c.hline(300, FLOOR_Y + 1, 42, 'g3'); c.hline(300, FLOOR_Y + 6, 42, 'g0')
    for x in range(302, 340, 4):
        c.px(x, FLOOR_Y + 3, 'g4'); c.px(x + 2, FLOOR_Y + 4, 'g1')
    floor_shadows(c)
    rug(c, 146, 180, 124, 28)
    crate(c, 326, 182, 22, 22)
    crate(c, 348, 190, 16, 16)
    crate(c, 331, 166, 16, 16)
    # frascos vazios sobre o caixote
    for i, col in enumerate(('gl1', 'gl2')):
        c.rect(334 + i * 5, 160, 3, 6, col); c.px(334 + i * 5, 159, 'cu2'); c.px(334 + i * 5, 161, 'gl3')
    sack(c, 310, 200)
    barrel(c, 10, 178)
    big_plant(c, 112, 178)
    return c
