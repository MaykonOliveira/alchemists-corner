import { describe, expect, it } from 'vitest';
import type { GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { LESSON_TIP } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';

const run = (s: GameSave, ...cmds: DomainCommand[]) => {
  let save = s;
  for (const c of cmds) save = applyCommand(save, c, { now: 0, random: () => 0.99 }).save;
  return save;
};
const day = (n: number, over: Partial<GameSave> = {}): GameSave => ({
  ...createNewGame(0), day: n, level: 3, phase: 'expediente', spawnInMs: 0, customers: [],
  potions: [
    { recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: true },
    { recipeId: 'elixir-concentracao', quantity: 3, quality: 1, forSale: true },
  ],
  ...over,
});
const first = (s: GameSave) => run(s, { type: 'ADVANCE', ms: 200 }).customers[0];

describe('tutorial das decisões (auditoria P1.4)', () => {
  it('dia 2: o primeiro cliente conta o sintoma', () => {
    expect(first(day(2)).symptom).toBe(true);
  });

  it('dia 3: entra uma nobre que quer a poção mais cara da prateleira', () => {
    const c = first(day(3));
    expect(c.archetype).toBe('nobre');
    expect(c.lesson).toBe('nobre');
    expect(c.wantedRecipeId).toBe('elixir-concentracao');
    expect(c.symptom).toBeFalsy();
  });

  it('dia 4: um morador de bolso curto pechincha pela etiqueta', () => {
    const c = first(day(4));
    expect(c.lesson).toBe('pechincha');
    const s = run({ ...day(4), spawnInMs: 99999, customers: [c] }, { type: 'SERVE_CUSTOMER', customerId: c.id, recipeId: c.wantedRecipeId });
    expect(s.customers[0].offer).not.toBeNull();
  });

  it('depois de aprendida, a lição não se repete', () => {
    const c = first(day(3, { tipsSeen: [LESSON_TIP.nobre] }));
    expect(c.lesson).toBeUndefined();
  });
});
