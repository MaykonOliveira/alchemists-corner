import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../domain/data/recipes';
import { MAX_HEARTS, REGULARS, SEASON_DAYS, TIP_HEARTS } from '../../domain/data/world';
import type { Customer, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { maxPriceFor } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';
import { xpForLevel } from '../../domain/rules/progression';
import { ACHIEVEMENTS, seasonCategory, seasonOf } from '../../domain/rules/world';
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
  const s = { ...createNewGame(0), level, xp: xpForLevel(level), coins: 5000, phase: 'expediente' as const, day: 4 };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level).map((r) => r.id);
  return { ...s, ...over };
};
const celia = REGULARS.find((r) => r.id === 'dona-celia')!;
const regularCustomer = (over: Partial<Customer> = {}): Customer => ({
  id: 'c-r', archetype: celia.archetype, wantedRecipeId: celia.favorite, budgetFactor: 2, patienceMs: 30000, waitedMs: 0,
  offer: null, remark: null, regularId: celia.id, ...over,
});
const stock = (recipeId: string, quantity: number) => [{ recipeId, quantity, quality: 1, forSale: true }];

describe('estações', () => {
  it('mudam a cada 7 dias e dão a volta no ano', () => {
    expect(seasonOf(1).id).toBe('primavera');
    expect(seasonOf(SEASON_DAYS).id).toBe('primavera');
    expect(seasonOf(SEASON_DAYS + 1).id).toBe('verao');
    expect(seasonOf(SEASON_DAYS * 4 + 1).id).toBe('primavera');
  });

  it('a categoria da estação paga mais, mas só a partir do dia 3', () => {
    const c = regularCustomer({ regularId: null, budgetFactor: 1 });
    const early = atLevel(3, { day: 1 });
    const later = atLevel(3, { day: 4 });
    expect(seasonCategory(early)).toBeNull();
    expect(seasonCategory(later)).toBe('cura');
    expect(maxPriceFor(later, c, 'cura-simples')).toBeGreaterThan(maxPriceFor(early, c, 'cura-simples'));
    expect(maxPriceFor(later, c, 'tonico-energia')).toBe(maxPriceFor(early, c, 'tonico-energia'));
  });

  it('avisa quando uma estação começa', () => {
    const r = run(atLevel(3, { day: SEASON_DAYS, phase: 'fechamento' }), { type: 'START_NEXT_DAY' });
    expect(r.events.some((e) => e.type === 'SEASON_STARTED' && e.season === 'verao')).toBe(true);
  });
});

describe('fregueses fiéis', () => {
  it('ganham coração com a favorita, deixam gorjeta e viram amigos com presente', () => {
    let s = atLevel(3, { prices: { 'cura-simples': 18 } });
    let tips = 0;
    for (let i = 0; i < MAX_HEARTS; i++) {
      s = { ...s, customers: [regularCustomer({ id: `c-${i}` })], potions: stock('cura-simples', 3) };
      const before = s.coins;
      const r = run(s, { type: 'SERVE_CUSTOMER', customerId: `c-${i}`, recipeId: 'cura-simples' });
      s = r.save;
      const tip = s.coins - before - 18;
      if (i >= TIP_HEARTS) expect(tip).toBeGreaterThan(0);
      else expect(tip).toBe(0);
      tips += tip;
      if (i === MAX_HEARTS - 1) expect(r.events.some((e) => e.type === 'REGULAR_GIFT')).toBe(true);
    }
    expect(s.regulars[celia.id]).toMatchObject({ hearts: MAX_HEARTS, visits: MAX_HEARTS, gift: true });
    expect(s.ingredients[celia.gift.ingredientId]).toBeGreaterThan(0);
    expect(tips).toBeGreaterThan(0);
    expect(s.achievements).toContain('amigo');
  });

  it('aparecem no balcão com o pedido de sempre', () => {
    // random 0 → sempre cai na chance de freguês
    const r = applyCommand(atLevel(5, { spawnInMs: 1, customers: [] }), { type: 'ADVANCE', ms: 10 }, { now: 0, random: () => 0 });
    const c = r.save.customers[0];
    expect(c.regularId).toBeTruthy();
    expect(c.wantedRecipeId).toBe(REGULARS.find((x) => x.id === c.regularId)!.favorite);
  });
});

describe('álbum e gato', () => {
  it('a primeira venda entra no álbum', () => {
    const s = atLevel(1, { customers: [regularCustomer({ regularId: null })], potions: stock('cura-simples', 1) });
    const r = run(s, { type: 'SERVE_CUSTOMER', customerId: 'c-r', recipeId: 'cura-simples' });
    expect(r.save.lifetime.sold).toBe(1);
    expect(r.save.achievements).toContain('primeira-venda');
    expect(r.events.some((e) => e.type === 'ACHIEVEMENT' && e.id === 'primeira-venda')).toBe(true);
  });

  it('carinho no gato: sorte uma vez por dia', () => {
    const s = atLevel(2, { reputation: 10 });
    const r = run(s, { type: 'PET_CAT' }, { type: 'PET_CAT' }, { type: 'PET_CAT' });
    expect(r.save.petCount).toBe(3);
    expect(r.save.reputation).toBe(11);
    expect(r.events.filter((e) => e.type === 'CAT_PETTED' && e.lucky)).toHaveLength(1);
  });

  it('as conquistas têm ids únicos', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('save antigo ganha os campos novos e estima os totais pelos relatórios', () => {
    const old = createNewGame(0) as unknown as Record<string, unknown>;
    const { regulars: _r, achievements: _a, lifetime: _l, petCount: _p, petDay: _d, ...rest } = old;
    const s = migrateSave({ ...rest, saveVersion: 5, reports: [{ day: 1, revenue: 120, salesByRecipe: { 'cura-simples': 6 } }] })!;
    expect(s.regulars).toEqual({});
    expect(s.achievements).toEqual([]);
    expect(s.lifetime).toEqual({ sold: 6, earned: 120 });
    expect(s.petCount).toBe(0);
  });
});
