import { describe, expect, it } from 'vitest';
import { UPGRADES } from '../../domain/data/upgrades';
import { CASUAL, DISTRAIDO, DISTRAIDO_COM_AJUDANTES, EFICIENTE, ESPERTO, GANANCIOSO, simulate, type BotProfile, type SimResult } from './bot';

// Metas de balanceamento do PRD, medidas com o robô-jogador sobre as regras puras.
const SEEDS = [1, 2, 3, 4, 5, 6];
const cheapest = Math.min(...UPGRADES.filter((u) => u.category !== 'ajudante').map((u) => u.cost));

describe.each([CASUAL, EFICIENTE])('balanceamento ($name)', (profile) => {
  const runs = SEEDS.map((seed) => simulate(profile, 4, seed));

  it('o primeiro ciclo (comprar, produzir, vender e fechar) cabe em 10 minutos e dá lucro', () => {
    for (const r of runs) {
      const d1 = r.days[0];
      // Fase 3: o dia 1 dura metade (cerca de 3 minutos de expediente).
      expect(d1.elapsedS).toBeLessThanOrEqual(6 * 60);
      expect(d1.ingredientCost).toBeGreaterThan(0);
      expect(d1.customersServed).toBeGreaterThanOrEqual(7);
      expect(d1.profit).toBeGreaterThan(0);
    }
  });

  it('sobe para o nível 2 no primeiro dia, mas não dispara', () => {
    for (const r of runs) expect(r.days[0].level).toBe(2);
    for (const r of runs) expect(r.days[3].level).toBeLessThanOrEqual(5);
  });

  it('a primeira melhoria vem nos primeiros dias, sem ser imediata', () => {
    for (const r of runs) {
      // Fase 3: a Condessa da estreia e o presente do nível 2 deixam o caixa do dia 1 mais cheio,
      // mas a primeira compra continua ficando para o dia 2 ou 3.
      expect(r.days[0].coinsEnd).toBeLessThan(cheapest * 2);
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

  // Até o nível 8 só o corvo está disponível: ele alivia o estoque, mas não joga pelo jogador.
  // O teste garante que contratar cedo não atrapalha (salário e preço não podem afundar a loja).
  it('o corvo não afunda a receita do jogador distraído', () => {
    const tail = (rs: typeof sem) => rs.reduce((n, r) => n + r.days.slice(-3).reduce((m, d) => m + d.revenue, 0), 0);
    expect(tail(com)).toBeGreaterThan(tail(sem) * 0.85);
  });

  it('aprendiz e golem só chegam depois do nível 8: o meio do jogo continua nas mãos do jogador', () => {
    for (const r of com) {
      for (const d of r.days) {
        if (d.upgrades.includes('aprendiz')) expect(d.level).toBeGreaterThanOrEqual(8);
        if (d.upgrades.includes('golem-balconista')) expect(d.level).toBeGreaterThanOrEqual(9);
      }
    }
  });
});

// Auditoria P0.3: ler quem está no balcão tem de valer mais do que vender tudo pela etiqueta,
// e pedir caro de todo mundo não pode ser a resposta fácil.
describe('preço que depende de quem compra', () => {
  const seeds = Array.from({ length: 8 }, (_, i) => 500 + i);
  const runs = (p: BotProfile) => seeds.map((seed) => simulate(p, 7, seed));
  const [casual, esperto, ganancioso] = [CASUAL, ESPERTO, GANANCIOSO].map(runs);
  const revenue = (rs: SimResult[]) => rs.reduce((n, r) => n + r.days.reduce((m, d) => m + d.revenue, 0), 0);
  const rep = (rs: SimResult[]) => rs.reduce((n, r) => n + r.days.at(-1)!.reputation, 0);

  it('quem lê o freguês fatura mais que quem só vende pela etiqueta, sem perder reputação', () => {
    expect(revenue(esperto)).toBeGreaterThan(revenue(casual) * 1.05);
    expect(rep(esperto)).toBeGreaterThanOrEqual(rep(casual) * 0.95);
  });

  it('pedir caro de todo mundo rende menos que ler o freguês e custa reputação', () => {
    expect(revenue(ganancioso)).toBeLessThan(revenue(esperto));
    expect(rep(ganancioso)).toBeLessThan(rep(esperto));
  });
});
