"""Funcionários novos da loja: gnomo jardineiro, coruja sábia e bardo da porta.

Mesma regra dos outros ajudantes (art/helpers.py): alguns quadros de animação no atlas da loja
e um retrato 16x16 para a interface.
"""
from pix import Canvas

# ------------------------------------------------------------------ coruja
# Coruja-de-orelha marrom, pousada na prateleirinha embaixo do quadro de avisos.
# Olhos âmbar enormes, disco facial creme, peito claro com pintinhas.

OWL_COLORS = {'p': 'w3', 'P': 'w2', 'f': 'c3', 'e': 'a3', 'E': 'k0', 'b': 'a2', 'l': 'c4', 'd': 'w4', 't': 'a1',
              'c': 'c2', 'g': 'v4', 'G': 'v3'}

OWL_BODY = """
.pp......pp.
.pPp....pPp.
pppPppppPppp
pppppppppppp
pffffppffffp
{eyes1}
{eyes2}
pffffbbffffp
pppffffffppp
PppllddllppP
PppllllllppP
PPpldlldlpPP
.PPllllllPP.
..t.t..t.t..
"""

OWL_EYES = {
    'open': ('feEeffffeEef', 'feeefbbfeeef'),
    'blink': ('ffffffffffff', 'fPPPfbbfPPPf'),
    # pensando na charada: olha para cima
    'think': ('fEeeffffEeef', 'feeefbbfeeef'),
    'nap': ('ffffffffffff', 'fPPPfbbfPPPf'),
}


def owl(pose='open'):
    """pose: 'open', 'blink', 'think' (com chapeuzinho de sábio), 'nap'."""
    c = Canvas(16, 19)
    e1, e2 = OWL_EYES[pose]
    rows = OWL_BODY.format(eyes1=e1, eyes2=e2)
    c.sprite(rows, OWL_COLORS, 2, 4)
    # Óculos redondos de sábio na ponta do bico (menos na soneca).
    if pose != 'nap':
        c.px(5, 10, 'a4'); c.px(10, 10, 'a4')
    # Chapéu de mago pequeno, roxo com estrela dourada.
    hat = ['....G...', '...GGg..', '..GaGGg.', '.GGGGGGg']
    for i, row in enumerate(hat):
        for j, ch in enumerate(row):
            if ch != '.':
                c.px(4 + j, i, {'G': 'v2', 'g': 'v3', 'a': 'a4'}[ch])
    c.hline(3, 4, 10, 'v1')
    c.outline('ink')
    return c


# ------------------------------------------------------------------- gnomo
# Gnomo de gorro vermelho e barba branca, regando a planta (à esquerda) com um regador de cobre.

def gnome(pose='idle', frame=0):
    """pose: 'idle' (2 quadros), 'water' (2 quadros, com gotas), 'nap'."""
    c = Canvas(22, 23)
    ox = 9
    nap = pose == 'nap'
    dy = 1 if nap else 0
    # gorro pontudo (cai um pouco na soneca)
    for i in range(8):
        w = 1 + i
        x = ox + 5 - i // 2 + (1 if nap and i < 3 else 0)
        c.hline(x, i + dy, w, 'r3')
        c.px(x, i + dy, 'r4')
    c.hline(ox + 1, 8 + dy, 9, 'r2')
    # rosto
    c.rect(ox + 2, 9 + dy, 7, 4, 'sk3'); c.vline(ox + 8, 9 + dy, 4, 'sk2')
    c.px(ox + 5, 11 + dy, 'sk2'); c.px(ox + 5, 10 + dy, 'r4')  # nariz de batata
    if nap:
        c.hline(ox + 3, 10 + dy, 2, 'ink'); c.hline(ox + 6, 10 + dy, 2, 'ink')
    elif pose == 'idle' and frame == 1:
        c.hline(ox + 3, 10, 1, 'ink'); c.hline(ox + 7, 10, 1, 'ink')
    else:
        c.px(ox + 3, 10, 'ink'); c.px(ox + 7, 10, 'ink')
    # barba branca
    c.rect(ox + 1, 12 + dy, 9, 4, 'c5'); c.rect(ox + 2, 16 + dy, 7, 1, 'c5'); c.rect(ox + 3, 17 + dy, 5, 1, 'c4')
    c.vline(ox + 9, 12 + dy, 4, 'c4'); c.px(ox + 5, 14 + dy, 'c4'); c.px(ox + 4, 15 + dy, 'c4')
    # corpo: camisa azul, cinto
    c.rect(ox + 1, 16 + dy, 9, 3 - dy, 'b2'); c.vline(ox + 9, 16 + dy, 3 - dy, 'b1')
    c.hline(ox + 1, 18, 9, 'w1'); c.px(ox + 5, 18, 'a3')
    # botas
    c.rect(ox + 2, 19, 3, 2, 'w1'); c.rect(ox + 6, 19, 3, 2, 'w1'); c.hline(ox + 2, 20, 3, 'w0'); c.hline(ox + 6, 20, 3, 'w0')
    # regador de cobre na mão esquerda
    tilt = pose == 'water'
    cx, cy = ox - 5, 13 + dy
    c.rect(cx, cy, 5, 4, 'cu2'); c.hline(cx, cy, 5, 'cu3'); c.vline(cx + 4, cy, 4, 'cu1')
    c.hline(cx + 1, cy - 1, 3, 'cu1')  # alça
    if tilt:
        c.px(cx - 1, cy + 1, 'cu2'); c.px(cx - 2, cy + 2, 'cu2'); c.px(cx - 3, cy + 3, 'cu3')
        for (x, y) in ((cx - 4, cy + 5 + frame), (cx - 3, cy + 7 - frame), (cx - 5, cy + 7 + frame)):
            c.px(x, y, 'b4')
    else:
        c.px(cx - 1, cy + 1, 'cu2'); c.px(cx - 2, cy, 'cu2'); c.px(cx - 3, cy - 1, 'cu3')
    c.rect(ox, 15 + dy, 2, 2, 'sk3')  # mão
    c.outline('ink')
    return c


# -------------------------------------------------------------------- bardo
# Bardo de chapéu vermelho com pena, túnica violeta e alaúde. Fica ao lado da porta.

BW, BH = 22, 34


def bard(pose='play', frame=0):
    """pose: 'play' (2 quadros), 'nap'."""
    c = Canvas(BW, BH)
    nap = pose == 'nap'
    oy = 3 + (1 if (pose == 'play' and frame == 1) or nap else 0)
    ox = 4
    # pernas e botas
    c.rect(ox + 3, 24 + 3, 3, 5, 'k2'); c.rect(ox + 8, 24 + 3, 3, 5, 'k2')
    c.rect(ox + 2, 31, 4, 2, 'w1'); c.rect(ox + 8, 31, 4, 2, 'w1')
    # túnica violeta
    c.rect(ox + 1, oy + 11, 12, 13, 'v2'); c.vline(ox + 1, oy + 11, 13, 'v3'); c.vline(ox + 12, oy + 12, 12, 'v1')
    c.hline(ox + 3, oy + 11, 8, 'c3')  # gola
    c.hline(ox + 1, oy + 19, 12, 'w2'); c.px(ox + 6, oy + 19, 'a3')  # cinto
    c.dither(ox + 2, oy + 20, 10, 4, 'v1', 0.25)
    # cabeça
    c.rect(ox + 3, oy + 3, 8, 8, 'sk3'); c.vline(ox + 10, oy + 4, 7, 'sk2')
    c.rect(ox + 2, oy + 3, 10, 2, 'a1'); c.vline(ox + 2, oy + 4, 5, 'a1'); c.vline(ox + 11, oy + 4, 4, 'a0')
    if nap:
        c.hline(ox + 4, oy + 7, 2, 'ink'); c.hline(ox + 8, oy + 7, 2, 'ink')
    else:
        c.px(ox + 5, oy + 7, 'ink'); c.px(ox + 8, oy + 7, 'ink')
        c.hline(ox + 6, oy + 9, 2, 'r2')  # sorriso
    c.px(ox + 4, oy + 8, 'r4'); c.px(ox + 9, oy + 8, 'r4')
    # chapéu com pena dourada
    c.rect(ox + 1, oy, 12, 3, 'r3'); c.hline(ox + 2, oy, 10, 'r4'); c.hline(ox, oy + 2, 14, 'r2')
    fx, fy = ox + 12, oy - 1
    for i in range(4):
        c.px(fx + i, fy - i // 2, 'a4' if i < 3 else 'a5')
    c.px(fx + 1, fy + 1, 'a3')
    # alaúde (corpo de madeira, braço para a direita)
    lx, ly = ox + 4, oy + 16
    c.ellipse(lx, ly, 4, 3, 'w4'); c.ellipse(lx, ly, 2, 1, 'w5'); c.px(lx, ly, 'w1'); c.px(lx + 1, ly, 'w1')
    if nap:
        # alaúde encostado, sem tocar
        for i in range(7):
            c.px(lx + 4 + i, ly - i // 2, 'w2')
    else:
        for i in range(9):
            c.px(lx + 4 + i, ly - 1 - i // 2 - i // 4, 'w2')
        c.rect(lx + 12, ly - 7, 2, 2, 'w1')  # cravelha
        # mão no braço do alaúde e mão dedilhando (muda de quadro)
        c.rect(lx + 9, ly - 6, 2, 2, 'sk3')
        c.rect(lx - 1 + frame, ly - 2 + frame, 2, 2, 'sk3')
    c.outline('ink')
    return c


def note(frame=0):
    """Nota musical que sobe do alaúde."""
    c = Canvas(5, 7)
    col = 'a4' if frame == 0 else 't4'
    c.vline(3, 0, 5, col); c.hline(3, 0, 2, col); c.px(4, 1, col)
    c.rect(1, 4, 3, 2, col)
    c.outline('ink')
    return c


# --------------------------------------------------------- retratos (16x16)

def _crop(cv, x, y, w, h):
    out = Canvas(w, h)
    for yy in range(h):
        for xx in range(w):
            p = cv.get(x + xx, y + yy)
            if p[3]:
                out.p[xx, yy] = p
    return out


def portrait(helper):
    if helper == 'coruja-sabia':
        return _crop(owl('open'), 0, 2, 16, 16)
    if helper == 'gnomo-jardineiro':
        return _crop(gnome('idle', 0), 6, 0, 16, 16)
    return _crop(bard('play', 0), 3, 1, 16, 16)


PORTRAITS = ('gnomo-jardineiro', 'coruja-sabia', 'bardo-da-porta')


def frames():
    """Quadros do atlas da loja (o build gera o contorno de hover de cada um)."""
    return {
        'owl-0': owl('open'), 'owl-1': owl('blink'), 'owl-think': owl('think'), 'owl-nap': owl('nap'),
        'gnome-idle-0': gnome('idle', 0), 'gnome-idle-1': gnome('idle', 1),
        'gnome-water-0': gnome('water', 0), 'gnome-water-1': gnome('water', 1), 'gnome-nap': gnome('nap'),
        'bard-0': bard('play', 0), 'bard-1': bard('play', 1), 'bard-nap': bard('nap'),
    }
