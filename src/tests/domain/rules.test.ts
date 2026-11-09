import { describe, expect, it } from 'vitest';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import { UPGRADES_BY_ID } from '../../domain/data/upgrades';
import { SAVE_VERSION, type Customer, type GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { maxPriceFor } from '../../domain/rules/customers';
import { maintenanceCost } from '../../domain/rules/economy';
import { createNewGame } from '../../domain/rules/initialState';
import { levelFromXp, xpForLevel } from '../../domain/rules/progression';
import { CLOSE_MIN, formatClock, OPEN_MIN, timeOfDay } from '../../domain/rules/time';

/** Contexto determinístico: random fixo em 0.5. */
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

describe('dados iniciais', () => {
  it('toda receita usa ingredientes existentes', () => {
    for (const r of RECIPES) for (const i of r.ingredients) expect(INGREDIENTS_BY_ID[i.ingredientId]).toBeDefined();
  });

  it('nova partida começa na preparação do dia 1', () => {
    const s = createNewGame(0);
    expect(s).toMatchObject({ day: 1, phase: 'preparacao', clockMin: OPEN_MIN, saveVersion: SAVE_VERSION });
    expect(s.knownRecipes.length).toBe(3);
  });
});

describe('fornecedor', () => {
  it('compra desconta moedas e soma no inventário', () => {
    const { save, events } = run(createNewGame(0), { type: 'BUY_INGREDIENT', ingredientId: 'folha-lunar', qty: 5 });
    const cost = INGREDIENTS_BY_ID['folha-lunar'].price * 5;
    expect(save.coins).toBe(100 - cost);
    expect(save.ingredients['folha-lunar']).toBe(9);
    expect(save.stats.ingredientCost).toBe(cost);
    expect(events[0].type).toBe('PURCHASE');
  });

  it('impede compra acima do saldo e de itens bloqueados', () => {
    const s = { ...createNewGame(0), coins: 5 };
    expect(run(s, { type: 'BUY_INGREDIENT', ingredientId: 'folha-lunar', qty: 2 }).save).toBe(s);
    const r = run(createNewGame(0), { type: 'BUY_INGREDIENT', ingredientId: 'escama-salamandra', qty: 1 });
    expect(r.events[0]).toMatchObject({ type: 'ERROR' });
  });
});

describe('caldeirão', () => {
  it('prepara lotes, consome ingredientes e entrega poções após o tempo', () => {
    let { save } = run(createNewGame(0), { type: 'START_BREW', recipeId: 'cura-simples', batches: 2 });
    expect(save.ingredients['folha-lunar']).toBe(0);
    expect(save.ingredients['po-de-pedra']).toBe(2);
    expect(save.brew).not.toBeNull();
    ({ save } = run(save, { type: 'ADVANCE', ms: 60_000 }));
    expect(save.brew).toBeNull();
    expect(save.potions.find((p) => p.recipeId === 'cura-simples')!.quantity).toBe(3 + 4);
  });

  it('não começa sem ingredientes', () => {
    const r = run(createNewGame(0), { type: 'START_BREW', recipeId: 'cura-simples', batches: 3 });
    expect(r.save.brew).toBeNull();
    expect(r.events[0].type).toBe('ERROR');
  });
});

describe('atendimento e preços', () => {
  const open = () => {
    const s = run(createNewGame(0), { type: 'OPEN_SHOP' }).save;
    return { ...s, customers: [customer()] };
  };

  it('vende quando o preço cabe no orçamento', () => {
    const { save, events } = run(open(), { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
    expect(save.coins).toBe(100 + 18);
    expect(save.customers).toHaveLength(0);
    expect(save.potions[0].quantity).toBe(2);
    expect(events.some((e) => e.type === 'SALE')).toBe(true);
    expect(save.reputation).toBeGreaterThan(5);
  });

  it('preço um pouco alto gera contraproposta; muito alto faz o cliente ir embora', () => {
    const s = open();
    const max = maxPriceFor(s, s.customers[0], 'cura-simples');
    const slightly = run({ ...s, prices: { ...s.prices, 'cura-simples': max + 2 } }, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
    expect(slightly.save.customers[0].offer).toEqual({ recipeId: 'cura-simples', price: max });
    const accepted = run(slightly.save, { type: 'ACCEPT_OFFER', customerId: 'c-x' });
    expect(accepted.save.coins).toBe(100 + max);

    const pricey = { ...s, customers: [customer({ budgetFactor: 0.8 })], prices: { ...s.prices, 'cura-simples': 23 } };
    const r = run(pricey, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
    expect(r.save.customers).toHaveLength(0);
    expect(r.save.coins).toBe(100);
    expect(r.save.stats.lost).toBe(1);
  });

  it('poção errada não é vendida', () => {
    const r = run(open(), { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'tonico-energia' });
    expect(r.save.customers).toHaveLength(1);
    expect(r.events[0]).toMatchObject({ type: 'CUSTOMER_REFUSED', reason: 'produto' });
  });

  it('impaciência custa só 1 de reputação', () => {
    const s = { ...open(), reputation: 10, spawnInMs: 999_999 };
    const r = run(s, { type: 'ADVANCE', ms: 31_000 });
    expect(r.save.customers).toHaveLength(0);
    expect(r.save.reputation).toBe(9);
  });

  it('clientes aparecem durante o expediente', () => {
    const r = run(run(createNewGame(0), { type: 'OPEN_SHOP' }).save, { type: 'ADVANCE', ms: 3000 });
    expect(r.save.customers).toHaveLength(1);
    // O primeiro cliente do jogo sempre pede algo disponível
    expect(r.save.customers[0].wantedRecipeId).toBe('cura-simples');
  });
});

describe('ciclo do dia', () => {
  it('abre, passa o tempo, fecha com relatório e começa o dia seguinte', () => {
    let { save } = run(createNewGame(0), { type: 'OPEN_SHOP' });
    expect(save.phase).toBe('expediente');
    ({ save } = run(save, { type: 'ADVANCE', ms: 15_000 }));
    // O dia 1 corre duas vezes mais rápido (fase 3).
    expect(save.clockMin).toBe(OPEN_MIN + 60);
    const coins = save.coins;
    const maint = maintenanceCost(save);
    let events;
    ({ save, events } = run(save, { type: 'ADVANCE', ms: 400_000 }));
    expect(save.clockMin).toBe(CLOSE_MIN);
    expect(save.phase).toBe('fechamento');
    expect(save.customers).toHaveLength(0);
    expect(events.some((e) => e.type === 'DAY_CLOSED')).toBe(true);
    expect(save.reports.at(-1)!.maintenance).toBe(maint);
    // O fechamento do dia 1 dá o presente do nível 2 (+40 moedas).
    expect(save.coins).toBeLessThanOrEqual(coins + 40);
    ({ save } = run(save, { type: 'START_NEXT_DAY' }));
    expect(save).toMatchObject({ day: 2, phase: 'preparacao', clockMin: OPEN_MIN });
    expect(save.order).not.toBeNull();
  });

  it('manutenção nunca deixa o saldo negativo', () => {
    // Dia 2: no dia 1 o fechamento dá o presente do nível 2.
    const s = { ...run(createNewGame(0), { type: 'OPEN_SHOP' }).save, coins: 3, day: 2 };
    const r = run(s, { type: 'CLOSE_SHOP' });
    expect(r.save.coins).toBe(0);
  });

  it('não muta o estado anterior', () => {
    const s = createNewGame(0);
    run(s, { type: 'OPEN_SHOP' }, { type: 'BUY_INGREDIENT', ingredientId: 'folha-lunar', qty: 1 });
    expect(s.phase).toBe('preparacao');
    expect(s.ingredients['folha-lunar']).toBe(4);
  });
});

describe('progressão', () => {
  it('nível cresce com a experiência e libera receitas', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(2))).toBe(2);
    const s = { ...run(createNewGame(0), { type: 'OPEN_SHOP' }).save, xp: xpForLevel(2) - 1, customers: [customer()] };
    const r = run(s, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
    expect(r.save.level).toBe(2);
    expect(r.save.recipeHints).toContain('visao-noturna'); // o nível deixa a pista; a receita vem na bancada (P1.2)
    expect(r.events.some((e) => e.type === 'LEVEL_UP')).toBe(true);
  });

  it('melhoria exige nível e moedas', () => {
    const s = createNewGame(0);
    expect(run(s, { type: 'BUY_UPGRADE', upgradeId: 'caldeirao-reforcado' }).save).toBe(s);
    const up = UPGRADES_BY_ID['caldeirao-reforcado'];
    expect(run({ ...s, level: up.requiredLevel - 1, coins: 5000 }, { type: 'BUY_UPGRADE', upgradeId: up.id }).save.upgrades).toHaveLength(0);
    expect(run({ ...s, level: up.requiredLevel, coins: up.cost - 1 }, { type: 'BUY_UPGRADE', upgradeId: up.id }).save.upgrades).toHaveLength(0);
    const bought = run({ ...s, level: up.requiredLevel, coins: up.cost }, { type: 'BUY_UPGRADE', upgradeId: up.id }).save;
    expect(bought.upgrades).toContain(up.id);
    expect(bought.coins).toBe(0);
  });

  it('experimento certo ensina a receita; errado dá pista e consome pouco', () => {
    const s = { ...createNewGame(0), ingredients: { ...createNewGame(0).ingredients, 'essencia-azul': 2 } };
    const ok = run(s, { type: 'EXPERIMENT', ingredientIds: ['essencia-azul', 'hortela-brava'] });
    expect(ok.save.knownRecipes).toContain('balsamo-calmante');
    const bad = run(s, { type: 'EXPERIMENT', ingredientIds: ['folha-lunar', 'cristal-ambar'] });
    expect(bad.save.ingredients['folha-lunar']).toBe(3);
    expect(bad.save.ingredients['cristal-ambar']).toBe(1);
    expect(bad.events[0]).toMatchObject({ type: 'EXPERIMENT_FAILED' });
  });

  it('pedido especial pode ser entregue', () => {
    const s = { ...createNewGame(0), order: { id: 'o', client: 'x', text: '', recipeId: 'cura-simples', qty: 2, rewardCoins: 50, rewardRep: 3, rewardXp: 10, dueDay: 3 } };
    const r = run(s, { type: 'DELIVER_ORDER' });
    expect(r.save.coins).toBe(150);
    expect(r.save.order).toBeNull();
    expect(r.save.potions[0].quantity).toBe(1);
  });
});

describe('tempo', () => {
  it('formata e classifica o horário', () => {
    expect(formatClock(8 * 60 + 5)).toBe('08:05');
    expect(timeOfDay(9 * 60)).toBe('manha');
    expect(timeOfDay(13 * 60)).toBe('tarde');
    expect(timeOfDay(19 * 60)).toBe('noite');
  });
});
