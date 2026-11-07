"""O gato da loja (pacote D): laranja rajado, de patinhas brancas. Senta, anda, dorme e ronrona."""
from pix import Canvas

CAT_COLORS = {'o': 'ink', 'a': 'a2', 'A': 'a1', 'l': 'a4', 'w': 'c4', 'g': 'g4', 'p': 'r4', 'k': 'k0'}

SIT = ["""
.........o...o..
........oao.oao.
........oaaaaao.
.......oaaaaaaao
.......oagkaagko
.......oaaapaaao
...oo...oalllao.
..oao..oaaaaao..
..oao.oaAaaAaao.
..oaooaaaAaaAaao
...oaoaaaaaaaaao
....oaaaaaaaaaao
....oawwaaaawwo.
.....oooooooooo.
""", """
.........o...o..
........oao.oao.
........oaaaaao.
.......oaaaaaaao
.......oaAAaaAAo
.......oaaapaaao
........oalllao.
..ooo..oaaaaao..
.oaaao.aAaaAaao.
..ooaoaaaAaaAaao
....oaaaaaaaaaao
....oaaaaaaaaaao
....oawwaaaawwo.
.....oooooooooo.
"""]

WALK = ["""
.............o.o..
............oaoao.
..oo........oaaaao
.oao.......oagkagk
.oa.oooooooaaapaao
..ooaaAaaAaaaallo.
...oaaaAaaAaaaao..
...oaaaaaaaaaaao..
...oawo.oo.oawo...
...oo.....ooo.....
""", """
.............o.o..
............oaoao.
.oo.........oaaaao
oao........oagkagk
oa..oooooooaaapaao
.oooaaAaaAaaaallo.
...oaaaAaaAaaaao..
...oaaaaaaaaaaao..
....oawoowoowo....
.....oo..oo.oo....
"""]

SLEEP = """
................
...........o.o..
..ooooooooaoaao.
.oaaAaaAaaaaaao.
oaaaaaaaaaaAaAao
oaaaAaaAaaaaapao
.oaaaaaaaawwaao.
..oooooooooooo..
"""


def _canvas(art):
    rows = [r for r in art.strip('\n').split('\n')]
    w = max(len(r) for r in rows)
    c = Canvas(w, len(rows))
    c.sprite('\n'.join(r.ljust(w, '.') for r in rows), CAT_COLORS)
    return c


def cat_sit(frame=0):
    return _canvas(SIT[frame])


def cat_walk(frame=0):
    return _canvas(WALK[frame])


def cat_sleep():
    return _canvas(SLEEP)
