"""Os 4 clientes-base (PRD 6.6), 3 quadros cada: 0 parado, 1 e 2 caminhando."""
from pix import Canvas

FW, FH, FRAMES = 18, 40, 3
Y0 = 6  # espaço extra acima da cabeça para chapéus

LOOKS = {
    # Aventureira: cabelo ruivo preso, gibão de couro, cachecol vermelho e mochila com rolo de dormir.
    'aventureiro': dict(skin=('sk1', 'sk2', 'sk3'), hair=('a0', 'a1', 'a2'), hair_style='ponytail',
                        top=('w1', 'w3', 'w4'), trim='r3', legs=('k1', 'k2'), boots=('w0', 'w2'),
                        extra='backpack', hat=None),
    # Estudioso: chapéu pontudo e túnica violeta com estrelas, óculos, livro debaixo do braço.
    'estudioso': dict(skin=('sk2', 'sk3', 'sk4'), hair=('s3', 's4', 's5'), hair_style='beard',
                      top=('v1', 'v2', 'v3'), trim='a4', legs=('v0', 'v1'), boots=('w0', 'w1'),
                      extra='book', hat='wizard'),
    # Moradora: lenço verde, avental creme e cesta de pães.
    'morador': dict(skin=('sk1', 'sk2', 'sk3'), hair=('k0', 'k1', 'k2'), hair_style='scarf',
                    top=('g1', 'g2', 'g3'), trim='c4', legs=('w1', 'w2'), boots=('w0', 'w1'),
                    extra='basket', hat=None),
    # Viajante: chapéu de aba larga, capa turquesa e cajado.
    'viajante': dict(skin=('sk2', 'sk3', 'sk4'), hair=('a1', 'a2', 'a3'), hair_style='short',
                     top=('t1', 't2', 't3'), trim='c3', legs=('w1', 'w2'), boots=('w0', 'w2'),
                     extra='staff', hat='wide'),
}


def draw_frame(look, frame):
    c = Canvas(FW, FH)
    bob = 0 if frame == 0 else 1
    sd, sb, sl = look['skin']; hd, hb, hl = look['hair']; td, tb, tl = look['top']
    ld, lb = look['legs']; bd, bb = look['boots']
    ox = 3  # corpo de 12px centrado em 18
    # pernas
    lift = {0: (0, 0), 1: (2, 0), 2: (0, 2)}[frame]
    for i, lx in enumerate((ox + 3, ox + 7)):
        l = lift[i]
        c.rect(lx, Y0 + 25, 3, 6 - l, lb); c.vline(lx + 2, Y0 + 25, 6 - l, ld)
        c.rect(lx, Y0 + 30 - l, 3, 2, bb); c.hline(lx, Y0 + 32 - l, 3, bd); c.px(lx, Y0 + 30 - l, 'w4' if bb == 'w2' else bb)
    top = Y0 + 2 + bob
    # mochila (atrás do corpo)
    if look['extra'] == 'backpack':
        c.rect(ox - 2, top + 12, 4, 10, 'w2'); c.vline(ox - 2, top + 12, 10, 'w1'); c.rect(ox - 2, top + 10, 4, 3, 'c2')
        c.hline(ox - 2, top + 11, 4, 'c1')
    if look['extra'] == 'staff':
        sx = ox + 13
        c.vline(sx, top + 2, Y0 + 30 - top, 'w3'); c.vline(sx + 1, top + 4, Y0 + 28 - top, 'w2')
        c.rect(sx - 1, top - 1, 3, 3, 't3'); c.px(sx, top - 1, 't5'); c.px(sx, top - 2, 't4')
    # tronco
    ty = top + 11
    if look['extra'] == 'staff' or look['hat'] == 'wizard':  # capa / túnica longa
        c.rect(ox + 1, ty, 10, 14, tb)
        c.rect(ox, ty + 3, 12, 11, tb)
        c.vline(ox, ty + 3, 11, td); c.vline(ox + 11, ty + 3, 11, td)
        c.hline(ox, ty + 13, 12, td)
        c.vline(ox + 2, ty + 1, 12, tl)
    else:
        c.rect(ox + 1, ty, 10, 13, tb)
        c.vline(ox + 1, ty, 13, td); c.vline(ox + 10, ty + 1, 12, td)
        c.vline(ox + 2, ty + 1, 7, tl)
        c.hline(ox + 1, ty + 12, 10, td)
    # detalhes de roupa
    if look['extra'] == 'basket':  # avental
        c.rect(ox + 3, ty + 4, 6, 9, look['trim']); c.vline(ox + 8, ty + 4, 9, 'c2'); c.hline(ox + 3, ty + 4, 6, 'c5')
        c.hline(ox + 1, ty + 4, 10, 'c2')
    if look['extra'] == 'backpack':
        c.hline(ox + 1, ty + 8, 10, 'w0'); c.px(ox + 6, ty + 8, 'a4')
        c.rect(ox + 2, ty, 8, 2, look['trim']); c.px(ox + 8, ty + 2, look['trim']); c.px(ox + 8, ty + 3, 'r2')
        c.vline(ox + 3, ty + 1, 7, 'w0')  # alça
    if look['hat'] == 'wizard':
        for (sx, sy) in ((ox + 4, ty + 5), (ox + 8, ty + 9), (ox + 3, ty + 11)):
            c.px(sx, sy, look['trim'])
        c.hline(ox + 1, ty + 7, 10, 'a3')
        c.hline(ox + 3, ty, 6, 'c4')
    if look['extra'] == 'staff':
        c.hline(ox + 2, ty, 8, look['trim']); c.px(ox + 6, ty + 1, 'a4')  # broche
    # braços
    sw = {0: 0, 1: 1, 2: -1}[frame]
    for side, ax in ((0, ox - 1), (1, ox + 11)):
        d = sw if side == 0 else -sw
        c.rect(ax, ty + 1 + d, 2, 8, td if side else tb)
        c.px(ax + (0 if side == 0 else 1), ty + 1 + d, tl if side == 0 else td)
        c.rect(ax, ty + 9 + d, 2, 2, sb); c.px(ax + 1, ty + 10 + d, sd)
    if look['extra'] == 'book':
        c.rect(ox + 10, ty + 5, 4, 6, 'r2'); c.vline(ox + 10, ty + 5, 6, 'c4'); c.px(ox + 12, ty + 7, 'a4')
    if look['extra'] == 'basket':
        bx = ox + 9
        c.rect(bx, ty + 8, 6, 4, 'c1'); c.hline(bx, ty + 8, 6, 'c2'); c.hline(bx + 1, ty + 10, 4, 'c0')
        c.rect(bx + 1, ty + 6, 2, 2, 'a3'); c.rect(bx + 3, ty + 6, 2, 2, 'a2'); c.px(bx + 1, ty + 6, 'a5')
        c.vline(bx, ty + 5, 3, 'c1'); c.vline(bx + 5, ty + 5, 3, 'c1'); c.hline(bx, ty + 5, 6, 'c1')
    # cabeça
    hy = top + 1
    c.rect(ox + 2, hy + 1, 8, 9, sb)
    c.vline(ox + 9, hy + 2, 8, sd); c.hline(ox + 3, hy + 9, 6, sd)
    c.px(ox + 3, hy + 2, sl); c.px(ox + 4, hy + 2, sl)
    # rosto
    c.rect(ox + 4, hy + 5, 1, 2, 'ink'); c.rect(ox + 7, hy + 5, 1, 2, 'ink')
    c.px(ox + 4, hy + 5, 'white') if False else None
    c.px(ox + 3, hy + 7, 'r4'); c.px(ox + 8, hy + 7, 'r4')
    c.hline(ox + 5, hy + 8, 2, 'r2')
    # cabelo
    style = look['hair_style']
    if style == 'scarf':
        c.rect(ox + 1, hy - 1, 10, 4, 'g2'); c.hline(ox + 2, hy - 1, 8, 'g3'); c.vline(ox + 1, hy + 2, 6, 'g2')
        c.vline(ox + 10, hy + 2, 6, 'g1'); c.px(ox + 5, hy, 'g4'); c.px(ox + 8, hy + 1, 'g4')
        c.rect(ox + 10, hy + 7, 2, 3, 'g1')
        c.hline(ox + 2, hy + 3, 8, hb)
    else:
        c.rect(ox + 2, hy, 8, 3, hb); c.hline(ox + 3, hy - 1, 6, hb)
        c.hline(ox + 3, hy, 3, hl); c.vline(ox + 2, hy + 2, 4, hb); c.vline(ox + 9, hy + 2, 4, hd)
        c.px(ox + 6, hy + 3, hb); c.px(ox + 7, hy + 3, hd)
        if style == 'ponytail':
            c.rect(ox + 10, hy + 1, 2, 2, hb); c.rect(ox + 11, hy + 3, 2, 5, hb); c.vline(ox + 12, hy + 4, 4, hd)
            c.px(ox + 10, hy + 1, 'r3')
        if style == 'beard':
            c.rect(ox + 3, hy + 7, 6, 3, hb); c.rect(ox + 4, hy + 10, 4, 2, hb); c.px(ox + 5, hy + 12, hb)
            c.hline(ox + 5, hy + 8, 2, 'r2'); c.vline(ox + 8, hy + 7, 4, hd)
            # óculos
            c.rect(ox + 3, hy + 5, 3, 2, 'a3'); c.rect(ox + 6, hy + 5, 3, 2, 'a3')
            c.px(ox + 4, hy + 5, 'ink'); c.px(ox + 7, hy + 5, 'ink'); c.px(ox + 4, hy + 6, 'b5'); c.px(ox + 7, hy + 6, 'b5')
    # chapéus
    hat = look['hat']
    if hat == 'wizard':
        c.rect(ox, hy, 12, 2, td); c.hline(ox, hy, 12, tb)
        c.rect(ox + 2, hy - 3, 8, 3, tb); c.rect(ox + 3, hy - 5, 6, 2, tb); c.rect(ox + 4, hy - 7, 4, 2, tb)
        c.rect(ox + 5, hy - 9, 3, 2, tb); c.rect(ox + 7, hy - 10, 2, 1, tb); c.px(ox + 9, hy - 11, tb); c.px(ox + 10, hy - 11, tl)
        c.vline(ox + 7, hy - 7, 7, td); c.vline(ox + 8, hy - 5, 5, td); c.hline(ox + 2, hy - 1, 8, 'a3')
        c.px(ox + 4, hy - 4, 'a5'); c.px(ox + 6, hy - 7, 'a4')
    if hat == 'wide':
        c.rect(ox - 2, hy + 1, 16, 2, 'w2'); c.hline(ox - 2, hy + 1, 16, 'w4')
        c.rect(ox + 2, hy - 3, 8, 4, 'w3'); c.hline(ox + 2, hy - 3, 8, 'w4'); c.hline(ox + 2, hy, 8, look['trim'])
        c.px(ox + 9, hy - 2, 'r3'); c.px(ox + 10, hy - 3, 'r4')  # pena
    c.outline('ink')
    return c


def customer_sheet(archetype):
    sheet = Canvas(FW * FRAMES, FH)
    for f in range(FRAMES):
        sheet.blit(draw_frame(LOOKS[archetype], f), f * FW, 0)
    return sheet
