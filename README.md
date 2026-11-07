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
- **Save automático** em IndexedDB com `saveVersion` 3, validação e migração.

## Celular

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
