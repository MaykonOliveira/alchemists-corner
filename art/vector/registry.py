"""Registro dos desenhos vetoriais: nome do quadro (o mesmo do atlas clássico) → função que devolve o SVG."""
SPRITES = {}


def sprite(*names):
    def deco(fn):
        for n in names:
            SPRITES[n] = fn
        return fn
    return deco


def variants(pattern, values):
    """Registra uma função parametrizada: variants('fire-{}', range(3)) chama fn(valor)."""
    def deco(fn):
        for v in values:
            SPRITES[pattern.format(v)] = (lambda vv: (lambda: fn(vv)))(v)
        return fn
    return deco
