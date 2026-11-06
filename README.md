# Alchemist's Corner

Jogo cozy de gerenciamento de uma loja de alquimia, no navegador. Veja o PRD para a visão completa.

## Como rodar

```bash
npm install
npm run dev        # servidor local em http://localhost:5173
npm test           # testes de domínio e persistência (Vitest)
npm run build      # build de produção em dist/
```

## O que já dá para jogar (MVP completo)

- **Loop do dia:** preparação → expediente (~6 min reais, luz de manhã a noite) → fechamento com relatório → próximo dia.
- **Fornecedor:** 8 ingredientes em 4 famílias, compra com +/−, estoque diário para itens raros e itens liberados por nível.
- **Caldeirão:** 6 receitas, preparo em lotes (2 poções por lote) com tempo, líquido colorido e barra de progresso.
- **Prateleiras e preços:** preço por poção entre 0,8× e 1,3× do preço-base, capacidade e opção de tirar da venda.
- **Clientes:** 4 arquétipos com orçamento, paciência e pedido próprio. Aceitam, pechincham com contraproposta ou vão embora. Poção parecida pode substituir.
- **Progressão:** XP e níveis que liberam receitas, ingredientes e melhorias. A reputação aumenta o movimento e a disposição a pagar.
- **5 melhorias** (4 funcionais e 1 visual), e todas aparecem na loja.
- **Pedidos especiais** no quadro de avisos, **eventos do dia** (feira, caravana, chuva) e **bancada de experimentos** com pistas.
- **Polimento:** tutorial de 7 passos, sons e música sintetizados (sem arquivos), configurações (volume, música, reduzir animações), atalhos de teclado e avisos.
- **Sem game over:** a manutenção nunca deixa o saldo negativo e há sempre ingredientes básicos baratos.
- **Save automático** em IndexedDB com `saveVersion` 2, validação e migração.

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
