import { describe, expect, it } from 'vitest';
import { nextTip } from '../../domain/data/tips';
import type { GameSave } from '../../domain/models/types';
import { maxBatches, repeatBatches } from '../../domain/rules/alchemy';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, cmds: DomainCommand[]) => {
  let save = s;
  for (const c of cmds) save = applyCommand(save, c, ctx).save;
  return save;
};

describe('caldeirão que não para (pacote O)', () => {
  it('guarda o último preparo e repete com um toque', () => {
    const s0 = { ...createNewGame(1), storySeen: true, tutorialStep: 7 };
    s0.ingredients = { ...s0.ingredients, 'folha-lunar': 20, 'po-de-pedra': 20 };
    const s1 = run(s0, [{ type: 'START_BREW', recipeId: 'cura-simples', batches: 2 }]);
    expect(s1.lastBrew).toEqual({ recipeId: 'cura-simples', batches: 2 });
    expect(repeatBatches(s1)).toBe(0); // ocupado
    const free = { ...s1, brew: null };
    expect(repeatBatches(free)).toBe(2);
    const s2 = run(free, [{ type: 'REPEAT_BREW' }]);
    expect(s2.brew?.recipeId).toBe('cura-simples');
    expect(s2.brew?.batches).toBe(2);
  });

  it('repete só o que os ingredientes permitem', () => {
    const s = { ...createNewGame(1), lastBrew: { recipeId: 'cura-simples', batches: 5 } };
    expect(repeatBatches(s)).toBe(Math.min(5, maxBatches(s, 'cura-simples')));
    const empty = { ...s, ingredients: {} };
    expect(repeatBatches(empty)).toBe(0);
    expect(run(empty, [{ type: 'REPEAT_BREW' }]).brew).toBeNull();
  });
});

describe('dicas (pacote N)', () => {
  it('no máximo uma dica por dia', () => {
    const s0 = { ...createNewGame(1), day: 2, storySeen: true, tutorialStep: 7, potions: [], brew: null };
    const tip = nextTip(s0);
    expect(tip).not.toBeNull();
    const s1 = run(s0, [{ type: 'SEE_TIP', tipId: tip!.id }]);
    expect(nextTip(s1)).toBeNull();
    expect(nextTip({ ...s1, day: 3 })).not.toBeNull();
  });
});

describe('dia honesto (pacote P)', () => {
  const rep = (day: number, profit: number, served: number, lost: number) => ({
    day, profit, revenue: profit, ingredientCost: 0, orderRewards: 0, maintenance: 0, salesByRecipe: {},
    customersServed: served, customersLost: lost, reputationDelta: 0, xpGained: 0, levelUps: 0,
  });
  it('muitos clientes perdidos tiram degraus da medalha', async () => {
    const { dayMedal } = await import('../../domain/rules/medals');
    expect(dayMedal([rep(1, 200, 10, 0)]).medal).toBe('ouro');
    expect(dayMedal([rep(1, 200, 5, 7)]).medal).toBe('prata');
    expect(dayMedal([rep(1, 200, 3, 10)]).medal).toBe('bronze');
  });
  it('o atendimento rápido não usa as poções do pedido especial', async () => {
    const { bestOffer } = await import('../../domain/rules/customers');
    const s = { ...createNewGame(1), potions: [{ recipeId: 'cura-simples', quantity: 3, forSale: true }] } as GameSave;
    const c = { wantedRecipeId: 'cura-simples' } as Parameters<typeof bestOffer>[1];
    expect(bestOffer(s, c)).toBe('cura-simples');
    const withOrder = { ...s, order: { id: 'x', client: 'C', text: '', recipeId: 'cura-simples', qty: 4, rewardCoins: 1, rewardRep: 1, rewardXp: 1, dueDay: 3 } };
    expect(bestOffer(withOrder, c)).toBeNull();
    const plenty = { ...withOrder, potions: [{ recipeId: 'cura-simples', quantity: 6, forSale: true }] } as GameSave;
    expect(bestOffer(plenty, c)).toBe('cura-simples');
  });
});
