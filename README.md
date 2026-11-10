# Alchemist's Corner

Jogo cozy de gerenciamento de uma loja de alquimia, no navegador. Veja o PRD para a visão completa.

## Como rodar

```bash
npm install
npm run dev        # servidor local em http://localhost:5173
npm test           # testes de domínio e persistência (Vitest)
npm run build      # build de produção em dist/
SIM_REPORT=1 npx vitest run src/tests/balance/report.test.ts --silent=false   # relatório de balanceamento
```

## Balanceamento

Um robô-jogador (`src/tests/balance/bot.ts`) joga vários dias usando só as regras puras do domínio, com dois perfis: **casual** (atende devagar e cobra o preço-base) e **eficiente** (atende rápido e cobra 10% a mais). Há ainda o perfil **distraído** (joga como o casual até o dia 5 e depois demora 20–45 s para atender e só prepara antes de abrir), com e sem ajudantes, que mede o valor das automações. `balance.test.ts` garante as metas do PRD: o primeiro dia cabe em 10 minutos e dá lucro, o nível 2 chega no fim do dia 1, e a primeira melhoria fica ao alcance depois do dia 2, sem estar disponível já no fim do dia 1. Também garante que o golem segura os clientes do jogador distraído e que os ajudantes aumentam a receita dele em mais de 20%.

## O que já dá para jogar (MVP completo)

- **Loop do dia:** preparação → expediente (~6 min reais, luz de manhã a noite) → fechamento com relatório → próximo dia.
- **Fornecedor:** 8 ingredientes em 4 famílias, compra com +/−, estoque diário para itens raros e itens liberados por nível.
- **Caldeirão:** 6 receitas, preparo em lotes (2 poções por lote) com tempo, líquido colorido e barra de progresso.
- **Prateleiras e preços:** preço por poção entre 0,8× e 1,3× do preço-base, capacidade e opção de tirar da venda.
- **Clientes:** 4 arquétipos com orçamento, paciência e pedido próprio. Aceitam, pechincham com contraproposta ou vão embora. Poção parecida pode substituir.
- **Progressão:** XP e níveis que liberam receitas, ingredientes e melhorias. A reputação aumenta o movimento e a disposição a pagar.
- **5 melhorias** (4 funcionais e 1 visual), e todas aparecem na loja.
- **3 ajudantes automáticos** (aparecem animados na loja, recebem salário diário e podem ser mandados descansar):
  - **Corvo entregador** (nível 3, 600 moedas, 8/dia): a cada hora de jogo confere o armário e busca no fornecedor o que está acabando (2 lotes de cada receita conhecida), com taxa de 3 moedas por viagem e sem gastar as últimas 40 moedas.
  - **Aprendiz de alquimia** (nível 4, 1000 moedas, 12/dia): quando o caldeirão fica livre, prepara a poção mais em falta (até 6 por receita), com prioridade para o pedido especial.
  - **Golem balconista** (nível 5, 1400 moedas, 15/dia): atende quem espera há mais de 4 s com a melhor poção a um preço aceitável, aceita contrapropostas e, sem a poção certa, dispensa com educação (sem perder reputação).
- **Pedidos especiais** no quadro de avisos, **eventos do dia** (feira, caravana, chuva) e **bancada de experimentos** com pistas.
- **Polimento:** tutorial de 7 passos, sons e música sintetizados (sem arquivos), configurações (volume, música, reduzir animações), atalhos de teclado e avisos.
- **Sem game over:** a manutenção nunca deixa o saldo negativo e há sempre ingredientes básicos baratos.
- **Save automático** em IndexedDB com `saveVersion` 4, validação e migração.

## Melhorias da auditoria de Game Director

O jogo passou por uma auditoria de design (nota 5,4/10). As mudanças que vieram dela:

- **Primeiro dia guiado** e **ritmo do expediente** sem esperas mortas.
- **Preço por freguês:** no balcão você pode dar desconto, cobrar a etiqueta ou pedir mais. A nobre paga, o viajante pechincha,
  o morador e o freguês fiel nunca pagam acima da etiqueta.
- **Demanda que pressiona a oferta:** o caldeirão não dá conta de tudo, cada receita tem limite na prateleira e a **procura do dia** muda.
- **Pedidos por sintoma** a partir do dia 2: o cliente conta o problema e você deduz a poção (acertar dá gorjeta).
- **Descoberta na bancada:** o nível deixa uma pista; a receita entra no livro quando você acerta a mistura.
- **Tutorial de decisões** nos dias 2 a 4 (sintoma, nobre, pechincha) e **rostos** com expressão para todos os clientes.
- **Fregueses fiéis com história:** 5 capítulos por freguês, um por coração.
- **Menos medidores:** Selos viraram Cristais de luar, metas/baú/trilha viraram o Diário e o Concurso Real mora na Vila.
- **Fim de jogo:** cada etapa da vila é uma encomenda de poções.

## Late game (níveis 6 a 15 e além)

- **Nível máximo 15**, com algo novo em cada nível do 6 ao 15.
- **5 poções novas:** Poção da Sorte (nv 6), Elixir de Geada (nv 8), Poção Pena-leve (nv 10), Elixir Estelar (nv 12) e Elixir da Fênix (nv 14), cada uma com frasco próprio.
- **5 ingredientes novos:** raiz de mandrágora, cristal de geada, pluma de grifo, areia estelar e pena de fênix.
- **Cliente Nobre** (a partir do nível 8), que paga bem pelas poções caras, e o evento **Festival das Lanternas**. A partir do nível 10, a Corte e o Observatório fazem encomendas mais generosas.
- **5 melhorias novas**, todas visíveis na loja: estufa no quintal (ervas grátis toda manhã), alambique de prata (3 poções por lote), despensa encantada (+40 ingredientes, +12 poções), vitral arcano e sino encantado.
- **Maestria das receitas:** estrelas aos 10, 30, 70, 140 e 250 preparos. Cada estrela faz o cliente aceitar pagar 4% a mais, sobe o teto de preço e dá XP extra por venda.
- **Grimório do Mestre (área Progresso, tecla 9):** desperta no nível 11 (ou com a primeira receita dominada). Níveis 11+, graus de Mestre (a cada 3000 XP depois do nível 15, sem fim), receitas com 5 estrelas, contratos e doações à Guilda rendem **10 Cristais de luar** cada. Talentos custam cristais (10, 20, 30…), os mesmos da decoração. Moedas sobrando também patrocinam o festival.
- Saves antigos migram para a `saveVersion` 4: as receitas dos níveis já alcançados entram direto, a maestria é estimada pelas vendas dos relatórios e a XP acumulada no nível 10 fica guardada na porta do 11.

## Loja que reage

- Cada venda faz moedas saltarem do cliente até o caixa; vendas acima do preço-base ganham brilho dourado. O saldo no HUD pula e mostra a diferença.
- Clientes ficam com cara zangada e tremem quando a paciência está acabando; o atendimento rápido mostra o humor.
- Ao terminar um preparo, sai fumaça na cor da poção e os frascos voam até as prateleiras.
- O fechamento conta o lucro do zero, dá medalha de ouro, prata ou bronze (comparando com a média dos 7 dias anteriores), avisa recorde e mostra o gráfico da semana.

## Expansões e contratos

- **Expansão da loja em 3 etapas** (aba Melhorias), cada uma abre a próxima e aparece na cena:
  - **Sala dos fundos** (nível 9): um segundo caldeirão, de cobre. Dois preparos ao mesmo tempo, inclusive pelo aprendiz.
  - **Balcão duplo** (nível 11): uma ala extra do balcão com balança. Até 4 clientes esperando e 10% mais movimento.
  - **Torre do alquimista** (nível 13): um astrolábio dourado gira sobre a loja. Preços +8% e contratos pagam 25% a mais.
- **Contratos de vários dias** (quadro de avisos, a partir do nível 6): 2 ou 3 receitas em quantidade. Aceite e entregue aos poucos em até 3 dias.
  Ao completar: moedas, reputação, XP, um baú de ingredientes raros e, a partir do nível 12, 10 Cristais de luar.
  Se vencer, o cliente paga metade do proporcional ao que recebeu e a loja perde reputação.
- Prints em `prints-expansoes/`.

## Mundo vivo

- **Fregueses fiéis**: 6 personagens com nome (Dona Célia, Bram, Lia, Tobias, Vovô Zé e a Condessa) que voltam pedindo a favorita.
  Cada entrega da favorita vale um coração: com 3 deixam gorjeta (15%), com 5 viram amigos e trazem um presente de ingredientes raros.
  Na loja, o balão deles tem um coraçãozinho; no atendimento aparecem o nome e os corações.
- **Estações** (7 dias cada): primavera (cura), verão (vigor), outono (mente) e inverno (utilidade). A categoria da estação é mais procurada
  e paga 12% a mais, a partir do dia 3. Pela janela caem pétalas, brilhos de sol, folhas ou neve.
- **Álbum** (área Mundo, tecla A): estação atual, fichas dos fregueses e 18 conquistas.
- **Gato da loja**: passeia, senta, pisca e dorme no tapete à noite. Um toque faz carinho; uma vez por dia ele dá sorte (+1 reputação).
- Prints em `prints-mundo-vivo/`.

## A rua da loja (área Mundo, tecla R)

- **Poções da estação** (nível 5): cada estação traz um ingrediente raro que o fornecedor só vende nela
  (pétala-da-aurora, fruta-do-sol, folha rubra e flor-de-neve) e uma poção própria: Néctar da Primavera, Refresco Solar,
  Chá da Colheita e Poção Aurora Boreal. Depois que a loja prepara a primeira, ela vira a sensação da rua (1 em cada 5 clientes pede).
- **Madame Vesper**, a rival (nível 4, a partir do dia 8): toda semana o placar soma vendas e pedidos das duas lojas.
  A rival fatura um pouco acima da sua média recente. Vencer dá moedas, reputação e ingredientes raros; perder não tira nada.
- **Eventos raros** (nível 5, cerca de 1 em cada 8 dias): Eclipse (elixires de mente valem 1,8×), Mercado da Lua Cheia
  (ingredientes das quatro estações e itens raros a mais) e Visitante Misterioso (pedido do dia que paga 10 Cristais de luar e um achado lendário).
  Eclipse e lua aparecem na janela da loja.
- **Expedições do corvo**: Floresta (1 dia), Cavernas (2 dias, nível 6) e Pico dos Grifos (3 dias, nível 9). Enquanto viaja ele não faz entregas.
  Volta com ingredientes raros e, às vezes, um dos 9 achados do gabinete.
- 5 conquistas novas no álbum. Save v7. Regras em `src/domain/rules/street.ts`, dados em `src/domain/data/street.ts`, arte em `art/seasonal.py`.
- Prints em `prints-rua/`.

## Primeiros passos, metas e dicas

- **História de abertura:** numa partida nova, três quadros em pixel art (a carta do antigo dono, a loja empoeirada,
  o caldeirão aceso) contam como a loja chegou até você. Dá para pular. Saves antigos não veem a história.
- **Tutorial na cena:** cada passo do tutorial acende o objeto certo da loja (contorno pulsando e seta) e o botão que
  precisa ser tocado na interface (anel dourado). No celular, com um painel aberto, a dica sobe para cima da cena.
- **Diário da loja** (área Progresso, tecla 7; as metas também aparecem no Início): metas do dia, baú da semana e trilha da temporada juntos. As **metas do dia** são três metas por dia sorteadas com a semente do dia
  (vender, faturar, vender de uma categoria, preparar uma receita, atender sem trocar a poção, entregar o pedido, carinho no gato).
  Cada uma paga moedas e XP na hora. O primeiro dia acompanha o tutorial.
- **Baú da semana:** 10 metas cumpridas na semana abrem o baú (moedas e ingredientes raros que a loja já pode comprar).
- **Dicas de contexto:** aparecem uma vez quando a situação pede, por exemplo prateleira vazia, armário ou prateleira cheios
  (os ajudantes param), cliente impaciente, pedido especial, corvo disponível, rival e poção da estação.
- Save v8. Regras em `src/domain/rules/goals.ts`, dicas em `src/domain/data/tips.ts`, arte em `art/story.py`. Prints em `prints-metas/`.

## Som da loja

- **Trilha por estação**, toda sintetizada em WebAudio (sem arquivos): Jardim em flor (primavera), Estrada ensolarada (verão),
  Folhas e livros (outono) e Noite de neve (inverno). Lampiões acesos toca depois das 18h30 e no fechamento, Festival das Lanternas
  no festival e Céu estranho nos eventos raros. Na preparação toca uma versão calma; a troca entre temas é em crossfade.
- **Ambiente em camadas:** chuva, vento (inverno e eclipse), multidão (feira, festival, caravana, lua cheia), pássaros (dia de primavera e verão),
  caldeirão borbulhando enquanto há preparo e lareira (outono, inverno e noite).
- **Sons de recompensa:** moeda (venda grande soa diferente), fanfarra de nível, medalha de conquista, sino de pedido, vitória e derrota na rival,
  troca de estação, coração do gato.
- **Mixer** em *Configurações*: volume de música, efeitos e ambiente, liga/desliga, "Tocando agora" e vibração no celular
  (venda, nível, conquista, pedido e vitória na rival).
- Lógica pura em `src/audio/mood.ts` (testada em `src/tests/domain/audio.test.ts`); síntese em `src/audio/sound.ts`. Prints em `prints-som/`.

## Jogar em qualquer lugar

- **GitHub Pages:** a cada merge na `main`, a Action `.github/workflows/pages.yml` roda os testes, gera o build e publica em
  https://maykonoliveira.github.io/alchemists-corner/. Para ativar (uma vez): *Settings → Pages → Build and deployment → Source: GitHub Actions*.
- **Offline e instalável:** o service worker (`public/sw.js`) guarda todos os arquivos do build na primeira visita
  (lista em `precache.json`, gerada pelo Vite). Depois o jogo abre sem internet. Ícones PNG 192 e 512 para instalar no celular.
  Ele só é registrado no build de produção e fora de iframes.
- **Levar a partida:** *Configurações → Levar a partida* gera um código (`AC1z.` + JSON comprimido) ou baixa um arquivo `.json`.
  No menu, *Importar save* aceita o código ou o arquivo, mostra o resumo (dia, nível, moedas) e carrega. A importação usa a
  mesma validação e migração do carregamento normal (`src/persistence/saveTransfer.ts`).
- **Tela de título** com poções flutuando, Importar/Exportar save, Instalar como app (quando o navegador oferece) e créditos.
- Prints em `prints-levar-o-save/`.

## Celular

- **Venda com um toque:** quando um cliente chega, o pedido aparece sobre a loja (ou no topo do painel, no celular) com o botão Vender, o preço e se ele deve aceitar. Opções abre o balcão completo.
- **Barra com 5 botões** no celular: Início e as 4 áreas (veja Navegação).
- **Avisos curtos:** no máximo 2 na tela, sem repetir e sempre dentro do palco.
- **Velocidade 2×** durante o expediente e cartão de **bem-vindo de volta** ao continuar a partida.

O layout se adapta a telas estreitas (palco em cima e painel embaixo) e a celular deitado (painel lateral compacto). O toque funciona no canvas e nos painéis. Já existem `manifest.webmanifest` e ícone, então dá para instalar como app web. Para gerar um app nativo depois:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Alchemist's Corner" com.seudominio.alchemistscorner --web-dir dist
npm run build && npx cap add android && npx cap sync
```

## Vontade de começar e de voltar (fase 3)

- **Primeiros 5 minutos:** depois da história, o jogador dá nome à loja e escolhe a cor do toldo. O tutorial começa por uma
  venda (já há poções na prateleira), o primeiro dia corre 2× mais rápido, a Condessa Amélia aparece às 14h e paga 10× o preço,
  e o dia 1 sempre termina no nível 2. Os níveis 2 a 5 trazem um presente (moedas, cristais, ingredientes).
- **Voltar amanhã:** ao reabrir depois de 10 minutos (até 8 horas contam), o **livro do caixa** mostra o que o golem vendeu e o
  que o aprendiz preparou. Há um **presente de visita** por dia real (calendário de 7), **cartas** dos fregueses que visitaram a
  loja e uma prévia de **amanhã na loja** no fechamento. Nada se perde se o jogador faltar um dia.
- **Decoração** (área Mundo, tecla T): **cristais de luar** são a única moeda de prestígio. Vêm das metas, do baú, das conquistas, dos presentes,
  dos níveis altos, das receitas dominadas e, no teto de reputação, de cada 25 pontos a mais. Só se ganham jogando (nunca são vendidos). Compram talentos no Grimório e decoração: tapete, quadro, luminária, planta e toldo aparecem na cena, e alguns dão **encanto** (+1 de reputação
  por dia, até 3). A **trilha** de 28 dias reais (no Diário da loja) tem 30 recompensas grátis. No último dia de cada estação há uma **festa** com um
  convidado especial e uma lembrança.
- **Mostrar a loja:** cartão 1080×1080 com a foto da loja para compartilhar ou baixar; **presentes entre amigos** por código
  (`AC1g.…`, um por dia); **desafio da semana** com a mesma semente para todos os jogadores. Prévia de link (`og-image.png`).
- **Alicerce para monetizar:** catálogo em `src/domain/data/catalog.ts`, posse em `src/domain/rules/entitlements.ts` e a
  interface de loja em `src/monetization/entitlements.ts` (`PURCHASES_ENABLED = false`). Princípios: nada de caixas pagas,
  energia, espera paga, vantagem paga ou sequência que zera. O funil (`src/analytics/funnel.ts`) fica só no aparelho e aparece em
  *Configurações → Números deste aparelho*.
- Save versão 9, com migração. Prints em `prints-fase3/`.

## Arquitetura

- `src/domain/`: tipos, dados (ingredientes, receitas, arquétipos, melhorias) e regras puras. Não depende de React nem de Phaser.
- `src/store/gameStore.ts`: estado canônico. React e Phaser enviam comandos tipados (`OPEN_SHOP`, `TICK`, `OPEN_PANEL`…).
- `src/game/phaser/`: cenas, arte gerada, hotspots e entidades. Só lê o store e envia comandos.
- `src/features/`: painéis React por domínio.
- `src/persistence/`: Dexie, migrações.

Em modo dev, `window.__store` expõe o store no console.

- `src/audio/`: efeitos e música sintetizados com WebAudio.
- `src/game/events.ts`: eventos das regras para sons e animações (nunca alteram a economia).

## Navegação

As 13 telas ficam em 4 áreas com nome fixo, iguais no computador e no celular (mapa em `src/app/layout/nav.ts`):

| Área | Telas (tecla) |
| --- | --- |
| ⚗️ Oficina | Armário (1), Caldeirão (2), Receitas (3) |
| 🛎️ Loja | Prateleiras (4), Balcão (5), Pedidos (6) |
| 🎯 Progresso | Diário (7), Melhorias (8), Grimório (9), Relatório (0) |
| 🗺️ Mundo | Rua (R), Vila e Concurso Real (V, C), Decoração (T), Álbum (A) |

- **Computador:** a barra de baixo mostra as áreas como grupos coloridos, com todas as telas e as teclas. Esc volta ao Início.
- **Celular:** 5 botões grandes (Início, Oficina, Loja, Progresso, Mundo). Tocar numa área abre a tela que tem novidade, senão a última que você abriu ali.
- **Dentro de cada painel:** o nome da área no topo e abas para as outras telas da mesma área.
- **Início:** o resumo do dia virou "O que fazer agora". Cada linha leva à tela certa e a próxima tarefa vem destacada; embaixo, o mapa das 4 áreas.

## Idiomas (português e inglês)

O jogo tem versão em português e em inglês. O idioma segue o navegador na primeira visita e pode ser trocado no menu ou nas Configurações (a troca recarrega o jogo, o save não muda).

- Todo texto que aparece na tela passa por `tr('frase em português')`, de `src/i18n`. Valores entram como `{0}`, `{1}`…: `tr('Venda {0} poções', n)`.
- A tradução fica em `src/i18n/en.ts`, indexada pela frase em português.
- O teste `src/tests/app/i18n.test.ts` falha se uma frase nova não tiver tradução, se a tradução perder um `{0}` ou se o dicionário guardar frase que o jogo não usa mais.
- As placas da porta (OPEN/CLOSED) e a vitrine do menu têm versão em inglês desenhada em `art/` (`python3 art/build.py`).
