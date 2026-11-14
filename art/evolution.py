"""Evoluções pós-equipe (pacotes E1 a E6).

- Funcionários novos: fada contadora, salamandra, mascate, exploradora e gerente noturno (fantasma da lanterna).
- Insígnias de nível (bronze, prata, ouro) que ficam sobre o funcionário na loja.
- Familiares (8 criaturinhas, cada uma com versão brilhante), o ninho e o ovo.
- Momentos raros: estrela cadente, dragão viajante e borboleta arco-íris.
- Vitrine cosmética: miniaturas dos temas, partículas dos temas e os chapéus dos uniformes.
- Mapa do reino (192x108) e os ícones das cidades.
"""
from pix import Canvas

# =================================================================== funcionários

def fairy(frame=0, nap=False):
    """Fada contadora: cabelo violeta, vestido turquesa, asas que batem e um ábaco dourado."""
    c = Canvas(16, 16)
    up = frame == 0 and not nap
    # asas
    wing = 'b5' if not nap else 'b4'
    if up:
        for i in range(4):
            c.hline(1 + i // 2, 2 + i, 4 - i // 2, wing); c.hline(11, 2 + i, 4 - i // 2, wing)
        c.px(2, 3, 'white'); c.px(13, 3, 'white')
    else:
        for i in range(3):
            c.hline(0 + i, 6 + i, 4 - i, wing); c.hline(12, 6 + i, 4 - i, wing)
        c.px(1, 6, 'white'); c.px(14, 6, 'white')
    dy = 1 if nap else 0
    # cabeça
    c.rect(6, 2 + dy, 5, 4, 'sk4'); c.vline(10, 3 + dy, 3, 'sk3')
    c.rect(5, 1 + dy, 7, 2, 'v3'); c.vline(5, 2 + dy, 4, 'v3'); c.vline(11, 2 + dy, 3, 'v2'); c.px(7, 1 + dy, 'v4')
    if nap:
        c.hline(7, 4 + dy, 1, 'ink'); c.hline(9, 4 + dy, 1, 'ink')
    else:
        c.px(7, 4, 'ink'); c.px(9, 4, 'ink'); c.px(6, 5, 'r4')
    # vestido
    c.rect(6, 6 + dy, 5, 4, 't3'); c.vline(10, 6 + dy, 4, 't2'); c.hline(5, 10 + dy, 7, 't2'); c.hline(6, 6 + dy, 5, 't4')
    c.px(6, 11 + dy, 'sk3'); c.px(10, 11 + dy, 'sk3')
    # ábaco dourado na frente
    c.rect(3, 8 + dy, 3, 4, 'w2'); c.px(4, 9 + dy, 'a4'); c.px(4, 11 + dy, 'r3'); c.px(3, 10 + dy, 'a4')
    # varinha com estrela
    if not nap:
        c.vline(12, 6, 4, 'w5'); c.px(12, 5, 'a5'); c.px(13, 5, 'a4'); c.px(11, 5, 'a4')
    c.outline('ink')
    return c


def salamander(frame=0, nap=False):
    """Salamandra de fogo deitada perto da lareira; a chama das costas tremula."""
    c = Canvas(22, 11)
    y = 6
    # corpo
    c.rect(5, y, 11, 3, 'pf2'); c.hline(5, y, 11, 'pf3'); c.hline(6, y + 2, 9, 'pf1')
    # cabeça
    c.rect(15, y - 1, 5, 4, 'pf2'); c.hline(15, y - 1, 5, 'pf3'); c.px(19, y + 1, 'pf1')
    if nap:
        c.hline(17, y, 2, 'ink')
    else:
        c.px(17, y, 'ink'); c.px(18, y, 'white')
    # rabo
    tail = [(4, y + 1), (3, y + 1), (2, y), (1, y - 1 + frame), (0, y - 2 + frame)]
    for x, yy in tail:
        c.px(x, yy, 'pf2')
    # patas
    for x in (6, 13):
        c.px(x, y + 3, 'pf1'); c.px(x + 1, y + 3, 'pf1')
    # pintas
    c.px(8, y + 1, 'a5'); c.px(11, y + 1, 'a5')
    # chama nas costas
    if not nap:
        flame = [(8, y - 1, 'pf3'), (9, y - 2, 'a4'), (10, y - 1, 'pf3'), (9, y - 3 - frame, 'a5'), (11, y - 2 + frame, 'a4'),
                 (7, y - 2 + frame, 'a4')]
        for x, yy, col in flame:
            c.px(x, yy, col)
    c.outline('ink')
    return c


def peddler(frame=0, nap=False):
    """Mascate de chapéu largo e mochila enorme cheia de frascos."""
    c = Canvas(22, 32)
    oy = 1 if (frame == 1 or nap) else 0
    ox = 3
    # mochila (atrás, à esquerda)
    c.rect(ox, 8 + oy, 7, 15, 'w3'); c.hline(ox, 8 + oy, 7, 'w4'); c.vline(ox, 8 + oy, 15, 'w2')
    for i, col in enumerate(('pr2', 'pb2', 'pg2', 'pl2')):
        c.rect(ox + 1 + (i % 2) * 3, 4 + oy + (i // 2) * 2, 2, 3, col); c.px(ox + 1 + (i % 2) * 3, 4 + oy + (i // 2) * 2, 'white')
    c.rect(ox - 1, 12 + oy, 2, 3, 'cu2')  # panela pendurada
    c.hline(ox + 1, 15 + oy, 5, 'w1')
    # pernas
    c.rect(ox + 7, 25, 3, 5, 'k2'); c.rect(ox + 11, 25, 3, 5, 'k2')
    c.rect(ox + 6, 30, 4, 2, 'w1'); c.rect(ox + 11, 30, 4, 2, 'w1')
    # casaco verde
    c.rect(ox + 6, 13 + oy, 10, 12 - oy, 'g2'); c.vline(ox + 15, 13 + oy, 12 - oy, 'g1'); c.vline(ox + 6, 13 + oy, 12 - oy, 'g3')
    c.hline(ox + 6, 20 + oy, 10, 'w1'); c.px(ox + 10, 20 + oy, 'a4')
    c.vline(ox + 8, 13 + oy, 7, 'w2')  # alça da mochila
    # cabeça
    c.rect(ox + 8, 6 + oy, 7, 7, 'sk2'); c.vline(ox + 14, 7 + oy, 6, 'sk1')
    c.rect(ox + 8, 10 + oy, 7, 3, 'w2')  # barba castanha
    c.px(ox + 11, 9 + oy, 'sk1')
    if nap:
        c.hline(ox + 9, 8 + oy, 2, 'ink'); c.hline(ox + 12, 8 + oy, 2, 'ink')
    else:
        c.px(ox + 10, 8 + oy, 'ink'); c.px(ox + 13, 8 + oy, 'ink'); c.hline(ox + 10, 11 + oy, 3, 'r1')
    # chapéu largo
    c.rect(ox + 8, 2 + oy, 7, 4, 'tc1'); c.hline(ox + 6, 5 + oy, 11, 'tc0'); c.hline(ox + 8, 4 + oy, 7, 'a3')
    # mão segurando um frasco à venda
    if not nap:
        c.rect(ox + 16, 15 + oy, 2, 2, 'sk2')
        c.rect(ox + 16, 12 + oy - frame, 2, 3, 'pv2'); c.px(ox + 16, 12 + oy - frame, 'white')
    c.outline('ink')
    return c


def explorer(frame=0, nap=False):
    """Exploradora de chapéu de aba, lenço vermelho, mochila e lampião."""
    c = Canvas(20, 32)
    oy = 1 if (frame == 1 or nap) else 0
    ox = 3
    # mochila
    c.rect(ox + 9, 12 + oy, 5, 9, 'w4'); c.hline(ox + 9, 12 + oy, 5, 'w5'); c.vline(ox + 13, 12 + oy, 9, 'w3')
    c.rect(ox + 9, 9 + oy, 5, 3, 'g2')  # saco de dormir
    # pernas e botas
    c.rect(ox + 3, 24, 3, 5, 'c1'); c.rect(ox + 7, 24, 3, 5, 'c1')
    c.rect(ox + 2, 29, 4, 3, 'w1'); c.rect(ox + 7, 29, 4, 3, 'w1')
    # camisa e colete
    c.rect(ox + 2, 13 + oy, 9, 11 - oy, 'c3'); c.rect(ox + 2, 13 + oy, 2, 11 - oy, 'w3'); c.rect(ox + 9, 13 + oy, 2, 11 - oy, 'w3')
    c.hline(ox + 2, 20 + oy, 9, 'w1'); c.px(ox + 6, 20 + oy, 'a4')
    c.hline(ox + 4, 13 + oy, 5, 'r3')  # lenço
    # cabeça
    c.rect(ox + 3, 6 + oy, 7, 7, 'sk3'); c.vline(ox + 9, 7 + oy, 6, 'sk2')
    c.vline(ox + 2, 7 + oy, 7, 'a1'); c.vline(ox + 10, 7 + oy, 4, 'a1'); c.px(ox + 2, 14 + oy, 'a1')  # trança
    if nap:
        c.hline(ox + 4, 9 + oy, 2, 'ink'); c.hline(ox + 7, 9 + oy, 2, 'ink')
    else:
        c.px(ox + 5, 9 + oy, 'ink'); c.px(ox + 8, 9 + oy, 'ink'); c.px(ox + 6, 11 + oy, 'r2')
    c.px(ox + 4, 10 + oy, 'r4')
    # chapéu de aba
    c.rect(ox + 3, 3 + oy, 7, 3, 'c1'); c.hline(ox + 1, 6 + oy, 11, 'c0'); c.hline(ox + 3, 5 + oy, 7, 'w2')
    # lampião na mão
    if not nap:
        lx, ly = ox - 2, 17 + oy + frame
        c.rect(ox, 16 + oy, 2, 2, 'sk3')
        c.rect(lx, ly, 3, 4, 'a4'); c.hline(lx, ly, 3, 'k3'); c.hline(lx, ly + 3, 3, 'k3'); c.px(lx + 1, ly + 1, 'a6')
    c.outline('ink')
    return c


def ghost(frame=0, nap=False):
    """Gerente noturno: fantasminha simpático de touca, com uma lanterna acesa."""
    c = Canvas(16, 18)
    oy = frame
    body, shade = ('c5', 'c4') if not nap else ('c4', 'c3')
    c.ellipse(7, 6 + oy, 5, 5, body)
    c.rect(2, 6 + oy, 11, 6, body)
    c.vline(12, 6 + oy, 6, shade); c.vline(11, 9 + oy, 3, shade)
    for i, x in enumerate(range(2, 13, 2)):
        c.px(x, 12 + oy + ((i + frame) % 2), body)
        c.px(x + 1, 12 + oy, body)
    # touca de dormir
    c.rect(3, 1 + oy, 9, 2, 'b2'); c.hline(4, 0 + oy, 6, 'b3'); c.px(12, 2 + oy, 'b2'); c.px(13, 3 + oy, 'c5')
    if nap:
        c.hline(4, 6 + oy, 2, 'ink'); c.hline(8, 6 + oy, 2, 'ink')
    else:
        c.rect(4, 5 + oy, 2, 2, 'ink'); c.rect(8, 5 + oy, 2, 2, 'ink'); c.px(4, 5 + oy, 'white'); c.px(8, 5 + oy, 'white')
        c.hline(6, 8 + oy, 2, 'r2')
    c.px(3, 7 + oy, 'r5'); c.px(10, 7 + oy, 'r5')
    # lanterna
    lx, ly = 12, 8 + oy
    c.vline(lx + 1, ly - 1, 2, 'k3')
    c.rect(lx, ly + 1, 3, 4, 'a4' if not nap else 'a2'); c.hline(lx, ly + 1, 3, 'k3'); c.hline(lx, ly + 4, 3, 'k3')
    if not nap:
        c.px(lx + 1, ly + 2, 'a6')
    c.outline('ink')
    return c


def pin(tier):
    """Insígnia do uniforme sobre a cabeça do funcionário."""
    col, hi = {1: ('cu2', 'cu4'), 2: ('s4', 'white'), 3: ('a3', 'a5')}[tier]
    c = Canvas(7, 7)
    c.vline(3, 1, 5, col); c.hline(1, 3, 5, col); c.rect(2, 2, 3, 3, col); c.px(3, 3, hi); c.px(2, 2, hi)
    c.outline('ink')
    return c


def _crop(cv, x, y, w=16, h=16):
    out = Canvas(w, h)
    for yy in range(h):
        for xx in range(w):
            p = cv.get(x + xx, y + yy)
            if p[3]:
                out.p[xx, yy] = p
    return out


STAFF_PORTRAITS = {
    'fada-contadora': lambda: _crop(fairy(0), 0, 0),
    'salamandra': lambda: _crop(salamander(0), 5, -4),
    'mascate': lambda: _crop(peddler(0), 5, 0),
    'exploradora': lambda: _crop(explorer(0), 2, 1),
    'gerente-noturno': lambda: _crop(ghost(0), 0, -1),
}


# =================================================================== familiares

def _fam_base(fid, frame):
    c = Canvas(14, 13)
    b = frame  # balanço
    if fid == 'fadinha':
        # bolinha de luz rosa com asinhas
        c.ellipse(7, 7 - b, 3, 3, 'pp2'); c.ellipse(6, 6 - b, 1, 1, 'pp3'); c.px(6, 6 - b, 'white')
        c.px(6, 7 - b, 'ink'); c.px(8, 7 - b, 'ink')
        for (x, y) in ((2, 4), (3, 3), (11, 4), (10, 3), (2, 5), (11, 5)):
            c.px(x, y - b + (1 if frame else 0), 'b5')
    elif fid == 'slime':
        h = 5 + (1 - b)
        c.ellipse(7, 12 - h // 2 - 1, 5, h // 2 + 1, 'pg2'); c.rect(2, 10, 11, 2, 'pg2'); c.hline(3, 12 - h + 1, 6, 'pg3')
        c.px(4, 12 - h + 2, 'white'); c.px(5, 9, 'ink'); c.px(9, 9, 'ink'); c.hline(6, 10, 3, 'pg0')
    elif fid == 'dragaozinho':
        c.rect(3, 6, 7, 5, 'r3'); c.hline(3, 6, 7, 'r4'); c.rect(8, 3, 5, 4, 'r3'); c.hline(8, 3, 5, 'r4')
        c.px(11, 4, 'ink'); c.px(12, 5, 'r1'); c.px(9, 2, 'a4'); c.px(11, 2, 'a4')
        c.rect(4, 8, 4, 2, 'a4')  # barriga
        c.px(2, 8, 'r3'); c.px(1, 7, 'r3'); c.px(0, 6, 'r2')  # rabo
        c.px(4, 11, 'r1'); c.px(8, 11, 'r1')
        wy = 3 + b
        c.hline(4, wy, 3, 'tc3'); c.hline(5, wy + 1, 3, 'tc2')
    elif fid == 'vagalume':
        c.ellipse(6, 6, 2, 2, 'k3'); c.px(6, 5, 'ink'); c.px(5, 5, 'ink')
        c.ellipse(9, 7, 2, 2, 'pl2' if b == 0 else 'pl3'); c.px(9, 7, 'a6')
        c.px(5, 3 - b, 'b5'); c.px(7, 3 - b, 'b5'); c.px(4, 2 - b, 'b5'); c.px(8, 2 - b, 'b5')
        c.px(4, 8, 'k2'); c.px(7, 9, 'k2')
    elif fid == 'sapo-dourado':
        c.ellipse(7, 8, 5, 3, 'a3'); c.hline(3, 6, 9, 'a4')
        c.rect(3, 4 + b, 3, 3, 'a3'); c.rect(9, 4 + b, 3, 3, 'a3'); c.px(4, 5 + b, 'ink'); c.px(10, 5 + b, 'ink')
        c.px(3, 4 + b, 'a5'); c.px(9, 4 + b, 'a5')
        c.hline(5, 9, 5, 'a1'); c.px(2, 11, 'a2'); c.px(12, 11, 'a2'); c.px(7, 7, 'r4')
    elif fid == 'raposa-lua':
        c.rect(3, 6, 6, 4, 'b4'); c.hline(3, 6, 6, 'b5'); c.rect(8, 3, 4, 4, 'b4'); c.px(8, 2, 'b3'); c.px(11, 2, 'b3')
        c.px(10, 4, 'ink'); c.px(12, 5, 'ink'); c.px(9, 6, 'c5'); c.px(10, 6, 'c5')
        c.px(4, 10, 'b2'); c.px(8, 10, 'b2')
        for i in range(4):
            c.px(2 - (i // 2), 7 - i + b, 'b4')
        c.px(0, 3 + b, 'c5'); c.px(1, 3 + b, 'c5')
        c.px(5, 7, 'a4')  # marca de lua
    elif fid == 'tartaruga-cristal':
        c.ellipse(6, 7, 4, 3, 't3'); c.hline(3, 5, 7, 't4'); c.px(5, 6, 'white'); c.px(8, 7, 't5')
        c.px(4, 8, 't2'); c.px(7, 8, 't2')
        c.rect(10 + b, 7, 3, 3, 'g3'); c.px(11 + b, 8, 'ink')
        c.px(3, 10, 'g2'); c.px(9, 10, 'g2')
    elif fid == 'cogumelinho':
        c.ellipse(7, 5 - b, 5, 3, 'r3'); c.hline(3, 7 - b, 9, 'r2'); c.px(5, 4 - b, 'c5'); c.px(9, 3 - b, 'c5'); c.px(7, 5 - b, 'c5')
        c.rect(5, 8 - b, 5, 4 + b, 'c4'); c.vline(9, 8 - b, 4 + b, 'c3'); c.px(6, 9, 'ink'); c.px(8, 9, 'ink')
    c.outline('ink')
    return c


SHINY = {
    'fadinha': {'pp2': 'a4', 'pp3': 'a5'},
    'slime': {'pg2': 'pv2', 'pg3': 'pv3', 'pg0': 'pv0'},
    'dragaozinho': {'r3': 'ps2', 'r4': 'ps3', 'r2': 'ps1', 'r1': 'ps0', 'tc3': 'a4', 'tc2': 'a3'},
    'vagalume': {'pl2': 'pb2', 'pl3': 'pb3'},
    'sapo-dourado': {'a3': 'pi2', 'a4': 'pi3', 'a5': 'pi4', 'a1': 'pi1', 'a2': 'pi1'},
    'raposa-lua': {'b4': 'r4', 'b5': 'r5', 'b3': 'r3', 'b2': 'r2'},
    'tartaruga-cristal': {'t3': 'pp2', 't4': 'pp3', 't5': 'pp4', 't2': 'pp1'},
    'cogumelinho': {'r3': 'b3', 'r2': 'b2'},
}

FAM_IDS = list(SHINY)


def familiar(fid, frame=0, shiny=False):
    c = _fam_base(fid, frame)
    if shiny:
        c.recolor(SHINY[fid])
        c.px(0, 0, 'a5'); c.px(13, 1, 'a5')
    return c


def fam_icon(fid, shiny=False):
    out = Canvas(16, 16)
    out.blit(familiar(fid, 0, shiny), 1, 2)
    if shiny:
        out.px(14, 1, 'a5'); out.px(15, 2, 'a4'); out.px(13, 2, 'a4'); out.px(14, 3, 'a4')
    return out


def egg(shine=False):
    c = Canvas(7, 8)
    c.ellipse(3, 4, 2, 3, 'c4'); c.px(2, 2, 'white'); c.hline(1, 5, 5, 'c3')
    c.px(2, 4, 't3'); c.px(4, 3, 'v3'); c.px(4, 6, 't3')
    if shine:
        c.px(5, 1, 'a5')
    c.outline('ink')
    return c


def nest():
    c = Canvas(20, 7)
    c.ellipse(10, 4, 9, 2, 'w4'); c.hline(2, 3, 17, 'w5'); c.dither(2, 3, 17, 4, 'w2', 0.4)
    for x in range(2, 19, 3):
        c.px(x, 2, 'c1'); c.px(x + 1, 6, 'w3')
    c.outline('ink')
    return c


# =================================================================== momentos raros

def star(frame=0):
    c = Canvas(19, 9)
    # rastro
    for i in range(10):
        c.px(i, 1 + i // 3, 'a5' if i > 6 else 'b5' if i > 3 else 'b4')
    for i in range(0, 8, 2):
        c.px(i + frame, 3 + i // 3, 'white')
    cx, cy = 14, 4
    c.vline(cx, cy - 3, 7, 'a4'); c.hline(cx - 3, cy, 7, 'a4'); c.rect(cx - 1, cy - 1, 3, 3, 'a5'); c.px(cx, cy, 'white')
    if frame:
        c.px(cx - 2, cy - 2, 'a5'); c.px(cx + 2, cy + 2, 'a5'); c.px(cx + 2, cy - 2, 'a5'); c.px(cx - 2, cy + 2, 'a5')
    c.outline('ink')
    return c


def dragon(frame=0):
    c = Canvas(26, 16)
    # corpo
    c.rect(7, 7, 11, 5, 't2'); c.hline(7, 7, 11, 't3'); c.rect(8, 10, 8, 2, 'a3')
    # pescoço e cabeça
    c.rect(17, 4, 3, 5, 't2'); c.rect(18, 2, 6, 4, 't2'); c.hline(18, 2, 6, 't3'); c.px(22, 3, 'ink'); c.px(24, 4, 't2')
    c.px(19, 1, 'a4'); c.px(21, 1, 'a4'); c.px(23, 5, 't1')
    # rabo
    for i, (x, y) in enumerate(((6, 9), (5, 9), (4, 8), (3, 7), (2, 7), (1, 6))):
        c.px(x, y, 't2')
    c.px(0, 5, 'a4'); c.px(0, 6, 'a4')
    # pernas
    c.rect(9, 12, 2, 2, 't1'); c.rect(15, 12, 2, 2, 't1')
    # asa
    if frame == 0:
        for i in range(6):
            c.hline(9 + i // 2, 1 + i, 6 - i // 2, 'v3'); c.px(9 + i // 2, 1 + i, 'v2')
    else:
        for i in range(4):
            c.hline(9, 8 + i, 7 - i, 'v3')
    c.outline('ink')
    return c


def butterfly(frame=0):
    c = Canvas(11, 9)
    cols = ('r3', 'a4', 'g3', 'b3')
    if frame == 0:
        c.rect(1, 1, 4, 3, cols[0]); c.rect(6, 1, 4, 3, cols[1]); c.rect(2, 4, 3, 3, cols[2]); c.rect(6, 4, 3, 3, cols[3])
        c.px(2, 2, 'white'); c.px(8, 2, 'white')
    else:
        c.rect(3, 1, 2, 3, cols[0]); c.rect(6, 1, 2, 3, cols[1]); c.rect(3, 4, 2, 2, cols[2]); c.rect(6, 4, 2, 2, cols[3])
    c.vline(5, 2, 5, 'k1'); c.px(4, 0, 'k1'); c.px(6, 0, 'k1')
    c.outline('ink')
    return c


# =================================================================== vitrine (E6)

def hat(kind):
    if kind == 'gorro':
        c = Canvas(10, 8)
        c.rect(2, 3, 6, 3, 'r3'); c.hline(3, 2, 4, 'r3'); c.hline(4, 1, 2, 'r4'); c.px(7, 1, 'r3')
        c.rect(1, 5, 8, 2, 'c5'); c.dither(1, 5, 8, 2, 'c3', 0.3)
        c.rect(8, 0, 2, 2, 'c5')
    elif kind == 'bruxa':
        c = Canvas(12, 9)
        for i in range(6):
            c.hline(6 - i // 2, i, 1 + i, 'v2')
        c.px(7, 0, 'v1'); c.px(8, 0, 'v1')
        c.hline(3, 5, 6, 'a3'); c.px(5, 5, 'a5')
        c.hline(0, 6, 12, 'v1'); c.hline(1, 6, 10, 'v2')
    elif kind == 'flores':
        c = Canvas(10, 4)
        c.hline(0, 2, 10, 'g2')
        for x, col in ((0, 'r4'), (3, 'a4'), (6, 'pp2'), (9, 'b4')):
            c.px(x, 1, col); c.px(x, 2, 'a5' if col != 'a4' else 'white')
        c.px(2, 3, 'g3'); c.px(8, 3, 'g3')
    else:  # cartola
        c = Canvas(10, 9)
        c.rect(2, 0, 6, 6, 'k1'); c.vline(7, 0, 6, 'k0'); c.vline(2, 0, 6, 'k2')
        c.hline(2, 4, 6, 'a3'); c.px(4, 4, 'a5')
        c.hline(0, 6, 10, 'k1')
    c.outline('ink')
    return c


def theme_thumb(kind):
    c = Canvas(24, 24)
    bg = {'inverno': ('b1', 'b2'), 'bruxas': ('v0', 'v1'), 'cerejeira': ('pp1', 'pp2'), 'dourado': ('a1', 'a2')}[kind]
    c.rect(1, 1, 22, 22, bg[0]); c.dither(1, 1, 22, 22, bg[1], 0.35)
    if kind == 'inverno':
        for (x, y) in ((4, 4), (17, 6), (6, 16), (19, 18), (12, 3)):
            c.px(x, y, 'white')
        cx, cy = 12, 12
        for d in range(-6, 7):
            c.px(cx + d, cy, 'b5'); c.px(cx, cy + d, 'b5'); c.px(cx + d * 0.7, cy + d * 0.7, 'b4'); c.px(cx + d * 0.7, cy - d * 0.7, 'b4')
        c.px(cx, cy, 'white')
        c.hline(1, 20, 22, 'white'); c.hline(1, 21, 22, 'b5'); c.hline(1, 22, 22, 'white')
    elif kind == 'bruxas':
        c.ellipse(12, 15, 7, 5, 'pf2'); c.ellipse(12, 15, 4, 5, 'pf3'); c.rect(11, 8, 2, 3, 'g1')
        c.rect(9, 13, 2, 2, 'a5'); c.rect(14, 13, 2, 2, 'a5'); c.hline(9, 17, 7, 'a5'); c.px(10, 18, 'pf2'); c.px(13, 18, 'pf2')
        c.ellipse(18, 5, 2, 2, 'a5')
        for (x, y) in ((4, 4), (5, 5), (6, 4), (3, 3), (7, 3)):
            c.px(x, y, 'k0')
    elif kind == 'cerejeira':
        c.hline(1, 5, 14, 'w2'); c.hline(8, 6, 8, 'w2'); c.px(15, 7, 'w2')
        for (x, y) in ((3, 4), (7, 6), (12, 4), (15, 8), (10, 7)):
            c.rect(x - 1, y - 1, 3, 3, 'pp3'); c.px(x, y, 'pp1')
        for (x, y) in ((5, 13), (14, 16), (9, 19), (18, 12), (19, 20)):
            c.px(x, y, 'pp4'); c.px(x + 1, y, 'pp3')
    else:
        cx, cy = 12, 12
        c.vline(cx, 3, 18, 'a4'); c.hline(3, cy, 18, 'a4'); c.rect(cx - 2, cy - 2, 5, 5, 'a4'); c.rect(cx - 1, cy - 1, 3, 3, 'a5')
        c.px(cx, cy, 'white')
        for (x, y) in ((5, 5), (18, 5), (5, 18), (18, 18)):
            c.px(x, y, 'a5')
    c.frame(0, 0, 24, 24, 'ink')
    return c


def particle(kind):
    if kind == 'snowflake':
        c = Canvas(3, 3); c.px(1, 0, 'white'); c.hline(0, 1, 3, 'white'); c.px(1, 2, 'white'); c.px(1, 1, 'b5')
    elif kind == 'petal':
        c = Canvas(3, 2); c.hline(0, 0, 2, 'pp3'); c.hline(1, 1, 2, 'pp2')
    elif kind == 'gold':
        c = Canvas(3, 3); c.px(1, 0, 'a5'); c.hline(0, 1, 3, 'a4'); c.px(1, 2, 'a5'); c.px(1, 1, 'white')
    elif kind.startswith('bat'):
        f = int(kind[-1])
        c = Canvas(9, 5)
        c.rect(3, 1, 3, 3, 'k0'); c.px(3, 0, 'k0'); c.px(5, 0, 'k0'); c.px(3, 2, 'r4'); c.px(5, 2, 'r4')
        if f == 0:
            c.hline(0, 1, 3, 'k1'); c.hline(6, 1, 3, 'k1'); c.px(0, 0, 'k1'); c.px(8, 0, 'k1')
        else:
            c.hline(1, 3, 2, 'k1'); c.hline(6, 3, 2, 'k1'); c.px(0, 4, 'k1'); c.px(8, 4, 'k1')
    return c


def pumpkin():
    c = Canvas(13, 10)
    c.ellipse(6, 6, 6, 3, 'pf2'); c.vline(4, 3, 7, 'pf1'); c.vline(8, 3, 7, 'pf1'); c.hline(1, 6, 11, 'pf2')
    c.rect(5, 0, 2, 3, 'g1')
    c.px(4, 5, 'a5'); c.px(8, 5, 'a5'); c.hline(4, 7, 5, 'a5'); c.px(6, 6, 'a5')
    c.outline('ink')
    return c


def blossom_branch():
    """Galho florido que pende das vigas do teto (tema cerejeira)."""
    c = Canvas(64, 14)
    for x in range(64):
        y = 2 + int(2 * abs(((x / 16) % 2) - 1))
        c.px(x, y, 'w2'); c.px(x, y + 1, 'w1')
    for i, x in enumerate(range(3, 62, 6)):
        y = 3 + (i * 5) % 7
        c.rect(x - 1, y - 1, 3, 3, 'pp3' if i % 2 else 'pp2'); c.px(x, y, 'a5' if i % 3 else 'white')
    return c


def icicles():
    c = Canvas(64, 8)
    c.hline(0, 0, 64, 'white'); c.hline(0, 1, 64, 'b5')
    for i, x in enumerate(range(1, 64, 5)):
        n = 3 + (i * 3) % 5
        c.vline(x, 1, n, 'b5'); c.px(x, 1, 'white'); c.vline(x + 1, 1, max(1, n - 3), 'b4')
    return c


# =================================================================== reino

MAP_W, MAP_H = 192, 108
ROADS = [((96, 80), (28, 76)), ((96, 80), (44, 22)), ((96, 80), (150, 24)), ((96, 80), (162, 80)), ((96, 80), (100, 40)),
         ((100, 40), (150, 24)), ((100, 40), (44, 22))]


def kingdom_map():
    import math
    c = Canvas(MAP_W, MAP_H)
    # mar
    c.rect(0, 0, MAP_W, MAP_H, 'b2'); c.dither(0, 0, MAP_W, MAP_H, 'b3', 0.15)

    def land(x, y):
        # continente ondulado
        nx, ny = (x - 100) / 92, (y - 54) / 50
        r = math.sqrt(nx * nx + ny * ny)
        wob = 0.08 * math.sin(x * 0.21) + 0.06 * math.cos(y * 0.27) + 0.04 * math.sin((x + y) * 0.13)
        return r < 0.95 + wob and not (x < 22 and y > 70)

    for y in range(MAP_H):
        for x in range(MAP_W):
            if land(x, y):
                c.px(x, y, 'g3')
    tex = Canvas(MAP_W, MAP_H)
    tex.dither(0, 0, MAP_W, MAP_H, 'g2', 0.12)
    # campos de trigo e colinas
    for (x, y, rx, ry) in ((70, 60, 9, 5), (122, 52, 8, 4), (60, 88, 7, 4), (128, 70, 6, 4)):
        tex.ellipse(x, y, rx, ry, 'a3'); tex.dither(x - rx, y - ry, 2 * rx + 1, 2 * ry + 1, 'py1', 0.3)
    for (x, y) in ((40, 50), (80, 30), (130, 40), (114, 94), (72, 74)):
        tex.ellipse(x, y, 4, 2, 'g4'); tex.hline(x - 2, y - 2, 5, 'g4')
    for y in range(MAP_H):
        for x in range(MAP_W):
            if land(x, y) and tex.opaque(x, y):
                c.px(x, y, tex.get(x, y))
    # praia
    for y in range(MAP_H):
        for x in range(MAP_W):
            if land(x, y) and not (land(x - 2, y) and land(x + 2, y) and land(x, y - 2) and land(x, y + 2)):
                c.px(x, y, 'c3')
    # espuma
    for y in range(MAP_H):
        for x in range(MAP_W):
            if not land(x, y) and (land(x - 1, y) or land(x + 1, y) or land(x, y - 1) or land(x, y + 1)):
                c.px(x, y, 'b4')
    # baía do porto
    c.ellipse(16, 84, 10, 8, 'b2'); c.ellipse(16, 84, 9, 7, 'b2')
    # montanhas (norte-oeste, vila da neve, e norte-leste, mina)
    def mountain(x, y, s, snow=True):
        for i in range(s):
            c.hline(x - i, y + i, 2 * i + 1, 's3' if i > s // 3 else ('white' if snow else 's4'))
            c.px(x + i, y + i, 's2')
        c.px(x, y - 1, 'ink')
    for (x, y, s) in ((34, 14, 7), (46, 10, 8), (58, 16, 6), (138, 14, 7), (152, 10, 8), (166, 16, 6), (28, 24, 5)):
        mountain(x, y, s, snow=x < 100)
    # floresta das fadas (sudeste)
    for (x, y) in ((150, 68), (158, 66), (166, 70), (172, 76), (146, 76), (154, 86), (170, 86), (162, 92), (176, 70), (142, 86)):
        c.ellipse(x, y, 3, 3, 'g1'); c.px(x - 1, y - 1, 'g2'); c.vline(x, y + 3, 2, 'w1')
    for (x, y) in ((156, 74), (166, 82)):
        c.px(x, y, 'pp3')
    # rio
    pts = [(100, 0), (98, 14), (104, 26), (100, 38), (92, 52), (98, 64), (110, 76), (122, 90), (126, 108)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(abs(x1 - x0), abs(y1 - y0))
        for t in range(n + 1):
            x = x0 + (x1 - x0) * t / n; y = y0 + (y1 - y0) * t / n
            c.px(x, y, 'b3'); c.px(x + 1, y, 'b3')
    # estradas pontilhadas
    for (x0, y0), (x1, y1) in ROADS:
        n = max(abs(x1 - x0), abs(y1 - y0))
        for t in range(0, n + 1):
            if t % 3 == 2:
                continue
            x = x0 + (x1 - x0) * t / n; y = y0 + (y1 - y0) * t / n
            c.px(x, y, 'w5')
    # castelo da capital (centro-norte) desenhado no mapa
    c.rect(96, 34, 9, 6, 's4'); c.rect(95, 31, 3, 4, 's4'); c.rect(103, 31, 3, 4, 's4'); c.px(100, 29, 'r3'); c.vline(100, 30, 4, 's2')
    # rosa dos ventos
    rx, ry = 178, 98
    c.vline(rx, ry - 6, 13, 'c4'); c.hline(rx - 6, ry, 13, 'c4'); c.px(rx, ry - 6, 'r3'); c.rect(rx - 1, ry - 1, 3, 3, 'a4')
    # moldura de pergaminho
    c.frame(0, 0, MAP_W, MAP_H, 'w1'); c.frame(1, 1, MAP_W - 2, MAP_H - 2, 'c1')
    return c


def city_icon(size):
    """0 fechada (bandeirinha), 1 barraca, 2 loja, 3 empório com torre."""
    c = Canvas(16, 16)
    if size == 0:
        c.vline(5, 2, 12, 'w2'); c.rect(6, 2, 6, 4, 'c2'); c.px(8, 3, 'c0'); c.hline(3, 14, 6, 'w1')
    elif size == 1:
        for i in range(6):
            c.hline(8 - i - 1, 4 + i, 2 * i + 2, 'r3' if (i % 2 == 0) else 'c4')
        c.rect(3, 10, 10, 4, 'w3'); c.hline(3, 10, 10, 'w5'); c.px(6, 9, 'pr2'); c.px(9, 9, 'pb2')
        c.vline(8, 1, 3, 'w2'); c.px(9, 1, 'a4')
    elif size == 2:
        c.rect(3, 7, 10, 7, 'p4'); c.vline(12, 7, 7, 'p2')
        for i in range(4):
            c.hline(2 + i, 6 - i, 12 - 2 * i, 'r2')
        c.rect(7, 10, 3, 4, 'w2'); c.rect(4, 9, 2, 2, 'a4'); c.rect(11, 9, 1, 2, 'a4')
        c.hline(4, 7, 8, 'a3')
    else:
        c.rect(2, 7, 12, 7, 'c3'); c.vline(13, 7, 7, 'c1')
        c.rect(10, 2, 4, 12, 'c3'); c.vline(13, 2, 12, 'c1')
        for i in range(3):
            c.hline(10 - i + 1, 1 - i + 2, 2 + 2 * i, 'v2')
        c.px(11, 0, 'a4'); c.hline(2, 7, 9, 'a3'); c.hline(2, 6, 8, 'v2')
        c.rect(5, 10, 3, 4, 'w2'); c.rect(3, 9, 1, 2, 'a5'); c.rect(9, 9, 1, 2, 'a5'); c.rect(11, 5, 1, 2, 'a5')
    c.outline('ink')
    return c


def home_icon():
    c = Canvas(16, 16)
    c.rect(3, 7, 10, 7, 'w4'); c.vline(12, 7, 7, 'w2')
    for i in range(4):
        c.hline(2 + i, 6 - i, 12 - 2 * i, 'v2')
    c.rect(7, 10, 3, 4, 'w1'); c.rect(4, 9, 2, 2, 'a5')
    c.vline(11, 1, 3, 's3'); c.px(11, 0, 's5')
    c.ellipse(8, 3, 1, 1, 'a5')
    c.outline('ink')
    return c


# =================================================================== exportação

def frames():
    """Quadros do atlas da loja (o build gera o contorno de hover dos funcionários)."""
    out = {
        'fairy-0': fairy(0), 'fairy-1': fairy(1), 'fairy-nap': fairy(0, True),
        'salamander-0': salamander(0), 'salamander-1': salamander(1), 'salamander-nap': salamander(0, True),
        'peddler-0': peddler(0), 'peddler-1': peddler(1), 'peddler-nap': peddler(0, True),
        'explorer-0': explorer(0), 'explorer-1': explorer(1), 'explorer-nap': explorer(0, True),
        'ghost-0': ghost(0), 'ghost-1': ghost(1), 'ghost-nap': ghost(0, True),
    }
    return out


def extras():
    """Peças sem contorno de hover: insígnias, familiares, momentos, temas e chapéus."""
    out = {f'pin-{t}': pin(t) for t in (1, 2, 3)}
    for fid in FAM_IDS:
        for f in (0, 1):
            out[f'fam-{fid}-{f}'] = familiar(fid, f)
            out[f'fam-{fid}-shiny-{f}'] = familiar(fid, f, True)
    out.update({'egg': egg(), 'egg-shine': egg(True), 'nest': nest()})
    for f in (0, 1):
        out[f'moment-estrela-{f}'] = star(f)
        out[f'moment-dragao-{f}'] = dragon(f)
        out[f'moment-borboleta-{f}'] = butterfly(f)
    for k in ('gorro', 'bruxa', 'flores', 'cartola'):
        out[f'hat-{k}'] = hat(k)
    for k in ('inverno', 'bruxas', 'cerejeira', 'dourado'):
        out[f'theme-{k}'] = theme_thumb(k)
    for k in ('snowflake', 'petal', 'gold', 'bat-0', 'bat-1'):
        out[f'fx-{k}'] = particle(k)
    out.update({'pumpkin': pumpkin(), 'blossom': blossom_branch(), 'icicles': icicles()})
    return out


def moment_outlines(out):
    from pix import outline_mask
    for k in [k for k in out if k.startswith('moment-')]:
        out[f'{k}-outline'] = outline_mask(out[k])
    return out


def icons():
    out = {f'helper-{h}': f() for h, f in STAFF_PORTRAITS.items()}
    for fid in FAM_IDS:
        out[f'fam-{fid}'] = fam_icon(fid)
        out[f'fam-{fid}-shiny'] = fam_icon(fid, True)
    out.update({f'city-{s}': city_icon(s) for s in range(4)})
    out['city-home'] = home_icon()
    return out
