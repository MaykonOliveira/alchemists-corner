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

## Late game (níveis 6 a 15 e além)

- **Nível máximo 15**, com algo novo em cada nível do 6 ao 15.
- **5 poções novas:** Poção da Sorte (nv 6), Elixir de Geada (nv 8), Poção Pena-leve (nv 10), Elixir Estelar (nv 12) e Elixir da Fênix (nv 14), cada uma com frasco próprio.
- **5 ingredientes novos:** raiz de mandrágora, cristal de geada, pluma de grifo, areia estelar e pena de fênix.
- **Cliente Nobre** (a partir do nível 8), que paga bem pelas poções caras, e o evento **Festival das Lanternas**. A partir do nível 10, a Corte e o Observatório fazem encomendas mais generosas.
- **5 melhorias novas**, todas visíveis na loja: estufa no quintal (ervas grátis toda manhã), alambique de prata (3 poções por lote), despensa encantada (+40 ingredientes, +12 poções), vitral arcano e sino encantado.
- **Maestria das receitas:** estrelas aos 10, 30, 70, 140 e 250 preparos. Cada estrela faz o cliente aceitar pagar 4% a mais, sobe o teto de preço e dá XP extra por venda.
- **Grimório do Mestre (tecla 8):** Selos de Mestre vêm dos níveis 11+, dos graus de Mestre (a cada 3000 XP depois do nível 15, sem fim), das receitas com 5 estrelas e das doações à Guilda. Os Selos compram 7 talentos permanentes. Moedas sobrando também patrocinam o festival.
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
  Ao completar: moedas, reputação, XP, um baú de ingredientes raros e, a partir do nível 12, 1 Selo de Mestre.
  Se vencer, o cliente paga metade do proporcional ao que recebeu e a loja perde reputação.
- Prints em `prints-expansoes/`.

## Celular

- **Venda com um toque:** quando um cliente chega, o pedido aparece sobre a loja (ou no topo do painel, no celular) com o botão Vender, o preço e se ele deve aceitar. Opções abre o balcão completo.
- **Barra com 5 abas** no celular (Armário, Caldeirão, Preços, Balcão e Mais); as outras ficam no menu Mais, com selo quando há novidade.
- **Avisos curtos:** no máximo 2 na tela, sem repetir e sempre dentro do palco.
- **Velocidade 2×** durante o expediente e cartão de **bem-vindo de volta** ao continuar a partida.

O layout se adapta a telas estreitas (palco em cima e painel embaixo) e a celular deitado (painel lateral compacto). O toque funciona no canvas e nos painéis. Já existem `manifest.webmanifest` e ícone, então dá para instalar como app web. Para gerar um app nativo depois:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Alchemist's Corner" com.seudominio.alchemistscorner --web-dir dist
npm run build && npx cap add android && npx cap sync
```

## Arquitetura

- `src/domain/`: tipos, dados (ingredientes, receitas, arquétipos, melhorias) e regras puras. Não depende de React nem de Phaser.
- `src/store/gameStore.ts`: estado canônico. React e Phaser enviam comandos tipados (`OPEN_SHOP`, `TICK`, `OPEN_PANEL`…).
- `src/game/phaser/`: cenas, arte gerada, hotspots e entidades. Só lê o store e envia comandos.
- `src/features/`: painéis React por domínio.
- `src/persistence/`: Dexie, migrações.

Em modo dev, `window.__store` expõe o store no console.

- `src/audio/`: efeitos e música sintetizados com WebAudio.
- `src/game/events.ts`: eventos das regras para sons e animações (nunca alteram a economia).
