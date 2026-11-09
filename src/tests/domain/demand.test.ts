import { describe, expect, it } from 'vitest';
import type { GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { brewLimits } from '../../domain/rules/alchemy';
import { LESSON_TIP } from '../../domain/rules/customers';
import { shelfPerRecipe } from '../../domain/rules/economy';
import { createNewGame } from '../../domain/rules/initialState';
import { tomorrowPreview } from '../../domain/rules/retention';

const run = (s: GameSave, cmds: DomainCommand[], random = () => 0.3) => {
  let save = s;
  const events = [];
  for (const c of cmds) {
    const r = applyCommand(save, c, { now: 0, random });
    save = r.save;
    events.push(...r.events);
  }
  return { save, events };
};

describe('demanda que pressiona a oferta (auditoria P0.4)', () => {
  it('o fechamento anuncia a procura de amanhã, e ela vale no dia seguinte', () => {
    const s: GameSave = { ...createNewGame(0), day: 3, level: 4, phase: 'expediente', knownRecipes: ['cura-simples', 'tonico-energia', 'elixir-concentracao', 'balsamo-calmante', 'pocao-brilho'] };
    const closed = run(s, [{ type: 'CLOSE_SHOP' }]).save;
    expect(closed.nextTrend!.length).toBeGreaterThan(0);
    expect(tomorrowPreview(closed).some((l) => l.icon === '📈')).toBe(true);
    const next = run(closed, [{ type: 'START_NEXT_DAY' }]).save;
    expect(next.trend).toEqual(closed.nextTrend);
    expect(next.nextTrend).toEqual([]);
  });

  it('a rua pede bem mais a poção em alta', () => {
    const base: GameSave = { ...createNewGame(0), tipsSeen: Object.values(LESSON_TIP), day: 4, level: 4, phase: 'expediente', spawnInMs: 0, trend: ['elixir-concentracao'], knownRecipes: ['cura-simples', 'tonico-energia', 'elixir-concentracao', 'balsamo-calmante'] };
    const share = (save: GameSave) => {
      let seed = 1;
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      let hot = 0;
      for (let i = 0; i < 300; i++) {
        const after = run({ ...save, customers: [] }, [{ type: 'ADVANCE', ms: 200 }], random).save;
        if (after.customers[0]?.wantedRecipeId === 'elixir-concentracao') hot++;
      }
      return hot / 300;
    };
    expect(share(base)).toBeGreaterThan(share({ ...base, trend: [] }) * 1.5);
  });

  it('cada receita tem um limite na prateleira', () => {
    const s: GameSave = { ...createNewGame(0), ingredients: { 'folha-lunar': 40, 'po-de-pedra': 20 }, potions: [{ recipeId: 'cura-simples', quantity: shelfPerRecipe(createNewGame(0)), quality: 1, forSale: true }] };
    const lim = brewLimits(s, 'cura-simples');
    expect(lim.bySpace).toBe(0);
    expect(lim.shelfFull).toBe(true);
    const r = run(s, [{ type: 'START_BREW', recipeId: 'cura-simples', batches: 1 }]);
    expect(r.events[0]).toMatchObject({ type: 'ERROR' });
    expect((r.events[0] as { message: string }).message).toContain('de cada receita');
  });
});
