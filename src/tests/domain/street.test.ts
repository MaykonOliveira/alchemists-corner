import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../domain/data/recipes';
import { EXPEDITIONS_BY_ID } from '../../domain/data/street';
import type { Customer, GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { maxPriceFor } from '../../domain/rules/customers';
import { supplierLeft, supplierStock } from '../../domain/rules/economy';
import { createNewGame } from '../../domain/rules/initialState';
import { xpForLevel } from '../../domain/rules/progression';
import { helperActive, RAVEN } from '../../domain/rules/helpers';
import { rivalDaysLeft } from '../../domain/rules/street';
import { migrateSave } from '../../persistence/migrations';

const ctxWith = (r: number) => ({ now: 0, random: () => r });
const run = (s: GameSave, cmds: DomainCommand[], r = 0.5) => {
  let save = s;
  const events = [];
  for (const c of cmds) {
    const res = applyCommand(save, c, ctxWith(r));
    save = res.save;
    events.push(...res.events);
  }
  return { save, events };
};
const atLevel = (level: number, over: Partial<GameSave> = {}): GameSave => {
  const s = { ...createNewGame(0), level, xp: xpForLevel(level), coins: 5000, phase: 'preparacao' as const, day: 4 };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level).map((r) => r.id);
  return { ...s, ...over };
};
/** Fecha o dia atual e abre o próximo. */
const nextDay = (s: GameSave, r = 0.5) => run(s, [{ type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' }], r);

describe('estação: ingredientes e poções próprios', () => {
  it('o fornecedor só vende o ingrediente da estação atual, a partir do nível 5', () => {
    const spring = atLevel(5, { day: 2 });
    const st = supplierStock(spring);
    expect(st['petala-aurora']).toBeGreaterThan(0);
    expect(st['fruta-sol']).toBe(0);
    expect(supplierStock(atLevel(4, { day: 2 }))['petala-aurora']).toBe(0);
    const summer = atLevel(5, { day: 9 });
    expect(supplierStock(summer)['fruta-sol']).toBeGreaterThan(0);
    expect(supplierStock(summer)['petala-aurora']).toBe(0);
  });

  it('Mercado da Lua Cheia traz os quatro ingredientes e mais itens raros', () => {
    const s = atLevel(5, { day: 2, event: 'lua-cheia' });
    const st = supplierStock(s);
    for (const id of ['petala-aurora', 'fruta-sol', 'folha-rubra', 'flor-neve']) expect(st[id]).toBeGreaterThan(0);
    expect(st['escama-salamandra']).toBeGreaterThan(supplierStock(atLevel(5, { day: 2 }))['escama-salamandra']!);
  });

  it('save antigo sem a chave no estoque não vende ingrediente da estação até o dia virar', () => {
    const s = atLevel(6, { day: 2, supplier: {} });
    expect(supplierLeft(s, 'petala-aurora')).toBe(0);
    expect(supplierLeft(s, 'folha-lunar')).toBe(Infinity);
  });

  it('poções da estação existem para as quatro estações e caem no livro no nível 5', () => {
    const seasonal = RECIPES.filter((r) => r.season);
    expect(seasonal.map((r) => r.season).sort()).toEqual(['inverno', 'outono', 'primavera', 'verao']);
    expect(seasonal.every((r) => r.unlockLevel === 5)).toBe(true);
  });

  it('o Eclipse paga quase o dobro pelas poções de mente', () => {
    const c: Customer = { id: 'c', archetype: 'estudioso', wantedRecipeId: 'elixir-concentracao', budgetFactor: 1.2, patienceMs: 1, waitedMs: 0, offer: null, remark: null };
    const normal = maxPriceFor(atLevel(6), c, 'elixir-concentracao');
    const eclipse = maxPriceFor(atLevel(6, { event: 'eclipse' }), c, 'elixir-concentracao');
    expect(eclipse / normal).toBeGreaterThan(1.7);
  });
});

describe('rival da rua', () => {
  it('só começa no nível 4 e a partir do dia 8, e fecha a semana no 7º dia', () => {
    const early = nextDay(atLevel(4, { day: 6 })).save;
    expect(early.reports.at(-1)!.rival).toBeUndefined();
    expect(rivalDaysLeft(14)).toBe(1);
    expect(rivalDaysLeft(8)).toBe(7);
  });

  it('vence a semana quem faturou mais e ganha prêmio', () => {
    let s = atLevel(6, { day: 14, rival: { week: 1, me: 9000, her: 100, wins: 0, losses: 0 } });
    const coins = s.coins;
    const r = nextDay(s);
    const ev = r.events.find((e) => e.type === 'RIVAL_RESULT');
    expect(ev && ev.type === 'RIVAL_RESULT' && ev.win).toBe(true);
    expect(r.save.rival.wins).toBe(1);
    expect(r.save.coins).toBeGreaterThan(coins - 500);
    // Semana nova começa zerada
    s = nextDay(r.save).save;
    expect(s.rival.week).toBe(2);
    expect(s.rival.me).toBe(0);
  });

  it('perder não tira nada, só conta a derrota', () => {
    const s = atLevel(6, { day: 14, coins: 3000, rival: { week: 1, me: 0, her: 50000, wins: 0, losses: 0 } });
    const r = nextDay(s);
    expect(r.save.rival.losses).toBe(1);
    expect(r.save.reports.at(-1)!.rival!.result).toBe('loss');
  });
});

describe('eventos raros', () => {
  it('o Visitante Misterioso deixa um pedido do dia que dá Selo e achado', () => {
    // Sorteio com um gerador simples: em poucas dezenas de dias o visitante aparece.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let found: GameSave | null = null;
    for (let i = 0; i < 400 && !found; i++) {
      const base = atLevel(6, { day: 9, order: null });
      let save = base;
      for (const c of [{ type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' }] as DomainCommand[]) save = applyCommand(save, c, { now: 0, random: rnd }).save;
      if (save.event === 'visitante') found = save;
    }
    expect(found).not.toBeNull();
    const s = found!;
    expect(s.order?.visitor).toBe(true);
    expect(s.order?.dueDay).toBe(s.day);
    const ready = { ...s, potions: [{ recipeId: s.order!.recipeId, quantity: 5, quality: 1, forSale: true }] };
    const seals = s.contractSeals;
    const r = run(ready, [{ type: 'DELIVER_ORDER' }]);
    expect(r.save.contractSeals).toBe(seals + 1);
    expect(r.save.finds.length).toBe(1);
  });
});

describe('expedições do corvo', () => {
  const withRaven = (over: Partial<GameSave> = {}) => atLevel(9, { upgrades: [RAVEN], ...over });

  it('precisa do corvo, do nível e de moedas', () => {
    expect(run(atLevel(9), [{ type: 'SEND_EXPEDITION', dest: 'floresta' }]).save.expedition).toBeNull();
    expect(run(withRaven({ level: 5 }), [{ type: 'SEND_EXPEDITION', dest: 'caverna' }]).save.expedition).toBeNull();
    expect(run(withRaven({ coins: 10 }), [{ type: 'SEND_EXPEDITION', dest: 'floresta' }]).save.expedition).toBeNull();
  });

  it('o corvo não faz entregas enquanto viaja e volta com ingredientes no dia certo', () => {
    let s = run(withRaven({ coins: 1000 }), [{ type: 'SEND_EXPEDITION', dest: 'caverna' }]).save;
    expect(s.coins).toBe(1000 - EXPEDITIONS_BY_ID.caverna.cost);
    expect(helperActive(s, RAVEN)).toBe(false);
    expect(run(s, [{ type: 'SEND_EXPEDITION', dest: 'floresta' }]).save.expedition?.dest).toBe('caverna');
    s = nextDay(s).save; // dia 5: ainda viajando
    expect(s.expedition).not.toBeNull();
    const before = s.ingredients['cogumelo-lanterna'];
    const r = nextDay(s, 0.1); // dia 6: volta
    expect(r.save.expedition).toBeNull();
    expect(r.save.expeditionsDone).toBe(1);
    expect(r.save.ingredients['cogumelo-lanterna']).toBeGreaterThan(before);
    const back = r.events.find((e) => e.type === 'EXPEDITION_BACK');
    expect(back && back.type === 'EXPEDITION_BACK' && back.find).toBeTruthy();
  });

  it('a floresta traz o ingrediente da estação', () => {
    const s = run(withRaven({ day: 2 }), [{ type: 'SEND_EXPEDITION', dest: 'floresta' }]).save;
    const back = nextDay(s).save;
    expect(back.ingredients['petala-aurora']).toBeGreaterThan(0);
  });
});

describe('save v7', () => {
  it('saves antigos ganham rival, expedição e achados zerados', () => {
    const old = { ...createNewGame(0), saveVersion: 6 } as Record<string, unknown>;
    delete old.rival;
    delete old.finds;
    delete old.expedition;
    const s = migrateSave(old)!;
    expect(s.rival).toEqual({ week: 0, me: 0, her: 0, wins: 0, losses: 0 });
    expect(s.finds).toEqual([]);
    expect(s.expedition).toBeNull();
    expect(s.saveVersion).toBe(9);
  });
});
