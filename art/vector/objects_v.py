"""Móveis e efeitos da loja no visual vetorial. Medidas e pontos de encaixe iguais aos do pixel art (art/objects.py)."""
import math
from vsvg import *
from registry import sprite, variants
from room_v import pot, sprout, lantern

IRON = '#5b4a82'; IRON_D = '#3f3263'; IRON_L = '#8773b8'
COPPER = '#d9824a'; COPPER_D = '#a8552c'; COPPER_L = '#f4b27c'


def bottle(x, y, w, h, color, cork=True):
    """Frasquinho genérico (y = base)."""
    o = [rect(x, y - h * 0.72, w, h * 0.72, color, r=w * 0.32, sw=0.4), rect(x + w * 0.28, y - h, w * 0.44, h * 0.34, color, r=0.4, sw=0.4)]
    if cork:
        o.append(rect(x + w * 0.2, y - h - 0.6, w * 0.6, 1.3, WOOD_L, r=0.4, sw=0.3))
    o.append(shine(x + w * 0.18, y - h * 0.6, w * 0.2, h * 0.34, 0.6))
    return o


# ------------------------------------------------------------------ armário de ingredientes (40×98)
@sprite('obj-cabinet')
def cabinet():
    o = [rect(1.2, 4, 37.6, 93, WOOD, r=2.4, sw=0.7),
         rect(0.4, 0.6, 39.2, 5, WOOD_L, r=2, sw=0.7),
         rect(3, 94.6, 4, 3, WOOD_DD, r=1, sw=0.5), rect(33, 94.6, 4, 3, WOOD_DD, r=1, sw=0.5)]
    # portas de vidro
    for dx in (4, 21):
        o.append(rect(dx, 8.4, 15, 47, '#2f6d78', r=1.6, sw=0.6))
        o.append(rect(dx + 1.2, 9.6, 12.6, 44.6, '#3f8f96', r=1, stroke=None))
        for sy in (24, 39, 53.4):
            o.append(rect(dx + 0.6, sy, 13.8, 1.3, WOOD_L, stroke=None))
        cols = [(TEAL_L, GOLD, CORAL), (LEAF_L, PLUM_L, GOLD_L), (ROSE, TEAL, BLUE)] if dx == 4 else [(GOLD, ROSE, TEAL_L), (CORAL, LEAF, PLUM_L), (BLUE, GOLD_L, LEAF_L)]
        for row, sy in enumerate((24, 39, 53.4)):
            for i, c in enumerate(cols[row]):
                o += bottle(dx + 1.6 + i * 4.2, sy, 3.2, 7 + (i + row) % 2 * 2, c)
        o.append(path(f'M{dx+2.4},{20} L{dx+6.4},{11.6}', None, stroke=WHITE, sw=1.1, extra='opacity="0.35"'))
    o += [circ(18.4, 32, 0.9, GOLD, sw=0.4), circ(21.6, 32, 0.9, GOLD, sw=0.4)]
    # gavetas
    for row in range(3):
        for col in range(2):
            x, y = 4 + col * 17, 59.4 + row * 11.6
            o.append(rect(x, y, 15, 9.6, WOOD_L, r=1.4, sw=0.6))
            o.append(rect(x + 5, y + 3.6, 5, 2.2, GOLD, r=1, sw=0.4))
    return o


@sprite('cabinet-labels')
def cabinet_labels():
    o = []
    for row in range(3):
        for col in range(2):
            x, y = 4 + col * 17, 59.4 + row * 11.6
            o.append(rect(x + 3.2, y + 1.6, 8.6, 5.6, CREAM, r=0.9, sw=0.45))
            o.append(line(x + 4.8, y + 3.6, x + 10.2, y + 3.6, stroke=WOOD_D, sw=0.5))
            o.append(line(x + 4.8, y + 5.4, x + 8.6, y + 5.4, stroke=WOOD_D, sw=0.5))
    return o


@sprite('cabinet-runes')
def cabinet_runes():
    o = [rect(1, 1, 38, 96, None, r=2.6, stroke=PLUM_L, sw=0.7, extra='stroke-dasharray="0.2 2.6" opacity="0.95"')]
    for x, y, r in ((3, 3, 2.2), (37, 4, 1.8), (3.6, 95, 1.8), (36.4, 94, 2.2), (20, 2.4, 1.4)):
        o.append(star(x, y, r, PLUM_LL))
    return o


# ------------------------------------------------------------------ caldeirão (48×48)
def hearth():
    """Base de pedras com a boca do fogo (y 31..48)."""
    o = []
    stones = [(2, 33, 11, 7), (35, 33, 11, 7), (1, 40.6, 9, 7), (10.6, 40.6, 6, 7), (31.4, 40.6, 6, 7), (38, 40.6, 9, 7), (13.6, 31.6, 20.8, 5)]
    for i, (x, y, w, h) in enumerate(stones):
        o.append(rect(x, y, w, h, STONE if i % 2 == 0 else STONE_L, r=1.8, sw=0.55))
    o.append(path('M16.6,48 V40 Q24,34 31.4,40 V48 Z', '#3a2233', sw=0.55))
    return o


def pot_body(body, dark, light, inside='#1f5f66'):
    o = []
    # alças
    o += [path('M5.4,13 q-4.6,1 -3.6,6', None, stroke=OUT, sw=2.6), path('M5.4,13 q-4.6,1 -3.6,6', None, stroke=light, sw=1.4),
          path('M42.6,13 q4.6,1 3.6,6', None, stroke=OUT, sw=2.6), path('M42.6,13 q4.6,1 3.6,6', None, stroke=light, sw=1.4)]
    # barriga
    o.append(path('M6,12 Q2.6,24 9,33 Q24,39.6 39,33 Q45.4,24 42,12 Z', body, sw=0.7))
    o.append(path('M9.4,31 Q24,37 38.6,31 Q24,40 9.4,31 Z', dark, stroke=None))
    o.append(path('M9,15 Q6.6,23 10.6,29', None, stroke=WHITE, sw=1.8, extra='opacity="0.28"'))
    # boca
    o.append(ell(24, 10.6, 19.4, 5.4, light, sw=0.7))
    o.append(ell(24, 10.8, 16.6, 3.9, inside, sw=0.5))
    return o


@sprite('obj-cauldron')
def cauldron():
    return hearth() + pot_body(IRON, IRON_D, IRON_L)


@sprite('cauldron-2')
def cauldron2():
    return hearth() + pot_body(COPPER, COPPER_D, COPPER_L, inside='#6a2f3f')


@sprite('cauldron-bands')
def cauldron_bands():
    o = [path('M4.6,19 Q24,25.6 43.4,19', None, stroke=OUT, sw=3), path('M4.6,19 Q24,25.6 43.4,19', None, stroke=GOLD, sw=1.8),
         path('M7.4,28 Q24,34.6 40.6,28', None, stroke=OUT, sw=2.6), path('M7.4,28 Q24,34.6 40.6,28', None, stroke=GOLD, sw=1.4)]
    o += [rect(20.6, 19.6, 6.8, 6.8, GOLD_L, r=1.6, sw=0.5), star(24, 23, 2.2, GOLD_D)]
    return o


@sprite('liquid')
def liquid():
    """Superfície do preparo (33×7), branca para receber a cor da receita."""
    return [ell(16.5, 3.5, 16, 3.3, '#f4f4f4', stroke=None), ell(11, 2.6, 5, 1, WHITE, stroke=None, extra='opacity="0.9"'),
            circ(23, 4, 1.1, WHITE, stroke=None), circ(18, 2.4, 0.7, WHITE, stroke=None)]


@variants('fire-{}', range(3))
def fire(f):
    """Chama (14×9), três quadros."""
    tips = [(7, 0.4, 3.4, 2.2), (6, 0.8, 9.6, 1.4), (8, 0.6, 4.6, 2.6)][f]
    a, at, b, bt = tips
    o = [path(f'M1.4,9 Q-0.4,5 {b-1.4},{bt+1.4} Q{b},{bt+3.6} {a-1},{at} Q{a+3.4},{at+3} {12.4},{3.4} Q14.6,6.4 12.6,9 Z', '#ff8a3c', sw=0.45),
         path(f'M4,9 Q3.2,6.4 {a-0.4},{at+3.2} Q{a+2.6},{at+5.4} 10,9 Z', GOLD, stroke=None),
         path(f'M5.8,9 Q5.6,7.4 {a},{at+5.6} Q{a+1.4},{at+7} 8.6,9 Z', GOLD_L, stroke=None)]
    return o


# ------------------------------------------------------------------ prateleira de poções (56×62)
@sprite('obj-shelf')
def shelf():
    o = [rect(0.6, 0.6, 54.8, 61, WOOD, r=2.2, sw=0.7), rect(3.4, 3.4, 49.2, 55.6, '#7a4a35', r=1, sw=0.5)]
    d, shade = lin([(0, '#4f2f2a', 0.55), (1, '#4f2f2a', 0)])
    for by in (19, 39, 59):
        o.append(rect(3.4, by - 15.4 if by > 19 else 3.4, 49.2, 6, shade, stroke=None))
    for by in (19, 39, 59):
        o.append(rect(2.4, by, 51.2, 2.8, WOOD_L, r=0.9, sw=0.55))
    o.append(rect(-0.2, -0.2, 56.4, 3.6, WOOD_L, r=1.6, sw=0.7))
    return o, d


# ------------------------------------------------------------------ quadro de avisos (36×32)
@sprite('obj-board')
def board():
    o = [rect(0.6, 0.6, 34.8, 30.8, WOOD, r=2.2, sw=0.7), rect(3, 3, 30, 26, '#e3a66a', r=1.2, sw=0.5)]
    notes = [(5, 5, 11, 10, CREAM, -4), (19, 4.6, 11, 8, '#ffe9a8', 3), (6, 17.6, 10, 8.6, '#d9f2e6', 3), (19.6, 15.4, 10.6, 11, CREAM, -3)]
    for x, y, w, h, col, rot in notes:
        body = [rect(x, y, w, h, col, r=0.8, sw=0.45)]
        for i in range(int(h // 2.6)):
            body.append(line(x + 1.6, y + 2.6 + i * 2.4, x + w - (1.6 if i % 2 == 0 else 3.4), y + 2.6 + i * 2.4, stroke='#b08a6a', sw=0.5))
        body.append(circ(x + w / 2, y + 0.9, 0.9, RED, sw=0.35))
        o.append(g(body, f'rotate({rot} {x+w/2} {y+h/2})'))
    return o


# ------------------------------------------------------------------ porta (42×84)
@sprite('obj-door')
def door():
    o = []
    # arco de pedras
    o.append(path('M0.6,84 V22 Q0.6,0.6 21,0.6 Q41.4,0.6 41.4,22 V84 Z', STONE, sw=0.7))
    for a in range(-80, 81, 23):
        r1, r2 = 15.6, 20.4
        ca, sa = math.sin(math.radians(a)), -math.cos(math.radians(a))
        o.append(line(21 + ca * r1, 22 + sa * r1, 21 + ca * r2, 22 + sa * r2, stroke=STONE_D, sw=0.6))
    for y in (32, 44, 56, 68, 80):
        o += [line(0.8, y, 5.4, y, stroke=STONE_D, sw=0.6), line(36.6, y, 41.2, y, stroke=STONE_D, sw=0.6)]
    # folha da porta
    o.append(path('M5.6,84 V22 Q5.6,6 21,6 Q36.4,6 36.4,22 V84 Z', WOOD, sw=0.7))
    for x in (13, 21, 29):
        o.append(line(x, 8.4 if x == 21 else 10.6, x, 83.4, stroke=WOOD_D, sw=0.6))
    # ferragens
    for y in (30, 70):
        o += [rect(5.6, y, 14, 2.6, IRON_D, r=1.2, sw=0.45), circ(8, y + 1.3, 0.6, IRON_L, stroke=None)]
    # janelinha redonda
    o += [circ(21, 19, 5.2, WOOD_L, sw=0.6), circ(21, 19, 3.6, SKY, sw=0.45), line(21, 15.4, 21, 22.6, sw=0.45), line(17.4, 19, 24.6, 19, sw=0.45)]
    # maçaneta
    o += [circ(32, 52, 1.9, GOLD, sw=0.5), circ(31.5, 51.5, 0.6, GOLD_L, stroke=None)]
    return o


def sign(text, color, w):
    o = [line(w / 2 - 6, 0, w / 2 - 6, 3, stroke=OUT, sw=0.6), line(w / 2 + 6, 0, w / 2 + 6, 3, stroke=OUT, sw=0.6),
         rect(0.5, 2.6, w - 1, 11, color, r=2.4, sw=0.6),
         f'<text x="{w/2}" y="10.9" text-anchor="middle" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="bold" font-size="6.4" fill="{CREAM}" textLength="{w-6}" lengthAdjust="spacingAndGlyphs">{text}</text>']
    return o


@sprite('sign-open')
def _so(): return sign('ABERTO', LEAF_D, 31)


@sprite('sign-closed')
def _sc(): return sign('FECHADO', RED, 35)


@sprite('sign-open-en')
def _soe(): return sign('OPEN', LEAF_D, 23)


@sprite('sign-closed-en')
def _sce(): return sign('CLOSED', RED, 31)


# ------------------------------------------------------------------ balcão (116×40) e caixa (22×18)
def counter_front(x, y, w, h, n):
    o = [rect(x, y, w, h, WOOD, r=1.6, sw=0.7)]
    pw = (w - 6) / n
    for i in range(n):
        px = x + 3 + i * pw
        o.append(rect(px + 1.4, y + 4, pw - 2.8, h - 9, WOOD_D, r=1.8, sw=0.5, stroke=WOOD_DD))
        cx, cy = px + pw / 2, y + 4 + (h - 9) / 2
        # vela acesa no painel
        o += [rect(cx - 1.6, cy - 0.6, 3.2, 5.6, GOLD_L, r=0.8, sw=0.4), path(f'M{cx},{cy-4.6} q-1.8,2.4 0,4 q1.8,-1.6 0,-4 Z', GOLD, sw=0.35)]
    o.append(rect(x, y + h - 3.4, w, 3.4, WOOD_DD, r=1, sw=0.5))
    return o


@sprite('obj-counter')
def counter():
    o = counter_front(1.2, 7, 113.6, 33, 4)
    o.append(rect(0.3, 2.6, 115.4, 6.2, WOOD_L, r=2.2, sw=0.7))
    o.append(shine(4, 3.8, 60, 1.2, 0.35))
    # papéis, sineta e vela em cima do tampo
    o += [rect(12, 0.4, 9, 3.4, CREAM, r=0.6, sw=0.4), line(13.6, 2, 19.4, 2, stroke=WOOD_D, sw=0.4),
          rect(23, 0.4, 9, 3.4, CREAM, r=0.6, sw=0.4), line(24.6, 2, 30.4, 2, stroke=WOOD_D, sw=0.4)]
    o += [path('M58.4,3.6 Q58.4,-0.6 62,-0.6 Q65.6,-0.6 65.6,3.6 Z', GOLD, sw=0.45), rect(57.4, 3, 9.2, 1.4, GOLD_D, r=0.7, sw=0.4), circ(62, -0.4, 0.7, GOLD_L, sw=0.3)]
    o += [rect(88, 0.2, 2, 3.4, CREAM, r=0.5, sw=0.4)]
    return o


@sprite('counter-wing')
def counter_wing():
    """Ala do balcão (28×52): módulo extra com a balança em cima."""
    o = counter_front(1.2, 19, 25.6, 33, 1)
    o.append(rect(0.3, 14.6, 27.4, 6.2, WOOD_L, r=2.2, sw=0.7))
    # balança dourada
    o += [rect(13, 3, 1.6, 11.4, GOLD_D, r=0.6, sw=0.4), rect(9.4, 13, 8.8, 2, GOLD, r=1, sw=0.4),
          rect(4.6, 3.2, 18.4, 1.5, GOLD, r=0.7, sw=0.4), circ(13.8, 3, 1.5, GOLD_L, sw=0.4)]
    for cx in (6, 21.6):
        o += [line(cx, 4.6, cx - 2.4, 9.4, sw=0.35), line(cx, 4.6, cx + 2.4, 9.4, sw=0.35), path(f'M{cx-3.4},{9.4} h6.8 q-3.4,3.4 -6.8,0 Z', GOLD_L, sw=0.4)]
    return o


@sprite('obj-register')
def register():
    o = [rect(1, 6, 20, 11.4, CORAL, r=2, sw=0.6), rect(3, 1, 12, 6, CORAL_D, r=1.4, sw=0.55), rect(4.6, 2.4, 8.8, 3, '#d7f5e6', r=0.6, sw=0.4)]
    for r in range(2):
        for c in range(4):
            o.append(rect(3.4 + c * 3.4, 8.4 + r * 3.2, 2.4, 2.2, CREAM, r=0.6, sw=0.35))
    o += [rect(17, 3, 1.4, 5, IRON_D, r=0.6, sw=0.35), circ(17.7, 2.6, 1.3, GOLD, sw=0.4), rect(0.4, 15.4, 21.2, 2.4, WOOD_DD, r=1, sw=0.5)]
    return o


@sprite('display-stand')
def display_stand():
    """Expositor (44×30): mesinha com toalha; os frascos ficam em y=8."""
    o = [rect(4, 22, 3, 8, WOOD_D, r=1, sw=0.5), rect(37, 22, 3, 8, WOOD_D, r=1, sw=0.5),
         rect(0.4, 8, 43.2, 3.6, WOOD_L, r=1.6, sw=0.6),
         path('M2,11.6 H42 V21 Q38.6,24 35.4,21 Q32,24 28.6,21 Q25.4,24 22,21 Q18.6,24 15.4,21 Q12,24 8.6,21 Q5.4,24 2,21 Z', CORAL, sw=0.6)]
    for i in range(5):
        o.append(star(6 + i * 8, 16, 1.6, GOLD_L))
    return o


# ------------------------------------------------------------------ efeitos e marcadores
def glow(color):
    d, f = rad([(0, color, 0.9), (0.35, color, 0.45), (1, color, 0)])
    return d, f


@sprite('glow-warm')
def _gw():
    d, f = glow('#ffc86e'); return [rect(0, 0, 48, 48, f, stroke=None)], d


@sprite('glow-fire')
def _gf():
    d, f = glow('#ff8c3c'); return [rect(0, 0, 36, 36, f, stroke=None)], d


@sprite('glow-small')
def _gs():
    d, f = glow('#ffe6aa'); return [rect(0, 0, 12, 12, f, stroke=None)], d


@sprite('glow-violet')
def _gv():
    d, f = glow('#b896e4'); return [rect(0, 0, 20, 20, f, stroke=None)], d


@sprite('glow-vitral')
def _gvi():
    d, f = glow('#c8aaff'); return [rect(0, 0, 32, 32, f, stroke=None)], d


@sprite('dot-bubble')
def _db(): return [circ(1.5, 1.5, 1.3, WHITE, stroke=None)]


@sprite('px')
def _px(): return [circ(1, 1, 0.9, WHITE, stroke=None)]


@sprite('dot-steam')
def _ds(): return [circ(2.5, 2.5, 2.3, '#f4f0ff', stroke=None, extra='opacity="0.9"')]


@sprite('sparkle')
def _sparkle(): return [star(2.5, 2.5, 2.5, WHITE)]


@sprite('coin')
def _coin(): return [circ(3.5, 3.5, 3.1, GOLD, sw=0.5), circ(3.5, 3.5, 1.7, GOLD_L, stroke=GOLD_D, sw=0.4)]


@sprite('heart')
def _heart(): return [path('M3.5,5.7 Q0.2,3.4 0.7,1.7 Q1.6,0 3.5,1.6 Q5.4,0 6.3,1.7 Q6.8,3.4 3.5,5.7 Z', '#ff5d7a', sw=0.45)]


@sprite('angry')
def _angry():
    return [path('M1,1 L3,2.6 M6,1 L4,2.6 M1,6 L3,4.4 M6,6 L4,4.4', None, stroke=RED, sw=1.1)]


@sprite('sad')
def _sad(): return [path('M2.5,0.5 Q0.4,3.6 0.6,5 Q1,6.6 2.5,6.6 Q4,6.6 4.4,5 Q4.6,3.6 2.5,0.5 Z', BLUE, sw=0.4), shine(1.6, 3.6, 0.8, 1.6, 0.7)]


@sprite('marker')
def _marker(): return [path('M0.6,0.6 H6.4 L3.5,5.4 Z', GOLD, sw=0.5)]


@sprite('badge')
def _badge():
    """Aviso de encomenda (9×11): balão dourado com exclamação."""
    return [path('M4.5,10.6 L2.6,7.8 Q0.4,6.6 0.4,4.3 Q0.4,0.4 4.5,0.4 Q8.6,0.4 8.6,4.3 Q8.6,6.6 6.4,7.8 Z', GOLD, sw=0.5),
            rect(3.8, 1.8, 1.4, 3.4, INK, r=0.6, stroke=None), circ(4.5, 6.4, 0.75, INK, stroke=None)]


@sprite('bubble')
def _bubble():
    """Balão de pedido (17×17)."""
    return [path('M2.6,0.6 H14.4 Q16.4,0.6 16.4,2.6 V11 Q16.4,13 14.4,13 H10 L8.5,16.2 L7,13 H2.6 Q0.6,13 0.6,11 V2.6 Q0.6,0.6 2.6,0.6 Z', CREAM, sw=0.55)]


@sprite('jar')
def _jar(): return [rect(0.5, 2, 5, 5.6, '#bfe6ee', r=1.2, sw=0.4, extra='opacity="0.9"'), rect(1, 0.6, 4, 1.8, WOOD_L, r=0.6, sw=0.35), shine(1.2, 3, 0.9, 2.6, 0.7)]


@sprite('zz')
def _zz():
    return [f'<text x="0.2" y="6.4" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="bold" font-size="5.2" fill="{WHITE}" stroke="{PLUM_D}" stroke-width="0.35">z</text>',
            f'<text x="3.4" y="3.8" font-family="DejaVu Sans, Verdana, sans-serif" font-weight="bold" font-size="4" fill="{WHITE}" stroke="{PLUM_D}" stroke-width="0.3">z</text>']


@variants('note-{}', range(2))
def note(f):
    c = [GOLD, TEAL_L][f]
    return [ell(1.6, 5.4, 1.4, 1.1, c, sw=0.35), line(2.9, 5.4, 2.9, 0.8, stroke=OUT, sw=0.5), path('M2.9,0.8 Q4.6,1 4.6,2.8', None, stroke=OUT, sw=0.5)]


# ------------------------------------------------------------------ melhorias e decoração
@sprite('garland')
def garland():
    """Cordão de luzes (384×26); as lâmpadas ficam nos pontos de layout.garlandBulbs."""
    import json, os
    lay = json.load(open(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'sprites', 'layout.json')))
    bulbs = lay['garlandBulbs']
    pts = [(16, 11)] + [(b['x'], b['y'] - 1.6) for b in bulbs] + [(366, 13)]
    d = 'M' + ' L'.join(f'{x},{y}' for x, y in pts)
    o = [path(d, None, stroke=LEAF_D, sw=0.7)]
    vivid = {'#f6cf5e': GOLD, '#e8705a': CORAL, '#86c0f0': BLUE, '#9cc75a': LEAF, '#b896e4': PLUM_L}
    for b in bulbs:
        o.append(rect(b['x'] - 0.7, b['y'] - 1.8, 1.4, 1.4, IRON_D, stroke=None))
        o.append(ell(b['x'], b['y'] + 0.8, 1.7, 2.1, vivid.get(b['color'], b['color']), sw=0.35))
        o.append(circ(b['x'] - 0.5, b['y'] + 0.2, 0.5, WHITE, stroke=None, extra='opacity="0.7"'))
    return o


@sprite('shop-sign')
def shop_sign():
    """Letreiro novo sobre a porta (40×18)."""
    o = [line(8, 0, 8, 4, sw=0.6), line(32, 0, 32, 4, sw=0.6), rect(0.5, 3.4, 39, 13.6, NAVY, r=3, sw=0.7), rect(2.2, 5.1, 35.6, 10.2, None, r=2, stroke=GOLD, sw=0.6)]
    o += bottle(17.4, 13.6, 5.2, 7.6, TEAL_L)
    o += [star(8.4, 10.2, 2.6, GOLD), star(31.6, 10.2, 2.6, GOLD), star(13, 7.6, 1.1, GOLD_L), star(27, 13, 1.1, GOLD_L)]
    return o


@sprite('awning')
def awning():
    """Toldo da janela (62×8), branco para receber a cor escolhida."""
    o = [path('M1,0.6 H61 V5 Q57.6,8.4 54.3,5 Q51,8.4 47.7,5 Q44.3,8.4 41,5 Q37.7,8.4 34.3,5 Q31,8.4 27.7,5 Q24.3,8.4 21,5 Q17.7,8.4 14.3,5 Q11,8.4 7.7,5 Q4.3,8.4 1,5 Z', '#ffffff', sw=0.55)]
    for i in range(9):
        o.append(rect(4.3 + i * 6.67, 0.8, 3.3, 4.4, '#d9d9d9', stroke=None))
    return o


@sprite('greenhouse')
def greenhouse():
    """Estufa de janela (60×20): jardineira com ervas no peitoril."""
    o = []
    for i, (h, col) in enumerate(((4.5, LEAF), (6, LEAF_L), (4, LEAF_D), (6.5, LEAF), (4.5, LEAF_L), (5.5, LEAF_D), (4, LEAF))):
        x = 7 + i * 7.6
        o += sprout(x, 13, 3, h, col)
        if i % 2 == 1:
            o.append(circ(x, 13 - h, 1.2, ROSE if i % 4 == 1 else GOLD, sw=0.35))
    o.append(rect(1, 12, 58, 7.4, WOOD_L, r=2, sw=0.6))
    o.append(rect(3, 14.2, 54, 1.2, WOOD_D, stroke=None))
    return o


@sprite('alembic')
def alembic():
    """Alambique (30×44)."""
    o = [rect(2, 38, 20, 5.4, STONE, r=1.6, sw=0.55), rect(6.6, 34, 10.8, 4.6, STONE_D, r=1.2, sw=0.5)]
    o.append(path('M12,34 Q3,33 3.4,25 Q4,18 9.4,16.6 V10 H14.6 V16.6 Q20,18 20.6,25 Q21,33 12,34 Z', COPPER, sw=0.65))
    o.append(path('M5.6,23 Q5.6,29 9,31', None, stroke=WHITE, sw=1.4, extra='opacity="0.4"'))
    o.append(rect(8.4, 8.4, 7.2, 2.6, COPPER_L, r=1.2, sw=0.5))
    o.append(path('M12,8.4 V4 Q12,1.6 15,2 L24.6,8 Q26.4,9.4 26.4,12 V28', None, stroke=OUT, sw=2.6))
    o.append(path('M12,8.4 V4 Q12,1.6 15,2 L24.6,8 Q26.4,9.4 26.4,12 V28', None, stroke=STONE_L, sw=1.4))
    o += bottle(23.2, 43.4, 6.2, 12, GOLD_L)
    return o


@sprite('vitral')
def vitral():
    """Vitral colorido sobre a parte de cima da janela (46×22)."""
    o = [rect(0, 0, 46, 22, '#2d2350', stroke=None)]
    cols = [CORAL, GOLD, TEAL, PLUM_L, LEAF, ROSE, BLUE, GOLD_L]
    k = 0
    for cx in (11.5, 34.5):
        for i in range(6):
            a0, a1 = math.pi + i * math.pi / 6, math.pi + (i + 1) * math.pi / 6
            p = f'M{cx},{21} L{cx+math.cos(a0)*19:.2f},{21+math.sin(a0)*19:.2f} A19,19 0 0 1 {cx+math.cos(a1)*19:.2f},{21+math.sin(a1)*19:.2f} Z'
            o.append(f'<g clip-path="url(#vclip{int(cx)})">' + path(p, cols[k % len(cols)], stroke='#2d2350', sw=0.7) + '</g>')
            k += 3
        o.append(path(f'M{cx-5},{21} A5,5 0 0 1 {cx+5},{21} Z', GOLD_L, stroke='#2d2350', sw=0.7))
    o.append(rect(22.3, 0, 1.4, 22, '#2d2350', stroke=None))
    defs = '<clipPath id="vclip11"><rect x="0" y="0" width="22.6" height="22"/></clipPath><clipPath id="vclip34"><rect x="23.4" y="0" width="22.6" height="22"/></clipPath>'
    return o, defs


@variants('bell-{}', range(2))
def bell(f):
    """Sino da porta (14×20), parado e tocando."""
    rot = [0, 16][f]
    o = [path('M1,1 H9 Q12,1 12,4 V6', None, stroke=IRON_D, sw=1.6)]
    b = [path('M7,6 Q2.4,7 2.4,13 L1,16.6 H13 L11.6,13 Q11.6,7 7,6 Z', GOLD, sw=0.6), circ(7, 17.8, 1.5, GOLD_D, sw=0.45), shine(4, 9, 1.2, 4, 0.5)]
    o.append(g(b, f'translate(5 0) rotate({rot} 7 6)'))
    return g(o, 'translate(-4 0)')


@variants('astrolabe-{}', range(2))
def astrolabe(f):
    """Astrolábio da torre (22×34), dois quadros de giro."""
    o = [line(11, 0, 11, 13, sw=0.8)]
    o += [circ(11, 23, 10, None, stroke=OUT, sw=3), circ(11, 23, 10, None, stroke=GOLD, sw=1.8)]
    rx = [9.4, 4][f]
    o += [ell(11, 23, rx, 9.4, None, stroke=GOLD_D, sw=1), ell(11, 23, 9.4, [3.4, 7][f], None, stroke=GOLD_D, sw=1)]
    o += [circ(11, 23, 2.6, PLUM_L, sw=0.5), star(11, 23, 1.6, WHITE)]
    return o


@sprite('perch')
def perch(): return [rect(0.4, 1.4, 19.2, 3, WOOD_L, r=1.4, sw=0.55), rect(2, 3.6, 2, 2.4, WOOD_D, r=0.6, sw=0.4), rect(16, 3.6, 2, 2.4, WOOD_D, r=0.6, sw=0.4)]


@sprite('parcel')
def parcel(): return [rect(0.5, 1.2, 6, 4.4, '#e9c79a', r=0.9, sw=0.45), line(3.5, 1.2, 3.5, 5.6, stroke=RED, sw=0.6), line(0.5, 3.3, 6.5, 3.3, stroke=RED, sw=0.6)]


@sprite('trophy-shelf')
def trophy_shelf(): return [rect(0.4, 0.8, 39.2, 2.6, WOOD_L, r=1.2, sw=0.55), rect(4, 3, 2, 2, WOOD_D, stroke=None), rect(34, 3, 2, 2, WOOD_D, stroke=None)]


@variants('trophy-{}', range(5))
def trophy(i):
    col = [GOLD, '#d9dbe6', COPPER, TEAL_L, PLUM_L][i]
    return [path('M1,0.6 H6 V3 Q6,5.6 3.5,5.6 Q1,5.6 1,3 Z', col, sw=0.4), rect(3, 5.4, 1, 2.4, col, stroke=OUT, sw=0.3), rect(1.6, 7.8, 3.8, 1.8, WOOD_D, r=0.5, sw=0.35)]


@sprite('crown')
def crown(): return [path('M1,7.4 L0.6,2 L3.6,4.6 L6.5,0.8 L9.4,4.6 L12.4,2 L12,7.4 Z', GOLD, sw=0.5), circ(6.5, 5.2, 1, RED, sw=0.3), circ(3, 5.8, 0.6, TEAL_L, stroke=None), circ(10, 5.8, 0.6, TEAL_L, stroke=None)]


@variants('pin-{}', (1, 2, 3))
def pin(n):
    col = {1: COPPER, 2: '#d9dbe6', 3: GOLD}[n]
    return [circ(3.5, 3.5, 3.1, col, sw=0.45), star(3.5, 3.5, 2, WHITE if n < 3 else GOLD_L, points=5, inner=0.5)]


# decoração: quadros (18×16), luminárias, plantas
def frame_art(inner):
    return [rect(0.4, 0.4, 17.2, 15.2, GOLD, r=1.6, sw=0.6)] + inner


@sprite('frame-caldeirao')
def _fr1(): return frame_art([rect(2.4, 2.4, 13.2, 11.2, '#2f6d78', r=0.8, sw=0.4), path('M5,7.4 Q4.4,12 9,12 Q13.6,12 13,7.4 Z', IRON, sw=0.4), ell(9, 7.4, 4.2, 1.2, TEAL_L, sw=0.35), circ(7.4, 5, 0.7, TEAL_L, stroke=None), circ(10.6, 4, 0.5, TEAL_L, stroke=None)])


@sprite('frame-gato')
def _fr2(): return frame_art([rect(2.4, 2.4, 13.2, 11.2, PLUM, r=0.8, sw=0.4), path('M5.4,12.6 V7.6 L5,4.6 L7.4,6.2 H10.6 L13,4.6 L12.6,7.6 V12.6 Z', GOLD, sw=0.4), circ(7.6, 8.6, 0.6, INK, stroke=None), circ(10.4, 8.6, 0.6, INK, stroke=None)])


@sprite('frame-mapa')
def _fr3(): return frame_art([rect(2.4, 2.4, 13.2, 11.2, CREAM, r=0.8, sw=0.4), path('M4,10 Q7,5 9,8 T14,5', None, stroke=RED, sw=0.6, extra='stroke-dasharray="1 0.8"'), ell(6, 6, 1.8, 1.2, LEAF, stroke=None), ell(12, 10.6, 2, 1.3, BLUE, stroke=None)])


@sprite('frame-amizade')
def _fr4(): return frame_art([rect(2.4, 2.4, 13.2, 11.2, '#ffd9e2', r=0.8, sw=0.4), g(_heart(), 'translate(4.6 4.4) scale(1.25)')])


@sprite('frame-neve')
def _fr5(): return frame_art([rect(2.4, 2.4, 13.2, 11.2, NAVY, r=0.8, sw=0.4), path('M2.6,13.4 L7,8 L10,11 L12.4,9 L15.4,13.4 Z', WHITE, stroke=None), circ(5, 4.6, 0.5, WHITE, stroke=None), circ(11, 5.6, 0.5, WHITE, stroke=None), circ(8, 3.6, 0.4, WHITE, stroke=None)])


@sprite('lamp-lua')
def _lamp1(): return [line(6, 0, 6, 12, sw=0.6), path('M8.6,13 A6,6 0 1 0 8.6,24.4 A4.6,4.6 0 1 1 8.6,13 Z', GOLD_L, sw=0.55)]


@sprite('lamp-cristal')
def _lamp2():
    o = [line(7, 0, 7, 8, sw=0.6), rect(1.6, 8, 10.8, 2.4, PLUM_D, r=1, sw=0.45)]
    for i, (h, c) in enumerate(((12, TEAL_L), (15, PLUM_LL), (11, SKY_L), (14, ROSE))):
        x = 2.4 + i * 2.5
        o.append(path(f'M{x},{10.4} h2 v{h-2.4} l-1,2.4 l-1,-2.4 Z', c, sw=0.35))
    return o


@sprite('lamp-abobora')
def _lamp3(): return [line(7, 0, 7, 12, sw=0.6), rect(6.2, 11.6, 1.6, 2.6, LEAF_D, r=0.5, sw=0.35), ell(7, 19.6, 6.2, 5.6, '#ff9a3c', sw=0.55), path('M3.6,18 l2,1.4 h-2.4 Z M10.4,18 l-2,1.4 h2.4 Z M4,21.6 Q7,24.4 10,21.6 Q7,23 4,21.6 Z', GOLD_L, stroke=None)]


@sprite('lamp-sol')
def _lamp4():
    o = [line(8, 0, 8, 11, sw=0.6)]
    for a in range(0, 360, 45):
        o.append(line(8 + math.cos(math.radians(a)) * 5, 18 + math.sin(math.radians(a)) * 5, 8 + math.cos(math.radians(a)) * 7.4, 18 + math.sin(math.radians(a)) * 7.4, stroke=GOLD_D, sw=1.1))
    return o + [circ(8, 18, 4.6, GOLD, sw=0.55), circ(6.8, 16.8, 1.2, GOLD_L, stroke=None)]


@sprite('plant-cogumelos')
def _pl1():
    o = pot(2, 14, 12, 7.6, CORAL, CORAL_D)
    for x, h, c in ((5, 7, RED), (10, 10, BLUE), (7.6, 4.6, GOLD)):
        o += [rect(x - 0.7, 14.6 - h + 2, 1.4, h - 2, CREAM, r=0.5, sw=0.35), path(f'M{x-2.6},{14.6-h+2.4} Q{x},{14.6-h-2} {x+2.6},{14.6-h+2.4} Z', c, sw=0.4)]
    return o


@sprite('plant-cacto')
def _pl2():
    o = [rect(5.6, 3, 4.8, 12, LEAF, r=2.4, sw=0.5), path('M5.6,10 H3.6 V6.6', None, stroke=OUT, sw=2.6), path('M5.6,10 H3.6 V6.6', None, stroke=LEAF, sw=1.6),
         path('M10.4,12 H12.6 V8.4', None, stroke=OUT, sw=2.6), path('M10.4,12 H12.6 V8.4', None, stroke=LEAF, sw=1.6), circ(8, 2.8, 1.5, ROSE, sw=0.4)]
    return o + pot(2.6, 14, 10.8, 7.6, GOLD, GOLD_D)


@sprite('plant-flores')
def _pl3():
    o = []
    for x, h, c in ((4.6, 9, ROSE), (9, 12, PLUM_L), (13.4, 8, GOLD)):
        o += [path(f'M9,14.4 Q{x},{14.4-h*0.5} {x},{14.4-h}', None, stroke=LEAF_D, sw=0.7), circ(x, 14.4 - h, 2.2, c, sw=0.4), circ(x, 14.4 - h, 0.8, GOLD_L, stroke=None)]
    return o + pot(3, 14, 12, 7.6, TEAL, TEAL_D)
