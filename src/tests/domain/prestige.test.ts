// Auditoria P1.1: Selos de Mestre e Cristais de luar viraram uma moeda de prestígio só.
import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../domain/rules/commands';
import { createNewGame } from '../../domain/rules/initialState';
import { SEAL_CRYSTALS, sealsEarned, xpForLevel } from '../../domain/rules/progression';
import { migrateSave } from '../../persistence/migrations';

const ctx = { now: 0, random: () => 0.5 };

describe('uma moeda de prestígio só (P1.1)', () => {
  it('save antigo: os Selos guardados viram cristais, os já gastos ficam nos talentos', () => {
    // Nível 13 = 3 Selos; 1 gasto no grau 1 da lábia; sobram 2 = 20 cristais.
    const old = { ...createNewGame(0), level: 13, xp: xpForLevel(13), crystals: 7, talents: { labia: 1 } } as Record<string, unknown>;
    delete old.sealsPaid;
    const s = migrateSave(old)!;
    expect(s.crystals).toBe(7 + 2 * SEAL_CRYSTALS);
    expect(s.sealsPaid).toBe(3);
    expect(s.talents.labia).toBe(1);
    // Carregar de novo não paga duas vezes.
    expect(migrateSave(s as unknown as Record<string, unknown>)!.crystals).toBe(s.crystals);
  });

  it('cada Selo novo entra como cristais no bolso, uma vez só', () => {
    const s = { ...createNewGame(0), level: 11, xp: xpForLevel(11), sealsPaid: 1, coins: 5000 };
    expect(sealsEarned(s)).toBe(1);
    const r = applyCommand(s, { type: 'BUY_SEAL' }, ctx);
    expect(r.save.sealsPaid).toBe(2);
    expect(r.events).toContainEqual({ type: 'CRYSTALS', n: SEAL_CRYSTALS, reason: 'selo' });
    const again = applyCommand(r.save, { type: 'PET_CAT' }, ctx);
    expect(again.events.some((e) => e.type === 'CRYSTALS' && e.reason === 'selo')).toBe(false);
  });
});
