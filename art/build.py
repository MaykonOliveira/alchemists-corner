"""Gera os spritesheets do jogo a partir dos arquivos-fonte em art/.

Uso: python3 art/build.py   (requer Pillow)
Saída: src/assets/sprites/*.png e *.json (atlas no formato JSON Hash do Phaser).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from pix import Canvas, check_palette, outline_mask
import objects as O
import items as I
from room import draw_room
from customers import customer_sheet, LOOKS, FW, FH, FRAMES

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'sprites')


def pack(frames, width, pad=1):
    """Empacotador simples em prateleiras (maiores primeiro)."""
    order = sorted(frames.items(), key=lambda kv: (-kv[1].h, -kv[1].w, kv[0]))
    x = y = row_h = 0
    pos = {}
    for name, cv in order:
        if x + cv.w > width:
            x = 0; y += row_h + pad; row_h = 0
        pos[name] = (x, y)
        x += cv.w + pad; row_h = max(row_h, cv.h)
    height = y + row_h
    sheet = Canvas(width, height)
    meta = {}
    for name, cv in frames.items():
        px_, py_ = pos[name]
        sheet.blit(cv, px_, py_)
        meta[name] = {'frame': {'x': px_, 'y': py_, 'w': cv.w, 'h': cv.h}, 'rotated': False, 'trimmed': False,
                      'spriteSourceSize': {'x': 0, 'y': 0, 'w': cv.w, 'h': cv.h}, 'sourceSize': {'w': cv.w, 'h': cv.h}}
    return sheet, meta


def save(cv, name):
    check_palette(cv.im, name)
    cv.im.save(os.path.join(OUT, name), optimize=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    save(draw_room(), 'room.png')

    shop = {}
    hot = {'obj-cabinet': O.cabinet(), 'obj-cauldron': O.cauldron(), 'obj-shelf': O.shelf(), 'obj-board': O.board(),
           'obj-door': O.door(), 'obj-counter': O.counter(), 'obj-register': O.register(), 'display-stand': O.display_stand()}
    for k, cv in hot.items():
        shop[k] = cv
        shop[f'{k}-outline'] = outline_mask(cv)
    shop.update({
        'sign-open': O.sign(True), 'sign-closed': O.sign(False), 'jar': O.empty_jar(), 'bubble': O.bubble(),
        'marker': O.marker(), 'coin': O.coin(), 'heart': O.heart(), 'angry': O.angry(), 'sad': O.sad(),
        'sparkle': O.sparkle(), 'liquid': O.liquid(), 'cauldron-bands': O.cauldron_bands(),
        'cabinet-labels': O.cabinet_labels(), 'shop-sign': O.shop_sign(), 'garland': O.garland(), 'badge': O.badge(),
        'glow-warm': O.glow(24, (255, 200, 110)), 'glow-fire': O.glow(18, (255, 140, 60)),
        'glow-small': O.glow(6, (255, 230, 170)), 'dot-bubble': O.dot(3, 'white'), 'px': O.dot(2, 'white'),
        'dot-steam': O.dot(5, 'c4'),
    })
    for f in range(3):
        shop[f'fire-{f}'] = O.fire(f)
    for rid in I.LIQ:
        shop[f'potion-{rid}'] = I.potion_small(rid)
    sheet, meta = pack(shop, 512)
    save(sheet, 'shop.png')
    with open(os.path.join(OUT, 'shop.json'), 'w') as fh:
        json.dump({'frames': meta, 'meta': {'image': 'shop.png', 'size': {'w': sheet.w, 'h': sheet.h}, 'scale': '1'}}, fh, indent=1)

    for arch in LOOKS:
        save(customer_sheet(arch), f'customer-{arch}.png')

    # Ícones 16x16 da interface (poções e ingredientes), em grade de 8 colunas.
    icons = {f'potion-{r}': I.potion_icon(r) for r in I.LIQ}
    icons.update({f'ingredient-{i}': I.ingredient_icon(i) for i in I.INGREDIENTS})
    cols = 8
    grid = Canvas(16 * cols, 16 * ((len(icons) + cols - 1) // cols))
    index = {}
    for n, (name, cv) in enumerate(icons.items()):
        x, y = (n % cols) * 16, (n // cols) * 16
        grid.blit(cv, x, y)
        index[name] = [x, y]
    save(grid, 'icons.png')
    with open(os.path.join(OUT, 'icons.json'), 'w') as fh:
        json.dump({'size': 16, 'width': grid.w, 'height': grid.h, 'icons': index}, fh, indent=1)
    # Posições que o jogo precisa conhecer (lâmpadas do cordão de luzes, para os brilhos).
    from pix import P
    layout = {'garlandBulbs': [{'x': x, 'y': y, 'color': P[c]} for x, y, c in O.garland_bulbs()],
              'shelfBoards': O.SHELF_BOARDS, 'customer': {'w': FW, 'h': FH, 'frames': FRAMES}}
    with open(os.path.join(OUT, 'layout.json'), 'w') as fh:
        json.dump(layout, fh, indent=1)
    print('ok:', sorted(os.listdir(OUT)))


if __name__ == '__main__':
    main()
