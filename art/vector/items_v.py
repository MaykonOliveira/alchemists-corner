"""Poções, partículas e enfeites de estação do visual vetorial.

As poções saem do próprio pixel art: a silhueta de cada frasco (largura linha a linha) vira uma curva suave
e as cores de cada linha viram um degradê, então cada receita mantém o formato e a cor que o jogador já conhece.
"""
import colorsys
from vsvg import *
from registry import sprite, SPRITES
from classic import classic_frames


def _hexc(c):
    return '#%02x%02x%02x' % tuple(int(max(0, min(255, v))) for v in c[:3])


def _vivid(c, s=1.12, v=1.14):
    h, sa, va = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
    r, g_, b = colorsys.hsv_to_rgb(h, min(1, sa * s), min(1, va * v + 0.03))
    return (r * 255, g_ * 255, b * 255)


def _smooth(pts):
    """Curva fechada suave (Catmull-Rom → Bézier) passando pelos pontos."""
    n = len(pts)
    d = f'M{pts[0][0]:.2f},{pts[0][1]:.2f}'
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        t = 5.0
        c1 = (p1[0] + (p2[0] - p0[0]) / t, p1[1] + (p2[1] - p0[1]) / t)
        c2 = (p2[0] - (p3[0] - p1[0]) / t, p2[1] - (p3[1] - p1[1]) / t)
        d += f' C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {p2[0]:.2f},{p2[1]:.2f}'
    return d + ' Z'


def potion_from(im):
    w, h = im.size
    px = im.load()
    rows = []
    for y in range(h):
        xs = [x for x in range(w) if px[x, y][3] > 128]
        if not xs:
            continue
        inner = [px[x, y] for x in xs if sum(px[x, y][:3]) > 150] or [px[x, y] for x in xs]
        col = tuple(sum(c[i] for c in inner) / len(inner) for i in range(3))
        rows.append((y, min(xs), max(xs) + 1, col))
    m = 0.35
    left = [(max(m, x0 + m * 0.6), y + 0.5) for y, x0, x1, c in rows]
    right = [(min(w - m, x1 - m * 0.6), y + 0.5) for y, x0, x1, c in rows]
    y0, y1 = rows[0][0], rows[-1][0] + 1
    top = [((rows[0][1] + rows[0][2]) / 2, y0 + m)]
    bot = [((rows[-1][1] + rows[-1][2]) / 2, y1 - m)]
    d = _smooth(top + right + bot + left[::-1])
    stops = [((y + 0.5 - y0) / (y1 - y0), _hexc(_vivid(c))) for y, x0, x1, c in rows]
    df, fill = lin(stops)
    # degradê em coordenadas do desenho, para as faixas baterem com as linhas do frasco
    df = df.replace('<linearGradient ', f'<linearGradient gradientUnits="userSpaceOnUse" ').replace('x1="0" y1="0" x2="0" y2="1"', f'x1="0" y1="{y0}" x2="0" y2="{y1}"')
    df = ''.join(df)
    # brilho no bojo (linha mais larga da metade de baixo)
    wide = max(rows[len(rows) // 3:], key=lambda r: r[2] - r[1])
    big = w > 10
    body = [path(d, fill, sw=0.7 if big else 0.55),
            ell(wide[1] + (3 if big else 1.7), wide[0] + 0.2, 0.9 if big else 0.55, 1.7 if big else 1.0, WHITE, stroke=None, extra='opacity="0.75"')]
    return body, df


def _register_potions():
    for name, im in classic_frames().items():
        if name.startswith('potion-') and not name.endswith('-outline') and name not in SPRITES:
            SPRITES[name] = (lambda im=im: potion_from(im))


_register_potions()


# ---------------------------------------------------------------- partículas e estações

@sprite('fx-snowflake')
def fx_snow(): return [circ(1.5, 1.5, 1.1, WHITE, stroke=None), circ(1.5, 1.5, 1.4, SKY_L, stroke=None, extra='opacity="0.5"')]


@sprite('fx-petal')
def fx_petal(): return [ell(1.5, 1, 1.35, 0.8, ROSE, stroke=None, extra='transform="rotate(-20 1.5 1)"'), ell(1.2, 0.8, 0.5, 0.3, WHITE, stroke=None, extra='opacity="0.6"')]


@sprite('fx-gold')
def fx_gold(): return [star(1.5, 1.5, 1.5, GOLD), circ(1.5, 1.5, 0.45, WHITE, stroke=None)]


def _bat(f):
    wy = 1.2 if f == 0 else 3.4
    return [path(f'M4.5,2.6 Q2.8,{wy - 1} 0.4,{wy} Q1.6,{wy + 0.9} 2.4,{wy + 0.5} Q3,{wy + 1.4} 4.5,3.6 Q6,{wy + 1.4} 6.6,{wy + 0.5} Q7.4,{wy + 0.9} 8.6,{wy} Q6.2,{wy - 1} 4.5,2.6 Z', PLUM_D, sw=0.35),
            ell(4.5, 2.9, 1.15, 1.35, INK, stroke=None), path('M3.7,1.9 L3.9,1 L4.3,1.8 M5.3,1.9 L5.1,1 L4.7,1.8', INK, stroke=INK, sw=0.2),
            circ(4.1, 2.7, 0.22, GOLD, stroke=None), circ(4.9, 2.7, 0.22, GOLD, stroke=None)]


SPRITES['fx-bat-0'] = lambda: _bat(0)
SPRITES['fx-bat-1'] = lambda: _bat(1)


@sprite('pumpkin')
def pumpkin():
    return [path('M6,3 Q6,1 7.6,0.6', None, stroke=LEAF_D, sw=1.1),
            ell(6.5, 6.2, 6, 3.6, '#ff9838', sw=0.5), ell(6.5, 6.2, 3.4, 3.5, '#ffad55', sw=0.35), ell(6.5, 6.2, 1.2, 3.4, '#ffc27a', stroke=None),
            poly([(3.6, 5.6), (5.2, 5.6), (4.4, 4.4)], INK, stroke=None), poly([(7.8, 5.6), (9.4, 5.6), (8.6, 4.4)], INK, stroke=None),
            path('M3.8,7.2 Q6.5,9 9.2,7.2 Q6.5,8 3.8,7.2 Z', INK, stroke=INK, sw=0.3)]


@sprite('blossom')
def blossom():
    b = [path('M0,2.6 Q10,5.4 20,3 Q32,0.8 44,3.4 Q54,5 64,2.2', None, stroke=WOOD_DD, sw=1.3),
         path('M12,3.8 Q13,7 15,8 M36,2.4 Q37,5.6 35,7.4 M52,4 Q53,6.6 55,7.6', None, stroke=WOOD_DD, sw=0.8)]
    spots = [(3, 2.4), (9, 4.6), (15, 8.6), (21, 3), (27, 1.8), (35, 8), (40, 3), (47, 4.2), (55, 8.2), (59, 3), (30, 11), (8, 11.4), (50, 12)]
    for i, (x, y) in enumerate(spots):
        r = 1.5 if i % 3 else 1.9
        b += [circ(x + dx * r * 0.6, y + dy * r * 0.6, r * 0.62, ROSE if i % 2 else '#ffc4d6', stroke=None) for dx, dy in ((0, -1), (1, -0.2), (0.6, 0.9), (-0.6, 0.9), (-1, -0.2))]
        b.append(circ(x, y, r * 0.32, GOLD_L, stroke=None))
    return b


@sprite('icicles')
def icicles():
    df, f = lin([(0, WHITE), (1, SKY)])
    b = [rect(0, 0, 64, 1.8, WHITE, r=0.9, stroke=None)]
    x = 0.6
    hs = [4.6, 2.6, 6.8, 3.4, 5.2, 2.2, 7.4, 4, 3, 6, 2.8, 5, 3.6, 6.6, 2.4, 4.4]
    for i, hh in enumerate(hs):
        b.append(path(f'M{x},1 Q{x + 0.3},{hh * 0.6} {x + 1.5},{hh} Q{x + 2.7},{hh * 0.6} {x + 3},1 Z', f, stroke=SKY, sw=0.25))
        x += 3.95
    return b, df


def _theme(bg0, bg1, inner):
    df, f = lin([(0, bg0), (1, bg1)])
    return [rect(0.5, 0.5, 23, 23, f, r=3.6, sw=0.7)] + inner + [rect(2, 2, 20, 5, WHITE, r=2.5, stroke=None, extra='opacity="0.12"')], df


@sprite('theme-inverno')
def theme_inverno():
    b = [line(12, 5, 12, 19, WHITE, 1), line(5, 12, 19, 12, WHITE, 1), line(7, 7, 17, 17, WHITE, 0.8), line(17, 7, 7, 17, WHITE, 0.8),
         circ(12, 12, 1.6, SKY_L, stroke=None), rect(0.9, 19.6, 22.2, 3.5, WHITE, r=1.6, stroke=None)]
    b += [circ(x, y, 0.6, WHITE, stroke=None) for x, y in ((5, 5), (19, 6), (6, 17), (18, 17))]
    return _theme('#5aa8f2', '#33407f', b)


@sprite('theme-bruxas')
def theme_bruxas():
    b = [circ(18, 6, 2.6, GOLD_L, stroke=None), circ(19.2, 5.2, 2.2, '#3b2a66', stroke=None),
         g(pumpkin(), 'translate(4.4 9.6) scale(1.15)')]
    return _theme('#4d3690', '#2b1d52', b)


@sprite('theme-cerejeira')
def theme_cerejeira():
    b = [path('M2,6 Q10,9 16,5 Q20,3 22,5', None, stroke=WOOD_DD, sw=1.1)]
    for i, (x, y) in enumerate(((5, 6.4), (11, 7), (17, 4.6), (8, 13), (16, 12), (12, 18), (5, 19), (19, 18))):
        b += [circ(x + dx, y + dy, 1.05, WHITE if i % 2 else '#ffe1ea', stroke=None) for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0))]
        b.append(circ(x, y, 0.55, GOLD, stroke=None))
    return _theme('#ffb7cb', '#f58aa8', b)


@sprite('theme-dourado')
def theme_dourado():
    return _theme('#ffc94d', '#e08a1c', [star(12, 12, 8, WHITE), star(12, 12, 4.4, GOLD_L), star(5.5, 6, 1.6, WHITE), star(18.5, 18, 1.8, WHITE)])
