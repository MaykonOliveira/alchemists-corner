# Visual vetorial cozy (teste)

Segunda pele do jogo, em vetor de traço redondo, para comparar com o pixel art antes de decidir a troca.
Quem joga alterna em **Opções → Visual** (ou abrindo o jogo com `?visual=novo` / `?visual=classico`).
O padrão continua sendo o pixel art e nada do save muda.

## Como funciona

- Cada desenho é um SVG escrito em Python nas **mesmas unidades da cena** (384×216) e com os **mesmos nomes
  e medidas** dos quadros do atlas clássico (`src/assets/sprites/shop.json`).
- O `build.py` renderiza tudo em 4× com o resvg e grava em `src/assets/sprites/vector/`
  (`room.png`, `shop.png` + `shop.json`, `customer-*.png`, `icons.png`).
- No jogo, `src/game/phaser/art/hires.ts` avisa o Phaser que essas texturas valem 1/4 do tamanho
  (`logicalize`), então a cena usa as mesmas posições e escalas dos dois visuais. O canvas é criado
  maior e a câmera dá zoom (`config.ts`, `PhaserGame.tsx`). Isso depende de WebGL: sem ele o jogo
  fica no pixel art.
- A interface troca de cara só com `data-skin="vector"` no `<html>`: `src/app/skin-vector.css`
  redefine os tokens (cores, cantos, letras Baloo 2 e Nunito) e arredonda botões e cartões.

| Arquivo | Conteúdo |
|---|---|
| `vsvg.py` | Paleta, primitivas SVG, render (resvg), contorno de hover e a ampliação arredondada de reserva |
| `room_v.py` | Cenário de fundo, janela e tapetes |
| `objects_v.py` | Móveis, caldeirões, placas, luzes, melhorias, troféus, quadros, luminárias e plantas |
| `chars_v.py` | Fregueses, equipe, corvo, gato, familiares, momentos raros, chapéus e os retratos 16×16 |
| `items_v.py` | Poções (silhueta e cores tiradas do próprio pixel art), partículas e enfeites de estação |
| `icons_v.py` | Ícones da interface desenhados à mão |
| `build.py` | Monta os spritesheets; lista no final o que ainda saiu da ampliação automática |
| `preview.py` | Folha de conferência com clássico e vetor lado a lado |

## Gerar

```bash
pip install pillow resvg-py
python3 art/build.py          # só se a arte clássica mudou
python3 art/vector/build.py
```

Quando um quadro novo entrar no atlas clássico, ele aparece no vetorial como ampliação arredondada do
pixel art até ganhar desenho próprio (o build avisa). O teste `src/tests/app/skin.test.ts` falha se os
dois atlas saírem de sincronia.

## O que ainda é pixel art no visual novo

Capa (vitrine), cenas da história, vila, mapa do reino, cartão de compartilhar e 45 ícones da interface
(ingredientes, cidades e parte dos símbolos), que por enquanto usam a ampliação arredondada.
