"""Fase 4 (pacote T): Concurso Real de Alquimia.

- Poção da Coroa: frasco dourado com uma coroazinha no lugar da rolha (registrada nas tabelas de items.py).
- Cinco troféus do concurso: 7x10 para a estante da loja e 16x16 para a interface.
- Estante dos troféus: tábua com suportes, pendurada na parede embaixo do quadro de avisos.
- Coroa da fachada: aparece sobre a placa da loja quando o concurso é vencido.

Posições na cena (src/game/phaser/scenes/ShopScene.ts):
- estante: (236, 80), 40x5; troféus em pé sobre ela, de 8 em 8 px a partir de x=238
- coroa da fachada: centrada em x=321, logo acima da placa (y=1)
"""
from pix import Canvas
import items as I

POS = {'trophy-shelf': (236, 80)}

I.LIQ['pocao-coroa'] = ('a0', 'a1', 'a3', 'a4', 'a6')

# Letras como em items.py: o contorno, g vidro, G vidro claro, w brilho, s ouro claro, 0-4 líquido, r rubi
I.SMALL['pocao-coroa'] = """
    s.s.s..
    sssss..
    .oggo..
    o1223o.
    o12w3o.
    o1s23o.
    o1223o.
    o0122o.
    .o001o.
    ..oo...
    """

I.ICON['pocao-coroa'] = """
    ....s..s..s.....
    ....ss.ss.ss....
    ....s3s33s3s....
    ....ssssssss....
    ......oGgo......
    ......oGgo......
    ....oo2222oo....
    ...o22223w33o...
    ..o122s2223w3o..
    ..o12sss22233o..
    ..o122s222233o..
    ..o0122222s23o..
    ..o0012222223o..
    ...o00112222o...
    ....oo0011oo....
    ......oooo......
    """

_ROYAL_COLORS = {'o': 'k1', 'g': 'gl2', 'G': 'gl3', 'w': 'white', 's': 'a5', 'r': 'r3'}


def _potion_colors(rid):
    base = I.potion_colors(rid)
    base.update({k: v for k, v in _ROYAL_COLORS.items() if k in ('s',)})
    return base


# ------------------------------------------------------------------ troféus
# k contorno; 1-4 rampa do metal (escuro → claro); w brilho; e/E esmalte; b base de madeira

TROPHY_RAMPS = [
    ('cu0', 'cu1', 'cu2', 'cu3', 'cu4'),   # bronze
    ('s1', 's3', 's4', 's5', 'white'),      # prata
    ('a0', 'a1', 'a3', 'a4', 'a5'),         # ouro
    ('ps0', 'ps1', 'ps2', 'ps3', 'ps4'),    # estrelado
    ('a0', 'a2', 'a3', 'a4', 'a6'),         # coroa
]
TROPHY_ACCENT = ['r3', 'a4', 'r3', 'a4', 'r3']

SMALL_TROPHIES = [
    # taça
    """
    k.....k
    k12343k
    .k234k.
    ..k3k..
    ...3...
    ..k2k..
    .kbbbk.
    .kbbbk.
    .......
    .......
    """,
    # lanterna
    """
    ...k...
    ..k4k..
    .kkkkk.
    .k1e2k.
    .k1E2k.
    .k1e2k.
    .kkkkk.
    .kbbbk.
    .kbbbk.
    .......
    """,
    # leque
    """
    .......
    k2k3k4k
    k23344k
    .k234k.
    .k234k.
    ..k3k..
    ...e...
    .kbbbk.
    .kbbbk.
    .......
    """,
    # medalha estelar
    """
    .ee.ee.
    ..eee..
    ..k4k..
    .k343k.
    k23w32k
    .k232k.
    ..k1k..
    .kbbbk.
    .kbbbk.
    .......
    """,
    # coroa
    """
    4..4..4
    4k.4.k4
    k44444k
    k3e3e3k
    k23332k
    kkkkkkk
    .EEEEE.
    .EeEeE.
    kbbbbbk
    .......
    """,
]

ICON_TROPHIES = [
    """
    ................
    ..kkkkkkkkkkkk..
    .k4k12344321k4k.
    .k.k12344321k.k.
    .k.k12344321k.k.
    ..kk12343321kk..
    ....k123321k....
    .....k1221k.....
    ......k22k......
    ......k33k......
    .....k1234k.....
    ....kkkkkkkk....
    ....kbbbbbbk....
    ....kbbebbbk....
    ....kkkkkkkk....
    ................
    """,
    """
    .......kk.......
    ......k44k......
    ......kkkk......
    ....kkkkkkkk....
    ....k123432k....
    ....kk1ee2kk....
    ....k1eEEe2k....
    ....k1eEEe2k....
    ....k1eEEe2k....
    ....kk1ee2kk....
    ....k123432k....
    ....kkkkkkkk....
    .....kbbbbk.....
    ....kbbbbbbk....
    ....kkkkkkkk....
    ................
    """,
    """
    ................
    ..k...k..k...k..
    .k2k.k3kk3k.k2k.
    .k23k34kk43k32k.
    ..k233444432k...
    ..k2334ww4332k..
    ...k23444432k...
    ....k234432k....
    .....k2332k.....
    ......k33k......
    .......ee.......
    ......eEEe......
    ....kkkkkkkk....
    ....kbbbbbbk....
    ....kkkkkkkk....
    ................
    """,
    """
    ....ee....ee....
    .....ee..ee.....
    ......eeee......
    ......k44k......
    .....k3443k.....
    ....k234432k....
    ...k23w44432k...
    ...k2344w432k...
    ...k23444432k...
    ....k234432k....
    .....k2332k.....
    ......k11k......
    ....kkkkkkkk....
    ....kbbbbbbk....
    ....kkkkkkkk....
    ................
    """,
    """
    ..4....4....4...
    .434..434..434..
    ..k4..k4k..4k...
    ..k44k444k44k...
    ..k4444w4444k...
    ..k3e33e33e3k...
    ..k3E33E33E3k...
    ..k2333333332k..
    ..kkkkkkkkkkkk..
    .kEEEEEEEEEEEEk.
    .kEeEEeEEeEEeEk.
    .kEEEEEEEEEEEEk.
    ..kkkkkkkkkkkk..
    ...kbbbbbbbbk...
    ...kkkkkkkkkk...
    ................
    """,
]


def _trophy_colors(i):
    r = TROPHY_RAMPS[i]
    accent = TROPHY_ACCENT[i]
    cushion = ('r2', 'r4') if i == 4 else (accent, 'white')
    return {'k': 'k1', '1': r[1], '2': r[2], '3': r[3], '4': r[4], 'w': 'white', 'b': 'w2',
            'e': accent if i != 4 else 'r4', 'E': cushion[0] if i == 4 else ('a5' if i != 1 else 'a6')}


def trophy_small(i):
    c = Canvas(7, 10)
    c.sprite(SMALL_TROPHIES[i], _trophy_colors(i))
    return c


def trophy_icon(i):
    c = Canvas(16, 16)
    c.sprite(ICON_TROPHIES[i], _trophy_colors(i))
    return c


def trophy_shelf():
    """Tábua de 40x5 com dois suportes, no mesmo estilo da estante de livros do cenário."""
    c = Canvas(40, 5)
    c.rect(0, 0, 40, 2, 'w4')
    c.hline(0, 0, 40, 'w5')
    c.hline(0, 2, 40, 'w1')
    c.rect(3, 3, 2, 2, 'w1')
    c.rect(35, 3, 2, 2, 'w1')
    return c


def crown():
    """Coroa dourada de 13x8 sobre a placa da fachada."""
    c = Canvas(13, 8)
    c.sprite("""
    s.....s.....s
    ks...ksk...sk
    k4s.k4a4k.s4k
    k44kk444kk44k
    k4r44r4r44r4k
    k33333333333k
    k22222222222k
    kkkkkkkkkkkkk
    """, {'k': 'a0', '4': 'a4', '3': 'a3', '2': 'a2', 's': 'a6', 'a': 'white', 'r': 'r3'})
    return c


def mystery_small():
    """Balão do cliente misterioso: um ponto de interrogação dourado, 7x10."""
    c = Canvas(7, 10)
    c.sprite("""
    .kkkkk.
    kaAAAak
    kAk.kAk
    .k.kAk.
    ..kAk..
    ..kAk..
    ...k...
    ..kkk..
    ..kAk..
    ...k...
    """, {'k': 'k1', 'a': 'a3', 'A': 'a4'})
    return c


def frames():
    out = {f'trophy-{i}': trophy_small(i) for i in range(5)}
    out['potion-misterio'] = mystery_small()
    out['trophy-shelf'] = trophy_shelf()
    out['crown'] = crown()
    return out
