import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, type Customer, type GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { maintenanceCost } from '../../domain/rules/economy';
import {
  APPRENTICE, apprenticePlan, GOLEM, GOLEM_DELAY_MS, RAVEN, RAVEN_FEE, RAVEN_INTERVAL_MS, ravenShoppingList,
} from '../../domain/rules/helpers';
import { createNewGame } from '../../domain/rules/initialState';
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
  id: 'c-x', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1, patienceMs: 30000,
  waitedMs: 0, offer: null, remark: null, ...over,
});

/** Partida no nível 5 com o ajudante contratado. */
const withHelper = (id: string, over: Partial<GameSave> = {}): GameSave => ({
  ...createNewGame(0), level: 5, coins: 500, upgrades: [id], ...over,
});

describe('contratação', () => {
  it('ajudantes exigem nível e moedas, e entram na folha de pagamento', () => {
    const s = createNewGame(0);
    expect(run(s, { type: 'BUY_UPGRADE', upgradeId: GOLEM }).save.upgrades).toEqual([]);
    // O golem só chega no nível 9 (auditoria P0.5): antes disso o balcão é do jogador.
    expect(run({ ...s, level: 8, coins: 5000 }, { type: 'BUY_UPGRADE', upgradeId: GOLEM }).save.upgrades).toEqual([]);
    const rich = { ...s, level: 9, coins: 5000 };
    const { save } = run(rich, { type: 'BUY_UPGRADE', upgradeId: GOLEM });
    expect(save.upgrades).toContain(GOLEM);
    expect(save.coins).toBe(5000 - 3000);
    // 3 pela melhoria + 25 de salário
    expect(maintenanceCost(save) - maintenanceCost(rich)).toBe(28);
  });

  it('dá para mandar descansar e chamar de volta', () => {
    const s = withHelper(APPRENTICE);
    const off = run(s, { type: 'SET_HELPER', upgradeId: APPRENTICE, on: false }).save;
    expect(off.helpers.off).toEqual([APPRENTICE]);
    expect(apprenticePlan(off)).not.toBeNull();
    const after = run(off, { type: 'ADVANCE', ms: 500 }).save;
    expect(after.brew).toBeNull();
    const on = run(off, { type: 'SET_HELPER', upgradeId: APPRENTICE, on: true }).save;
    expect(on.helpers.off).toEqual([]);
    // sem contratar, não liga
    expect(run(createNewGame(0), { type: 'SET_HELPER', upgradeId: GOLEM, on: true }).events[0]).toMatchObject({ type: 'ERROR' });
  });
});

describe('aprendiz', () => {
  it('põe no fogo a poção em falta assim que o caldeirão fica livre', () => {
    const s = withHelper(APPRENTICE);
    const { save, events } = run(s, { type: 'ADVANCE', ms: 200 });
    expect(save.brew).not.toBeNull();
    expect(events).toContainEqual(expect.objectContaining({ type: 'BREW_STARTED', by: 'aprendiz' }));
    expect(save.stats.helperWork.brews).toBe(1);
  });

  it('dá prioridade ao pedido especial', () => {
    const s = withHelper(APPRENTICE, {
      ingredients: { ...createNewGame(0).ingredients, 'orvalho-feerico': 4, 'folha-lunar': 8, 'po-de-pedra': 8 },
      order: { id: 'o-1', client: 'x', text: 'x', recipeId: 'elixir-concentracao', qty: 3, rewardCoins: 1, rewardRep: 1, rewardXp: 1, dueDay: 3 },
    });
    expect(apprenticePlan(s)?.recipeId).toBe('elixir-concentracao');
  });

  it('não faz nada sem ingredientes', () => {
    const s = withHelper(APPRENTICE, { ingredients: {} });
    expect(apprenticePlan(s)).toBeNull();
  });
});

describe('corvo entregador', () => {
  it('repõe o que está acabando, cobra a taxa e respeita a reserva', () => {
    const s = withHelper(RAVEN, { ingredients: {}, coins: 300 });
    const { save, events } = run(s, { type: 'ADVANCE', ms: 2000 });
    const delivery = events.find((e) => e.type === 'RAVEN_DELIVERY');
    expect(delivery).toBeDefined();
    expect(save.ingredients['folha-lunar']).toBeGreaterThan(0);
    expect(save.coins).toBeGreaterThanOrEqual(40);
    expect(save.coins).toBe(300 - (delivery as { cost: number }).cost);
    expect((delivery as { fee: number }).fee).toBe(RAVEN_FEE);
    expect(save.helpers.ravenInMs).toBe(RAVEN_INTERVAL_MS);
    expect(save.stats.helperWork.deliveries).toBe(1);
  });

  it('não viaja quando o armário está abastecido ou o caixa está vazio', () => {
    const full = withHelper(RAVEN, { ingredients: { 'folha-lunar': 20, 'po-de-pedra': 20, 'hortela-brava': 20, 'cristal-ambar': 20, 'orvalho-feerico': 20 } });
    expect(ravenShoppingList(full)).toEqual([]);
    const broke = withHelper(RAVEN, { ingredients: {}, coins: 30 });
    expect(ravenShoppingList(broke)).toEqual([]);
  });

  it('respeita o estoque diário do fornecedor', () => {
    const s = withHelper(RAVEN, { ingredients: {}, coins: 2000, knownRecipes: ['pocao-brilho'], supplier: { ...createNewGame(0).supplier, 'escama-salamandra': 1 } });
    const list = ravenShoppingList(s);
    expect(list.find((i) => i.ingredientId === 'escama-salamandra')?.qty).toBe(1);
  });
});

describe('golem balconista', () => {
  const open = (over: Partial<GameSave> = {}) => withHelper(GOLEM, { phase: 'expediente', spawnInMs: 99999, ...over });

  it('espera o jogador agir e depois atende sozinho', () => {
    const s = open({ customers: [customer()] });
    expect(run(s, { type: 'ADVANCE', ms: 1000 }).save.customers).toHaveLength(1);
    const later = open({ customers: [customer({ waitedMs: GOLEM_DELAY_MS })] });
    const { save, events } = run(later, { type: 'ADVANCE', ms: 200 });
    expect(save.customers).toHaveLength(0);
    expect(events).toContainEqual(expect.objectContaining({ type: 'SALE', by: 'golem', recipeId: 'cura-simples' }));
    expect(save.stats.helperWork.served).toBe(1);
  });

  it('cobra o preço-base, mesmo com a prateleira mais cara', () => {
    const s = open({ customers: [customer({ waitedMs: GOLEM_DELAY_MS, budgetFactor: 0.9 })], prices: { 'cura-simples': 23 } });
    const { save, events } = run(s, { type: 'ADVANCE', ms: 200 });
    expect(save.customers).toHaveLength(0);
    expect(events.find((e) => e.type === 'SALE')).toMatchObject({ price: 18 });
  });

  it('deixa para o jogador quem negocia, fregueses fiéis, visitas e sintomas', () => {
    const offer = customer({ waitedMs: GOLEM_DELAY_MS, offer: { recipeId: 'cura-simples', price: 15 } });
    const regular = customer({ id: 'c-r', waitedMs: GOLEM_DELAY_MS, regularId: 'celia' });
    const symptom = customer({ id: 'c-s', waitedMs: GOLEM_DELAY_MS, symptom: true });
    const s = open({ customers: [offer, regular, symptom] });
    expect(run(s, { type: 'ADVANCE', ms: 200 }).save.customers).toHaveLength(3);
  });

  it('não oferece outra poção no lugar da pedida', () => {
    const s = open({ customers: [customer({ wantedRecipeId: 'balsamo-calmante', waitedMs: GOLEM_DELAY_MS })] });
    expect(run(s, { type: 'ADVANCE', ms: 200 }).events.find((e) => e.type === 'SALE')).toBeUndefined();
  });

  it('sem a poção certa, dispensa com educação (sem perder reputação)', () => {
    const c = customer({ wantedRecipeId: 'visao-noturna', waitedMs: 20000 });
    const s = open({ customers: [c] });
    const { save, events } = run(s, { type: 'ADVANCE', ms: 200 });
    expect(save.customers).toHaveLength(0);
    expect(save.reputation).toBe(s.reputation);
    expect(events).toContainEqual({ type: 'GOLEM_DISMISSED', customerId: c.id });
  });

  it('não trabalha na preparação', () => {
    const s = withHelper(GOLEM, { customers: [customer({ waitedMs: GOLEM_DELAY_MS })] });
    expect(run(s, { type: 'ADVANCE', ms: 200 }).save.customers).toHaveLength(1);
  });
});

describe('relatório e save', () => {
  it('o fechamento mostra salários e trabalho dos ajudantes', () => {
    const s = withHelper(GOLEM, { phase: 'expediente', coins: 500 });
    const { save } = run(s, { type: 'CLOSE_SHOP' });
    expect(save.reports.at(-1)!.wages).toBe(25);
    expect(save.reports.at(-1)!.helperWork).toEqual({ brews: 0, served: 0, deliveries: 0, delivered: 0 });
  });

  it('save v2 ganha os campos dos ajudantes', () => {
    const { helpers: _h, ...old } = createNewGame(0);
    const s = migrateSave({ ...old, saveVersion: 2, stats: { ...old.stats, helperWork: undefined } })!;
    expect(s.saveVersion).toBe(SAVE_VERSION);
    expect(s.helpers.off).toEqual([]);
    expect(s.stats.helperWork.served).toBe(0);
  });
});
