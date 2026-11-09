// Auditoria P2.3: o toque de mestre virou três gestos (ordem, fogo, ponto).
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../../domain/data/recipes';
import { brewSteps, HEAT, POINT_BAND, shuffledOrder } from '../../domain/rules/quality';

describe('caldeirão com verbo próprio (P2.3)', () => {
  it('toda receita tem ordem, fogo e cor', () => {
    for (const r of RECIPES) {
      const s = brewSteps(r.id);
      expect(s.order.length).toBeGreaterThan(0);
      expect(s.heat.band[0]).toBeLessThan(s.heat.band[1]);
      expect(s.color).toMatch(/^#/);
    }
  });

  it('cada família pede um fogo diferente', () => {
    const names = new Set(Object.values(HEAT).map((h) => h.name));
    expect(names.size).toBe(4);
    expect(POINT_BAND[0]).toBeLessThan(POINT_BAND[1]);
  });

  it('os ingredientes aparecem embaralhados, nunca já na ordem certa', () => {
    for (const r of RECIPES) {
      const { order } = brewSteps(r.id);
      for (let seed = 1; seed < 20; seed++) {
        const shown = shuffledOrder(order, seed);
        expect([...shown].sort()).toEqual([...order].sort());
        if (order.length > 1) expect(shown).not.toEqual(order);
      }
    }
  });
});
