import { describe, expect, it } from 'vitest';
import { UPGRADES } from '../../domain/data/upgrades';
import { CASUAL, EFICIENTE, simulate } from './bot';

// Metas de balanceamento do PRD, medidas com o robô-jogador sobre as regras puras.
const SEEDS = [1, 2, 3, 4, 5, 6];
const cheapest = Math.min(...UPGRADES.map((u) => u.cost));

describe.each([CASUAL, EFICIENTE])('balanceamento ($name)', (profile) => {
  const runs = SEEDS.map((seed) => simulate(profile, 4, seed));

  it('o primeiro ciclo (comprar, produzir, vender e fechar) cabe em 10 minutos e dá lucro', () => {
    for (const r of runs) {
      const d1 = r.days[0];
      expect(d1.elapsedS).toBeLessThanOrEqual(10 * 60);
      expect(d1.ingredientCost).toBeGreaterThan(0);
      expect(d1.customersServed).toBeGreaterThanOrEqual(12);
      expect(d1.profit).toBeGreaterThan(0);
    }
  });

  it('sobe para o nível 2 no primeiro dia, mas não dispara', () => {
    for (const r of runs) expect(r.days[0].level).toBe(2);
    for (const r of runs) expect(r.days[3].level).toBeLessThanOrEqual(5);
  });

  it('a primeira melhoria vem nos primeiros dias, sem ser imediata', () => {
    for (const r of runs) {
      expect(r.days[0].coinsEnd).toBeLessThan(cheapest);
      expect(r.firstUpgradeDay).not.toBeNull();
      expect(r.firstUpgradeDay!).toBeGreaterThanOrEqual(2);
      expect(r.firstUpgradeDay!).toBeLessThanOrEqual(3);
      expect(r.days[2].upgrades.length).toBeLessThanOrEqual(2);
    }
  });
});
