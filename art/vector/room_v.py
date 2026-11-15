"""Sala da loja no visual vetorial (384×216 unidades). As posições seguem as do cenário em pixel art (art/room.py)."""
import random
from vsvg import *
from registry import sprite

GLASS = (52, 24, 46, 46)        # vidro da janela (x, y, w, h)
FRONT = (43, 15)                # canto da peça 'window-front' (64×63)
FLOOR_Y = 112


def lantern(cx, top, chain=10, body=GOLD_L):
    """Lanterna pendurada: corrente a partir de y=chain até o topo do corpo."""
    return [
        line(cx, chain, cx, top, stroke=OUT, sw=0.8),
        path(f'M{cx-3.2},{top+2.6} L{cx},{top-0.6} L{cx+3.2},{top+2.6} Z', PLUM_D),
        rect(cx - 3, top + 2.4, 6, 8.6, body, r=1.4),
        line(cx, top + 2.8, cx, top + 10.6, stroke=OUT, sw=0.5),
        rect(cx - 3.6, top + 10.6, 7.2, 1.8, PLUM_D, r=0.8),
        shine(cx - 2.2, top + 3.6, 1.1, 4, 0.7),
    ]


def pot(x, y, w, h, color, dark):
    """Vaso trapezoidal com borda."""
    return [path(f'M{x+0.6},{y+2} L{x+w-0.6},{y+2} L{x+w-1.6},{y+h} Q{x+w/2},{y+h+0.8} {x+1.6},{y+h} Z', color),
            rect(x, y, w, 2.6, dark, r=1.1)]


def sprout(x, y, n=3, h=6, color=LEAF, dark=LEAF_D):
    out = []
    for i in range(n):
        dx = (i - (n - 1) / 2) * 2.4
        out.append(path(f'M{x},{y} Q{x+dx*0.4},{y-h*0.6} {x+dx},{y-h+abs(dx)*0.5}', None, stroke=dark, sw=0.7))
        out.append(ell(x + dx, y - h + abs(dx) * 0.5, 1.5, 1.1, color, sw=0.4))
    return out


def street_view():
    """A rua vista pelo vidro: céu, casinhas, torre e calçada (quem passa anda por cima da calçada)."""
    x, y, w, h = GLASS
    d1, sky = lin([(0, '#8fd3f7'), (1, '#e3f6ff')])
    out = [rect(x, y, w, h, sky, stroke=None)]
    # nuvens
    for cx, cy, s in ((x + 9, y + 8, 1.0), (x + 33, y + 5, 0.8)):
        out += [ell(cx, cy, 5 * s, 2.2 * s, WHITE, stroke=None, extra='opacity="0.95"'),
                ell(cx + 3 * s, cy - 1.6 * s, 3 * s, 2 * s, WHITE, stroke=None, extra='opacity="0.95"')]
    # casa creme de telhado vinho
    out += [rect(x + 2, y + 21, 17, 23, '#ffe9c9', sw=0.5),
            path(f'M{x},{y+22} L{x+10.5},{y+12} L{x+21},{y+22} Z', '#d8556b', sw=0.5),
            rect(x + 6, y + 27, 5, 6, '#ffd36b', r=0.8, sw=0.5), line(x + 8.5, y + 27, x + 8.5, y + 33, sw=0.4)]
    # torre lilás
    out += [rect(x + 21, y + 15, 12, 29, '#c9b6f2', sw=0.5),
            path(f'M{x+19.5},{y+16} L{x+27},{y+5} L{x+34.5},{y+16} Z', PLUM, sw=0.5),
            circ(x + 27, y + 22, 2.4, '#ffd36b', sw=0.5),
            rect(x + 24.5, y + 30, 5, 7, '#7d63c9', r=2.4, sw=0.5)]
    # casa verde-água ao fundo
    out += [rect(x + 34, y + 24, 14, 20, '#bfeee2', sw=0.5),
            path(f'M{x+32.5},{y+25} L{x+41},{y+17} L{x+49.5},{y+25} Z', TEAL_D, sw=0.5),
            rect(x + 38, y + 29, 4.5, 5, '#ffd36b', r=0.8, sw=0.5)]
    # calçada
    out += [rect(x, y + h - 5, w, 5, '#cfc6d8', stroke=None), line(x, y + h - 5, x + w, y + h - 5, stroke='#a79db8', sw=0.5)]
    for i in range(6):
        out.append(line(x + 3 + i * 8, y + h - 3.6, x + 7 + i * 8, y + h - 3.6, stroke='#b7adc6', sw=0.5))
    return out, d1


def window_front():
    """Moldura, travessas, cortinas, varão, peitoril e vasos (tudo o que fica na frente de quem passa na rua)."""
    x, y, w, h = GLASS
    out = []
    # moldura de madeira em volta do vidro
    out.append(path(f'M{x-3},{y-3} H{x+w+3} V{x*0+y+h+3} H{x-3} Z M{x},{y} V{y+h} H{x+w} V{y} Z', WOOD, sw=0.6, extra='fill-rule="evenodd"'))
    out += [rect(x + w / 2 - 1, y, 2, h, WOOD, sw=0.5), rect(x, y + h * 0.46, w, 2, WOOD, sw=0.5)]
    # reflexos no vidro
    out += [path(f'M{x+5},{y+12} L{x+12},{y+4}', None, stroke=WHITE, sw=1.2, extra='opacity="0.55"'),
            path(f'M{x+29},{y+33} L{x+34},{y+27}', None, stroke=WHITE, sw=1.0, extra='opacity="0.45"')]
    # peitoril
    out.append(rect(x - 6, y + h + 2, w + 12, 4, WOOD_L, r=1.6))
    # vasos no peitoril
    out += sprout(x + 8, y + h - 3.5, 3, 8) + pot(x + 4, y + h - 4.5, 8, 6.5, CORAL, CORAL_D)
    out += sprout(x + 38, y + h - 2.5, 2, 5, LEAF_L, LEAF) + pot(x + 34.5, y + h - 3.5, 7, 5.5, GOLD, GOLD_D)
    # varão e cortinas
    out.append(rect(x - 8, y - 8, w + 16, 1.8, PLUM_D, r=0.9))
    for sx, flip in ((x - 6.5, 1), (x + w + 6.5, -1)):
        # cortina presa no meio por um laço dourado
        out.append(path(f'M{sx},{y-7} h{8.5*flip} q{0.5*flip},{14} {-2.5*flip},{23} q{2*flip},{12} {2.5*flip},{h-14} h{-8.5*flip} Z', CORAL))
        out.append(path(f'M{sx+3.2*flip},{y-6} q{0.6*flip},{12} {-0.8*flip},{21} M{sx+3*flip},{y+19} q{0.4*flip},{12} {1.4*flip},{h-18}', None, stroke=CORAL_D, sw=0.6))
        out.append(rect(min(sx - 0.4 * flip, sx + 6.6 * flip), y + 14.6, 7, 2.4, GOLD, r=1.1))
    return out


@sprite('window-front')
def _window_front():
    return g(window_front(), f'translate({-FRONT[0]},{-FRONT[1]})')


def planks(x0, x1, y0, y1, rows, base, alt, seam, seed=7):
    rnd = random.Random(seed)
    out = []
    rh = (y1 - y0) / rows
    for r in range(rows):
        y = y0 + r * rh
        out.append(rect(x0, y, x1 - x0, rh, base if r % 2 == 0 else alt, stroke=None))
        out.append(line(x0, y, x1, y, stroke=seam, sw=0.5))
        xs = x0 + rnd.uniform(10, 60)
        while xs < x1:
            out.append(line(xs, y + 0.6, xs, y + rh - 0.6, stroke=seam, sw=0.5))
            # veio claro da madeira
            if rnd.random() < 0.7:
                gx = xs + rnd.uniform(6, 30)
                out.append(line(gx, y + rh * 0.5, gx + rnd.uniform(6, 14), y + rh * 0.5, stroke=WHITE, sw=0.5, extra='opacity="0.18"'))
            xs += rnd.uniform(44, 86)
    return out


def crate(x, y, s):
    return [rect(x, y, s, s, WOOD_L, r=1.2), rect(x + 1.8, y + 1.8, s - 3.6, s - 3.6, WOOD, r=0.6, sw=0.4),
            line(x + 2.4, y + 2.4, x + s - 2.4, y + s - 2.4, stroke=WOOD_D, sw=1.2)]


@sprite('room')
def room():
    defs = ''
    o = []
    # --- parede do fundo
    d, wall = lin([(0, '#f9dcb4'), (1, '#f1c896')]); defs += d
    o.append(rect(0, 0, 384, 216, wall, stroke=None))
    # manchas de tijolo à mostra
    for bx, by in ((226, 13), (242, 19), (270, 68), (286, 74), (140, 60), (196, 14)):
        o += [rect(bx, by, 9, 4, '#e7a98a', r=1.2, sw=0.4, stroke='#c98468'), rect(bx + 10, by, 7, 4, '#eeb596', r=1.2, sw=0.4, stroke='#c98468')]
    # luz suave das lanternas na parede
    d, glow = rad([(0, '#fff6d8', 0.75), (1, '#fff6d8', 0)]); defs += d
    for lx, ly in ((107, 34), (289, 30)):
        o.append(ell(lx, ly, 34, 30, glow, stroke=None))
    # --- lambri (painéis de madeira)
    o.append(rect(25, 84, 334, 28, WOOD, stroke=None))
    o.append(rect(25, 82.6, 334, 3.2, WOOD_L, r=1.2, sw=0.5))
    px = 28.5
    while px < 356:
        o.append(rect(px, 89, 20, 18, WOOD_D, r=2, sw=0.5, stroke=WOOD_DD))
        o.append(rect(px + 2.2, 91.2, 15.6, 13.6, '#b57440', r=1.2, stroke=None))
        px += 23.6
    o.append(rect(25, 109.4, 334, 3, WOOD_DD, stroke=None))
    # --- piso
    o += planks(0, 384, FLOOR_Y, 216, 13, '#e0a364', '#d6975a', '#b9773f')
    d, shade = lin([(0, '#7a452b', 0.35), (1, '#7a452b', 0)]); defs += d
    o.append(rect(25, FLOOR_Y, 334, 9, shade, stroke=None))
    # --- paredes laterais (em perspectiva) e colunas
    for pts, col in (([(0, 0), (25, 0), (25, 112), (0, 137)], '#dba878'), ([(384, 0), (359, 0), (359, 112), (384, 137)], '#dba878')):
        o.append(poly(pts, col, sw=0.6))
    o += [poly([(0, 95), (25, 84), (25, 112), (0, 137)], WOOD_D, sw=0.6), poly([(384, 95), (359, 84), (359, 112), (384, 137)], WOOD_D, sw=0.6)]
    o += [rect(23.4, 8, 3.2, 104.6, WOOD_DD, r=1, sw=0.5), rect(357.4, 8, 3.2, 104.6, WOOD_DD, r=1, sw=0.5)]
    # --- teto: viga e barrotes
    o.append(rect(-2, -2, 388, 11.5, '#7d4a33', sw=0.6))
    o.append(line(0, 3.4, 384, 3.4, stroke='#96603f', sw=0.8))
    for bx in (10, 74, 138, 202, 266, 330):
        o.append(rect(bx, -2, 9, 15.5, '#96603f', r=1.6))
        o.append(shine(bx + 1.4, 1, 1.4, 9, 0.2))
    # --- janela com a rua
    view, d = street_view(); defs += d
    o += view
    o += window_front()
    # --- quadro estrelado (decoração padrão)
    o += [rect(27, 17, 18, 16, GOLD, r=1.6), rect(29, 19, 14, 12, NAVY, r=0.8, sw=0.4),
          star(33, 23, 1.8, GOLD_L), star(39.5, 27, 1.3, WHITE), circ(38, 21.5, 0.6, WHITE, stroke=None)]
    # --- ervas secando
    o.append(path('M110,13.5 Q132,17.5 156,13.5', None, stroke=WOOD_DD, sw=0.6))
    for i, col in enumerate((LEAF, LEAF_D, '#e9d7a6', LEAF_L, PLUM_L, LEAF)):
        hx = 115 + i * 7
        o.append(path(f'M{hx},{15} q-3,4 -1.5,8 q1.5,2 3,0 q1.5,-4 -1.5,-8 Z', col, sw=0.4))
    # --- lanternas
    o += lantern(107, 24) + lantern(289, 20)
    # --- prateleira de livros
    o.append(rect(275, 50, 26, 3, WOOD_L, r=1.2))
    o += [path('M278,53 v4 M298,53 v4', None, stroke=WOOD_DD, sw=1.2)]
    bx = 277
    for bw, bh, col in ((3, 10, RED), (2.6, 12, BLUE), (3, 9, LEAF_D), (2.6, 11, GOLD), (3.2, 8, PLUM)):
        o.append(rect(bx, 50 - bh, bw, bh, col, r=0.6, sw=0.4)); bx += bw + 0.3
    o += [rect(293.6, 44, 2, 6, CREAM, r=0.5, sw=0.4), path('M294.6,44 q-1.2,-2 0,-3.4 q1.2,1.4 0,3.4 Z', GOLD, sw=0.3)]
    # --- capacho
    o.append(rect(300, 112.6, 42, 6, LEAF_D, r=2, sw=0.5))
    for i in range(7):
        o.append(circ(304 + i * 5.7, 115.6, 0.7, LEAF_L, stroke=None))
    # --- barril com concha
    o += [line(25, 167, 25, 181, stroke=WOOD_DD, sw=1.2), circ(25, 167, 1.3, WOOD_L, sw=0.4)]
    o.append(path('M10,172 Q8,190 11,207 Q21,210 31,207 Q34,190 32,172 Q21,169 10,172 Z', WOOD))
    o += [path('M9.6,180 Q21,182.6 32.4,180', None, stroke=PLUM_D, sw=1.6), path('M9.8,199 Q21,201.6 32.2,199', None, stroke=PLUM_D, sw=1.6),
          path('M16,171.6 V207.6 M26,171.6 V207.6', None, stroke=WOOD_D, sw=0.5), ell(21, 172, 11, 2.4, WOOD_D, sw=0.5)]
    # --- planta
    o += pot(114, 190, 12, 13, CORAL, CORAL_D)
    o.append(rect(118, 195.5, 4, 2.6, GOLD, r=0.8, sw=0.3))
    o.append(path('M120,190 Q119,182 114,180 M120,190 Q122,182 126,178 M120,190 V175 M120,190 Q126,188 131,185 M120,190 Q114,189 111,186', None, stroke=LEAF_D, sw=0.8))
    for lx, ly, rx, ry, col in ((114, 180, 5, 3, LEAF_D), (126, 178, 5.4, 3.2, LEAF), (120, 174.6, 5, 3, LEAF_L), (131, 185, 4.6, 2.8, LEAF),
                                (111, 186, 4.2, 2.6, LEAF), (122, 183, 5, 3, LEAF_D)):
        o.append(ell(lx, ly, rx, ry, col, sw=0.45))
    # --- tapete padrão
    o += rug_body(146, 178, NAVY, CORAL, GOLD)
    # --- saco, caixotes e garrafas
    o.append(path('M301,205 Q298,192 306,190 L305,187.6 H315 L314,190 Q322,192 319,205 Q310,209.6 301,205 Z', '#ead9b0'))
    o.append(path('M305,190 H315', None, stroke=WOOD_D, sw=1))
    o += crate(326, 182, 21.5) + crate(331, 166, 15.5) + crate(348.5, 190, 15)
    o += [rect(334, 160, 2.6, 6, TEAL_L, r=0.8, sw=0.4), rect(338.4, 159, 2.8, 7, SKY_L, r=0.8, sw=0.4)]
    return o, defs


def rug_body(x, y, base, border, accent, w=124, h=32, motif='diamond'):
    o = []
    # franjas
    for i in range(31):
        fx = x + 2 + i * 4
        o += [line(fx, y + 0.4, fx, y + 2.4, stroke=CREAM_D, sw=0.9), line(fx, y + h - 2.4, fx, y + h - 0.4, stroke=CREAM_D, sw=0.9)]
    o.append(rect(x, y + 2, w, h - 4, border, r=2.4))
    o.append(rect(x + 3, y + 5, w - 6, h - 10, accent, r=1.6, sw=0.4))
    o.append(rect(x + 4.6, y + 6.6, w - 9.2, h - 13.2, base, r=1.2, sw=0.4))
    n = 9
    for i in range(n):
        cx = x + 12 + i * (w - 24) / (n - 1)
        cy = y + h / 2
        if motif == 'diamond':
            o.append(poly([(cx, cy - 4), (cx + 4, cy), (cx, cy + 4), (cx - 4, cy)], accent, sw=0.4))
            o.append(circ(cx, cy, 1.3, border, stroke=None))
        elif motif == 'star':
            o.append(star(cx, cy, 4.2, accent, stroke=OUT, sw=0.3))
        else:  # folhas
            o.append(ell(cx, cy, 4.4, 2.6, accent, sw=0.4))
            o.append(line(cx - 3.4, cy, cx + 3.4, cy, stroke=base, sw=0.5))
    return o


@sprite('rug-estrelas')
def _rug1():
    return rug_body(0, 0, '#3b2b7a', PLUM_L, GOLD, motif='star')


@sprite('rug-musgo')
def _rug2():
    return rug_body(0, 0, '#3f8f4f', LEAF_D, LEAF_L, motif='leaf')


@sprite('rug-vinho')
def _rug3():
    return rug_body(0, 0, '#a8324a', '#7b2138', GOLD)
