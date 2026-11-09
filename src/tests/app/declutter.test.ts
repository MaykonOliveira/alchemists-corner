import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../domain/rules/initialState';
import { TUTORIAL_DONE, useGameStore, type StoreState } from '../../store/gameStore';
import { stageCards } from '../../features/tutorial/stage';
import { NAV_GROUPS, panelsInTab, tabOf, tabsOf } from '../../app/layout/nav';
import type { Customer, GameSave } from '../../domain/models/types';

/**
 * Despoluir (D7): regras que seguram a interface limpa.
 * - nunca dois cartões sobre a cena ao mesmo tempo (fora o tutorial, que só aparece sozinho);
 * - a dica só aparece no Início;
 * - cada área tem no máximo 4 abas, e as telas que moram em outra aparecem nela.
 */
const customer: Customer = { id: 'c1', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1, patienceMs: 30000, waitedMs: 0, offer: null, remark: null };

function state(save: Partial<GameSave>, ui: Partial<StoreState['ui']> = {}): StoreState {
  const base = useGameStore.getState();
  return { ...base, save: { ...createNewGame(), tutorialStep: TUTORIAL_DONE, storySeen: true, ...save }, ui: { ...base.ui, ...ui } };
}

describe('uma camada por vez sobre a cena', () => {
  const cases: [string, StoreState][] = [
    ['início calmo', state({})],
    ['bem-vindo com cliente', state({ phase: 'expediente', customers: [customer] }, { welcome: true, selectedCustomerId: 'c1' })],
    ['cliente no balcão', state({ phase: 'expediente', customers: [customer] }, { selectedCustomerId: 'c1' })],
    ['painel aberto', state({}, { activePanel: 'shelves' })],
    ['tutorial com cliente', state({ phase: 'expediente', customers: [customer], tutorialStep: 1 }, { selectedCustomerId: 'c1' })],
  ];
  it.each(cases)('%s: no máximo um cartão', (_, st) => {
    const c = stageCards(st);
    const shown = [c.welcome, c.customer, c.tip].filter(Boolean).length;
    expect(shown).toBeLessThanOrEqual(1);
    if (c.tutorial) expect(c.welcome || c.tip).toBe(false);
  });

  it('a dica só aparece no Início, e espera o capítulo do Concurso', () => {
    expect(stageCards(state({})).tip).toBe(true);
    expect(stageCards(state({}, { activePanel: 'ingredients' })).tip).toBe(false);
    const royal = { ...(createNewGame().royal ?? {}), chapter: 1, seen: 0 } as GameSave['royal'];
    expect(stageCards(state({ royal })).tip).toBe(false);
  });
});

describe('navegação em dois níveis', () => {
  it('cada área tem no máximo 4 abas (Progresso caiu de 5 para 2)', () => {
    for (const g of NAV_GROUPS) expect(tabsOf(g).length).toBeLessThanOrEqual(4);
    expect(tabsOf(NAV_GROUPS.find((g) => g.id === 'progresso')!).map((i) => i.panel)).toEqual(['goals', 'upgrades']);
  });

  it('o Grimório mora em Melhorias e o Concurso em Metas', () => {
    expect(tabOf('grimoire')).toBe('upgrades');
    expect(tabOf('royal')).toBe('goals');
    expect(panelsInTab('goals')).toEqual(['goals', 'royal']);
    expect(tabOf('shelves')).toBe('shelves');
  });
});
