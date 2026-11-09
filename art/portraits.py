"""Retratos 16x16 dos clientes (auditoria P1.5): 5 tipos e 6 fregueses fiéis, 3 expressões cada.

O cartão do atendimento mostra o rosto de quem está no balcão, e a expressão muda com a paciência
(contente, neutro, bravo). Cada retrato é montado com as mesmas cores do sprite de corpo inteiro
(customers.py), para o jogador reconhecer a mesma pessoa na cena e no cartão.
"""
from pix import Canvas

EXPRESSIONS = ('feliz', 'neutro', 'bravo')

# skin: (sombra, base, luz) · hair: (sombra, base, luz) · top: (sombra, base, luz)
LOOKS = {
    'aventureiro': dict(skin=('sk1', 'sk2', 'sk3'), hair=('a0', 'a1', 'a2'), top=('w1', 'w3', 'w4'), trim='r3', style='ponytail'),
    'estudioso': dict(skin=('sk2', 'sk3', 'sk4'), hair=('s3', 's4', 's5'), top=('v1', 'v2', 'v3'), trim='a4', style='wizard', beard=True, glasses=True),
    'morador': dict(skin=('sk1', 'sk2', 'sk3'), hair=('k0', 'k1', 'k2'), top=('g1', 'g2', 'g3'), trim='c4', style='scarf', scarf=('g2', 'g3')),
    'viajante': dict(skin=('sk2', 'sk3', 'sk4'), hair=('a1', 'a2', 'a3'), top=('t1', 't2', 't3'), trim='c3', style='wide', hat=('w1', 'w2', 'w3')),
    'nobre': dict(skin=('sk2', 'sk3', 'sk4'), hair=('a2', 'a3', 'a4'), top=('r1', 'r2', 'r3'), trim='c5', style='crown'),
}

# Fregueses fiéis: o mesmo desenho do tipo, com o que faz cada um ser reconhecível.
REGULAR_LOOKS = {
    # Dona Célia: senhora de lenço violeta e cabelo grisalho.
    'dona-celia': dict(LOOKS['morador'], hair=('s3', 's4', 's5'), scarf=('v2', 'v3'), top=('v1', 'v2', 'v3'), trim='c4', blush=True),
    # Bram, o ferreiro: careca de barba preta, avental de couro.
    'bram': dict(LOOKS['aventureiro'], skin=('sk0', 'sk1', 'sk2'), hair=('k0', 'k1', 'k2'), style='bald', beard=True, top=('w0', 'w2', 'w3'), trim='k3'),
    # Lia, aprendiz de maga: chapéu pontudo azul, cabelo laranja, sem barba.
    'lia': dict(LOOKS['estudioso'], hair=('a1', 'a2', 'a3'), beard=False, glasses=False, top=('b1', 'b2', 'b3'), trim='a4', hatcolor=('b1', 'b2', 'b3'), blush=True),
    # Tobias, o mascate: chapéu de aba larga e bigode.
    'tobias': dict(LOOKS['viajante'], hair=('w1', 'w2', 'w3'), mustache=True, hat=('tc0', 'tc1', 'tc2'), top=('w2', 'w3', 'w4')),
    # Vovô Zé: cabelo e barba brancos, colete verde.
    'vovo-ze': dict(LOOKS['morador'], skin=('sk2', 'sk3', 'sk4'), hair=('s4', 's5', 'c5'), style='short', beard=True, top=('g1', 'g2', 'g3'), trim='c3'),
    # Condessa Amélia: cabelo dourado comprido, tiara e gola de arminho.
    'condessa': dict(LOOKS['nobre'], hair=('a3', 'a4', 'a5'), style='tiara', top=('v1', 'v2', 'v3'), trim='c5', long_hair=True, blush=True),
}


def portrait(look, expression):
    c = Canvas(16, 16)
    sd, sb, sl = look['skin']
    hd, hb, hl = look['hair']
    td, tb, tl = look['top']
    style = look.get('style')

    # ombros e roupa
    c.rect(2, 13, 12, 3, tb)
    c.hline(2, 13, 12, tl)
    c.vline(2, 13, 3, td); c.vline(13, 13, 3, td)
    c.rect(6, 13, 4, 2, look['trim'])
    # pescoço
    c.rect(6, 12, 4, 1, sd)

    # cabelo comprido atrás do rosto
    if look.get('long_hair'):
        c.rect(3, 5, 10, 9, hd)
        c.rect(3, 5, 2, 8, hb); c.rect(11, 5, 2, 8, hb)

    # rosto (10x8)
    c.rect(4, 4, 8, 8, sb)
    c.rect(5, 11, 6, 1, sb)
    c.vline(4, 6, 5, sd); c.vline(11, 6, 5, sd)
    c.hline(5, 11, 6, sd)
    c.px(5, 5, sl); c.px(6, 5, sl)
    # orelhas
    c.px(3, 7, sd); c.px(12, 7, sd)

    # cabelo / chapéu
    if style == 'ponytail':
        c.rect(4, 3, 8, 2, hb); c.hline(4, 3, 8, hd); c.px(5, 4, hl); c.px(6, 4, hl)
        c.rect(12, 4, 2, 6, hb); c.vline(13, 5, 5, hd); c.px(12, 3, hd)
        c.vline(4, 5, 2, hb)
    elif style == 'wizard':
        hat = look.get('hatcolor', look['top'])
        c.rect(3, 3, 10, 2, hat[1]); c.hline(3, 4, 10, hat[0])
        c.rect(5, 1, 6, 2, hat[1]); c.rect(6, 0, 3, 1, hat[1]); c.px(9, 0, hat[2])
        c.px(7, 2, look['trim']); c.px(10, 1, look['trim'])
        c.vline(4, 5, 2, hb); c.vline(11, 5, 2, hb)
    elif style == 'scarf':
        s0, s1 = look['scarf']
        c.rect(3, 2, 10, 3, s1); c.hline(3, 4, 10, s0); c.px(5, 2, 'c4'); c.px(9, 3, 'c4')
        c.vline(3, 5, 3, s0); c.vline(12, 5, 3, s0)
        c.hline(5, 5, 6, hb)
    elif style == 'wide':
        h0, h1, h2 = look['hat']
        c.rect(1, 4, 14, 1, h1); c.hline(1, 4, 14, h0)
        c.rect(4, 1, 8, 3, h1); c.hline(4, 1, 8, h2); c.hline(4, 3, 8, look['trim'])
        c.vline(4, 5, 2, hb); c.vline(11, 5, 2, hb)
    elif style == 'crown':
        c.rect(4, 3, 8, 2, hb); c.hline(4, 4, 8, hd)
        c.hline(4, 2, 8, 'a3'); c.px(4, 1, 'a4'); c.px(7, 1, 'a4'); c.px(8, 1, 'a4'); c.px(11, 1, 'a4'); c.px(7, 0, 'r3')
        c.vline(4, 5, 3, hb); c.vline(11, 5, 3, hb)
    elif style == 'tiara':
        c.rect(4, 3, 8, 2, hb); c.hline(4, 3, 8, hl)
        c.hline(5, 2, 6, 'a4'); c.px(7, 1, 'b4'); c.px(8, 1, 'a5')
        c.vline(4, 5, 3, hb); c.vline(11, 5, 3, hb)
    elif style == 'bald':
        c.hline(5, 3, 6, sb); c.px(6, 3, sl); c.px(7, 3, sl)
        c.px(4, 6, hd); c.px(11, 6, hd)
    else:  # short
        c.rect(4, 3, 8, 2, hb); c.hline(4, 3, 8, hd); c.px(6, 3, hl); c.px(7, 3, hl)
        c.vline(4, 5, 2, hb); c.vline(11, 5, 2, hb)

    # olhos e sobrancelhas
    brow = hd if style not in ('wizard', 'wide') or not look.get('beard') else hb
    if expression == 'bravo':
        c.px(5, 6, brow); c.px(6, 7, brow); c.px(10, 6, brow); c.px(9, 7, brow)
    else:
        c.hline(5, 6, 2, brow); c.hline(9, 6, 2, brow)
    c.px(6, 8, 'ink'); c.px(9, 8, 'ink')
    if expression == 'feliz':
        c.px(5, 8, 'ink'); c.px(10, 8, 'ink')
        c.px(6, 8, 'ink'); c.px(9, 8, 'ink')
        c.px(5, 7, sb); c.px(10, 7, sb)
    if look.get('glasses'):
        c.hline(5, 8, 2, 'a4'); c.hline(9, 8, 2, 'a4'); c.px(7, 8, 'a3'); c.px(8, 8, 'a3')
        c.px(6, 8, 'ink'); c.px(9, 8, 'ink')
    # nariz
    c.px(7, 9, sd)
    # bochechas
    if look.get('blush') or expression == 'feliz':
        c.px(5, 9, 'r4'); c.px(10, 9, 'r4')
    if expression == 'bravo':
        c.px(5, 9, 'r3'); c.px(10, 9, 'r3')

    # barba e bigode
    if look.get('beard'):
        c.rect(5, 10, 6, 3, hb); c.hline(5, 12, 6, hd); c.px(4, 9, hb); c.px(11, 9, hb); c.rect(6, 13, 4, 1, hb)
    if look.get('mustache'):
        c.hline(6, 10, 4, hd); c.px(5, 11, hd); c.px(10, 11, hd)

    # boca
    mouth = 'r1'
    if expression == 'feliz':
        c.px(6, 10, mouth); c.hline(7, 11, 2, mouth); c.px(9, 10, mouth)
        if not look.get('beard'):
            c.hline(7, 10, 2, 'c5')
    elif expression == 'neutro':
        c.hline(6, 11, 4, mouth)
    else:
        c.hline(7, 10, 2, mouth); c.px(6, 11, mouth); c.px(9, 11, mouth)

    c.outline('ink')
    return c


def portraits():
    out = {}
    for kind, look in LOOKS.items():
        for e in EXPRESSIONS:
            out[f'face-{kind}-{e}'] = portrait(look, e)
    for rid, look in REGULAR_LOOKS.items():
        for e in EXPRESSIONS:
            out[f'face-{rid}-{e}'] = portrait(look, e)
    return out
