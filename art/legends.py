"""Pacote U: as seis receitas lendárias.

Reaproveita os formatos de frasco do livro com rampas novas de líquido e a rolha dourada
(o 's' de ouro no lugar de 'c'/'C'), para a lenda se destacar na prateleira.
Registra tudo nas tabelas de items.py, como seasonal.py e royal.py.
"""
from pix import P
import pix
import items as I

P.update({
    'le0': '#1e3a3a', 'le1': '#3a6e6a', 'le2': '#6ab0a0', 'le3': '#a8e0d0', 'le4': '#e8fff8',  # eco
    'lg0': '#4a2a10', 'lg1': '#8a4a1a', 'lg2': '#c87a30', 'lg3': '#e8b070', 'lg4': '#fff0d0',  # gigante
    'li0': '#4a4a5a', 'li1': '#7a7a90', 'li2': '#b0b0c8', 'li3': '#dcdcf0', 'li4': '#ffffff',  # invisível
    'lm0': '#0a3a4a', 'lm1': '#1a7a8a', 'lm2': '#3ac0c0', 'lm3': '#90f0e0', 'lm4': '#f0fff8',  # sereia
    'ld0': '#2a1040', 'ld1': '#5a2a80', 'ld2': '#a050c0', 'ld3': '#e08ae0', 'ld4': '#ffd8f8',  # sonhos
    'lr0': '#3a0808', 'lr1': '#7a1010', 'lr2': '#c82a1a', 'lr3': '#f07a30', 'lr4': '#ffe070',  # dragão
})
pix.PALETTE_SET.update({pix.rgba(v)[:3] for v in P.values()})

# lenda: (rampa, formato emprestado de uma receita do livro)
LEGENDS = {
    'elixir-eco': ('le', 'elixir-concentracao'),
    'tonico-gigante': ('lg', 'tonico-energia'),
    'pocao-invisivel': ('li', 'pena-leve'),
    'balsamo-sereia': ('lm', 'balsamo-calmante'),
    'elixir-sonhos': ('ld', 'elixir-estelar'),
    'elixir-dragao': ('lr', 'elixir-fenix'),
}


def _gold_cork(shape):
    return shape.replace('c', 's').replace('C', 's')


for rid, (ramp, base) in LEGENDS.items():
    I.LIQ[rid] = tuple(f'{ramp}{i}' for i in range(5))
    I.SMALL[rid] = _gold_cork(I.SMALL[base])
    I.ICON[rid] = _gold_cork(I.ICON[base])
