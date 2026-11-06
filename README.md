# Alchemist's Corner

Jogo cozy de gerenciamento de uma loja de alquimia, no navegador. Veja o PRD para a visão completa.

## Como rodar

```bash
npm install
npm run dev        # servidor local em http://localhost:5173
npm test           # testes de domínio e persistência (Vitest)
npm run build      # build de produção em dist/
```

## Estado atual: Fases 0 e 1 do PRD

- **Fundação:** Vite + TypeScript + React + Phaser 3 + Zustand + Dexie, na estrutura da seção 10.3.
- **Cenário:** loja em pixel art original, desenhada em código (`src/game/phaser/art/`), em 384×216 com zoom inteiro e sem suavização.
- **Hotspots:** armário, caldeirão, 2 prateleiras, quadro de avisos, porta, balcão e caixa. Cada um tem os estados normal, hover (contorno claro + tooltip) e acionado (contorno dourado + afundar 1px).
- **HUD e painéis:** barra superior (dia, fase, relógio, moedas, reputação, nível), painel lateral contextual e barra inferior de atalhos (teclas 1–5, Esc fecha, espaço pausa).
- **Dia de loja:** preparação → expediente (relógio corre ~6 min reais, a luz vai de manhã à noite, clientes visuais entram, pedem e saem) → fechamento → próximo dia.
- **Save automático** em IndexedDB com `saveVersion`, validação e migração.

Provisório: os clientes ainda são só visuais, e os botões Preparar e Vender ficam desativados até as Fases 2 e 3.

## Arquitetura

- `src/domain/`: tipos, dados (ingredientes, receitas, arquétipos, melhorias) e regras puras. Não depende de React nem de Phaser.
- `src/store/gameStore.ts`: estado canônico. React e Phaser enviam comandos tipados (`OPEN_SHOP`, `TICK`, `OPEN_PANEL`…).
- `src/game/phaser/`: cenas, arte gerada, hotspots e entidades. Só lê o store e envia comandos.
- `src/features/`: painéis React por domínio.
- `src/persistence/`: Dexie, migrações.

Em modo dev, `window.__store` expõe o store no console.
