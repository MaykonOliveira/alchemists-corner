"""Folha de conferência: python3 art/vector/preview.py saida.png nome1 nome2 ...  (clássico à esquerda, vetor à direita)."""
import sys, os
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
import build as B
from vsvg import K


def sheet(names, bg=(246, 214, 170, 255), cols=None):
    classic = B.classic_frames()
    cells = []
    for n in names:
        c = classic[n]
        v = B.draw(n, *c.size) if n in B.SPRITES else B.smooth_up(c)
        cells.append((c.resize((c.size[0] * K, c.size[1] * K), Image.NEAREST), v))
    pad = 12
    W = sum(a.size[0] + b.size[0] + pad * 3 for a, b in cells)
    H = max(a.size[1] for a, b in cells) + pad * 2
    out = Image.new('RGBA', (W, H), bg)
    x = pad
    for a, b in cells:
        out.alpha_composite(a, (x, pad)); x += a.size[0] + pad
        out.alpha_composite(b, (x, pad)); x += b.size[0] + pad * 2
    return out


if __name__ == '__main__':
    sheet(sys.argv[2:]).save(sys.argv[1])
