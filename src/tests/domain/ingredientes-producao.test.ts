import { describe, expect, it } from 'vitest';
import type { GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { missingPurchase, supplierLeft } from '../../domain/rules/economy';
import { createNewGame } from '../../domain/rules/initialState';
import { xpForLevel } from '../../domain/rules/progression';
import { RECIPES } from '../../domain/data/recipes';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, cmds: DomainCommand[]) => {
  let save = s;
  for (const c of cmds) save = applyCommand(save, c, ctx).save;
  return save;
};
const base = (): GameSave => ({ ...createNewGame(1), storySeen: true, tutorialStep: 7 });

describe('subir de nível no meio do dia', () => {
  it('o fornecedor já traz hoje os ingredientes do nível novo', () => {
    const s0 = { ...base(), level: 2, xp: xpForLevel(3) - 1, phase: 'expediente' as const };
    expect(supplierLeft(s0, 'escama-salamandra')).toBe(0);
    s0.ingredients = { 'folha-lunar': 10, 'po-de-pedra': 10 };
    // Um preparo rende XP e sobe para o nível 3.
    let s = run(s0, [{ type: 'START_BREW', recipeId: 'cura-simples', batches: 1 }]);
    s = run(s, [{ type: 'ADVANCE', ms: 15_000 }]);
    expect(s.level).toBe(3);
    expect(supplierLeft(s, 'escama-salamandra')).toBeGreaterThan(0);
    // A pista nova do nível 3 dá para testar com o que o fornecedor tem.
    const nova = RECIPES.find((r) => r.unlockLevel === 3)!;
    expect(s.recipeHints).toContain(nova.id);
    expect(missingPurchase({ ...s, coins: 9999 }, nova.id, 1).error).toBeNull();
  });
});

describe('comprar o que falta na produção', () => {
  it('compra exatamente o que falta e cobra o preço do fornecedor', () => {
    const s0 = { ...base(), coins: 500, ingredients: { 'folha-lunar': 1 } };
    const plan = missingPurchase(s0, 'cura-simples', 3);
    expect(plan.error).toBeNull();
    const s = run(s0, [{ type: 'BUY_MISSING', recipeId: 'cura-simples', batches: 3 }]);
    expect(s.coins).toBe(500 - plan.cost);
    expect(missingPurchase(s, 'cura-simples', 3).items).toEqual([]);
  });

  it('sem moedas não compra nada e explica', () => {
    const s0 = { ...base(), coins: 1, ingredients: {} };
    expect(missingPurchase(s0, 'cura-simples', 1).error).toMatch(/Faltam \d+ moedas/);
    const s = run(s0, [{ type: 'BUY_MISSING', recipeId: 'cura-simples', batches: 1 }]);
    expect(s.coins).toBe(1);
    expect(s.ingredients).toEqual({});
  });

  it('ingrediente de nível mais alto não pode ser comprado', () => {
    const s0 = { ...base(), coins: 9999 };
    const r = RECIPES.find((x) => x.ingredients.some((i) => i.ingredientId === 'pena-fenix'))!;
    expect(missingPurchase(s0, r.id, 1).error).toMatch(/nível/);
  });
});
