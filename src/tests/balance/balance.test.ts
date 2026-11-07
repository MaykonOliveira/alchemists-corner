import { describe, expect, it } from 'vitest';
import { UPGRADES } from '../../domain/data/upgrades';
import { CASUAL, DISTRAIDO, DISTRAIDO_COM_AJUDANTES, EFICIENTE, simulate } from './bot';

// Metas de balanceamento do PRD, medidas com o robô-jogador sobre as regras puras.
const SEEDS = [1, 2, 3, 4, 5, 6];
const cheapest = Math.min(...UPGRADES.filter((u) => u.category !== 'ajudante').map((u) => u.cost));

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

describe('ajudantes automáticos', () => {
  const days = 12;
  const seeds = [1, 2, 3, 4];
  const sem = seeds.map((seed) => simulate(DISTRAIDO, days, seed));
  const com = seeds.map((seed) => simulate(DISTRAIDO_COM_AJUDANTES, days, seed));

  it('não ficam ao alcance cedo demais', () => {
    for (const r of com) {
      const hired = r.days.findIndex((d) => d.upgrades.includes('corvo-entregador'));
      expect(hired === -1 || hired >= 2).toBe(true);
    }
  });

  it('o golem segura os clientes de quem está distraído', () => {
    for (const r of com) {
      for (const d of r.days.filter((_, i) => i > 0 && r.days[i - 1].upgrades.includes('golem-balconista'))) {
        expect(d.customersLost).toBeLessThanOrEqual(3);
      }
    }
  });

  it('o jogador distraído lucra mais com os ajudantes nos últimos dias', () => {
    const tail = (rs: typeof sem) => rs.reduce((n, r) => n + r.days.slice(-3).reduce((m, d) => m + d.revenue, 0), 0);
    expect(tail(com)).toBeGreaterThan(tail(sem) * 1.2);
  });
});
