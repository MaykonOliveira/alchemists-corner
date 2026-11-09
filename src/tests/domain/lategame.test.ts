import { describe, expect, it } from 'vitest';
import { RECIPES, RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import type { Customer, GameEvent, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { maxPriceFor, spawnCustomer } from '../../domain/rules/customers';
import { ingredientPrice, potionCapacity, priceRange, recipeCost } from '../../domain/rules/economy';
import { createNewGame } from '../../domain/rules/initialState';
import { MASTERY_STEPS, masteryStars } from '../../domain/rules/mastery';
import {
  levelFromXp, MASTER_STEP_XP, masterRank, MAX_LEVEL, SEAL_CRYSTALS, sealsEarned, xpForLevel,
} from '../../domain/rules/progression';
import type { Draft } from '../../domain/rules/context';
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
  id: 'c-x', archetype: 'nobre', wantedRecipeId: 'pocao-sorte', budgetFactor: 1.4, patienceMs: 30000,
  waitedMs: 0, offer: null, remark: null, ...over,
});
/** Partida no nível informado, com receitas liberadas e caixa cheio. */
const atLevel = (level: number, over: Partial<GameSave> = {}): GameSave => {
  const s = { ...createNewGame(0), level, xp: xpForLevel(level), coins: 20000 };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level).map((r) => r.id);
  return { ...s, ...over };
};

/** Save com os Selos já pagos em cristais, para o teste olhar só o que o comando muda. */
const settled = (s: GameSave): GameSave => ({ ...s, sealsPaid: sealsEarned(s) });

describe('conteúdo do late game', () => {
  it('há algo novo em cada nível do 6 ao 15', () => {
    for (let lvl = 6; lvl <= MAX_LEVEL; lvl++) {
      const recipe = RECIPES.some((r) => r.unlockLevel === lvl);
      const upgrade = UPGRADES.some((u) => u.requiredLevel === lvl);
      expect(recipe || upgrade || lvl === 11 || lvl === 13 || lvl === 15).toBe(true);
    }
    expect(RECIPES.filter((r) => !r.season && !r.secret && !r.legend).length).toBe(11);
  });

  it('cada receita tem uma combinação única de ingredientes (a bancada de experimentos funciona)', () => {
    const keys = RECIPES.map((r) => r.ingredients.map((i) => i.ingredientId).sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('as poções novas dão mais lucro por lote que as antigas', () => {
    const s = createNewGame(0);
    const margin = (id: string) => RECIPES_BY_ID[id].basePrice * 2 - recipeCost(s, id);
    for (const id of ['pocao-sorte', 'elixir-geada', 'pena-leve', 'elixir-estelar', 'elixir-fenix']) {
      expect(margin(id)).toBeGreaterThan(margin('pocao-brilho'));
    }
  });

  it('o nível máximo é 15 e depois vêm os graus de Mestre', () => {
    expect(levelFromXp(10_000_000)).toBe(MAX_LEVEL);
    expect(masterRank(xpForLevel(MAX_LEVEL) - 1)).toBe(0);
    expect(masterRank(xpForLevel(MAX_LEVEL) + MASTER_STEP_XP * 2)).toBe(2);
  });

  it('subir para o nível 12 libera o Elixir Estelar e rende Selos', () => {
    const s = atLevel(11, { xp: xpForLevel(12) - 1 });
    s.knownRecipes = s.knownRecipes.filter((id) => id !== 'elixir-estelar');
    const { save, events } = run(s, { type: 'BUY_UPGRADE', upgradeId: 'estufa' });
    expect(save.level).toBe(12);
    expect(save.recipeHints).toContain('elixir-estelar');
    expect(events.some((e) => e.type === 'LEVEL_UP' && e.level === 12)).toBe(true);
    // Os Selos viram cristais de luar (P1.1): 2 Selos, 20 cristais.
    expect(save.sealsPaid).toBe(2);
    expect(events).toContainEqual({ type: 'CRYSTALS', n: 2 * SEAL_CRYSTALS, reason: 'selo' });
  });

  it('graus de Mestre avisam e dão Selo', () => {
    const s = atLevel(15, { xp: xpForLevel(15) + MASTER_STEP_XP - 5 });
    const { save, events } = run(s, { type: 'BUY_UPGRADE', upgradeId: 'estufa' });
    expect(events.some((e) => e.type === 'MASTER_RANK' && e.rank === 1)).toBe(true);
    expect(save.sealsPaid).toBe(5 + 1);
  });
});

describe('talentos do Grimório', () => {
  it('custam 10, 20, 30 cristais e respeitam o grau máximo', () => {
    // Quanto o comando cobrou (descontando cristais que a conquista do primeiro talento dá).
    const spent = (before: GameSave, r: { save: GameSave; events: GameEvent[] }) =>
      before.crystals - r.save.crystals + r.events.reduce((n, e) => n + (e.type === 'CRYSTALS' ? e.n : 0), 0);
    let s = settled(atLevel(13, { crystals: 30 }));
    let r = run(s, { type: 'LEARN_TALENT', talentId: 'labia' });
    expect(r.save.talents.labia).toBe(1);
    expect(spent(s, r)).toBe(10);
    s = r.save;
    r = run(s, { type: 'LEARN_TALENT', talentId: 'labia' });
    expect(r.save.talents.labia).toBe(2);
    expect(spent(s, r)).toBe(20);
    s = r.save;
    r = run(s, { type: 'LEARN_TALENT', talentId: 'labia' });
    expect(r.save.talents.labia).toBe(2);
    expect(r.events.some((e) => e.type === 'ERROR')).toBe(true);
  });

  it('antes do Grimório despertar não aprende nada, nem com cristais no bolso', () => {
    const r = run(atLevel(10, { crystals: 500 }), { type: 'LEARN_TALENT', talentId: 'fama' });
    expect(r.save.talents.fama).toBeUndefined();
    expect(r.save.crystals).toBe(500);
  });

  it('lábia aumenta o que o cliente aceita pagar e o amigo do fornecedor barateia', () => {
    const s = atLevel(12);
    const c = customer();
    const before = maxPriceFor(s, c, 'pocao-sorte');
    const after = maxPriceFor({ ...s, talents: { labia: 2 } }, c, 'pocao-sorte');
    expect(after).toBeGreaterThan(before);
    expect(ingredientPrice({ ...s, talents: { 'fornecedor-amigo': 3 } }, 'pena-fenix')).toBeLessThan(ingredientPrice(s, 'pena-fenix'));
  });

  it('caldeirão grande permite mais lotes', () => {
    // Com as duas prateleiras extras cabem 20 de cada receita (auditoria P0.4).
    const s = atLevel(12, { upgrades: ['prateleira-extra', 'despensa-encantada'], talents: { 'caldeirao-grande': 2 }, ingredients: { ...createNewGame(0).ingredients, 'folha-lunar': 40, 'po-de-pedra': 20 }, potions: [] });
    const { save } = run(s, { type: 'START_BREW', recipeId: 'cura-simples', batches: 7 });
    expect(save.brew?.batches).toBe(7);
  });
});

describe('maestria das receitas', () => {
  it('ganha estrela ao preparar e a estrela sobe preço e teto', () => {
    const s = atLevel(6, {
      mastery: { 'cura-simples': MASTERY_STEPS[0] - 1 },
      ingredients: { ...createNewGame(0).ingredients, 'folha-lunar': 10, 'po-de-pedra': 10 },
      potions: [],
    });
    const c = customer({ archetype: 'morador', wantedRecipeId: 'cura-simples', budgetFactor: 1 });
    const priceBefore = maxPriceFor(s, c, 'cura-simples');
    const capBefore = priceRange(s, 'cura-simples').max;
    let r = run(s, { type: 'START_BREW', recipeId: 'cura-simples', batches: 1 });
    r = run(r.save, { type: 'ADVANCE', ms: r.save.brew!.totalMs });
    expect(masteryStars(r.save, 'cura-simples')).toBe(1);
    expect(r.events.some((e) => e.type === 'MASTERY_STAR')).toBe(true);
    expect(maxPriceFor(r.save, c, 'cura-simples')).toBeGreaterThanOrEqual(priceBefore);
    expect(priceRange(r.save, 'cura-simples').max).toBeGreaterThan(capBefore);
  });

  it('receita dominada (5 estrelas) rende 1 Selo', () => {
    const s = atLevel(5, { mastery: { 'cura-simples': MASTERY_STEPS[4] } });
    expect(sealsEarned(s)).toBe(1);
  });
});

describe('melhorias do late game', () => {
  it('o alambique rende 3 poções por lote', () => {
    const s = atLevel(9, {
      upgrades: ['alambique-prata'], potions: [],
      ingredients: { ...createNewGame(0).ingredients, 'folha-lunar': 10, 'po-de-pedra': 10 },
    });
    let r = run(s, { type: 'START_BREW', recipeId: 'cura-simples', batches: 2 });
    r = run(r.save, { type: 'ADVANCE', ms: r.save.brew!.totalMs });
    expect(r.save.potions.find((p) => p.recipeId === 'cura-simples')?.quantity).toBe(6);
  });

  it('a estufa colhe ervas toda manhã', () => {
    const s = atLevel(7, { upgrades: ['estufa'], phase: 'expediente', ingredients: { ...createNewGame(0).ingredients, 'folha-lunar': 0, 'raiz-mandragora': 0 } });
    const r = run(s, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' });
    expect(r.save.ingredients['folha-lunar']).toBe(4);
    expect(r.save.ingredients['raiz-mandragora']).toBe(2);
    expect(r.events.some((e) => e.type === 'GREENHOUSE_HARVEST')).toBe(true);
  });

  it('a despensa encantada aumenta as capacidades', () => {
    const s = atLevel(11);
    expect(potionCapacity({ ...s, upgrades: ['despensa-encantada'] })).toBe(potionCapacity(s) + 12);
  });
});

describe('clientes do late game', () => {
  const spawnMany = (s: GameSave, n: number) => {
    const out: Customer[] = [];
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const d: Draft = { s: structuredClone({ ...s, customers: [] }), events: [], ctx: { now: 0, random } };
      spawnCustomer(d);
      out.push(d.s.customers[0]);
    }
    return out;
  };

  it('a nobreza só aparece a partir do nível 8', () => {
    expect(spawnMany(atLevel(7, { day: 5 }), 300).some((c) => c.archetype === 'nobre')).toBe(false);
    expect(spawnMany(atLevel(8, { day: 5 }), 300).some((c) => c.archetype === 'nobre')).toBe(true);
  });

  it('no começo do jogo ninguém pede poções de nível alto', () => {
    for (const c of spawnMany(atLevel(1, { day: 5 }), 300)) expect(RECIPES_BY_ID[c.wantedRecipeId].unlockLevel).toBeLessThanOrEqual(2);
  });
});

describe('save antigo (v3, nível 10 zerado)', () => {
  it('ganha as receitas novas, guarda a XP na porta do nível 11 e estima a maestria', () => {
    const old = createNewGame(0) as unknown as Record<string, unknown>;
    const { mastery: _m, talents: _t, ...rest } = old;
    const raw = {
      ...rest, saveVersion: 3, level: 10, xp: 40000, coins: 5000,
      reports: [{ day: 1, salesByRecipe: { 'cura-simples': 30, 'pocao-brilho': 12 } }],
    };
    const s = migrateSave(raw)!;
    expect(s.knownRecipes).toEqual(expect.arrayContaining(['pocao-sorte', 'elixir-geada', 'pena-leve']));
    expect(s.knownRecipes).not.toContain('elixir-estelar');
    expect(s.xp).toBe(xpForLevel(11) - 1);
    expect(s.mastery['cura-simples']).toBe(30);
    expect(masteryStars(s, 'cura-simples')).toBe(2);
    expect(s.talents).toEqual({});
    // A próxima venda já sobe para o nível 11.
    const { save } = run(s, { type: 'BUY_UPGRADE', upgradeId: 'estufa' });
    expect(save.level).toBe(11);
  });
});

describe('gastos de fim de jogo', () => {
  it('doação à Guilda troca moedas por Selos, cada vez mais caros', () => {
    let s = settled(atLevel(11, { coins: 10000 }));
    const paid = s.sealsPaid!;
    s = run(s, { type: 'BUY_SEAL' }).save;
    expect(s.coins).toBe(7000);
    expect(s.sealsPaid).toBe(paid + 1);
    s = run(s, { type: 'BUY_SEAL' }).save;
    expect(s.coins).toBe(1000);
    expect(run(s, { type: 'BUY_SEAL' }).save.sealsBought).toBe(2);
  });

  it('patrocinar o festival garante o evento no dia seguinte', () => {
    const s = atLevel(9, { phase: 'expediente', coins: 5000 });
    const r = run(s, { type: 'SPONSOR_FESTIVAL' }, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' });
    expect(r.save.event).toBe('festival');
    expect(r.save.festivalSponsored).toBe(false);
    expect(run(atLevel(7), { type: 'SPONSOR_FESTIVAL' }).save.festivalSponsored).toBe(false);
  });
});
