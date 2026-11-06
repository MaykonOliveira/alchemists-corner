import { describe, expect, it } from 'vitest';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES } from '../../domain/data/recipes';
import { applyCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';
import { levelFromXp, xpForLevel } from '../../domain/rules/progression';
import { CLOSE_MIN, formatClock, OPEN_MIN, timeOfDay } from '../../domain/rules/time';

describe('dados iniciais', () => {
  it('toda receita usa ingredientes existentes', () => {
    for (const r of RECIPES) for (const i of r.ingredients) expect(INGREDIENTS_BY_ID[i.ingredientId]).toBeDefined();
  });

  it('nova partida começa na preparação do dia 1', () => {
    const s = createNewGame(0);
    expect(s).toMatchObject({ day: 1, phase: 'preparacao', clockMin: OPEN_MIN, saveVersion: 1 });
    expect(s.knownRecipes.length).toBeGreaterThan(0);
  });
});

describe('ciclo do dia', () => {
  it('abre, passa o tempo e fecha sozinho ao fim do expediente', () => {
    let s = createNewGame(0);
    expect(applyCommand(s, { type: 'TICK', minutes: 10 })).toBe(s); // relógio parado na preparação
    s = applyCommand(s, { type: 'OPEN_SHOP' });
    expect(s.phase).toBe('expediente');
    s = applyCommand(s, { type: 'TICK', minutes: 30 });
    expect(s.clockMin).toBe(OPEN_MIN + 30);
    s = applyCommand(s, { type: 'TICK', minutes: 10_000 });
    expect(s.clockMin).toBe(CLOSE_MIN);
    expect(s.phase).toBe('fechamento');
    s = applyCommand(s, { type: 'START_NEXT_DAY' });
    expect(s).toMatchObject({ day: 2, phase: 'preparacao', clockMin: OPEN_MIN });
  });

  it('pode encerrar o expediente antes da hora', () => {
    const s = applyCommand(applyCommand(createNewGame(0), { type: 'OPEN_SHOP' }), { type: 'CLOSE_SHOP' });
    expect(s.phase).toBe('fechamento');
  });

  it('não muta o estado anterior', () => {
    const s = createNewGame(0);
    applyCommand(s, { type: 'OPEN_SHOP' });
    expect(s.phase).toBe('preparacao');
  });
});

describe('tempo e progressão', () => {
  it('formata e classifica o horário', () => {
    expect(formatClock(8 * 60 + 5)).toBe('08:05');
    expect(timeOfDay(9 * 60)).toBe('manha');
    expect(timeOfDay(13 * 60)).toBe('tarde');
    expect(timeOfDay(19 * 60)).toBe('noite');
  });

  it('nível cresce com a experiência', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(2))).toBe(2);
    expect(levelFromXp(xpForLevel(3) - 1)).toBe(2);
  });
});
