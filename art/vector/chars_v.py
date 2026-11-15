"""Personagens no visual vetorial: fregueses, equipe e bichos. Mesmas medidas dos quadros do pixel art."""
import math
from vsvg import *
from registry import sprite, variants, SPRITES

HAIR = {'ruivo': '#e0703a', 'castanho': '#8a5a3c', 'loiro': '#f4c95a', 'grisalho': '#d9d6e2', 'preto': '#3d3350', 'lilas': '#a98be8'}


def face(cx, hy, closed=False, mouth='smile', look=0, blush=True):
    o = []
    if blush:
        o += [ell(cx - 3.9, hy + 2.5, 1.5, 0.95, '#ff8fa3', stroke=None, extra='opacity="0.65"'),
              ell(cx + 3.9, hy + 2.5, 1.5, 0.95, '#ff8fa3', stroke=None, extra='opacity="0.65"')]
    for sx in (-2.3, 2.3):
        if closed == 'happy':
            o.append(path(f'M{cx+sx-1.1},{hy+1.5} q1.1,-1.7 2.2,0', None, stroke=INK, sw=0.65))
        elif closed:
            o.append(path(f'M{cx+sx-1},{hy+1} q1,0.9 2,0', None, stroke=INK, sw=0.55))
        else:
            o.append(ell(cx + sx + look, hy + 0.9, 0.85, 1.15, INK, stroke=None))
            o.append(circ(cx + sx + look + 0.3, hy + 0.5, 0.32, WHITE, stroke=None))
    if mouth == 'smile':
        o.append(path(f'M{cx-1.1},{hy+3.1} q1.1,1 2.2,0', None, stroke=INK, sw=0.5))
    elif mouth == 'o':
        o.append(ell(cx, hy + 3.4, 0.7, 0.8, '#b0485a', stroke=None))
    elif mouth == 'flat':
        o.append(line(cx - 0.9, hy + 3.4, cx + 0.9, hy + 3.4, stroke=INK, sw=0.5))
    return o


def hair_cap(cx, hy, col, style='short'):
    o = []
    if style in ('long', 'pony'):
        o.append(path(f'M{cx-6.5},{hy-1} Q{cx-8},{hy+5} {cx-5.6},{hy+7.6} L{cx-4},{hy+3} Z M{cx+6.5},{hy-1} Q{cx+8},{hy+5} {cx+5.6},{hy+7.6} L{cx+4},{hy+3} Z', col, sw=0.5))
    if style == 'pony':
        o.append(ell(cx + 6.8, hy - 3.6, 2.4, 2.8, col, sw=0.5))
    if style == 'spiky':
        o.append(path(f'M{cx-6.4},{hy} Q{cx-8},{hy-5} {cx-5},{hy-6.4} L{cx-4.4},{hy-9} L{cx-2},{hy-7} L{cx},{hy-9.8} L{cx+2},{hy-7} L{cx+4.6},{hy-9} L{cx+5},{hy-6.4} Q{cx+8},{hy-5} {cx+6.4},{hy} '
                      f'Q{cx+4},{hy-3.4} {cx+1},{hy-2.6} Q{cx-3},{hy-3.6} {cx-6.4},{hy} Z', col, sw=0.5))
    else:
        o.append(path(f'M{cx-6.5},{hy+0.6} Q{cx-7.4},{hy-7.2} {cx},{hy-7} Q{cx+7.4},{hy-7.2} {cx+6.5},{hy+0.6} '
                      f'Q{cx+4.6},{hy-3} {cx+1},{hy-2.8} Q{cx-3.4},{hy-3} {cx-6.5},{hy+0.6} Z', col, sw=0.5))
    return o


def wizard_hat(cx, hy, col=PLUM, band=GOLD, stars=True, tip=2.4, tall=10.5):
    by = hy - 4.4
    o = [ell(cx, by, 8.2, 2.1, col, sw=0.55)]
    o.append(path(f'M{cx-5.2},{by-0.2} Q{cx-2},{by-tall*0.6} {cx+tip},{by-tall} Q{cx+4},{by-tall*0.45} {cx+5.2},{by-0.2} Q{cx},{by+1.6} {cx-5.2},{by-0.2} Z', col, sw=0.55))
    o.append(path(f'M{cx-5},{by-0.9} Q{cx},{by+1} {cx+5},{by-0.9}', None, stroke=band, sw=1.2))
    if stars:
        o += [star(cx - 0.6, by - tall * 0.42, 1.1, GOLD_L), circ(cx + 2.2, by - tall * 0.66, 0.45, GOLD_L, stroke=None)]
    return o


def brim_hat(cx, hy, col=WOOD_D, band=CORAL, crown_h=4.6, brim=8.6):
    by = hy - 4.2
    return [ell(cx, by, brim, 1.9, col, sw=0.55), rect(cx - 4.6, by - crown_h, 9.2, crown_h + 0.6, col, r=2.2, sw=0.55),
            rect(cx - 4.6, by - 2, 9.2, 1.5, band, stroke=None)]


def crown_hat(cx, hy):
    by = hy - 5.2
    return [path(f'M{cx-4.8},{by} L{cx-5.2},{by-5} L{cx-2.4},{by-2.6} L{cx},{by-6} L{cx+2.4},{by-2.6} L{cx+5.2},{by-5} L{cx+4.8},{by} Z', GOLD, sw=0.55),
            circ(cx, by - 1.6, 0.9, RED, sw=0.3), circ(cx - 3, by - 1.2, 0.55, TEAL_L, stroke=None), circ(cx + 3, by - 1.2, 0.55, TEAL_L, stroke=None)]


def chibi(w, h, *, cx=None, skin=0, hair=None, hair_style='short', hat=None, robe=PLUM, trim=None, legs='#5a4a6a', step=0,
          closed=False, mouth='smile', beard=None, back=None, front=None, body_extra=None, hood=None, arm_r=None, arm_l=None,
          bob=0.0, look=0, head_dy=0.0, hr=6.2, body_w=5.6):
    """Bonequinho de cabeça grande. step: 0 parado, 1 e 2 caminhando. back/front/body_extra: funções (cx, hy, bt, bb) → formas."""
    cx = w / 2 if cx is None else cx
    fy = h - 0.6                      # sola dos pés
    lift = 0.5 if step else 0.0
    bb = fy - 3.2                     # barra da roupa
    bt = bb - 11.4 - bob - lift       # ombros
    hy = bt - hr + 2.2 + head_dy      # centro da cabeça
    sk = SKIN[skin]
    o = []
    if back:
        o += back(cx, hy, bt, bb)
    # pés
    lf, rf = (0, 0), (0, 0)
    if step == 1: lf = (-0.9, -1.3)
    if step == 2: rf = (0.9, -1.3)
    o += [rect(cx - 4.6 + lf[0], fy - 2.9 + lf[1], 3.9, 2.9, legs, r=1.3, sw=0.5), rect(cx + 0.7 + rf[0], fy - 2.9 + rf[1], 3.9, 2.9, legs, r=1.3, sw=0.5)]
    # corpo
    o.append(path(f'M{cx-3.5},{bt} L{cx+3.5},{bt} Q{cx+body_w+0.6},{bb-3.4} {cx+body_w},{bb} Q{cx},{bb+1.5} {cx-body_w},{bb} Q{cx-body_w-0.6},{bb-3.4} {cx-3.5},{bt} Z', robe, sw=0.6))
    if trim:
        o.append(path(f'M{cx-body_w+0.3},{bb-1.5} Q{cx},{bb} {cx+body_w-0.3},{bb-1.5}', None, stroke=trim, sw=1.1))
    if body_extra:
        o += body_extra(cx, hy, bt, bb)
    # braços (ombro → mão)
    for side, custom in ((-1, arm_l), (1, arm_r)):
        sx, sy = cx + side * 3.6, bt + 1.8
        hx, hyy = custom if custom else (cx + side * 5.9, bt + 7)
        o.append(line(sx, sy, hx, hyy, stroke=OUT, sw=3.1))
        o.append(line(sx, sy, hx, hyy, stroke=robe, sw=2))
        o.append(circ(hx, hyy, 1.25, sk, sw=0.45))
    # cabeça
    if hood:
        o.append(path(f'M{cx-7.4},{hy+5} Q{cx-8.4},{hy-8.4} {cx},{hy-8} Q{cx+8.4},{hy-8.4} {cx+7.4},{hy+5} Q{cx},{hy+8} {cx-7.4},{hy+5} Z', hood, sw=0.55))
    o.append(ell(cx, hy, hr, hr - 0.4, sk, sw=0.55))
    o += face(cx, hy, closed, mouth, look)
    if beard:
        o.append(path(f'M{cx-5},{hy+2} Q{cx-5},{hy+9} {cx},{hy+10.4} Q{cx+5},{hy+9} {cx+5},{hy+2} Q{cx+2.4},{hy+4.6} {cx},{hy+3.2} Q{cx-2.4},{hy+4.6} {cx-5},{hy+2} Z', beard, sw=0.5))
    if hair and not hood:
        o += hair_cap(cx, hy, HAIR.get(hair, hair), hair_style)
    if hood:
        o.append(path(f'M{cx-6.4},{hy+0.4} Q{cx-6.6},{hy-6.6} {cx},{hy-6.6} Q{cx+6.6},{hy-6.6} {cx+6.4},{hy+0.4} Q{cx+4},{hy-4.4} {cx},{hy-4.4} Q{cx-4},{hy-4.4} {cx-6.4},{hy+0.4} Z', hood, stroke=None))
    if hat:
        o += hat(cx, hy)
    if front:
        o += front(cx, hy, bt, bb)
    return o


# ------------------------------------------------------------------ fregueses (18×40, 3 quadros)
def _scarf(col):
    return lambda cx, hy, bt, bb: [path(f'M{cx-3.8},{bt+0.4} Q{cx},{bt+3} {cx+3.8},{bt+0.4} L{cx+2},{bt+4.6} L{cx},{bt+2.4} Z', col, sw=0.45)]


def _belt(col=GOLD):
    return lambda cx, hy, bt, bb: [path(f'M{cx-4.9},{bt+7} Q{cx},{bt+8.4} {cx+4.9},{bt+7}', None, stroke=WOOD_DD, sw=1.3), rect(cx - 1, bt + 6.8, 2, 1.8, col, r=0.4, sw=0.3)]


@variants('customer-aventureiro-{}', range(3))
def aventureiro(f):
    back = lambda cx, hy, bt, bb: [rect(cx - 7.6, bt + 0.6, 5, 8, '#e9c79a', r=1.6, sw=0.5)]
    extra = lambda cx, hy, bt, bb: _scarf(RED)(cx, hy, bt, bb) + _belt()(cx, hy, bt, bb)
    return chibi(18, 40, hair='ruivo', hair_style='pony', robe='#a8693f', legs='#4a3a4f', step=f, back=back, body_extra=extra)


@variants('customer-estudioso-{}', range(3))
def estudioso(f):
    def extra(cx, hy, bt, bb):
        return [star(cx - 2, bt + 6, 0.9, GOLD_L), star(cx + 1.6, bt + 9, 0.8, GOLD_L)] + _belt()(cx, hy, bt, bb)
    front = lambda cx, hy, bt, bb: [rect(cx + 3.4, bt + 4.6, 4.4, 5.6, RED, r=0.8, sw=0.45), line(cx + 4.4, bt + 4.8, cx + 4.4, bt + 10, stroke=GOLD_L, sw=0.5)]
    return chibi(18, 40, skin=1, robe=PLUM, trim=GOLD, legs=PLUM_D, step=f, beard='#d9d6e2', mouth=None, hat=lambda cx, hy: wizard_hat(cx, hy, PLUM, GOLD),
                 body_extra=extra, front=front, arm_r=(13.6, 31))


@variants('customer-morador-{}', range(3))
def morador(f):
    def front(cx, hy, bt, bb):
        return [rect(cx - 5.6, bt + 4.4, 8.4, 7, CREAM, r=1, sw=0.5), rect(cx + 1.6, bt + 5.4, 6, 5.4, WOOD_L, r=0.8, sw=0.45), rect(cx + 2.6, bt + 4.2, 3.4, 2, GOLD, r=0.8, sw=0.35)]
    return chibi(18, 40, skin=2, robe=LEAF_D, legs='#6a4a3a', step=f, hood='#4aa860', front=front)


@variants('customer-viajante-{}', range(3))
def viajante(f):
    def back(cx, hy, bt, bb):
        return [line(cx + 7.6, hy - 6, cx + 7.6, 39, stroke=OUT, sw=1.7), line(cx + 7.6, hy - 6, cx + 7.6, 39, stroke=WOOD, sw=0.9),
                poly([(cx + 7.6, hy - 9.4), (cx + 9, hy - 7), (cx + 7.6, hy - 4.8), (cx + 6.2, hy - 7)], TEAL_L, sw=0.4)]
    return chibi(18, 40, cx=8.2, hair='ruivo', robe=TEAL_D, trim=TEAL_L, legs='#5a4a3a', step=f, back=back,
                 hat=lambda cx, hy: brim_hat(cx, hy, WOOD, CORAL), arm_r=(15.6, 29))


@variants('customer-nobre-{}', range(3))
def nobre(f):
    def extra(cx, hy, bt, bb):
        return [path(f'M{cx-4.6},{bt-0.2} Q{cx},{bt+3.6} {cx+4.6},{bt-0.2} L{cx+4.2},{bt+2.6} Q{cx},{bt+5.6} {cx-4.2},{bt+2.6} Z', WHITE, sw=0.45),
                circ(cx - 2, bt + 2.4, 0.4, INK, stroke=None), circ(cx + 2, bt + 2.4, 0.4, INK, stroke=None),
                path(f'M{cx-1.6},{bt+5.4} L{cx},{bt+7.6} L{cx+1.6},{bt+5.4}', None, stroke=GOLD, sw=0.7), circ(cx, bt + 8.2, 0.9, GOLD, sw=0.3)]
    return chibi(18, 40, hair='loiro', hair_style='long', robe='#d4455a', trim=GOLD, legs='#6a2f45', step=f, body_extra=extra, hat=crown_hat)


# ------------------------------------------------------------------ equipe
def _apron(col=CREAM):
    return lambda cx, hy, bt, bb: [path(f'M{cx-2.8},{bt+2} H{cx+2.8} L{cx+3.6},{bb-0.6} Q{cx},{bb+0.6} {cx-3.6},{bb-0.6} Z', col, sw=0.45),
                                   star(cx, bt + 6.4, 1.1, PLUM_L), circ(cx + 1.2, bt + 8.6, 0.5, TEAL, stroke=None)]


def _staff(x, y0, y1, ang=0, px=None):
    body = [line(x, y0, x, y1, stroke=OUT, sw=1.9), line(x, y0, x, y1, stroke=WOOD_L, sw=1.1), rect(x - 1.4, y0 - 2, 2.8, 4.4, WOOD, r=1, sw=0.45)]
    return [g(body, f'rotate({ang} {x if px is None else px} {y1})')]


def apprentice(mode, f=0):
    kw = dict(cx=11, hair='ruivo', hair_style='spiky', robe='#b5533c', legs='#4a3a4f', body_extra=_apron())
    if mode == 'idle':
        return chibi(22, 34, bob=0.5 * f, back=lambda cx, hy, bt, bb: _staff(19, 9 - 0.5 * f, 33), arm_r=(18.4, 23 - 0.5 * f), **kw)
    if mode == 'stir':
        ang = (-14, 0, 14)[f]
        hand = (15.2 + f * 1.4, 22.6)
        return chibi(22, 34, front=lambda cx, hy, bt, bb: _staff(16.6, 8, 33, ang), arm_r=hand, arm_l=(13 + f * 1.2, 24), mouth='o', **kw)
    return chibi(22, 34, closed=True, mouth='flat', head_dy=1.4, back=lambda cx, hy, bt, bb: _staff(19, 9, 33), **kw)


SPRITES.update({'apprentice-idle-0': lambda: apprentice('idle', 0), 'apprentice-idle-1': lambda: apprentice('idle', 1),
                'apprentice-stir-0': lambda: apprentice('stir', 0), 'apprentice-stir-1': lambda: apprentice('stir', 1),
                'apprentice-stir-2': lambda: apprentice('stir', 2), 'apprentice-nap': lambda: apprentice('nap')})


def golem(mode, f=0):
    """Golem balconista (26×34): pedra com musgo e avental de barro."""
    dy = -0.5 * f if mode == 'idle' else 0
    nap = mode == 'nap'
    o = []
    # pernas
    o += [rect(5.6, 27.4, 6, 6, '#b5533c', r=1.6, sw=0.55), rect(14.4, 27.4, 6, 6, '#b5533c', r=1.6, sw=0.55)]
    # braços
    ly = 17 + dy
    o += [rect(0.6, ly, 5.4, 9.4, '#c9603f', r=2.4, sw=0.55), rect(0.4, ly + 8, 5.8, 4.6, STONE_D, r=1.8, sw=0.5)]
    if mode == 'serve':
        o += [rect(20, 10, 5.4, 9.4, '#c9603f', r=2.4, sw=0.55), rect(19.8, 7, 5.8, 4.6, STONE_D, r=1.8, sw=0.5),
              rect(21.4, 1.6, 2.8, 5.6, CORAL, r=1.1, sw=0.4), rect(21.8, 0.6, 2, 1.6, WOOD_L, r=0.4, sw=0.3)]
    else:
        o += [rect(20, ly, 5.4, 9.4, '#c9603f', r=2.4, sw=0.55), rect(19.8, ly + 8, 5.8, 4.6, STONE_D, r=1.8, sw=0.5)]
    # tronco
    o.append(rect(4.4, 13.6 + dy, 17.2, 15.6, '#d9704a', r=3.4, sw=0.6))
    o += [path(f'M4.6,{16+dy} Q8,{13+dy} 11,{15.4+dy} Q9,{17.6+dy} 4.6,{17.4+dy} Z', LEAF, sw=0.4), path(f'M21.4,{16+dy} Q18,{13.4+dy} 15.6,{15.6+dy} Q18,{17.6+dy} 21.4,{17+dy} Z', LEAF_D, sw=0.4)]
    o += [star(13, 21.4 + dy, 2, TEAL_L, stroke=TEAL_D, sw=0.3), rect(7, 24.6 + dy, 3.6, 2, STONE_D, r=0.6, sw=0.35), rect(15.4, 24.6 + dy, 3.6, 2, STONE_D, r=0.6, sw=0.35)]
    # cabeça de pedra
    hy = (3.2 if nap else 1.6) + dy
    o.append(rect(6, hy, 14, 12, STONE_D if not nap else '#7a7590', r=2.6, sw=0.6))
    o.append(path(f'M6.4,{hy+2.6} Q8,{hy-1.4} 13,{hy-0.2} Q17,{hy-1.6} 19.6,{hy+2.4} Q16,{hy+3.4} 13,{hy+2} Q10,{hy+3.6} 6.4,{hy+2.6} Z', LEAF, sw=0.45))
    if nap:
        o += [path(f'M8.6,{hy+6.6} q1.2,0.9 2.4,0 M15,{hy+6.6} q1.2,0.9 2.4,0', None, stroke=INK, sw=0.6)]
    else:
        o += [rect(8.4, hy + 5, 3, 2.6, TEAL_L, r=0.8, sw=0.4), rect(14.6, hy + 5, 3, 2.6, TEAL_L, r=0.8, sw=0.4)]
    o.append(line(11.4, hy + 9.6, 14.6, hy + 9.6, stroke=INK, sw=0.55))
    return o


SPRITES.update({'golem-idle-0': lambda: golem('idle', 0), 'golem-idle-1': lambda: golem('idle', 1), 'golem-serve': lambda: golem('serve'), 'golem-nap': lambda: golem('nap')})


def bard(mode):
    f = 1 if mode == 1 else 0
    def hat(cx, hy):
        by = hy - 4.6
        return [ell(cx, by - 1, 7.4, 3, RED, sw=0.55), rect(cx - 5.6, by - 0.6, 11.2, 1.8, '#a8324a', r=0.9, sw=0.4),
                path(f'M{cx+4},{by-2.6} Q{cx+8},{by-7} {cx+9.4},{by-4}', None, stroke=GOLD, sw=1.1)]
    def front(cx, hy, bt, bb):
        # alaúde
        return [line(cx - 3, bt + 7.4, cx + 6.4, bt + 2.4 - f, stroke=OUT, sw=1.9), line(cx - 3, bt + 7.4, cx + 6.4, bt + 2.4 - f, stroke=WOOD_D, sw=1.1),
                ell(cx - 4.4, bt + 8.2, 3.8, 3.1, WOOD_L, sw=0.5), circ(cx - 4.4, bt + 8.2, 1, WOOD_DD, stroke=None)]
    return chibi(22, 34, cx=13.4, hair='castanho', hair_style='long', robe=PLUM, trim=GOLD, legs='#4a3a4f', hat=hat, front=front,
                 arm_l=(9.6, 26.4), arm_r=(18.6, 21.6 - f), closed=mode == 'nap', mouth='flat' if mode == 'nap' else 'o' if f else 'smile',
                 head_dy=1.2 if mode == 'nap' else 0)


SPRITES.update({'bard-0': lambda: bard(0), 'bard-1': lambda: bard(1), 'bard-nap': lambda: bard('nap')})


def peddler(mode):
    f = 1 if mode == 1 else 0
    def back(cx, hy, bt, bb):
        o = [rect(cx - 12, bt - 1, 8.6, 13.6, WOOD, r=2.4, sw=0.55), rect(cx - 12, bt + 5, 8.6, 2, WOOD_D, stroke=None)]
        for i, c in enumerate((RED, GOLD, BLUE)):
            o.append(rect(cx - 11.4 + i * 2.6, bt - 5 + (i % 2), 2, 4.6, c, r=0.8, sw=0.35))
        return o
    hat = lambda cx, hy: brim_hat(cx, hy, '#8a4a34', GOLD, crown_h=4.2, brim=7.2)
    return chibi(22, 32, cx=13.4, skin=3, robe=LEAF_D, legs='#4a3a4f', hat=hat, back=back, beard='#5a3a2c', mouth=None, body_extra=_belt(),
                 bob=0.5 * f, closed=mode == 'nap', head_dy=1.2 if mode == 'nap' else 0)


SPRITES.update({'peddler-0': lambda: peddler(0), 'peddler-1': lambda: peddler(1), 'peddler-nap': lambda: peddler('nap')})


def explorer(mode):
    f = 1 if mode == 1 else 0
    def back(cx, hy, bt, bb):
        return [rect(cx + 2.4, bt, 7.6, 10.4, LEAF_D, r=2.2, sw=0.55), rect(cx + 2.4, bt + 4.6, 7.6, 1.6, '#2f7a45', stroke=None)]
    def front(cx, hy, bt, bb):
        return [rect(cx - 8.4, bt + 6, 3.2, 4, GOLD_L, r=1, sw=0.4), rect(cx - 8, bt + 5, 2.4, 1.2, IRON_D, r=0.4, stroke=None)]
    hat = lambda cx, hy: brim_hat(cx, hy, '#c9a36a', '#8a6a44', crown_h=4, brim=7.6)
    return chibi(20, 32, cx=9.4, hair='castanho', hair_style='long', robe='#e3c48d', legs='#8a6a44', hat=hat, back=back, front=front,
                 body_extra=_scarf(RED), arm_l=(2.8, 25.4 - 0.5 * f), bob=0.5 * f, closed=mode == 'nap', mouth='flat' if mode == 'nap' else 'smile',
                 head_dy=1.2 if mode == 'nap' else 0)


IRON_D = '#3f3263'
SPRITES.update({'explorer-0': lambda: explorer(0), 'explorer-1': lambda: explorer(1), 'explorer-nap': lambda: explorer('nap')})


def gnome(mode, f=0):
    """Gnomo jardineiro (22×23): chapéu vermelho, barba branca e regador."""
    cx, dy = 14, (-0.5 * f if mode == 'idle' else 0)
    nap = mode == 'nap'
    o = []
    # regador
    tilt = {'idle': 0, 'water': -18 - 8 * f, 'nap': 0}[mode]
    can = [rect(1.6, 13, 6.4, 5.6, COPPER, r=1.4, sw=0.5), path('M1.8,14.6 L-0.6,12.4', None, stroke=OUT, sw=1.8), path('M1.8,14.6 L-0.6,12.4', None, stroke=COPPER_L, sw=1),
           path('M8,14 q2.4,0.6 2,3.4', None, stroke=OUT, sw=0.6)]
    o.append(g(can, f'translate(1.4 {dy}) rotate({tilt} 6 16)'))
    if mode == 'water':
        for i in range(3):
            o.append(circ(1.4 + i * 0.4 - f, 18.6 + i * 1.5, 0.55, BLUE, stroke=None))
    o += [rect(cx - 4.4, 20.2, 3.8, 2.4, '#4a3a4f', r=1.1, sw=0.45), rect(cx + 0.6, 20.2, 3.8, 2.4, '#4a3a4f', r=1.1, sw=0.45)]
    o.append(rect(cx - 5, 14 + dy, 10, 7.4, BLUE, r=2.6, sw=0.55))
    o.append(line(cx - 3.6, 16.4 + dy, cx - 6.4, 16.6 + dy, stroke=OUT, sw=2.6)); o.append(line(cx - 3.6, 16.4 + dy, cx - 6.4, 16.6 + dy, stroke=BLUE, sw=1.6))
    hy = 11.6 + dy + (0.8 if nap else 0)
    o.append(ell(cx, hy, 4.6, 4, SKIN[0], sw=0.5))
    o.append(path(f'M{cx-4.4},{hy+0.6} Q{cx-4.6},{hy+7.4} {cx},{hy+8.4} Q{cx+4.6},{hy+7.4} {cx+4.4},{hy+0.6} Q{cx+2},{hy+3} {cx},{hy+1.8} Q{cx-2},{hy+3} {cx-4.4},{hy+0.6} Z', WHITE, sw=0.5))
    if nap:
        o.append(path(f'M{cx-2.8},{hy-0.4} q0.9,0.7 1.8,0 M{cx+1},{hy-0.4} q0.9,0.7 1.8,0', None, stroke=INK, sw=0.5))
    else:
        o += [circ(cx - 1.9, hy - 0.4, 0.7, INK, stroke=None), circ(cx + 1.9, hy - 0.4, 0.7, INK, stroke=None)]
    o.append(circ(cx, hy + 1, 1, '#ffb59a', sw=0.35))
    o.append(path(f'M{cx-5},{hy-2.2} Q{cx-2},{hy-8} {cx+0.6},{hy-11.4+ (1 if nap else 0)} Q{cx+3},{hy-7} {cx+5},{hy-2.2} Q{cx},{hy-0.6} {cx-5},{hy-2.2} Z', RED, sw=0.55))
    return o


COPPER = '#d9824a'; COPPER_L = '#f4b27c'
SPRITES.update({'gnome-idle-0': lambda: gnome('idle', 0), 'gnome-idle-1': lambda: gnome('idle', 1), 'gnome-water-0': lambda: gnome('water', 0),
                'gnome-water-1': lambda: gnome('water', 1), 'gnome-nap': lambda: gnome('nap')})


def owl(mode):
    """Coruja contadora (16×19) de chapéu de bruxa."""
    cx = 8
    o = [ell(cx, 12.6, 6.6, 6, '#a8714a', sw=0.55), ell(cx, 14.4, 4.2, 3.8, '#f1d9b0', sw=0.4)]
    for i in range(3):
        o.append(path(f'M{cx-2.4+i*1.6},{14+ (i%2)*1.2} q0.8,0.9 1.6,0', None, stroke='#c9a36a', sw=0.45))
    o += [path(f'M{cx-6.4},{11} Q{cx-7.6},{15} {cx-5.4},{17}', None, stroke='#8a5a3c', sw=1.4), path(f'M{cx+6.4},{11} Q{cx+7.6},{15} {cx+5.4},{17}', None, stroke='#8a5a3c', sw=1.4)]
    for sx in (-2.7, 2.7):
        if mode == 'nap':
            o.append(path(f'M{cx+sx-1.5},{9.8} q1.5,1.2 3,0', None, stroke=INK, sw=0.6))
        else:
            o.append(circ(cx + sx, 9.6, 2.3, GOLD_L, sw=0.45))
            o.append(circ(cx + sx + (0.5 * (1 if sx < 0 else -1) if mode == 1 else 0), 9.6 - (0.8 if mode == 'think' else 0), 1, INK, stroke=None))
    o.append(poly([(cx - 1, 11.4), (cx + 1, 11.4), (cx, 13)], GOLD_D, sw=0.35))
    o += [rect(cx - 3.6, 17.8, 2.4, 1, GOLD_D, r=0.5, stroke=None), rect(cx + 1.2, 17.8, 2.4, 1, GOLD_D, r=0.5, stroke=None)]
    o += wizard_hat(cx, 10.6, PLUM, GOLD, stars=False, tip=1.4, tall=6)
    return o


SPRITES.update({'owl-0': lambda: owl(0), 'owl-1': lambda: owl(1), 'owl-think': lambda: owl('think'), 'owl-nap': lambda: owl('nap')})


def fairy(mode):
    """Fada contadora (16×16)."""
    f = 1 if mode == 1 else 0
    cx = 8
    wy = 6.4 - 1.2 * f
    o = [ell(cx - 4.6, wy, 3.4, 2.6 + f * 0.6, SKY_L, stroke=BLUE, sw=0.4, extra='opacity="0.9"'), ell(cx + 4.6, wy, 3.4, 2.6 + f * 0.6, SKY_L, stroke=BLUE, sw=0.4, extra='opacity="0.9"')]
    o += [rect(cx - 2.4, 13.2, 1.9, 2.2, '#5a4a6a', r=0.8, sw=0.4), rect(cx + 0.5, 13.2, 1.9, 2.2, '#5a4a6a', r=0.8, sw=0.4)]
    o.append(path(f'M{cx-2.2},8.4 H{cx+2.2} L{cx+3.4},13.6 Q{cx},14.8 {cx-3.4},13.6 Z', TEAL, sw=0.5))
    o.append(ell(cx, 5, 3.9, 3.6, SKIN[0], sw=0.5))
    if mode == 'nap':
        o.append(path(f'M{cx-2.4},5.6 q0.8,0.6 1.6,0 M{cx+0.8},5.6 q0.8,0.6 1.6,0', None, stroke=INK, sw=0.45))
    else:
        o += [circ(cx - 1.5, 5.6, 0.6, INK, stroke=None), circ(cx + 1.5, 5.6, 0.6, INK, stroke=None)]
    o.append(path(f'M{cx-4},5.4 Q{cx-4.6},0.6 {cx},0.8 Q{cx+4.6},0.6 {cx+4},5.4 Q{cx+2},2.8 {cx},3 Q{cx-2},2.8 {cx-4},5.4 Z', HAIR['lilas'], sw=0.45))
    # varinha com estrela
    o += [line(cx + 3.4, 11, cx + 6.4, 8.4 - f, stroke=WOOD_DD, sw=0.6), star(cx + 6.6, 8 - f, 1.5, GOLD)]
    return o


SPRITES.update({'fairy-0': lambda: fairy(0), 'fairy-1': lambda: fairy(1), 'fairy-nap': lambda: fairy('nap')})


def salamander(mode):
    """Salamandra do fogo (22×11)."""
    f = 1 if mode == 1 else 0
    o = [path(f'M2,7 Q0,{4-f*2} 3,{3-f} ', None, stroke=OUT, sw=2.4), path(f'M2,7 Q0,{4-f*2} 3,{3-f}', None, stroke='#ff8a3c', sw=1.4)]
    o += [rect(5.4, 8.4, 2.6, 2, '#e8642a', r=0.8, sw=0.4), rect(13, 8.4, 2.6, 2, '#e8642a', r=0.8, sw=0.4)]
    o.append(path('M2,7 Q3,4.6 9,4.6 H15 Q18.6,3 21,5.6 Q21.6,8.6 17,9 H5 Q2.4,9 2,7 Z', '#ff8a3c', sw=0.55))
    for i in range(3):
        o.append(circ(7 + i * 3, 6.6, 0.8, GOLD, stroke=None))
    if mode == 'nap':
        o.append(path('M17.4,5.8 q0.8,0.6 1.6,0', None, stroke=INK, sw=0.45))
    else:
        o.append(circ(18.2, 5.6, 0.7, INK, stroke=None))
    o.append(path(f'M10,4.8 q-0.6,-2.6 1,-4 q1.6,1.6 0.8,4 Z', GOLD, sw=0.35))
    return o


SPRITES.update({'salamander-0': lambda: salamander(0), 'salamander-1': lambda: salamander(1), 'salamander-nap': lambda: salamander('nap')})


def ghost(mode):
    """Fantasma gerente noturno (16×18) de touca azul e lanterna."""
    f = 1 if mode == 1 else 0
    cx, dy = 7.4, -0.6 * f
    o = [path(f'M{cx-5.6},{16.6+dy} V{8+dy} Q{cx-5.6},{2.4+dy} {cx},{2.4+dy} Q{cx+5.6},{2.4+dy} {cx+5.6},{8+dy} V{16.6+dy} L{cx+3.4},{15+dy} L{cx+1.2},{16.8+dy} L{cx-1.2},{15+dy} L{cx-3.4},{16.8+dy} Z', '#fbf7ff', sw=0.55)]
    o.append(path(f'M{cx-5.4},{5+dy} Q{cx-4},{0.4+dy} {cx+1},{0.8+dy} Q{cx+5},{1+dy} {cx+5.4},{5+dy} Q{cx},{3.4+dy} {cx-5.4},{5+dy} Z', BLUE, sw=0.5))
    o.append(circ(cx + 5.6, 2.4 + dy, 1.2, WHITE, sw=0.4))
    if mode == 'nap':
        o.append(path(f'M{cx-3.2},{8.4+dy} q1,0.8 2,0 M{cx+1.2},{8.4+dy} q1,0.8 2,0', None, stroke=INK, sw=0.5))
    else:
        o += [ell(cx - 2.2, 8.2 + dy, 0.8, 1.1, INK, stroke=None), ell(cx + 2.2, 8.2 + dy, 0.8, 1.1, INK, stroke=None)]
    o += [ell(cx - 3.6, 10.4 + dy, 1.2, 0.8, ROSE, stroke=None, extra='opacity="0.7"'), ell(cx + 3.6, 10.4 + dy, 1.2, 0.8, ROSE, stroke=None, extra='opacity="0.7"')]
    o += [rect(12.4, 10.4 + dy, 3, 4, GOLD_L if mode != 'nap' else '#c9b98a', r=0.9, sw=0.4), path(f'M12.6,{10.4+dy} q1.3,-2 2.6,0', None, stroke=OUT, sw=0.5)]
    return o


SPRITES.update({'ghost-0': lambda: ghost(0), 'ghost-1': lambda: ghost(1), 'ghost-nap': lambda: ghost('nap')})

RAVEN = '#3d3a5c'; RAVEN_L = '#5a6ab0'


def raven(f):
    """Corvo pousado (16×14): 0 parado, 1 cabeça virada, 2 bicando."""
    tilt = (0, -12, 16)[f]
    o = [rect(6, 12, 1.2, 1.8, GOLD_D, stroke=None), rect(9, 12, 1.2, 1.8, GOLD_D, stroke=None)]
    o.append(path('M2,10 Q1,6 6,5.4 Q11,5 12.4,8.6 Q12.6,12 8,12.4 Q4,12.6 0.6,13 Z', RAVEN, sw=0.55))
    o.append(path('M4,9.4 Q7,7 10.6,9 Q8,11.6 4,9.4 Z', RAVEN_L, sw=0.4))
    head = [circ(10.6, 4.6, 3.4, RAVEN, sw=0.55), poly([(13.4, 3.8), (16, 5), (13.4, 6)], GOLD, sw=0.4), circ(11.4, 4, 0.7, WHITE, stroke=None), circ(11.6, 4, 0.35, INK, stroke=None)]
    o.append(g(head, f'rotate({tilt} 10.6 6)'))
    return o


def raven_fly(f, carry=False):
    """Corvo voando (20×14, ou 20×20 com a trouxinha)."""
    up = f == 0
    o = [path('M4,8 Q10,5 15,7.6 Q11,10.6 4,8 Z', RAVEN, sw=0.5), circ(15.6, 6.6, 2.4, RAVEN, sw=0.5), poly([(17.6, 6), (19.8, 7), (17.6, 7.8)], GOLD, sw=0.35),
         circ(16.2, 6.2, 0.5, WHITE, stroke=None), path('M4.6,8 L0.6,9.6 L1.6,7.4 Z', RAVEN, sw=0.4)]
    if up:
        o.append(path('M7,7.6 Q5,1.4 11,0.8 Q12.6,4 12,7.4 Z', RAVEN_L, sw=0.5))
    else:
        o.append(path('M7,8 Q5.6,13.4 11.4,13 Q12.6,10.6 12,8 Z', RAVEN_L, sw=0.5))
    if carry:
        o += [line(10, 9.4, 10, 14.6, stroke=OUT, sw=0.5), rect(7, 14.4, 6, 4.6, '#e9c79a', r=1.2, sw=0.45), line(10, 14.4, 10, 19, stroke=RED, sw=0.6)]
    return o


SPRITES.update({'raven-0': lambda: raven(0), 'raven-1': lambda: raven(1), 'raven-2': lambda: raven(2), 'raven-fly-0': lambda: raven_fly(0), 'raven-fly-1': lambda: raven_fly(1),
                'raven-carry-0': lambda: raven_fly(0, True), 'raven-carry-1': lambda: raven_fly(1, True)})

CAT = '#f09a3e'; CAT_D = '#c9702a'


def cat_head(cx, cy, closed=False):
    o = [poly([(cx - 3.4, cy - 1.6), (cx - 2.8, cy - 4.8), (cx - 0.6, cy - 2.8)], CAT, sw=0.45), poly([(cx + 3.4, cy - 1.6), (cx + 2.8, cy - 4.8), (cx + 0.6, cy - 2.8)], CAT, sw=0.45),
         ell(cx, cy, 3.6, 3, CAT, sw=0.5)]
    if closed:
        o.append(path(f'M{cx-2.2},{cy} q0.8,0.6 1.6,0 M{cx+0.6},{cy} q0.8,0.6 1.6,0', None, stroke=INK, sw=0.45))
    else:
        o += [ell(cx - 1.4, cy - 0.2, 0.55, 0.8, '#3c7a3c', stroke=None), ell(cx + 1.4, cy - 0.2, 0.55, 0.8, '#3c7a3c', stroke=None)]
    o.append(poly([(cx - 0.5, cy + 0.9), (cx + 0.5, cy + 0.9), (cx, cy + 1.5)], ROSE, stroke=None))
    return o


@variants('cat-sit-{}', range(2))
def cat_sit(f):
    o = [path(f'M4,12.6 Q{0.6 - f},{11} {1.4 + f * 0.6},{7.4 - f}', None, stroke=OUT, sw=2.2), path(f'M4,12.6 Q{0.6 - f},{11} {1.4 + f * 0.6},{7.4 - f}', None, stroke=CAT, sw=1.3)]
    o.append(path('M4,13.4 Q3,7 8,6.6 Q12.6,7 12.4,13.4 Z', CAT, sw=0.5))
    o += [line(6, 9, 6, 10.6, stroke=CAT_D, sw=0.6), line(8, 8.6, 8, 10.2, stroke=CAT_D, sw=0.6), rect(8, 12.2, 2, 1.4, CREAM, r=0.6, sw=0.35), rect(10.6, 12.2, 2, 1.4, CREAM, r=0.6, sw=0.35)]
    return o + cat_head(10.6, 5.2)


@variants('cat-walk-{}', range(2))
def cat_walk(f):
    o = [path('M3,5 Q0.4,3 1,0.8', None, stroke=OUT, sw=2), path('M3,5 Q0.4,3 1,0.8', None, stroke=CAT, sw=1.1)]
    for i, x in enumerate((4, 6.6, 10, 12.4)):
        dy = -1 if (i + f) % 2 == 0 else 0
        o.append(rect(x, 7.4 + dy, 1.6, 2.4, CAT, r=0.7, sw=0.4))
    o.append(rect(2.6, 3.6, 11.6, 4.6, CAT, r=2.3, sw=0.5))
    o += [line(6, 3.9, 6, 5.4, stroke=CAT_D, sw=0.6), line(8.4, 3.9, 8.4, 5.4, stroke=CAT_D, sw=0.6)]
    return o + [g(cat_head(14.2, 4.6), 'translate(2.84 0.9) scale(0.8)')]


@sprite('cat-sleep')
def cat_sleep():
    o = [ell(8, 5, 7.2, 2.8, CAT, sw=0.5), path('M1.4,5.6 Q4,8 9,7.4', None, stroke=CAT_D, sw=1.1)]
    o += [line(6, 2.6, 6, 4, stroke=CAT_D, sw=0.6), line(8.4, 2.4, 8.4, 3.8, stroke=CAT_D, sw=0.6)]
    return o + [g(cat_head(12.4, 4.8, closed=True), 'translate(2.5 1) scale(0.8)')]


# ------------------------------------------------------------------ familiares (14×13, 2 quadros, comum e brilhante)
def _fam_eyes(cx, cy, d=1.7):
    return [circ(cx - d, cy, 0.65, INK, stroke=None), circ(cx + d, cy, 0.65, INK, stroke=None), circ(cx - d + 0.2, cy - 0.25, 0.22, WHITE, stroke=None), circ(cx + d + 0.2, cy - 0.25, 0.22, WHITE, stroke=None)]


def familiar(kind, f, shiny):
    dy = -0.7 * f
    sh = shiny
    o = []
    if kind == 'fadinha':
        c = GOLD_L if sh else ROSE
        o += [ell(3.6, 5.4 + dy - f, 2.8, 2.2, WHITE, stroke=c, sw=0.4, extra='opacity="0.9"'), ell(10.4, 5.4 + dy - f, 2.8, 2.2, WHITE, stroke=c, sw=0.4, extra='opacity="0.9"'),
              circ(7, 7 + dy, 3.4, c, sw=0.5)] + _fam_eyes(7, 7 + dy, 1.4)
    elif kind == 'slime':
        c = GOLD if sh else LEAF
        o += [path(f'M1.6,12 Q1,{5+dy} 7,{4.6+dy} Q13,{5+dy} 12.4,12 Z', c, sw=0.5), shine(3.4, 6.4 + dy, 1.4, 2.4, 0.6)] + _fam_eyes(7, 8.6 + dy)
        o.append(path(f'M6,{10+dy} q1,0.8 2,0', None, stroke=INK, sw=0.45))
    elif kind == 'dragaozinho':
        c, d = (GOLD, GOLD_D) if sh else (CORAL, CORAL_D)
        o += [path(f'M3,{8+dy} Q0.6,{4-f} 4.6,{4.6+dy} Z', d, sw=0.4), path(f'M3,12 Q1,{10+dy} 4,{9+dy}', None, stroke=OUT, sw=2), path(f'M3,12 Q1,{10+dy} 4,{9+dy}', None, stroke=c, sw=1.1),
              ell(6.6, 9.4 + dy, 3.6, 3, c, sw=0.5), circ(10, 5.6 + dy, 3, c, sw=0.5), poly([(9, 3.2 + dy), (9.6, 1.2 + dy), (10.6, 3)], GOLD_L, sw=0.3),
              circ(10.8, 5.2 + dy, 0.6, INK, stroke=None), rect(5, 11.6, 1.6, 1.2, d, r=0.5, stroke=None), rect(8, 11.6, 1.6, 1.2, d, r=0.5, stroke=None)]
    elif kind == 'vagalume':
        c = GOLD_L if sh else '#d6f56b'
        o += [ell(4.6, 5 + dy - f, 2.6, 1.8, WHITE, stroke=STONE_D, sw=0.35, extra='opacity="0.85"'), ell(9.4, 5 + dy - f, 2.6, 1.8, WHITE, stroke=STONE_D, sw=0.35, extra='opacity="0.85"'),
              ell(7, 8 + dy, 3, 2.4, '#5a4a6a', sw=0.5), circ(7, 10.4 + dy, 2, c, sw=0.45)] + _fam_eyes(7, 7.6 + dy, 1.2)
    elif kind == 'sapo-dourado':
        c = GOLD_L if sh else GOLD
        o += [ell(7, 9.4 + dy, 5.2, 3.2, c, sw=0.5), circ(4.4, 5.8 + dy, 1.9, c, sw=0.45), circ(9.6, 5.8 + dy, 1.9, c, sw=0.45), circ(4.4, 5.8 + dy, 0.7, INK, stroke=None), circ(9.6, 5.8 + dy, 0.7, INK, stroke=None),
              path(f'M4.6,{9.6+dy} q2.4,1.6 4.8,0', None, stroke=INK, sw=0.45), rect(1.6, 11.4, 2.6, 1.3, GOLD_D, r=0.6, stroke=None), rect(9.8, 11.4, 2.6, 1.3, GOLD_D, r=0.6, stroke=None)]
    elif kind == 'raposa-lua':
        c = GOLD_L if sh else '#b7c4f5'
        o += [path(f'M2.6,11 Q0,{7+dy} 3,{5+dy} Q4.6,{8+dy} 4.6,11 Z', c, sw=0.45), ell(7.4, 10 + dy, 3.6, 2.6, c, sw=0.5),
              poly([(6.2, 4.6 + dy), (6.6, 1.4 + dy), (8.6, 3.6 + dy)], c, sw=0.4), poly([(11.8, 4.6 + dy), (11.4, 1.4 + dy), (9.4, 3.6 + dy)], c, sw=0.4),
              ell(9, 6.2 + dy, 3.2, 2.7, c, sw=0.5)] + _fam_eyes(9, 6 + dy, 1.3) + [circ(9, 7.4 + dy, 0.4, INK, stroke=None)]
    elif kind == 'tartaruga-cristal':
        c = GOLD_L if sh else TEAL_L
        o += [circ(11.4, 8.6 + dy, 1.9, LEAF, sw=0.45), circ(11.9, 8.2 + dy, 0.45, INK, stroke=None), rect(3, 11, 2, 1.6, LEAF, r=0.6, sw=0.35), rect(8, 11, 2, 1.6, LEAF, r=0.6, sw=0.35),
              path(f'M1.6,11 Q2,{5+dy} 6.6,{5+dy} Q11,{5+dy} 11,11 Z', c, sw=0.5), poly([(4, 8.6 + dy), (6.4, 6 + dy), (8.8, 8.6 + dy)], WHITE, stroke=None, extra='opacity="0.6"')]
    else:  # cogumelinho
        c = GOLD if sh else RED
        o += [rect(4.6, 7.4 + dy, 4.8, 5, CREAM, r=1.8, sw=0.5)] + _fam_eyes(7, 9.6 + dy, 1.2)
        o += [path(f'M1.2,{8+dy} Q2,{2.4+dy} 7,{2.4+dy} Q12,{2.4+dy} 12.8,{8+dy} Q7,{9.4+dy} 1.2,{8+dy} Z', c, sw=0.5), circ(4.6, 5.6 + dy, 0.9, WHITE, stroke=None), circ(8.6, 4.4 + dy, 0.75, WHITE, stroke=None), circ(10.4, 6.6 + dy, 0.6, WHITE, stroke=None)]
    if sh:
        o += [star(1.8, 2.6, 1.3, WHITE), star(12.2, 1.8 + f, 1, WHITE)]
    return o


for _k in ('fadinha', 'slime', 'dragaozinho', 'vagalume', 'sapo-dourado', 'raposa-lua', 'tartaruga-cristal', 'cogumelinho'):
    for _f in (0, 1):
        SPRITES[f'fam-{_k}-{_f}'] = (lambda k, f: (lambda: familiar(k, f, False)))(_k, _f)
        SPRITES[f'fam-{_k}-shiny-{_f}'] = (lambda k, f: (lambda: familiar(k, f, True)))(_k, _f)


@sprite('egg')
def egg(): return [path('M3.5,0.6 Q6.4,3.4 6.4,5.4 Q6.4,7.6 3.5,7.6 Q0.6,7.6 0.6,5.4 Q0.6,3.4 3.5,0.6 Z', CREAM, sw=0.45), circ(2.6, 4.6, 0.6, PLUM_L, stroke=None), circ(4.6, 3.4, 0.5, TEAL, stroke=None)]


@sprite('egg-shine')
def egg_shine(): return [path('M3.5,0.6 Q6.4,3.4 6.4,5.4 Q6.4,7.6 3.5,7.6 Q0.6,7.6 0.6,5.4 Q0.6,3.4 3.5,0.6 Z', GOLD_L, sw=0.45), star(3.5, 4.6, 1.6, WHITE)]


@sprite('nest')
def nest(): return [path('M0.6,1.4 Q10,4.6 19.4,1.4 Q19,6.6 10,6.6 Q1,6.6 0.6,1.4 Z', WOOD, sw=0.5), path('M3,3.6 Q10,6 17,3.6 M5,5 Q10,6.4 15,5', None, stroke=WOOD_L, sw=0.5)]


# ------------------------------------------------------------------ momentos raros e chapéus
@variants('moment-estrela-{}', range(2))
def m_star(f):
    d, tr_ = lin([(0, GOLD_L, 0), (1, GOLD_L, 0.9)], 0, 0, 1, 0)
    return [path(f'M0.6,{6.6-f} L13,{4.4} L13,{5.6} Z', tr_, stroke=None), star(14.4, 4.6, 4 - f * 0.5, GOLD, stroke=OUT, sw=0.4, points=5, inner=0.48)], d


@variants('moment-dragao-{}', range(2))
def m_dragon(f):
    wy = 1.4 if f == 0 else 11
    o = [path(f'M9,8 Q11,{wy} 17,{wy+ (1.6 if f == 0 else -1.6)} Q15.4,7 14.4,8.4 Z', TEAL_D, sw=0.45),
         path('M3,9.6 Q0.6,8 1,5.4', None, stroke=OUT, sw=2), path('M3,9.6 Q0.6,8 1,5.4', None, stroke=TEAL, sw=1.1),
         path('M3,9 Q8,5.6 16,8 Q14,12.6 6,11.6 Q3.4,11 3,9 Z', TEAL, sw=0.5), circ(19.6, 7.4, 3.4, TEAL, sw=0.5),
         poly([(18.4, 4.6), (19, 2.2), (20.4, 4.4)], GOLD_L, sw=0.3), circ(20.6, 6.8, 0.7, INK, stroke=None), path('M22.4,8.4 q1.6,0.2 2.6,-0.8', None, stroke=CORAL, sw=0.8)]
    return o


@variants('moment-borboleta-{}', range(2))
def m_butterfly(f):
    w = 4.4 if f == 0 else 2.2
    return [ell(5.5 - w / 2 - 0.6, 3.4, w / 2 + 0.4, 2.8, ROSE, sw=0.4), ell(5.5 + w / 2 + 0.6, 3.4, w / 2 + 0.4, 2.8, ROSE, sw=0.4),
            ell(5.5 - w / 2 - 0.2, 6.6, w / 2, 1.8, PLUM_L, sw=0.4), ell(5.5 + w / 2 + 0.2, 6.6, w / 2, 1.8, PLUM_L, sw=0.4), rect(5, 1.6, 1, 6.4, INK, r=0.5, stroke=None)]


@sprite('hat-gorro')
def hat_gorro(): return [path('M1,7.4 Q1,1.6 5,1.6 Q9,1.6 9,7.4 Z', RED, sw=0.5), rect(0.4, 5.8, 9.2, 2, WHITE, r=1, sw=0.4), circ(5, 1.4, 1.2, WHITE, sw=0.35)]


@sprite('hat-bruxa')
def hat_bruxa(): return [ell(6, 7.4, 5.6, 1.4, PLUM_D, sw=0.45), path('M2.6,7.2 Q5,3 7.6,0.6 Q8.6,4 9.4,7.2 Q6,8.4 2.6,7.2 Z', PLUM_D, sw=0.45), path('M3,6.6 Q6,7.8 9.2,6.6', None, stroke=GOLD, sw=0.9)]


@sprite('hat-flores')
def hat_flores(): return [path('M0.6,3 Q5,4.4 9.4,3', None, stroke=LEAF_D, sw=0.9)] + [circ(1.6 + i * 2.3, 2.2 + (i % 2) * 0.5, 1.1, c, sw=0.3) for i, c in enumerate((ROSE, GOLD, PLUM_L, ROSE))]


@sprite('hat-cartola')
def hat_cartola(): return [rect(0.4, 7, 9.2, 1.6, INK, r=0.8, sw=0.4), rect(2, 0.6, 6, 7, INK, r=1, sw=0.4), rect(2, 5, 6, 1.4, RED, stroke=None)]


# ------------------------------------------------------------------ retratos (ícones 16×16 dos fregueses)
def _collar(col=WHITE):
    return lambda cx, hy, bt, bb: [path(f'M{cx-4.6},{bt-0.2} Q{cx},{bt+3.6} {cx+4.6},{bt-0.2} L{cx+4.2},{bt+2.6} Q{cx},{bt+5.6} {cx-4.2},{bt+2.6} Z', col, sw=0.45)]


def _tiara(cx, hy):
    return [path(f'M{cx-4.4},{hy-5.2} Q{cx},{hy-7.6} {cx+4.4},{hy-5.2}', None, stroke=GOLD, sw=1), poly([(cx, hy - 8.6), (cx + 1.2, hy - 6.6), (cx - 1.2, hy - 6.6)], TEAL_L, sw=0.3)]


PORTRAITS = {
    'aventureiro': dict(hair='ruivo', hair_style='pony', robe='#a8693f', body_extra=_scarf(RED)),
    'estudioso': dict(skin=1, robe=PLUM, beard='#d9d6e2', hat=lambda cx, hy: wizard_hat(cx, hy, PLUM, GOLD)),
    'morador': dict(skin=2, robe=LEAF_D, hood='#4aa860'),
    'viajante': dict(hair='ruivo', robe=TEAL_D, hat=lambda cx, hy: brim_hat(cx, hy, WOOD, CORAL)),
    'nobre': dict(hair='loiro', hair_style='long', robe='#d4455a', body_extra=_collar(), hat=crown_hat),
    'dona-celia': dict(skin=1, robe=PLUM, hood=PLUM_L),
    'bram': dict(skin=3, robe=WOOD_DD, beard='#3d3350', body_extra=_scarf(STONE_D)),
    'lia': dict(hair='ruivo', hair_style='long', robe=BLUE, hat=lambda cx, hy: wizard_hat(cx, hy, BLUE, GOLD)),
    'tobias': dict(skin=1, hair='castanho', robe=WOOD, hat=lambda cx, hy: brim_hat(cx, hy, CORAL_D, GOLD),
                   front=lambda cx, hy, bt, bb: [path(f'M{cx-2.6},{hy+2.9} Q{cx-1.2},{hy+1.9} {cx},{hy+2.8} Q{cx+1.2},{hy+1.9} {cx+2.6},{hy+2.9} Q{cx+1.2},{hy+3.7} {cx},{hy+3.1} Q{cx-1.2},{hy+3.7} {cx-2.6},{hy+2.9} Z', '#6a4028', sw=0.3)]),
    'vovo-ze': dict(skin=1, hair='grisalho', robe=LEAF_D, beard='#eeeaf4'),
    'condessa': dict(hair='loiro', hair_style='long', robe=PLUM, body_extra=_collar(), hat=_tiara),
}


def portrait(who, mood):
    spec = dict(PORTRAITS[who])
    bearded = bool(spec.get('beard'))
    mouth = None if bearded or mood == 'bravo' else 'smile' if mood == 'feliz' else 'flat'
    cx, hy = 9, 20.8
    body = chibi(18, 40, closed='happy' if mood == 'feliz' else False, mouth=mouth, **spec)
    if mood == 'bravo':
        body += [path(f'M{cx-3.6},{hy-1.6} L{cx-1.2},{hy-0.5} M{cx+3.6},{hy-1.6} L{cx+1.2},{hy-0.5}', None, stroke=INK, sw=0.7)]
        if not bearded:
            body.append(path(f'M{cx-1.2},{hy+3.9} q1.2,-1.1 2.4,0', None, stroke=INK, sw=0.55))
    s, ty = (0.78, 10.6) if spec.get('hat') else (0.9, 8.6)
    return [g(body, f'translate({8 - cx * s:.2f} {ty - hy * s:.2f}) scale({s})')]


for _who in PORTRAITS:
    for _mood in ('feliz', 'neutro', 'bravo'):
        SPRITES[f'icon:face-{_who}-{_mood}'] = (lambda w=_who, m=_mood: portrait(w, m))
