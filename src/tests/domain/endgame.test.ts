import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../domain/data/recipes';
import { ROYAL_CHAPTERS, ROYAL_RECIPE } from '../../domain/data/royal';
import type { Customer, GameEvent, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';
import { MAX_LEVEL, xpForLevel } from '../../domain/rules/progression';
import { royalGoal } from '../../domain/rules/royal';
import { OPEN_MIN } from '../../domain/rules/time';
import { migrateSave } from '../../persistence/migrations';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, ...cmds: DomainCommand[]) => {
  let save = s;
  const events: GameEvent[] = [];
  for (const c of cmds) {
    const r = applyCommand(save, c, ctx);
    save = r.save;
    events.push(...r.events);
  }
  return { save, events };
};
const customer = (over: Partial<Customer> = {}): Customer => ({
  id: 'c-x', archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 3, patienceMs: 30000,
  waitedMs: 0, offer: null, remark: null, ...over,
});
/** Loja no nível máximo, aberta, com todas as receitas do livro. */
const endgame = (over: Partial<GameSave> = {}): GameSave => {
  const s = { ...createNewGame(0), level: MAX_LEVEL, xp: xpForLevel(MAX_LEVEL), coins: 1000, day: 30, tutorialStep: 99, storySeen: true };
  s.knownRecipes = RECIPES.filter((r) => !r.secret && !r.legend).map((r) => r.id);
  s.phase = 'expediente';
  s.clockMin = OPEN_MIN + 60;
  return { ...s, ...over };
};
/** Convite aceito e cena do capítulo lida. */
const invited = (over: Partial<GameSave> = {}) => run(endgame(over), { type: 'SET_SETTINGS', settings: {} }, { type: 'SEE_ROYAL' }).save;

describe('Concurso Real (pacote T)', () => {
  it('o convite chega no nível máximo, e só nele', () => {
    const low = run({ ...endgame(), level: 14 }, { type: 'SET_SETTINGS', settings: {} });
    expect(low.save.royal).toBeNull();
    const r = run(endgame(), { type: 'SET_SETTINGS', settings: {} });
    expect(r.save.royal?.chapter).toBe(0);
    expect(r.events.some((e) => e.type === 'ROYAL_INVITE')).toBe(true);
  });

  it('vendas de cura contam só depois de ler o capítulo, e o capítulo paga o prêmio', () => {
    let s = run(endgame(), { type: 'SET_SETTINGS', settings: {} }).save;
    s = { ...s, potions: [{ recipeId: 'cura-simples', quantity: 25, quality: 1, forSale: true }], prices: { ...s.prices, 'cura-simples': 18 } };
    s = run({ ...s, customers: [customer()] }, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' }).save;
    expect(s.royal!.progress).toBe(0);
    s = run(s, { type: 'SEE_ROYAL' }).save;
    const coins = s.coins;
    let events: GameEvent[] = [];
    for (let i = 0; i < 20; i++) {
      const r = run({ ...s, customers: [customer({ id: `c-${i}` })] }, { type: 'SERVE_CUSTOMER', customerId: `c-${i}`, recipeId: 'cura-simples' });
      s = r.save;
      events = r.events;
    }
    expect(events.some((e) => e.type === 'ROYAL_CHAPTER_DONE')).toBe(true);
    expect(s.royal!.chapter).toBe(1);
    expect(s.coins).toBeGreaterThanOrEqual(coins + ROYAL_CHAPTERS[0].reward.coins);
  });

  it('entregas tiram poções da prateleira e respeitam o que falta', () => {
    let s = invited();
    s = { ...s, royal: { ...s.royal!, chapter: 1, seen: 1, dueDay: 40 } };
    s.potions = [{ recipeId: 'visao-noturna', quantity: 8, quality: 1, forSale: true }, { recipeId: 'tonico-energia', quantity: 2, quality: 1, forSale: true }];
    s = run(s, { type: 'DELIVER_ROYAL' }).save;
    expect(s.royal!.delivered).toEqual({ 'visao-noturna': 6, 'tonico-energia': 2 });
    expect(s.potions.find((p) => p.recipeId === 'visao-noturna')?.quantity).toBe(2);
    expect(royalGoal(s)).toEqual({ done: 8, total: 18 });
  });

  it('no baile, perder um nobre zera a sequência', () => {
    let s = invited();
    s = { ...s, royal: { ...s.royal!, chapter: 2, seen: 2, progress: 4, dueDay: 0 } };
    const r = run({ ...s, customers: [customer({ archetype: 'nobre', waitedMs: 29_900 })] }, { type: 'ADVANCE', ms: 200 });
    expect(r.save.royal!.progress).toBe(0);
    expect(r.events.some((e) => e.type === 'ROYAL_STREAK_LOST')).toBe(true);
  });

  it('a noite das estrelas exige 3 estrelas no Elixir Estelar', () => {
    let s = invited();
    s = { ...s, royal: { ...s.royal!, chapter: 3, seen: 3, dueDay: 40 } };
    s.potions = [{ recipeId: 'elixir-estelar', quantity: 10, quality: 1, forSale: true }];
    expect(run(s, { type: 'DELIVER_ROYAL' }).save.royal!.delivered).toEqual({});
    s = { ...s, mastery: { 'elixir-estelar': 70 } };
    expect(run(s, { type: 'DELIVER_ROYAL' }).save.royal!.chapter).toBe(4);
  });

  it('a final ensina a Poção da Coroa e a vitória coroa a loja', () => {
    let s = invited();
    s = { ...s, royal: { ...s.royal!, chapter: 3, seen: 3, dueDay: 40 }, mastery: { 'elixir-estelar': 70 } };
    s.potions = [{ recipeId: 'elixir-estelar', quantity: 10, quality: 1, forSale: true }];
    s = run(s, { type: 'DELIVER_ROYAL' }).save;
    expect(s.knownRecipes).toContain(ROYAL_RECIPE);
    s = run(s, { type: 'SEE_ROYAL' }).save;
    s.potions = [{ recipeId: ROYAL_RECIPE, quantity: 3, quality: 1, forSale: true }];
    const r = run(s, { type: 'DELIVER_ROYAL' });
    expect(r.save.royal!.chapter).toBe(5);
    expect(r.events.some((e) => e.type === 'ROYAL_WON')).toBe(true);
    expect(r.save.achievements).toContain('grao-alquimista');
  });

  it('prazo vencido recomeça a contagem, sem perder o que foi entregue', () => {
    let s = invited();
    s = { ...s, phase: 'fechamento', royal: { ...s.royal!, chapter: 1, seen: 1, dueDay: s.day, delivered: { 'visao-noturna': 3 } } };
    const r = run(s, { type: 'START_NEXT_DAY' });
    expect(r.events.some((e) => e.type === 'ROYAL_RETRY')).toBe(true);
    expect(r.save.royal!.delivered).toEqual({ 'visao-noturna': 3 });
    expect(r.save.royal!.dueDay).toBeGreaterThan(r.save.day);
  });

  it('a Poção da Coroa não sai por experimento nem conta para o livro completo', () => {
    const s = endgame({ ingredients: { 'pena-fenix': 1, 'areia-estelar': 1, 'pluma-grifo': 1 } });
    const r = run(s, { type: 'EXPERIMENT', ingredientIds: ['pena-fenix', 'areia-estelar', 'pluma-grifo'] });
    expect(r.save.knownRecipes).not.toContain(ROYAL_RECIPE);
    expect(r.save.achievements).toContain('todas-receitas');
  });
});

describe('Metas sem teto (pacote X)', () => {
  it('talentos sem fim só abrem no nível máximo e não têm teto', () => {
    const low = run({ ...endgame(), level: 14, talents: {} }, { type: 'LEARN_TALENT', talentId: 'toque-de-ouro' });
    expect(low.save.talents['toque-de-ouro']).toBeUndefined();
    const s = run({ ...endgame(), crystals: 1000 }, { type: 'LEARN_TALENT', talentId: 'toque-de-ouro' }, { type: 'LEARN_TALENT', talentId: 'toque-de-ouro' });
    expect(s.save.talents['toque-de-ouro']).toBe(2);
  });

  it('recordes do dia são guardados e comemorados no fechamento', () => {
    const s = endgame({ records: { revenue: 100, served: 3, bestSale: 50 } });
    s.stats = { ...s.stats, revenue: 900, served: 10 };
    const r = run(s, { type: 'CLOSE_SHOP' });
    expect(r.save.records).toMatchObject({ revenue: 900, served: 10 });
    expect(r.events.filter((e) => e.type === 'RECORD').length).toBe(2);
    expect(r.save.reports.at(-1)!.records).toEqual(['revenue', 'served']);
  });

  it('saves antigos começam os recordes pelos relatórios guardados', () => {
    const old = { ...endgame(), saveVersion: 9, reports: [{ revenue: 1200, customersServed: 30 }, { revenue: 800, customersServed: 40 }] } as Record<string, unknown>;
    delete old.records;
    delete old.royal;
    const s = migrateSave(old)!;
    expect(s.records).toEqual({ revenue: 1200, served: 40, bestSale: 0 });
    expect(s.royal).toBeNull();
  });

  it('o corvo veloz não cobra taxa', () => {
    const s = endgame({ upgrades: ['corvo-entregador', 'corvo-veloz'], ingredients: {}, coins: 5000 });
    s.helpers = { ...s.helpers, ravenInMs: 0 };
    const r = run(s, { type: 'ADVANCE', ms: 200 });
    const d = r.events.find((e) => e.type === 'RAVEN_DELIVERY');
    expect(d && d.type === 'RAVEN_DELIVERY' ? d.fee : -1).toBe(0);
  });
});

describe('Reconstruir a vila (pacote W)', () => {
  // Auditoria P2.2: cada etapa é uma encomenda que pede poções (e menos moedas).
  it('cada etapa é uma encomenda de poções e moedas; a inauguração liga o bônus', async () => {
    const { ingredientPrice } = await import('../../domain/rules/economy');
    const pot = (recipeId: string, quantity: number) => ({ recipeId, quantity, quality: 1 as const, forSale: true });
    let s = endgame({ coins: 30000, potions: [] });
    const before = ingredientPrice(s, 'folha-lunar');
    // Sem as 8 Poções de Cura, nem a fundação começa.
    expect(run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save.village.fonte).toBeUndefined();
    s = { ...s, potions: [pot('cura-simples', 8), pot('balsamo-calmante', 8)] };
    s = run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' }, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save;
    expect(s.village.fonte).toBe(2);
    expect(s.coins).toBe(30000 - 4200);
    expect(s.potions.reduce((n, p) => n + p.quantity, 0)).toBe(0);
    expect(run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save.village.fonte).toBe(2);
    s = { ...s, potions: [pot('cura-simples', 14)] };
    const r = run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' });
    expect(r.save.village.fonte).toBe(3);
    expect(r.save.potions[0].quantity).toBe(2);
    // O mercado pronto barateia o fornecedor.
    let m = endgame({ coins: 30000, potions: [pot('visao-noturna', 8), pot('pocao-sorte', 16)] });
    for (let i = 0; i < 3; i++) m = run(m, { type: 'BUILD_VILLAGE', projectId: 'mercado' }).save;
    expect(m.village.mercado).toBe(3);
    expect(ingredientPrice(m, 'pena-fenix')).toBeLessThan(ingredientPrice(endgame(), 'pena-fenix'));
    expect(before).toBeGreaterThan(0);
  });

  it('a prefeitura só aceita ajuda a partir do nível 12', () => {
    const s = run({ ...endgame({ coins: 30000 }), level: 11 }, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save;
    expect(s.village.fonte).toBeUndefined();
  });
});

describe('Toque de mestre e cliente misterioso (pacote V)', () => {
  const brewing = (hits?: number) => {
    const s = endgame({ ingredients: { 'folha-lunar': 10, 'agua-nascente': 10, 'cogumelo-lanterna': 10, 'raiz-mandragora': 10 } });
    s.brew = { recipeId: 'cura-simples', batches: 2, elapsedMs: 0, totalMs: 1000, ...(hits !== undefined ? { hits } : {}) };
    s.potions = [];
    return s;
  };

  it('mexer bem deixa o lote Primoroso e a venda paga 50% a mais', () => {
    const plain = run(brewing(), { type: 'ADVANCE', ms: 1200 }).save;
    const stirred = run(brewing(), { type: 'STIR', slot: 1, hits: 3 }, { type: 'ADVANCE', ms: 1200 });
    expect(stirred.events.some((e) => e.type === 'STIRRED')).toBe(true);
    const stack = stirred.save.potions.find((p) => p.recipeId === 'cura-simples')!;
    expect(stack.prime).toBe(stack.quantity);
    const sell = (s: GameSave) => {
      const r = run({ ...s, customers: [customer()] }, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
      const sale = r.events.find((e) => e.type === 'SALE');
      return sale && sale.type === 'SALE' ? sale.price : 0;
    };
    expect(sell(stirred.save)).toBeGreaterThan(sell(plain) * 1.3);
  });

  it('só se mexe uma vez e o aprendiz não mexe', () => {
    const once = run(brewing(), { type: 'STIR', slot: 1, hits: 1 }, { type: 'STIR', slot: 1, hits: 3 }).save;
    expect(once.brew!.hits).toBe(1);
    const s = brewing();
    s.brew!.byHelper = true;
    expect(run(s, { type: 'STIR', slot: 1, hits: 3 }).save.brew!.hits).toBeUndefined();
  });

  it('o cliente misterioso só aceita a poção certa e paga 3×', () => {
    const s = endgame({ potions: [{ recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: true }, { recipeId: 'tonico-energia', quantity: 3, quality: 1, forSale: true }] });
    const m = customer({ archetype: 'viajante', mystery: true, remark: 'charada', patienceMs: 60000 });
    const wrong = run({ ...s, customers: [m] }, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'tonico-energia' });
    expect(wrong.events.some((e) => e.type === 'MYSTERY_WRONG')).toBe(true);
    expect(wrong.save.customers[0].waitedMs).toBeGreaterThan(0);
    const right = run(wrong.save, { type: 'SERVE_CUSTOMER', customerId: 'c-x', recipeId: 'cura-simples' });
    const solved = right.events.find((e) => e.type === 'MYSTERY_SOLVED');
    expect(solved && solved.type === 'MYSTERY_SOLVED' ? solved.coins : 0).toBe(RECIPES.find((r) => r.id === 'cura-simples')!.basePrice * 3);
    expect(right.save.crystals).toBeGreaterThan(s.crystals);
  });
});

describe('Receitas lendárias (pacote U)', () => {
  it('ficam fora do livro, não entram nas pistas e só saem por experimento', async () => {
    const { LEGENDS } = await import('../../domain/rules/legends');
    expect(LEGENDS.length).toBe(6);
    const base = endgame();
    expect(base.knownRecipes.some((id) => LEGENDS.some((r) => r.id === id))).toBe(false);
    const eco = LEGENDS.find((r) => r.id === 'elixir-eco')!;
    const ids = eco.ingredients.map((i) => i.ingredientId);
    const r = run({ ...base, ingredients: Object.fromEntries(ids.map((id) => [id, 2])) }, { type: 'EXPERIMENT', ingredientIds: ids });
    expect(r.save.knownRecipes).toContain('elixir-eco');
    const ev = r.events.find((e) => e.type === 'DISCOVERY');
    expect(ev && ev.type === 'DISCOVERY' ? ev.legend : false).toBe(true);
    expect(r.save.crystals).toBeGreaterThan(base.crystals);
    // Um erro não dá pista de lenda.
    const miss = run({ ...base, ingredients: { 'folha-lunar': 3, 'pena-fenix': 3 } }, { type: 'EXPERIMENT', ingredientIds: ['folha-lunar', 'pena-fenix'] });
    const hint = miss.events.find((e) => e.type === 'EXPERIMENT_FAILED');
    expect(hint && hint.type === 'EXPERIMENT_FAILED' ? LEGENDS.some((l) => hint.hint.includes(l.name)) : true).toBe(false);
  });

  it('páginas rasgadas revelam ingredientes em ordem, no baú e nos contratos', async () => {
    const { findPage, pagesFor } = await import('../../domain/rules/legends');
    const s = endgame();
    const d = { s: structuredClone(s), events: [] as GameEvent[], ctx };
    for (let i = 0; i < 18; i++) findPage(d, 'teste');
    expect(d.events.filter((e) => e.type === 'PAGE_FOUND').length).toBe(18);
    expect(findPage(d, 'teste')).toBe(false);
    expect(pagesFor(d.s, 'elixir-dragao')).toBe(3);
    const low = { s: { ...structuredClone(s), level: 9 }, events: [] as GameEvent[], ctx };
    expect(findPage(low, 'teste')).toBe(false);
  });

  it('clientes só pedem lendas que a loja conhece', () => {
    const s = endgame();
    let asked = false;
    for (let i = 0; i < 200 && !asked; i++) {
      const r = run({ ...s, customers: [], nextCustomerInMs: 0 } as GameSave, { type: 'ADVANCE', ms: 200 });
      asked = r.save.customers.some((c) => ['elixir-eco', 'tonico-gigante', 'pocao-invisivel', 'balsamo-sereia', 'elixir-sonhos', 'elixir-dragao'].includes(c.wantedRecipeId));
    }
    expect(asked).toBe(false);
  });
});
