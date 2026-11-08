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
  s.knownRecipes = RECIPES.filter((r) => !r.secret).map((r) => r.id);
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
    const s = run({ ...endgame(), sealsBought: 100 }, { type: 'LEARN_TALENT', talentId: 'toque-de-ouro' }, { type: 'LEARN_TALENT', talentId: 'toque-de-ouro' });
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
  it('cada etapa cobra moedas; a inauguração pede as poções doadas e liga o bônus', async () => {
    const { ingredientPrice } = await import('../../domain/rules/economy');
    let s = endgame({ coins: 30000, potions: [] });
    const before = ingredientPrice(s, 'folha-lunar');
    s = run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' }, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save;
    expect(s.village.fonte).toBe(2);
    expect(s.coins).toBe(30000 - 7000);
    // Sem as 10 Poções de Cura, a fonte não inaugura.
    expect(run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' }).save.village.fonte).toBe(2);
    s = { ...s, potions: [{ recipeId: 'cura-simples', quantity: 12, quality: 1, forSale: true }] };
    const r = run(s, { type: 'BUILD_VILLAGE', projectId: 'fonte' });
    expect(r.save.village.fonte).toBe(3);
    expect(r.save.potions[0].quantity).toBe(2);
    // O mercado pronto barateia o fornecedor.
    let m = endgame({ coins: 30000 });
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
