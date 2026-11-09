import { describe, expect, it } from 'vitest';
import type { GameSave } from '../../domain/models/types';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';
import { xpForLevel } from '../../domain/rules/progression';

const run = (s: GameSave, ...cmds: DomainCommand[]) => {
  let save = s;
  const events = [];
  for (const c of cmds) {
    const r = applyCommand(save, c, { now: 0, random: () => 0.5 });
    save = r.save;
    events.push(...r.events);
  }
  return { save, events };
};

describe('descobrir receitas na bancada (auditoria P1.2)', () => {
  const leveled = () => {
    const s: GameSave = { ...createNewGame(0), xp: xpForLevel(2) - 1, ingredients: { 'folha-lunar': 10, 'po-de-pedra': 10, 'cogumelo-lanterna': 2, 'essencia-azul': 2, 'hortela-brava': 2 } };
    return run(s, { type: 'EXPERIMENT', ingredientIds: ['folha-lunar', 'hortela-brava'] }).save; // +2 XP: sobe para o nível 2
  };

  it('o nível deixa uma pista, não a receita pronta', () => {
    const s = leveled();
    expect(s.level).toBe(2);
    expect(s.knownRecipes).not.toContain('visao-noturna');
    expect(s.recipeHints).toContain('visao-noturna');
  });

  it('acertar a mistura ensina a receita e apaga a pista', () => {
    const { save, events } = run(leveled(), { type: 'EXPERIMENT', ingredientIds: ['cogumelo-lanterna', 'essencia-azul'] });
    expect(save.knownRecipes).toContain('visao-noturna');
    expect(save.recipeHints).not.toContain('visao-noturna');
    expect(events).toContainEqual({ type: 'DISCOVERY', recipeId: 'visao-noturna' });
  });

  it('errar custa um ingrediente e a anotação ajuda a pista em aberto', () => {
    const s = leveled();
    const { save, events } = run(s, { type: 'EXPERIMENT', ingredientIds: ['po-de-pedra', 'essencia-azul'] });
    expect(save.ingredients['po-de-pedra']).toBe(s.ingredients['po-de-pedra'] - 1);
    const hint = events.find((e) => e.type === 'EXPERIMENT_FAILED') as { hint: string };
    expect(hint.hint).toMatch(/Visão Noturna|Bálsamo Calmante/);
  });

  it('saves antigos mantêm as receitas que já tinham', async () => {
    const { migrateSave } = await import('../../persistence/migrations');
    const old = { ...createNewGame(0), level: 4, knownRecipes: ['cura-simples'] };
    expect(migrateSave(old)!.knownRecipes).toContain('pocao-brilho');
  });
});
