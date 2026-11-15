"""Ícones da interface (16×16) do visual vetorial. Os registrados aqui são desenhados à mão;
poções, familiares e troféus reaproveitam os desenhos da cena; o resto sai do pixel art arredondado."""
from vsvg import *
from registry import sprite


@sprite('icon:ui-home')
def i_home():
    return [rect(3, 8, 10, 6.4, CREAM, r=1, sw=0.7), path('M1.2,8.6 L8,2 L14.8,8.6 Z', CORAL, sw=0.7),
            rect(6.6, 10, 2.8, 4.4, WOOD, r=1.2, sw=0.55), rect(10.6, 3.2, 1.8, 3, WOOD_D, r=0.4, sw=0.5)]


@sprite('icon:ui-cauldron')
def i_cauldron():
    return [path('M2.4,6.6 Q1.4,13.8 8,14 Q14.6,13.8 13.6,6.6 Z', '#5a4a78', sw=0.7), ell(8, 6.6, 6.2, 2, TEAL, sw=0.7),
            ell(6.4, 6.2, 1.6, 0.6, TEAL_L, stroke=None), circ(5, 3, 1, TEAL_L, sw=0.4), circ(9.4, 2, 1.4, TEAL_L, sw=0.4), circ(11.6, 4, 0.8, TEAL_L, sw=0.4),
            path('M4,9 Q4,12 6,12.6', None, stroke=WHITE, sw=0.7, extra='opacity="0.4"')]


@sprite('icon:ui-bell')
def i_bell():
    return [rect(1.4, 11.6, 13.2, 2.4, WOOD, r=1.2, sw=0.65), path('M2.8,11.6 Q2.8,5 8,5 Q13.2,5 13.2,11.6 Z', GOLD, sw=0.7),
            circ(8, 4, 1.3, GOLD_D, sw=0.55), path('M4.6,10 Q4.6,6.8 7.2,6.4', None, stroke=WHITE, sw=0.9, extra='opacity="0.7"')]


@sprite('icon:ui-target')
def i_target():
    return [circ(7.6, 8.6, 6, RED, sw=0.7), circ(7.6, 8.6, 4, WHITE, sw=0.4), circ(7.6, 8.6, 2.1, RED, sw=0.4),
            line(7.8, 8.4, 13.4, 2.8, WOOD_DD, 0.9), path('M12.2,2 L14.2,1.8 L14,3.8 L13,3 Z', GOLD, sw=0.4)]


@sprite('icon:ui-map')
def i_map():
    return [path('M1.6,3.6 L5.8,2.2 L10.2,3.6 L14.4,2.2 L14.4,12.4 L10.2,13.8 L5.8,12.4 L1.6,13.8 Z', CREAM, sw=0.7),
            path('M5.8,2.2 L5.8,12.4 M10.2,3.6 L10.2,13.8', None, stroke=CREAM_D, sw=0.6),
            path('M3.2,10.6 Q5,7 7.4,9 Q9.6,10.8 12.4,6', None, stroke=CORAL, sw=0.8, extra='stroke-dasharray="1.2 1"'),
            circ(12.4, 5.6, 1.1, RED, sw=0.4), circ(3.4, 6, 1.2, LEAF, stroke=None)]


@sprite('icon:ui-coin')
def i_coin():
    return [circ(8, 8, 6.2, GOLD_D, sw=0.7), circ(8, 7.4, 5.4, GOLD, stroke=None), circ(8, 7.4, 3.5, GOLD_L, stroke=GOLD_D, sw=0.5),
            path('M5,5.4 Q6,3.6 8,3.4', None, stroke=WHITE, sw=0.8, extra='opacity="0.8"')]


@sprite('icon:ui-star')
def i_star():
    return [star(8, 8.4, 7, GOLD, OUT, 0.7, points=5, inner=0.5), path('M5.4,7 Q6.4,5.4 7.6,5', None, stroke=WHITE, sw=0.8, extra='opacity="0.8"')]


@sprite('icon:ui-moon')
def i_moon():
    return [path('M10.6,1.8 A6.6,6.6 0 1 0 14.2,11.2 A5.4,5.4 0 0 1 10.6,1.8 Z', GOLD_L, sw=0.7), star(12.6, 4.6, 1.5, WHITE)]


@sprite('icon:ui-fire')
def i_fire():
    return [path('M8,1.4 Q13.6,6 12.8,10.2 Q12,14.4 8,14.4 Q4,14.4 3.2,10.2 Q2.8,7.4 5.4,5.4 Q5.6,7.4 6.8,7.6 Q6.4,4 8,1.4 Z', CORAL, sw=0.7),
            path('M8,7 Q10.8,9.6 10.2,11.6 Q9.6,13.6 8,13.6 Q6.4,13.6 5.8,11.6 Q5.6,10 7,9.4 Q7.4,8.4 8,7 Z', GOLD, stroke=None),
            ell(8, 12.2, 1.2, 1.2, GOLD_L, stroke=None)]


@sprite('icon:ui-gear')
def i_gear():
    import math
    teeth = [rect(7, 1, 2, 3.4, STONE_L, r=0.6, sw=0.6, extra=f'transform="rotate({a} 8 8)"') for a in range(0, 360, 45)]
    return teeth + [circ(8, 8, 4.8, STONE_L, sw=0.7), circ(8, 8, 1.9, '#5a4a6a', sw=0.5)]


@sprite('icon:ui-fast')
def i_fast():
    return [path('M2,3.4 L8,8 L2,12.6 Z', GOLD, sw=0.7), path('M8.4,3.4 L14.4,8 L8.4,12.6 Z', GOLD, sw=0.7)]


@sprite('icon:ui-heart')
def i_heart():
    return [path('M8,13.8 Q1.6,9.4 1.8,5.6 Q2,2.6 4.8,2.6 Q6.8,2.6 8,4.6 Q9.2,2.6 11.2,2.6 Q14,2.6 14.2,5.6 Q14.4,9.4 8,13.8 Z', RED, sw=0.7),
            path('M4,6.4 Q4,4.4 5.6,4.2', None, stroke=WHITE, sw=0.9, extra='opacity="0.7"')]


@sprite('icon:ui-check')
def i_check(): return [path('M2.4,8.6 L6.2,12.4 L13.8,3.8', None, stroke=OUT, sw=3.6), path('M2.4,8.6 L6.2,12.4 L13.8,3.8', None, stroke=LEAF, sw=2.2)]


@sprite('icon:ui-lock')
def i_lock():
    return [path('M4.8,7.6 L4.8,5.4 Q4.8,2.2 8,2.2 Q11.2,2.2 11.2,5.4 L11.2,7.6', None, stroke=OUT, sw=2.6), path('M4.8,7.6 L4.8,5.4 Q4.8,2.2 8,2.2 Q11.2,2.2 11.2,5.4 L11.2,7.6', None, stroke=STONE_L, sw=1.3),
            rect(2.6, 7.2, 10.8, 7, GOLD, r=1.8, sw=0.7), circ(8, 10.2, 1.2, OUT, stroke=None), rect(7.5, 10.4, 1, 2.2, OUT, r=0.4, stroke=None)]


@sprite('icon:ui-sparkle')
def i_sparkle(): return [star(6.6, 8.6, 6, GOLD, OUT, 0.65), star(12.4, 3.8, 2.8, GOLD_L, OUT, 0.5), circ(6.6, 8.6, 1.2, WHITE, stroke=None)]


@sprite('icon:ui-question')
def i_question():
    return [circ(8, 8, 6.4, PLUM_L, sw=0.7), path('M5.8,6.4 Q5.8,4 8,4 Q10.4,4 10.4,6 Q10.4,7.6 8,8.2 L8,9.4', None, stroke=WHITE, sw=1.5), circ(8, 11.6, 0.95, WHITE, stroke=None)]


def _face(col, mouth, brow=None, extra=None):
    o = [circ(8, 8, 6.4, col, sw=0.7), ell(5.6, 7, 0.8, 1.1, INK, stroke=None), ell(10.4, 7, 0.8, 1.1, INK, stroke=None),
         path(mouth, None, stroke=INK, sw=0.9), path('M4.2,5 Q5.6,3.4 7.4,3.4', None, stroke=WHITE, sw=0.8, extra='opacity="0.6"')]
    if brow:
        o.append(path(brow, None, stroke=INK, sw=0.8))
    return o + (extra or [])


@sprite('icon:ui-face-happy')
def i_fh(): return _face(GOLD, 'M5,9.8 Q8,12.6 11,9.8', extra=[circ(4, 9.4, 1, ROSE, stroke=None, extra='opacity="0.8"'), circ(12, 9.4, 1, ROSE, stroke=None, extra='opacity="0.8"')])


@sprite('icon:ui-face-meh')
def i_fm(): return _face(GOLD, 'M5.4,10.6 L10.6,10.6')


@sprite('icon:ui-face-angry')
def i_fa(): return _face(CORAL, 'M5.2,11.4 Q8,9.2 10.8,11.4', 'M4.2,4.8 L6.8,5.8 M11.8,4.8 L9.2,5.8')


@sprite('icon:ui-face-sick')
def i_fs(): return _face(LEAF_L, 'M5.2,10.8 Q6.6,9.6 8,10.8 Q9.4,12 10.8,10.8')


@sprite('icon:ui-book')
def i_book():
    return [path('M1.4,4 Q5,2.6 8,4.4 Q11,2.6 14.6,4 L14.6,12.6 Q11,11.4 8,13.2 Q5,11.4 1.4,12.6 Z', CREAM, sw=0.7), line(8, 4.4, 8, 13.2, OUT, 0.6),
            path('M3.2,6 Q5,5.4 6.6,6.2 M3.2,8 Q5,7.4 6.6,8.2 M9.4,6.2 Q11,5.4 12.8,6 M9.4,8.2 Q11,7.4 12.8,8', None, stroke=PLUM_L, sw=0.6)]


@sprite('icon:ui-flask')
def i_flask():
    return [path('M6.4,2.6 L6.4,6 L2.8,12 Q2.4,14 4.4,14 L11.6,14 Q13.6,14 13.2,12 L9.6,6 L9.6,2.6 Z', SKY_L, sw=0.7),
            path('M4.6,9.6 L3.4,12 Q3.2,13.2 4.6,13.2 L11.4,13.2 Q12.8,13.2 12.6,12 L11.4,9.6 Z', PLUM_L, stroke=None),
            rect(5.6, 1.4, 4.8, 1.6, WOOD, r=0.7, sw=0.55), circ(7, 11.4, 0.7, WHITE, stroke=None, extra='opacity="0.8"')]


@sprite('icon:ui-crown')
def i_crown():
    return [path('M2,12.4 L1.6,4.8 L5.2,8 L8,3 L10.8,8 L14.4,4.8 L14,12.4 Z', GOLD, sw=0.7), rect(2, 11.2, 12, 2.4, GOLD_D, r=0.8, sw=0.6),
            circ(8, 9, 1, RED, sw=0.35), circ(4.6, 9.8, 0.7, TEAL, stroke=None), circ(11.4, 9.8, 0.7, TEAL, stroke=None)]


@sprite('icon:ui-gift')
def i_gift():
    return [rect(2.4, 6.6, 11.2, 7.6, SKY, r=1.2, sw=0.7), rect(1.6, 4.6, 12.8, 3, BLUE, r=1, sw=0.7), rect(7, 4.6, 2, 9.6, RED, stroke=None),
            path('M8,4.6 Q5,1.2 3.8,3 Q3.4,4.4 8,4.6 Q12.6,4.4 12.2,3 Q11,1.2 8,4.6 Z', RED, sw=0.55)]


@sprite('icon:ui-leaf')
def i_leaf():
    return [path('M2.4,13.6 Q1.6,4.4 13.8,2.2 Q13.6,13.4 4.6,13 Z', LEAF, sw=0.7), path('M3,13 Q7,8.6 11.6,4.6', None, stroke=LEAF_D, sw=0.7)]


@sprite('icon:ui-gem')
def i_gem():
    return [path('M4.6,3 L11.4,3 L14.4,6.6 L8,13.8 L1.6,6.6 Z', TEAL, sw=0.7), path('M1.6,6.6 L14.4,6.6 M4.6,3 L6,6.6 L8,13.8 L10,6.6 L11.4,3', None, stroke=TEAL_D, sw=0.5),
            path('M5,4 L3.6,5.8', None, stroke=WHITE, sw=0.8, extra='opacity="0.8"')]


@sprite('icon:ui-hourglass')
def i_hourglass():
    return [path('M4,3 L12,3 Q12,6.6 9,8 Q12,9.4 12,13 L4,13 Q4,9.4 7,8 Q4,6.6 4,3 Z', SKY_L, sw=0.7), path('M5.6,5 L10.4,5 Q9.6,6.6 8,7.4 Q6.4,6.6 5.6,5 Z M5,12.4 Q8,9 11,12.4 Z', GOLD, stroke=None),
            rect(3, 1.6, 10, 1.8, WOOD, r=0.8, sw=0.6), rect(3, 12.6, 10, 1.8, WOOD, r=0.8, sw=0.6)]


@sprite('icon:ui-egg')
def i_egg(): return [path('M8,1.8 Q13.2,7.4 13.2,10.2 Q13.2,14.4 8,14.4 Q2.8,14.4 2.8,10.2 Q2.8,7.4 8,1.8 Z', CREAM, sw=0.7), circ(6, 9, 1.1, PLUM_L, stroke=None), circ(10, 7.4, 0.9, TEAL, stroke=None), circ(9.4, 11.6, 0.8, ROSE, stroke=None)]


@sprite('icon:ui-key')
def i_key(): return [circ(4.8, 8, 3.2, GOLD, sw=0.7), circ(4.8, 8, 1.2, CREAM, sw=0.5), path('M8,7.2 L14.4,7.2 L14.4,10 L12.8,10 L12.8,8.8 L11.4,8.8 L11.4,10 L9.8,10 L9.8,8.8 L8,8.8 Z', GOLD, sw=0.6)]


@sprite('icon:ui-drop')
def i_drop(): return [path('M8,1.6 Q13,8 13,10.4 Q13,14.4 8,14.4 Q3,14.4 3,10.4 Q3,8 8,1.6 Z', BLUE, sw=0.7), path('M5.2,10.4 Q5.2,8.4 6.6,7', None, stroke=WHITE, sw=0.9, extra='opacity="0.7"')]


@sprite('icon:ui-sun')
def i_sun():
    rays = [rect(7.3, 0.8, 1.4, 3, GOLD_D, r=0.7, stroke=OUT, sw=0.4, extra=f'transform="rotate({a} 8 8)"') for a in range(0, 360, 45)]
    return rays + [circ(8, 8, 4.2, GOLD, sw=0.7), path('M5.8,7 Q6.4,5.6 7.6,5.4', None, stroke=WHITE, sw=0.7, extra='opacity="0.8"')]


@sprite('icon:ui-snow')
def i_snow():
    arms = [g([line(8, 8, 8, 1.6, SKY, 1.2), path('M6.4,3.2 L8,4.6 L9.6,3.2', None, stroke=SKY, sw=1)], f'rotate({a} 8 8)') for a in range(0, 360, 60)]
    return arms + [circ(8, 8, 1.4, WHITE, stroke=SKY, sw=0.5)]


@sprite('icon:ui-scroll')
def i_scroll():
    return [rect(3, 2.4, 10, 11.6, CREAM, r=1.2, sw=0.7), rect(2, 1.6, 12, 2.4, CREAM_D, r=1.2, sw=0.6), rect(2, 12.4, 12, 2.4, CREAM_D, r=1.2, sw=0.6),
            path('M5,6 L11,6 M5,8 L11,8 M5,10 L9,10', None, stroke=WOOD_D, sw=0.7)]


@sprite('icon:ui-chart')
def i_chart():
    return [rect(2.4, 9, 2.8, 5, BLUE, r=0.7, sw=0.55), rect(6.6, 6, 2.8, 8, LEAF, r=0.7, sw=0.55), rect(10.8, 3, 2.8, 11, GOLD, r=0.7, sw=0.55), line(1.4, 14.4, 14.6, 14.4, OUT, 0.8)]


@sprite('icon:ui-hammer')
def i_hammer(): return [rect(7, 6, 2, 8.6, WOOD, r=0.8, sw=0.6), rect(2.6, 2, 10.8, 4.6, STONE, r=1.2, sw=0.7), rect(3.4, 2.8, 4, 1, WHITE, r=0.5, stroke=None, extra='opacity="0.5"')]


@sprite('icon:ui-medal')
def i_medal(): return [path('M4.6,1.4 L7.2,1.4 L8.6,6 L6.4,7 Z', RED, sw=0.55), path('M11.4,1.4 L8.8,1.4 L7.4,6 L9.6,7 Z', BLUE, sw=0.55), circ(8, 10, 4.4, GOLD, sw=0.7), star(8, 10, 2.4, GOLD_L, None, points=5, inner=0.5)]


@sprite('icon:ui-letter')
def i_letter(): return [rect(1.6, 3.6, 12.8, 9.2, CREAM, r=1.2, sw=0.7), path('M1.8,4.2 L8,9 L14.2,4.2', None, stroke=OUT, sw=0.6), circ(8, 9.4, 1.6, RED, sw=0.4)]


@sprite('icon:ui-hand')
def i_hand():
    return [path('M6.4,8 L6.4,2.8 Q6.4,1.6 7.5,1.6 Q8.6,1.6 8.6,2.8 L8.6,6.4 Q9.6,5.8 10.4,6.6 Q11.4,6 12.2,6.9 Q13.4,6.6 13.6,8 L13.6,11 Q13.6,14.4 10,14.4 L8.6,14.4 Q6.6,14.4 5.2,12.4 L3,9.6 Q2.4,8.4 3.6,8 Q4.6,7.8 5.4,8.8 Z', SKIN[0], sw=0.7)]


@sprite('icon:ui-note')
def i_note(): return [path('M6,11.6 L6,3.4 L13,2 L13,10.2', None, stroke=PLUM, sw=1.3), ell(4.4, 11.8, 2.2, 1.7, PLUM, sw=0.6), ell(11.4, 10.4, 2.2, 1.7, PLUM, sw=0.6)]


@sprite('icon:ui-speaker')
def i_speaker(): return [path('M2,6 L5,6 L9,2.6 L9,13.4 L5,10 L2,10 Z', STONE_L, sw=0.7), path('M11,5.6 Q12.6,8 11,10.4 M12.8,3.8 Q15.4,8 12.8,12.2', None, stroke=OUT, sw=0.9)]
