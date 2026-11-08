import { describe, expect, it } from 'vitest';
import { nextTip } from '../../domain/data/tips';
import type { GameSave } from '../../domain/models/types';
import { maxBatches, repeatBatches } from '../../domain/rules/alchemy';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';

const ctx = { now: 0, random: () => 0.5 };
const run = (s: GameSave, cmds: DomainCommand[]) => {
  let save = s;
  for (const c of cmds) save = applyCommand(save, c, ctx).save;
  return save;
};

describe('caldeirão que não para (pacote O)', () => {
  it('guarda o último preparo e repete com um toque', () => {
    const s0 = { ...createNewGame(1), storySeen: true, tutorialStep: 7 };
    s0.ingredients = { ...s0.ingredients, 'folha-lunar': 20, 'po-de-pedra': 20 };
    const s1 = run(s0, [{ type: 'START_BREW', recipeId: 'cura-simples', batches: 2 }]);
    expect(s1.lastBrew).toEqual({ recipeId: 'cura-simples', batches: 2 });
    expect(repeatBatches(s1)).toBe(0); // ocupado
    const free = { ...s1, brew: null };
    expect(repeatBatches(free)).toBe(2);
    const s2 = run(free, [{ type: 'REPEAT_BREW' }]);
    expect(s2.brew?.recipeId).toBe('cura-simples');
    expect(s2.brew?.batches).toBe(2);
  });

  it('repete só o que os ingredientes permitem', () => {
    const s = { ...createNewGame(1), lastBrew: { recipeId: 'cura-simples', batches: 5 } };
    expect(repeatBatches(s)).toBe(Math.min(5, maxBatches(s, 'cura-simples')));
    const empty = { ...s, ingredients: {} };
    expect(repeatBatches(empty)).toBe(0);
    expect(run(empty, [{ type: 'REPEAT_BREW' }]).brew).toBeNull();
  });
});

describe('dicas (pacote N)', () => {
  it('no máximo uma dica por dia', () => {
    const s0 = { ...createNewGame(1), day: 2, storySeen: true, tutorialStep: 7, potions: [], brew: null };
    const tip = nextTip(s0);
    expect(tip).not.toBeNull();
    const s1 = run(s0, [{ type: 'SEE_TIP', tipId: tip!.id }]);
    expect(nextTip(s1)).toBeNull();
    expect(nextTip({ ...s1, day: 3 })).not.toBeNull();
  });
});
