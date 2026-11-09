import { describe, expect, it } from 'vitest';
import { RECIPES, RECIPES_BY_ID } from '../../domain/data/recipes';
import type { Contract, GameSave } from '../../domain/models/types';
import { freeCauldron } from '../../domain/rules/alchemy';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { CONTRACT_DAYS, CONTRACT_FAIL_REP, contractReady } from '../../domain/rules/contracts';
import { maxCustomers } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';
import { sealsEarned, xpForLevel } from '../../domain/rules/progression';
import { migrateSave } from '../../persistence/migrations';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, ...cmds: DomainCommand[]) => {
  let save = s;
  const events = [];
  for (const c of cmds) {
    const r = applyCommand(save, c, ctx);
    save = r.save;
    events.push(...r.events);
  }
  return { save, events };
};
const atLevel = (level: number, over: Partial<GameSave> = {}): GameSave => {
  const s = { ...createNewGame(0), level, xp: xpForLevel(level), coins: 50000 };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level).map((r) => r.id);
  return { ...s, ...over };
};
const stock = (list: [string, number][]) => list.map(([recipeId, quantity]) => ({ recipeId, quantity, quality: 1, forSale: true }));
const contract = (over: Partial<Contract> = {}): Contract => ({
  id: 'k-1', client: 'Teste', text: '', accepted: false, dueDay: 5, rewardCoins: 1000, rewardRep: 10, rewardXp: 100,
  rewardIngredients: [{ ingredientId: 'folha-lunar', qty: 4 }], rewardSeal: false,
  items: [{ recipeId: 'cura-simples', qty: 4, delivered: 0 }, { recipeId: 'tonico-energia', qty: 2, delivered: 0 }],
  ...over,
});

describe('expansões da loja', () => {
  it('cada etapa exige a anterior', () => {
    const s = atLevel(13);
    const blocked = run(s, { type: 'BUY_UPGRADE', upgradeId: 'balcao-duplo' });
    expect(blocked.save.upgrades).not.toContain('balcao-duplo');
    const ok = run(s, { type: 'BUY_UPGRADE', upgradeId: 'sala-dos-fundos' }, { type: 'BUY_UPGRADE', upgradeId: 'balcao-duplo' },
      { type: 'BUY_UPGRADE', upgradeId: 'torre-alquimista' });
    expect(ok.save.upgrades).toEqual(expect.arrayContaining(['sala-dos-fundos', 'balcao-duplo', 'torre-alquimista']));
  });

  it('balcão duplo recebe um cliente a mais', () => {
    const s = atLevel(11);
    expect(maxCustomers({ ...s, upgrades: ['sala-dos-fundos', 'balcao-duplo'] })).toBe(maxCustomers(s) + 1);
  });

  it('sala dos fundos: dois preparos ao mesmo tempo, e os dois terminam', () => {
    const base = atLevel(9, { ingredients: { 'folha-lunar': 20, 'po-de-pedra': 20, 'hortela-brava': 20, 'cristal-ambar': 20 } });
    const recipeA = 'cura-simples';
    const recipeB = RECIPES_BY_ID['tonico-energia'] ? 'tonico-energia' : recipeA;
    // Sem a expansão, o segundo preparo é recusado.
    const one = run(base, { type: 'START_BREW', recipeId: recipeA, batches: 1 }, { type: 'START_BREW', recipeId: recipeA, batches: 1 });
    expect(one.save.brew).not.toBeNull();
    expect(one.save.brew2).toBeNull();
    expect(one.events.some((e) => e.type === 'ERROR')).toBe(true);

    const s = { ...base, upgrades: ['sala-dos-fundos'] };
    const two = run(s, { type: 'START_BREW', recipeId: recipeA, batches: 1 }, { type: 'START_BREW', recipeId: recipeB, batches: 1 });
    expect(two.save.brew?.recipeId).toBe(recipeA);
    expect(two.save.brew2).not.toBeNull();
    expect(freeCauldron(two.save)).toBeNull();
    const done = run({ ...two.save, phase: 'expediente' }, { type: 'ADVANCE', ms: 120000 });
    expect(done.save.brew).toBeNull();
    expect(done.save.brew2).toBeNull();
    expect(done.events.filter((e) => e.type === 'BREW_DONE')).toHaveLength(2);
    expect(done.events.some((e) => e.type === 'BREW_DONE' && e.slot === 2)).toBe(true);
  });
});

describe('contratos de vários dias', () => {
  it('aparecem a partir do nível 6, na virada do dia', () => {
    const low = run(atLevel(5, { phase: 'fechamento' }), { type: 'START_NEXT_DAY' });
    expect(low.save.contract).toBeNull();
    const high = run(atLevel(6, { phase: 'fechamento' }), { type: 'START_NEXT_DAY' });
    expect(high.save.contract).not.toBeNull();
    expect(high.save.contract!.items.length).toBe(2);
    expect(high.events.some((e) => e.type === 'CONTRACT_OFFERED')).toBe(true);
    expect(high.save.contract!.rewardSeal).toBe(false);
    const late = run(atLevel(12, { phase: 'fechamento' }), { type: 'START_NEXT_DAY' });
    expect(late.save.contract!.items.length).toBe(3);
    expect(late.save.contract!.rewardSeal).toBe(true);
  });

  it('aceitar dá 3 dias; entrega aos poucos e paga tudo ao completar', () => {
    const s0 = atLevel(12, { day: 4, contract: contract({ rewardSeal: true }), potions: stock([['cura-simples', 3]]) });
    const s = { ...s0, sealsPaid: sealsEarned(s0) };
    const seals = s.sealsPaid;
    const a = run(s, { type: 'ACCEPT_CONTRACT' }, { type: 'DELIVER_CONTRACT' });
    expect(a.save.contract!.dueDay).toBe(4 + CONTRACT_DAYS);
    expect(a.save.contract!.items[0].delivered).toBe(3);
    expect(a.events.some((e) => e.type === 'CONTRACT_PROGRESS')).toBe(true);
    expect(contractReady(a.save)).toBe(0);

    const b = run({ ...a.save, potions: stock([['cura-simples', 5], ['tonico-energia', 2]]) }, { type: 'DELIVER_CONTRACT' });
    expect(b.save.contract).toBeNull();
    // +50 da primeira recompensa da Trilha da Temporada (o contrato vale 30 pontos).
    expect(b.save.coins).toBe(s.coins + 1000 + 50);
    expect(b.save.contractsDone).toBe(1);
    expect(b.save.ingredients['folha-lunar']).toBeGreaterThan(s.ingredients['folha-lunar'] ?? 0);
    expect(b.save.sealsPaid).toBe(seals + 1);
    // Sobrou 1 cura no estoque (entregou só o que faltava).
    expect(b.save.potions.find((p) => p.recipeId === 'cura-simples')?.quantity).toBe(4);
  });

  it('contrato aceito não pode ser recusado', () => {
    const s = atLevel(8, { contract: contract({ accepted: true }) });
    const r = run(s, { type: 'DECLINE_CONTRACT' });
    expect(r.save.contract).not.toBeNull();
    expect(r.events.some((e) => e.type === 'ERROR')).toBe(true);
    const offer = run(atLevel(8, { contract: contract() }), { type: 'DECLINE_CONTRACT' });
    expect(offer.save.contract).toBeNull();
  });

  it('vencido: paga metade do proporcional e tira reputação', () => {
    const c = contract({ accepted: true, dueDay: 3 });
    c.items[0].delivered = 3; // 3 de 6 entregues
    const s = atLevel(8, { day: 3, phase: 'fechamento', reputation: 40, contract: c });
    const r = run(s, { type: 'START_NEXT_DAY' });
    expect(r.events.some((e) => e.type === 'CONTRACT_FAILED')).toBe(true);
    expect(r.save.reputation).toBe(40 - CONTRACT_FAIL_REP);
    expect(r.save.coins).toBe(s.coins + 250);
    expect(r.save.contract).toBeNull();
  });

  it('oferta não aceita some sem punição', () => {
    const s = atLevel(8, { day: 3, phase: 'fechamento', reputation: 40, contract: contract({ dueDay: 3 }) });
    const r = run(s, { type: 'START_NEXT_DAY' });
    expect(r.save.reputation).toBe(40);
    expect(r.save.coins).toBe(s.coins);
  });
});

describe('save antigo', () => {
  it('migra para a versão com expansões e contratos', () => {
    const old = createNewGame(0) as unknown as Record<string, unknown>;
    const { brew2: _b, contract: _c, nextContractDay: _n, contractsDone: _d, contractSeals: _s, ...rest } = old;
    const s = migrateSave({ ...rest, saveVersion: 4 })!;
    expect(s.brew2).toBeNull();
    expect(s.contract).toBeNull();
    expect(s.contractsDone).toBe(0);
    expect(s.contractSeals).toBe(0);
    expect(typeof s.nextContractDay).toBe('number');
  });
});
