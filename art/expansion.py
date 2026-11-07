"""Expansões da loja (pacote C): segundo caldeirão, ala extra do balcão e astrolábio da torre."""
from pix import Canvas
import objects as O

# Posições no mundo lógico 384x216 (a cena lê de layout.json).
POS = {
    'cauldron-2': (50, 166),     # na frente do caldeirão principal (Sala dos fundos)
    'counter-wing': (124, 116),  # emenda à esquerda do balcão (Balcão duplo)
    'astrolabe': (157, 0),       # pendurado na viga, entre as prateleiras (Torre do alquimista)
}


def cauldron_copper():
    """Segundo caldeirão: o mesmo modelo, em cobre, com o líquido violeta em repouso."""
    c = O.cauldron()
    c.recolor({'k0': 'w0', 'k1': 'cu0', 'k2': 'cu1', 'k3': 'cu2', 'k4': 'cu3',
               't1': 'v1', 't2': 'v2', 't3': 'v3', 't4': 'v4',
               's1': 's0', 's2': 's1', 's3': 's2', 's4': 's3'})
    c.outline('ink')
    return c


def counter_wing():
    """Ala extra do balcão: um pedaço de balcão com uma balança de latão em cima."""
    c = Canvas(28, 52)
    base = O.counter()
    for y in range(base.h):
        for x in range(28):
            px = base.p[x, y]
            if px[3]:
                c.p[x, y + 12] = px
    # balança de latão
    c.rect(12, 1, 2, 10, 'a2'); c.vline(12, 1, 10, 'a4')
    c.hline(4, 2, 18, 'a3'); c.hline(4, 3, 18, 'a1'); c.px(12, 0, 'a5')
    for bx in (3, 19):
        c.vline(bx + 2, 3, 3, 'k3')
        c.rect(bx, 6, 6, 2, 'a3'); c.hline(bx, 6, 6, 'a5'); c.hline(bx + 1, 8, 4, 'a1')
    c.rect(9, 10, 8, 2, 'w2'); c.hline(9, 10, 8, 'w4')
    c.px(4, 5, 'pr2'); c.px(5, 5, 'pr3')   # pétala na balança
    c.px(21, 5, 'pb2'); c.px(22, 5, 'pb3')
    return c


def astrolabe(frame=0):
    """Esfera armilar dourada pendurada por uma corrente (2 quadros: os anéis giram)."""
    c = Canvas(22, 34)
    for y in range(0, 10, 2):
        c.px(11, y, 'k3'); c.px(11, y + 1, 'k2')
    cx, cy, r = 11, 21, 9
    # anel externo (meridiano)
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if r - 1.5 <= d <= r + 0.3:
                c.px(x, y, 'a4' if x < cx else 'a2')
    # anéis inclinados (giram entre os quadros)
    rx = 8 if frame == 0 else 4
    for x in range(cx - rx, cx + rx + 1):
        t = (x - cx) / rx
        h = round((1 - t * t) ** 0.5 * 3)
        c.px(x, cy - h + (1 if frame else 0), 'a3'); c.px(x, cy + h, 'a1')
    for y in range(cy - r + 1, cy + r):
        c.px(cx, y, 'a2')
    # coração de cristal violeta
    c.rect(cx - 1, cy - 1, 3, 3, 'v3'); c.px(cx - 1, cy - 1, 'v5'); c.px(cx + 1, cy + 1, 'v1')
    # estrela no topo
    c.px(cx, cy - r - 1, 'a5'); c.px(cx - 1, cy - r, 'a3'); c.px(cx + 1, cy - r, 'a3')
    c.outline('ink')
    return c
