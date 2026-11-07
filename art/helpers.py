"""Ajudantes automáticos da loja: corvo entregador, aprendiz de alquimia e golem balconista.

Cada ajudante tem alguns quadros de animação (exportados no atlas da loja) e um retrato 16x16
para a interface.
"""
from pix import Canvas

# ------------------------------------------------------------------- corvo
# Pousado sobre o armário, olhando para a loja (à direita). Penas pretas com reflexo azulado.

RAVEN_COLORS = {'o': 'ink', 'k': 'k1', 'd': 'k0', 'h': 'k3', 's': 'b1', 'S': 'b2', 'e': 'white', 'b': 'k3', 'B': 'k4',
                'f': 'a1', 'p': 'c2', 'P': 'c1', 'r': 'r3', 'R': 'r2', 'l': 'c0'}

RAVEN_PERCH = ["""
..........ooo...
.........okkko..
........okkekoo.
........okkkkbbo
........okkkkkoo
...oo..okkkkko..
..oSsoookkkkko..
.oSssssskkkkko..
.osssssskkkkdo..
..osssssskkddo..
...oossssddddo..
.....oooooooo...
.......f..f.....
......ff.ff.....
""", """
..........ooo...
.........okkko..
........okkkkoo.
........okkkkbbo
........okkkkkoo
...oo..okkkkko..
..oSsoookkkkko..
.oSssssskkkkko..
.osssssskkkkdo..
..osssssskkddo..
...oossssddddo..
.....oooooooo...
.......f..f.....
......ff.ff.....
""", """
................
..........ooo...
.........okkko..
........okkekoo.
...oo...okkkkbbo
..oSso.okkkkkoo.
.oSssoookkkkko..
.oSssssskkkkko..
.osssssskkkkdo..
..osssssskkddo..
...oossssddddo..
.....oooooooo...
.......f..f.....
......ff.ff.....
"""]

# Voando (asas para cima / para baixo), 20x14. A versão "carregando" leva uma trouxinha amarrada.
RAVEN_FLY = ["""
..oo.........oo.....
.oSso.......oSso....
.oSsso.....oSsso....
..oSsso...oSsso.....
...osssoooossoooo...
....ossskkkkkkekoo..
.....okkkkkkkkkkbbo.
......okkkkkkkkooo..
.......oddkkddo.....
........ooddoo......
..........oo........
....................
....................
....................
""", """
....................
....................
....................
.............ooo....
....oooooookkkekoo..
...osssskkkkkkkkbbo.
..oSssssskkkkkkoooo.
.oSssoooskkkkdo.....
.oSso..oSssddo......
..oo..oSsso oo......
.....oSsso..........
.....oSso...........
......oo............
....................
"""]

PARCEL = """
..oRo..
.oRrRo.
oppRppo
oPppppo
oPPppPo
.ooooo.
"""


def raven(frame):
    c = Canvas(16, 14)
    c.sprite(RAVEN_PERCH[frame], RAVEN_COLORS)
    return c


def raven_fly(frame, carrying=False):
    c = Canvas(20, 20 if carrying else 14)
    c.sprite(RAVEN_FLY[frame].replace(' ', '.'), RAVEN_COLORS)
    if carrying:
        # barbante preso às patas
        c.vline(10, 11, 3, 'c0')
        c.sprite(PARCEL, RAVEN_COLORS, 7, 13)
    return c


def parcel():
    c = Canvas(7, 6)
    c.sprite(PARCEL, RAVEN_COLORS)
    return c


def perch():
    """Poleiro de madeira com uma tigelinha de petiscos, pregado no topo do armário."""
    c = Canvas(20, 6)
    c.rect(1, 2, 18, 2, 'w4'); c.hline(1, 2, 18, 'w6'); c.hline(1, 3, 18, 'w2')
    c.rect(3, 4, 2, 2, 'w1'); c.rect(15, 4, 2, 2, 'w1')
    c.rect(13, 0, 5, 2, 'cu2'); c.hline(13, 0, 5, 'cu3'); c.px(14, 0, 'a4'); c.px(16, 0, 'g4')
    c.outline('ink')
    return c


# ----------------------------------------------------------------- aprendiz
# Fica atrás do caldeirão (o caldeirão cobre da cintura para baixo) e mexe com uma pá de madeira.
# Óculos de proteção na testa, cabelo ruivo bagunçado, túnica terracota e avental creme.

AW, AH = 22, 34


def _apprentice_body(c, sway=0, blink=False, nap=False):
    ox = 5 + sway
    top = 4 + (2 if nap else 0)
    # tronco
    ty = top + 12
    c.rect(ox + 1, ty, 10, 14, 'tc2'); c.vline(ox + 1, ty, 14, 'tc1'); c.vline(ox + 10, ty + 1, 13, 'tc0')
    c.rect(ox + 3, ty + 3, 6, 11, 'c3'); c.hline(ox + 3, ty + 3, 6, 'c5'); c.vline(ox + 8, ty + 4, 10, 'c1')
    c.hline(ox + 2, ty + 2, 8, 'c2')  # alça do avental
    c.px(ox + 5, ty + 7, 'v3'); c.px(ox + 6, ty + 8, 't3')  # manchas de poção no avental
    # pernas (aparecem só quando o caldeirão não cobre)
    c.rect(ox + 3, ty + 14, 3, 4, 'k2'); c.rect(ox + 7, ty + 14, 3, 4, 'k2')
    # cabeça
    hy = top + 1
    c.rect(ox + 2, hy + 1, 8, 9, 'sk3')
    c.vline(ox + 9, hy + 2, 8, 'sk2'); c.hline(ox + 3, hy + 9, 6, 'sk2'); c.px(ox + 3, hy + 2, 'sk4')
    if nap:
        c.hline(ox + 3, hy + 6, 2, 'ink'); c.hline(ox + 6, hy + 6, 2, 'ink')
        c.px(ox + 5, hy + 8, 'r2')
    else:
        # olhando para o caldeirão (à esquerda)
        if blink:
            c.hline(ox + 3, hy + 6, 2, 'ink'); c.hline(ox + 6, hy + 6, 2, 'ink')
        else:
            c.rect(ox + 3, hy + 5, 1, 2, 'ink'); c.rect(ox + 6, hy + 5, 1, 2, 'ink')
            c.px(ox + 3, hy + 5, 'white') if False else None
        c.hline(ox + 4, hy + 8, 2, 'r2')
    c.px(ox + 2, hy + 7, 'r4'); c.px(ox + 8, hy + 7, 'r4')
    c.px(ox + 7, hy + 7, 'c0'); c.px(ox + 8, hy + 6, 'c0')  # sardas
    # cabelo ruivo bagunçado
    c.rect(ox + 2, hy - 1, 8, 3, 'a1'); c.hline(ox + 3, hy - 2, 6, 'a1')
    c.px(ox + 1, hy, 'a1'); c.px(ox + 10, hy, 'a1'); c.px(ox + 5, hy - 3, 'a1'); c.px(ox + 8, hy - 3, 'a2')
    c.hline(ox + 3, hy - 1, 3, 'a2'); c.px(ox + 7, hy - 2, 'a3')
    c.vline(ox + 2, hy + 2, 3, 'a1'); c.vline(ox + 9, hy + 2, 3, 'a0')
    # óculos de proteção na testa
    c.hline(ox + 1, hy + 2, 10, 'k1')
    c.rect(ox + 2, hy + 1, 3, 3, 'cu2'); c.rect(ox + 6, hy + 1, 3, 3, 'cu2')
    c.px(ox + 3, hy + 2, 'gl3'); c.px(ox + 7, hy + 2, 'gl2'); c.px(ox + 3, hy + 1, 'cu4')
    return ox, ty


def apprentice(pose, frame=0):
    """pose: 'idle' (2 quadros), 'stir' (3 quadros), 'nap'."""
    c = Canvas(AW, AH)
    if pose == 'stir':
        sway = (0, -1, 0)[frame]
        ox, ty = _apprentice_body(c, sway)
        # pá de madeira: o cabo sobe à direita, a lâmina mergulha no caldeirão (à esquerda, embaixo)
        hx, hy = [(ox + 13, ty - 6), (ox + 11, ty - 5), (ox + 14, ty - 4)][frame]
        bx, by = [(1, AH - 3), (0, AH - 2), (2, AH - 2)][frame]
        steps = max(abs(hx - bx), abs(hy - by))
        for i in range(steps + 1):
            t = i / steps
            x = round(bx + (hx - bx) * t); y = round(by + (hy - by) * t)
            c.px(x, y, 'w4'); c.px(x, y + 1, 'w2')
        c.px(hx, hy, 'w5')
        # mãos na pá
        for t in (0.42, 0.62):
            x = round(bx + (hx - bx) * t); y = round(by + (hy - by) * t)
            c.rect(x - 1, y, 2, 2, 'sk3'); c.px(x, y + 1, 'sk2')
        # braços (mangas) ligando os ombros às mãos
        for t, sx in ((0.42, ox + 1), (0.62, ox + 10)):
            x = round(bx + (hx - bx) * t); y = round(by + (hy - by) * t)
            n = max(abs(x - sx), abs(y - (ty + 2)))
            for i in range(1, n):
                c.px(round(sx + (x - sx) * i / n), round(ty + 2 + (y - ty - 2) * i / n), 'tc2')
    elif pose == 'nap':
        ox, ty = _apprentice_body(c, 0, nap=True)
        # pá encostada no ombro
        for i in range(14):
            c.px(ox + 12 - i // 4, ty - 4 + i, 'w4')
        c.rect(ox, ty + 5, 2, 3, 'sk3'); c.rect(ox + 10, ty + 5, 2, 3, 'sk3')
    else:
        ox, ty = _apprentice_body(c, 0, blink=frame == 1)
        # segura a pá em pé, ao lado
        c.vline(ox + 13, ty - 9, 22, 'w4'); c.vline(ox + 14, ty - 8, 21, 'w2')
        c.rect(ox + 12, ty - 12, 4, 4, 'w5'); c.hline(ox + 12, ty - 12, 4, 'w6')
        c.rect(ox + 11, ty + 5, 2, 2, 'sk3'); c.rect(ox, ty + 5, 2, 3, 'sk3')
        c.vline(ox + 11, ty + 1, 4, 'tc1'); c.vline(ox, ty + 1, 4, 'tc1')
    c.outline('ink')
    return c


# -------------------------------------------------------------------- golem
# Golem de argila e pedra com musgo nos ombros, olhos e runa turquesa. Fica ao lado do caixa.

GW, GH = 26, 34


def golem(pose, frame=0):
    """pose: 'idle' (2 quadros), 'serve', 'nap'."""
    c = Canvas(GW, GH)
    nap = pose == 'nap'
    dy = 2 if nap else 0
    ox = 4
    # pernas grossas
    c.rect(ox + 3, 26, 6, 7, 'tc1'); c.rect(ox + 11, 26, 6, 7, 'tc1')
    c.hline(ox + 3, 32, 6, 'tc0'); c.hline(ox + 11, 32, 6, 'tc0'); c.vline(ox + 3, 26, 6, 'tc2'); c.vline(ox + 11, 26, 6, 'tc2')
    # tronco de barro
    ty = 12 + dy
    c.rect(ox + 1, ty, 18, 15 - dy, 'tc2')
    c.rect(ox, ty + 2, 20, 11 - dy, 'tc2')
    c.vline(ox, ty + 2, 11 - dy, 'tc1'); c.vline(ox + 19, ty + 2, 11 - dy, 'tc0'); c.hline(ox + 1, ty + 14 - dy, 18, 'tc0')
    c.vline(ox + 2, ty + 1, 10, 'tc3')
    # placas de pedra encaixadas
    c.rect(ox + 12, ty + 7, 5, 4, 's3'); c.hline(ox + 12, ty + 7, 5, 's4'); c.hline(ox + 12, ty + 10, 5, 's1')
    c.rect(ox + 3, ty + 9, 4, 3, 's3'); c.hline(ox + 3, ty + 9, 4, 's4')
    # runa no peito
    glow = 't4' if (frame == 1 and not nap) else 't3'
    if nap:
        glow = 't1'
    rx, ry = ox + 8, ty + 3
    for (x, y) in ((1, 0), (0, 1), (2, 1), (1, 2), (1, 3), (0, 4), (2, 4)):
        c.px(rx + x, ry + y, glow)
    if not nap:
        c.px(rx + 1, ry + 1, 't5' if frame == 1 else 't4')
    # cabeça (bloco)
    hy = 2 + dy * 2
    c.rect(ox + 4, hy, 12, 10, 's3'); c.hline(ox + 4, hy, 12, 's4'); c.vline(ox + 15, hy + 1, 9, 's1'); c.hline(ox + 4, hy + 9, 12, 's1')
    c.dither(ox + 5, hy + 1, 10, 8, 's2', 0.2)
    # olhos voltados para o balcão (esquerda)
    if nap:
        c.hline(ox + 5, hy + 5, 3, 's0'); c.hline(ox + 10, hy + 5, 3, 's0')
    else:
        eye = 't5' if frame == 1 else 't4'
        c.rect(ox + 5, hy + 4, 3, 2, eye); c.rect(ox + 10, hy + 4, 3, 2, eye)
        c.px(ox + 5, hy + 4, 'white'); c.px(ox + 10, hy + 4, 'white')
    c.hline(ox + 7, hy + 7, 4, 's1')
    # musgo na cabeça e nos ombros, com uma florzinha
    c.hline(ox + 4, hy - 1, 9, 'g2'); c.hline(ox + 5, hy - 2, 5, 'g3'); c.px(ox + 6, hy, 'g3'); c.px(ox + 11, hy, 'g2')
    c.px(ox + 13, hy - 2, 'a4'); c.px(ox + 12, hy - 2, 'g3')
    c.rect(ox, ty, 5, 2, 'g2'); c.hline(ox, ty, 4, 'g3'); c.rect(ox + 15, ty, 5, 2, 'g2'); c.hline(ox + 16, ty, 3, 'g3')
    c.px(ox + 1, ty + 2, 'g1'); c.px(ox + 18, ty + 2, 'g1')
    # braços
    if pose == 'serve':
        # braço esquerdo esticado entregando uma poção
        c.rect(ox - 4, ty + 3, 6, 4, 'tc2'); c.hline(ox - 4, ty + 6, 6, 'tc0'); c.hline(ox - 4, ty + 3, 6, 'tc3')
        c.rect(0, ty, 4, 4, 's3'); c.hline(0, ty, 4, 's4')
        c.rect(1, ty - 5, 3, 5, 'gl2'); c.rect(1, ty - 3, 3, 3, 'pr2'); c.px(1, ty - 3, 'pr4'); c.hline(1, ty - 6, 3, 'cu2')
    else:
        lift = 1 if (frame == 1 and not nap) else 0
        c.rect(ox - 3, ty + 2 - lift, 4, 11, 'tc2'); c.vline(ox - 3, ty + 2 - lift, 11, 'tc3'); c.vline(ox, ty + 2 - lift, 11, 'tc1')
        c.rect(ox - 4, ty + 13 - lift, 5, 4, 's3'); c.hline(ox - 4, ty + 13 - lift, 5, 's4')
    c.rect(ox + 19, ty + 2, 4, 11, 'tc2'); c.vline(ox + 22, ty + 2, 11, 'tc0')
    c.rect(ox + 19, ty + 13, 5, 4, 's3'); c.hline(ox + 19, ty + 13, 5, 's4'); c.vline(ox + 23, ty + 14, 3, 's1')
    c.outline('ink')
    return c


def zz():
    c = Canvas(7, 7)
    c.sprite("""
    ...zzzz
    .....z.
    ....z..
    ...zzzz
    zzz....
    .z.....
    zzz....
    """, {'z': 'c4'})
    return c


# --------------------------------------------------------- retratos (16x16)

def portrait(helper):
    c = Canvas(16, 16)
    if helper == 'corvo-entregador':
        c.sprite("""
        ................
        ......oooo......
        .....okkkko.....
        ....okkkkkkoo...
        ....okewkkkkbo..
        ...okkkkkkkbbbo.
        ...okkkkkkkoooo.
        ..oSskkkkkko....
        .oSssskkkkko....
        .oSsssskkkdo....
        .osssssskddo....
        ..ossssddddo....
        ...ooooooooo....
        .....f...f......
        ....ff..ff......
        ................
        """, {**RAVEN_COLORS, 'w': 'k4'})
    elif helper == 'aprendiz':
        full = apprentice('idle', 0)
        c.blit(_crop(full, 3, 1, 16, 16), 0, 0)
    else:
        full = golem('idle', 1)
        c.blit(_crop(full, 5, 0, 16, 16), 0, 0)
    return c


def _crop(cv, x, y, w, h):
    out = Canvas(w, h)
    for yy in range(h):
        for xx in range(w):
            p = cv.get(x + xx, y + yy)
            if p[3]:
                out.p[xx, yy] = p
    return out
