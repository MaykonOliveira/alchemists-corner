# Arte do Alchemist's Corner

Pixel art original do jogo (PRD seção 6). Os arquivos `.py` desta pasta são os **fontes** da arte:
cada sprite é desenhado pixel a pixel (grades de texto para itens pequenos, primitivas de pincel para
o cenário e os móveis) usando a paleta definida em `pix.py`.

O jogo **não desenha nada em tempo de execução**: ele só carrega os spritesheets exportados para
`src/assets/sprites/`.

| Arquivo | Conteúdo |
|---|---|
| `room.py` | Cenário de fundo 384×216 (paredes, piso, janela com vista da rua, decoração, primeiro plano) |
| `objects.py` | Móveis interativos (armário, caldeirão, prateleiras, quadro, porta, balcão, caixa), placas, efeitos e melhorias |
| `customers.py` | 4 clientes-base, 3 quadros cada (parado + 2 passos), 18×40 |
| `items.py` | 6 poções (frasco de formato próprio por receita, 7×10 e 16×16) e 8 ingredientes 16×16 |
| `pix.py` | Paleta e primitivas (retângulo, elipse, dithering, contorno, sprite em texto) |
| `build.py` | Exporta tudo para `src/assets/sprites/` |

## Gerar os spritesheets

```bash
pip install pillow
python3 art/build.py
```

Saída:

- `room.png` — cenário de fundo.
- `shop.png` + `shop.json` — atlas (JSON Hash do Phaser) com móveis, contornos de hover, placas, efeitos e frascos.
- `customer-<arquétipo>.png` — folhas de animação dos clientes.
- `icons.png` + `icons.json` — ícones 16×16 de poções e ingredientes usados pela interface React.
- `layout.json` — posições que a cena precisa conhecer (lâmpadas do cordão de luzes, tábuas das prateleiras).

O `build.py` falha se alguma cor sair da paleta.
