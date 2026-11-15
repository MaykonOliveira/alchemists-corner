"""Gera os spritesheets do visual vetorial cozy (teste) em src/assets/sprites/vector/.

Uso: python3 art/vector/build.py   (requer: pip install pillow resvg-py)

Os quadros têm os mesmos nomes e as mesmas medidas lógicas do atlas clássico (src/assets/sprites/shop.json),
só que desenhados em vetor e exportados em K× (ver vsvg.K). O que ainda não foi redesenhado entra como
uma ampliação arredondada do pixel art, e a lista sai no final do build.
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from vsvg import K, render, outline_of, smooth_up
from registry import SPRITES
from classic import CLASSIC, classic_frames
import room_v, objects_v, chars_v, items_v, icons_v  # noqa: F401  (registram os desenhos)

HERE = os.path.dirname(__file__)
OUT = os.path.join(CLASSIC, 'vector')
ARCHS = ('aventureiro', 'estudioso', 'morador', 'viajante', 'nobre')


def draw(name, w, h):
    res = SPRITES[name]()
    body, defs = res if isinstance(res, tuple) else (res, '')
    return render(body, w, h, K, defs)


def build_frames(only=None):
    classic = classic_frames()
    frames, fallback = {}, []
    for name, cim in classic.items():
        if only and name not in only:
            continue
        if name.endswith('-outline'):
            continue
        w, h = cim.size
        if name in SPRITES:
            frames[name] = draw(name, w, h)
        else:
            frames[name] = smooth_up(cim)
            fallback.append(name)
    for name in classic:
        if name.endswith('-outline') and name[:-8] in frames:
            frames[name] = outline_of(frames[name[:-8]])
    return frames, fallback


def pack(frames, width=2048, pad=2):
    order = sorted(frames.items(), key=lambda kv: (-kv[1].size[1], -kv[1].size[0], kv[0]))
    x = y = row_h = 0
    pos = {}
    for name, im in order:
        w, h = im.size
        if x + w > width:
            x = 0; y += row_h + pad; row_h = 0
        pos[name] = (x, y)
        x += w + pad; row_h = max(row_h, h)
    sheet = Image.new('RGBA', (width, y + row_h), (0, 0, 0, 0))
    meta = {}
    for name, im in frames.items():
        px, py = pos[name]
        sheet.paste(im, (px, py))
        w, h = im.size
        meta[name] = {'frame': {'x': px, 'y': py, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                      'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}
    return sheet, meta


def customer_sheet(arch):
    fw, fh, n = 18, 40, 3
    name = f'customer-{arch}'
    if f'{name}-0' in SPRITES:
        sheet = Image.new('RGBA', (fw * n * K, fh * K), (0, 0, 0, 0))
        for i in range(n):
            sheet.paste(draw(f'{name}-{i}', fw, fh), (i * fw * K, 0))
        return sheet, False
    return smooth_up(Image.open(os.path.join(CLASSIC, f'{name}.png'))), True


# Ícones da equipe: recorte do boneco da cena (cabeça e ombros) ou o bicho inteiro.
HELPER_SRC = {'helper-corvo-entregador': 'raven-0', 'helper-aprendiz': 'apprentice-idle-0', 'helper-golem-balconista': 'golem-idle-0',
              'helper-gnomo-jardineiro': 'gnome-idle-0', 'helper-coruja-sabia': 'owl-0', 'helper-bardo-da-porta': 'bard-0',
              'helper-fada-contadora': 'fairy-0', 'helper-salamandra': 'salamander-0', 'helper-mascate': 'peddler-0',
              'helper-exploradora': 'explorer-0', 'helper-gerente-noturno': 'ghost-0'}


BUST_SIDE = {'bard-0': 21, 'peddler-0': 19, 'explorer-0': 19, 'apprentice-idle-0': 18}


def bust(scene, n, side=17):
    """Cabeça e ombros de um boneco alto: quadrado de `side` unidades em volta da cabeça, reduzido para n×n."""
    w, h = classic_frames()[scene].size
    hx = json.load(open(os.path.join(CLASSIC, 'layout.json')))['heads'][scene]['x']
    x0 = max(0, min(w - side, hx - side / 2))
    full = draw(scene, w, h)
    return full.crop((round(x0 * K), 0, round((x0 + side) * K), side * K)).resize((n * K, n * K), Image.LANCZOS)


def icon_sheet():
    """Ícones da interface (grade de 16×16) em K×, na mesma disposição do icons.png clássico."""
    meta = json.load(open(os.path.join(CLASSIC, 'icons.json')))
    src = Image.open(os.path.join(CLASSIC, 'icons.png')).convert('RGBA')
    n = meta['size']
    sheet = Image.new('RGBA', (meta['width'] * K, meta['height'] * K), (0, 0, 0, 0))
    auto = []
    for name, (x, y) in meta['icons'].items():
        cim = src.crop((x, y, x + n, y + n))
        scene = name if name.startswith('trophy-') else f'{name}-0' if name.startswith('fam-') else HELPER_SRC.get(name)
        if f'icon:{name}' in SPRITES:
            im = draw(f'icon:{name}', n, n)
        elif name.startswith('potion-'):
            body, defs = items_v.potion_from(cim)
            im = render(body, n, n, K, defs)
        elif scene in SPRITES and name in HELPER_SRC and classic_frames()[scene].size[1] > 20:
            im = bust(scene, n, BUST_SIDE.get(scene, 17))
        elif scene in SPRITES:
            # desenho da cena centralizado no quadro do ícone
            w, h = classic_frames()[scene].size
            f = min(1.0, (n - 1) / max(w, h))
            one = draw(scene, w, h)
            one = one.resize((round(w * K * f), round(h * K * f)), Image.LANCZOS)
            im = Image.new('RGBA', (n * K, n * K), (0, 0, 0, 0))
            im.alpha_composite(one, ((n * K - one.size[0]) // 2, (n * K - one.size[1]) // 2))
        else:
            im = smooth_up(cim, cozy=True)
            auto.append(name)
        sheet.paste(im, (x * K, y * K))
    sheet.save(os.path.join(OUT, 'icons.png'), optimize=True)
    return auto


def main():
    os.makedirs(OUT, exist_ok=True)
    fallback = []
    if 'room' in SPRITES:
        draw('room', 384, 216).convert('RGB').save(os.path.join(OUT, 'room.png'), optimize=True)
    else:
        smooth_up(Image.open(os.path.join(CLASSIC, 'room.png'))).convert('RGB').save(os.path.join(OUT, 'room.png'), optimize=True)
        fallback.append('room')
    frames, fb = build_frames()
    fallback += fb
    sheet, meta = pack(frames)
    sheet.save(os.path.join(OUT, 'shop.png'), optimize=True)
    with open(os.path.join(OUT, 'shop.json'), 'w') as fh:
        json.dump({'frames': meta, 'meta': {'image': 'shop.png', 'size': {'w': sheet.size[0], 'h': sheet.size[1]}, 'scale': str(K)}}, fh)
    for arch in ARCHS:
        im, fb = customer_sheet(arch)
        im.save(os.path.join(OUT, f'customer-{arch}.png'), optimize=True)
        if fb:
            fallback.append(f'customer-{arch}')
    auto = icon_sheet()
    print(f'ok: {len(frames)} quadros, atlas {sheet.size}, {len(fallback)} ainda em ampliação automática')
    if fallback:
        print('  ' + ', '.join(sorted(fallback)))
    print(f'ícones da interface: {len(auto)} ainda saem do pixel art arredondado (ingredientes, cidades e parte dos símbolos)')


if __name__ == '__main__':
    main()
