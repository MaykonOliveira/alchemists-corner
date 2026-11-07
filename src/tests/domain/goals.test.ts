import { describe, expect, it } from 'vitest';
import { TIPS, nextTip } from '../../domain/data/tips';
import { RECIPES } from '../../domain/data/recipes';
import type { GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { CHEST_GOAL, chestReady, ensureGoals, rollGoals } from '../../domain/rules/goals';
import { createNewGame } from '../../domain/rules/initialState';
import { xpForLevel } from '../../domain/rules/progression';
import { migrateSave } from '../../persistence/migrations';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, cmds: DomainCommand[]) => {
  let save = s;
  const events = [];
  for (const c of cmds) {
    const res = applyCommand(save, c, ctx);
    save = res.save;
    events.push(...res.events);
  }
  return { save, events };
};
const atLevel = (level: number, day: number): GameSave => {
  const s = { ...createNewGame(1234), level, xp: xpForLevel(level), coins: 5000, day };
  s.knownRecipes = RECIPES.filter((r) => r.unlockLevel <= level && !r.season).map((r) => r.id);
  ensureGoals(s);
  return s;
};

describe('metas do dia', () => {
  it('partida nova já começa com três metas que seguem o tutorial', () => {
    const s = createNewGame(0);
    expect(s.goals.day).toBe(1);
    expect(s.goals.list.map((g) => g.kind)).toEqual(['preparar', 'vender', 'sem-troca']);
  });

  it('o sorteio é o mesmo para o mesmo dia e muda de um dia para o outro', () => {
    const a = atLevel(6, 10);
    expect(rollGoals(a)).toEqual(rollGoals(structuredClone(a)));
    const kinds = new Set<string>();
    for (let day = 2; day < 30; day++) {
      const g = rollGoals(atLevel(6, day));
      expect(g).toHaveLength(3);
      expect(new Set(g.map((x) => x.kind)).size).toBe(3);
      g.forEach((x) => kinds.add(x.kind));
    }
    expect(kinds.size).toBeGreaterThanOrEqual(5);
  });

  it('preparar a receita cumpre a meta e paga moedas e XP', () => {
    const s = createNewGame(0);
    const coins = s.coins;
    const { save, events } = run(s, [{ type: 'START_BREW', recipeId: 'cura-simples', batches: 1 }]);
    const done = events.find((e) => e.type === 'GOAL_DONE');
    expect(done).toBeTruthy();
    const g = save.goals.list.find((x) => x.kind === 'preparar')!;
    expect(g.done).toBe(true);
    expect(save.goals.weekDone).toBe(1);
    expect(save.xp).toBeGreaterThan(s.xp);
    // o preparo gasta ingredientes, não moedas: a diferença é o prêmio da meta
    expect(save.coins).toBe(coins + g.coins);
  });

  it('meta cumprida não paga duas vezes', () => {
    const s = createNewGame(0);
    s.ingredients['folha-lunar'] = 20; s.ingredients['po-de-pedra'] = 20;
    const { events } = run(s, [
      { type: 'START_BREW', recipeId: 'cura-simples', batches: 1 },
      { type: 'PET_CAT' },
    ]);
    expect(events.filter((e) => e.type === 'GOAL_DONE')).toHaveLength(1);
  });

  it('virar o dia sorteia metas novas', () => {
    const s = atLevel(4, 5);
    const { save } = run(s, [{ type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' }]);
    expect(save.goals.day).toBe(6);
    expect(save.goals.list.every((g) => !g.done && g.progress === 0)).toBe(true);
  });
});

describe('baú da semana', () => {
  it(`abre com ${CHEST_GOAL} metas, uma vez por semana`, () => {
    const s = atLevel(8, 10);
    expect(chestReady(s)).toBe(false);
    expect(run(s, [{ type: 'CLAIM_CHEST' }]).events[0].type).toBe('ERROR');
    s.goals.weekDone = CHEST_GOAL;
    const { save, events } = run(s, [{ type: 'CLAIM_CHEST' }]);
    const open = events.find((e) => e.type === 'CHEST_OPENED');
    expect(open && open.type === 'CHEST_OPENED' && open.items.length).toBeGreaterThan(0);
    expect(save.coins).toBeGreaterThan(s.coins);
    expect(chestReady(save)).toBe(false);
    expect(run(save, [{ type: 'CLAIM_CHEST' }]).events[0].type).toBe('ERROR');
  });

  it('a semana nova zera o baú', () => {
    const s = atLevel(8, 14);
    s.goals.weekDone = 12; s.goals.chestClaimed = true;
    const { save } = run(s, [{ type: 'OPEN_SHOP' }, { type: 'CLOSE_SHOP' }, { type: 'START_NEXT_DAY' }]);
    expect(save.goals.weekDone).toBe(0);
    expect(save.goals.chestClaimed).toBe(false);
  });
});

describe('dicas e história', () => {
  it('cada dica aparece uma vez', () => {
    const s = atLevel(3, 4);
    const first = nextTip(s)!;
    expect(first).toBeTruthy();
    const { save } = run(s, [{ type: 'SEE_TIP', tipId: first.id }]);
    expect(save.tipsSeen).toContain(first.id);
    expect(nextTip(save)?.id).not.toBe(first.id);
    expect(new Set(TIPS.map((t) => t.id)).size).toBe(TIPS.length);
  });

  it('avisa quando o armário lota e o corvo não consegue comprar', () => {
    const s = atLevel(5, 6);
    s.upgrades = [...s.upgrades, 'corvo-entregador'];
    s.tipsSeen = TIPS.map((t) => t.id).filter((id) => id !== 'armario-cheio');
    for (const k of Object.keys(s.ingredients)) s.ingredients[k] = 50;
    expect(nextTip(s)?.id).toBe('armario-cheio');
  });

  it('partida nova mostra a história; save antigo não', () => {
    expect(createNewGame(0).storySeen).toBe(false);
    const old = { ...createNewGame(0), saveVersion: 7 } as Record<string, unknown>;
    delete old.storySeen; delete old.goals; delete old.tipsSeen;
    const m = migrateSave(old)!;
    expect(m.storySeen).toBe(true);
    expect(m.goals.list).toHaveLength(3);
    expect(run(createNewGame(0), [{ type: 'SEE_STORY' }]).save.storySeen).toBe(true);
  });
});
