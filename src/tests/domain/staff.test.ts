import { describe, expect, it } from 'vitest';
import type { Customer, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { GNOME_GIFT_QTY, gnomeGift, helperWages } from '../../domain/rules/economy';
import { maxPriceFor, nextSpawnDelay, patienceFactor } from '../../domain/rules/customers';
import { BARD, GNOME, OWL, OWL_THINK_MS, RAVEN, PRODIGY_APPRENTICE, APPRENTICE } from '../../domain/rules/helpers';
import { createNewGame } from '../../domain/rules/initialState';
import { helperRoot, UPGRADES_BY_ID } from '../../domain/data/upgrades';
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
const customer = (over: Partial<Customer> = {}): Customer => ({
  id: 'c-x', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1, patienceMs: 60000,
  waitedMs: 0, offer: null, remark: null, ...over,
});
const game = (over: Partial<GameSave> = {}): GameSave => ({ ...createNewGame(0), level: 12, coins: 5000, ...over });

describe('funcionários novos', () => {
  it('o gnomo dobra a estufa e traz o ingrediente mais raro do nível', () => {
    const base = game({ upgrades: ['estufa'], phase: 'fechamento', ingredients: {} });
    const plain = run(base, { type: 'START_NEXT_DAY' }).save;
    const withGnome = run({ ...base, upgrades: ['estufa', GNOME] }, { type: 'START_NEXT_DAY' }).save;
    expect(withGnome.ingredients['folha-lunar']).toBe(2 * plain.ingredients['folha-lunar']);
    const gift = gnomeGift(base)!;
    expect(gift).toBeTruthy();
    expect((withGnome.ingredients[gift] ?? 0) - (plain.ingredients[gift] ?? 0)).toBe(GNOME_GIFT_QTY);
  });

  it('o gnomo só pode ser contratado depois da estufa', () => {
    expect(run(game(), { type: 'BUY_UPGRADE', upgradeId: GNOME }).save.upgrades).toEqual([]);
    expect(run(game({ upgrades: ['estufa'] }), { type: 'BUY_UPGRADE', upgradeId: GNOME }).save.upgrades).toContain(GNOME);
  });

  it('a coruja decifra a charada depois de pensar um pouco', () => {
    const c = customer({ id: 'c-m', mystery: true });
    const s = game({ upgrades: [OWL], phase: 'expediente', spawnInMs: 99999, customers: [c] });
    expect(run(s, { type: 'ADVANCE', ms: 200 }).save.customers).toHaveLength(1);
    const later = { ...s, customers: [{ ...c, waitedMs: OWL_THINK_MS }] };
    const { save, events } = run(later, { type: 'ADVANCE', ms: 200 });
    expect(save.customers).toHaveLength(0);
    expect(events).toContainEqual(expect.objectContaining({ type: 'MYSTERY_SOLVED' }));
    expect(save.crystals).toBeGreaterThan(s.crystals);
  });

  it('a coruja entrega o pedido especial quando o estoque fica pronto', () => {
    const order = { id: 'o1', client: 'x', text: 'x', recipeId: 'cura-simples', qty: 3, rewardCoins: 200, rewardRep: 3, rewardXp: 30, dueDay: 5 };
    const s = game({ upgrades: [OWL], phase: 'expediente', spawnInMs: 99999, order });
    const { save, events } = run(s, { type: 'ADVANCE', ms: 200 });
    expect(save.order).toBeNull();
    expect(save.coins).toBe(s.coins + 200);
    expect(events).toContainEqual(expect.objectContaining({ type: 'ORDER_DONE', by: 'coruja' }));
    // Faltando poção, ela espera.
    const short = run({ ...s, order: { ...order, qty: 9 } }, { type: 'ADVANCE', ms: 200 }).save;
    expect(short.order).not.toBeNull();
  });

  it('o bardo traz mais gente, mais paciência e um preço melhor', () => {
    const s = game();
    const bard = game({ upgrades: [BARD] });
    const c = customer();
    expect(nextSpawnDelay(bard, () => 0.5)).toBeLessThan(nextSpawnDelay(s, () => 0.5));
    expect(patienceFactor(bard)).toBeGreaterThan(patienceFactor(s));
    expect(maxPriceFor(bard, c, 'cura-simples')).toBeGreaterThanOrEqual(maxPriceFor(s, c, 'cura-simples'));
    // Descansando, o bardo não toca.
    const resting = { ...bard, helpers: { ...bard.helpers, off: [BARD] } };
    expect(patienceFactor(resting)).toBe(patienceFactor(s));
  });

  it('o refeitório baixa os salários em 40%', () => {
    const team = game({ upgrades: [RAVEN, APPRENTICE, OWL] });
    const fed = game({ upgrades: [RAVEN, APPRENTICE, OWL, 'refeitorio'] });
    expect(helperWages(fed)).toBe(Math.round(helperWages(team) * 0.6));
  });
});

describe('mestres da equipe', () => {
  it('cada mestre exige o treino anterior', () => {
    const s = game({ level: 15, coins: 100000, upgrades: [RAVEN] });
    expect(run(s, { type: 'BUY_UPGRADE', upgradeId: 'corvo-da-guilda' }).save.upgrades).not.toContain('corvo-da-guilda');
    const trained = { ...s, upgrades: [RAVEN, 'corvo-veloz'] };
    expect(run(trained, { type: 'BUY_UPGRADE', upgradeId: 'corvo-da-guilda' }).save.upgrades).toContain('corvo-da-guilda');
  });

  it('o retrato de cada evolução é o do ajudante de origem', () => {
    expect(helperRoot('golem-de-cristal')).toBe('golem-balconista');
    expect(helperRoot('corvo-veloz')).toBe('corvo-entregador');
    expect(helperRoot('estufa')).toBeNull();
    expect(UPGRADES_BY_ID['aprendiz-prodigio'].requires).toBe('aprendiz-dedicado');
  });

  it('o corvo da guilda compra 20% mais barato', () => {
    const s = game({ upgrades: [RAVEN, 'corvo-veloz'], phase: 'expediente', spawnInMs: 99999, ingredients: {}, coins: 2000, helpers: { off: [], ravenInMs: 0, golemInMs: 0 } });
    const plain = run(s, { type: 'ADVANCE', ms: 100 }).save;
    const guild = run({ ...s, upgrades: [...s.upgrades, 'corvo-da-guilda'] }, { type: 'ADVANCE', ms: 100 }).save;
    const spent = (x: GameSave) => s.coins - x.coins;
    expect(spent(plain)).toBeGreaterThan(0);
    expect(spent(guild)).toBe(Math.round(spent(plain) * 0.8));
  });

  it('o aprendiz prodígio prepara poções Finas', () => {
    const s = game({ upgrades: [APPRENTICE, 'aprendiz-dedicado', PRODIGY_APPRENTICE], potions: [] });
    const { save } = run(s, { type: 'ADVANCE', ms: 100 });
    expect(save.brew?.byHelper).toBe(true);
    expect(save.brew?.hits).toBe(2);
  });

  it('saves antigos continuam abrindo sem os campos novos', () => {
    const old = createNewGame(0);
    const s = migrateSave({ ...old, upgrades: ['golem-balconista'] })!;
    expect(s.upgrades).toEqual(['golem-balconista']);
    expect(s.helpers.off).toEqual([]);
  });
});
