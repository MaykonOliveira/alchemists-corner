import type { DayEventId, DayReport, DayStats, GameSave } from '../models/types';
import { pick, type Draft } from './context';
import { advanceCustomers, sendAllCustomersHome } from './customers';
import { helperWages, maintenanceCost, supplierStock } from './economy';
import { advanceHelpers, emptyHelperWork } from './helpers';
import { expireOrder, maybeCreateOrder } from './orders';
import { CLOSE_MIN, GAME_MIN_PER_SECOND, OPEN_MIN } from './time';
import { advanceBrew } from './alchemy';

export function freshStats(s: GameSave): DayStats {
  return {
    revenue: 0, ingredientCost: 0, orderRewards: 0, salesByRecipe: {}, served: 0, lost: 0,
    repStart: s.reputation, xpStart: s.xp, levelStart: s.level, ordersDone: 0,
    helperWork: emptyHelperWork(),
  };
}

export function openShop(d: Draft): boolean {
  if (d.s.phase !== 'preparacao') return false;
  d.s.phase = 'expediente';
  d.s.spawnInMs = 2500;
  return true;
}

export function closeDay(d: Draft): boolean {
  const s = d.s;
  if (s.phase !== 'expediente') return false;
  sendAllCustomersHome(d);
  const maintenance = Math.min(s.coins, maintenanceCost(s));
  s.coins -= maintenance;
  const st = s.stats;
  const report: DayReport = {
    day: s.day,
    revenue: st.revenue,
    ingredientCost: st.ingredientCost,
    orderRewards: st.orderRewards,
    maintenance,
    profit: st.revenue + st.orderRewards - st.ingredientCost - maintenance,
    salesByRecipe: { ...st.salesByRecipe },
    customersServed: st.served,
    customersLost: st.lost,
    reputationDelta: s.reputation - st.repStart,
    xpGained: s.xp - st.xpStart,
    levelUps: s.level - st.levelStart,
    wages: Math.min(maintenance, helperWages(s)),
    helperWork: { ...st.helperWork },
  };
  s.reports = [...s.reports, report].slice(-30);
  s.phase = 'fechamento';
  d.events.push({ type: 'DAY_CLOSED', report });
  return true;
}

export function startNextDay(d: Draft): boolean {
  const s = d.s;
  if (s.phase !== 'fechamento') return false;
  s.day += 1;
  s.phase = 'preparacao';
  s.clockMin = OPEN_MIN;
  s.customers = [];
  s.supplier = supplierStock(s);
  s.stats = freshStats(s);
  // O corvo faz a entrega da manhã logo que o dia começa.
  s.helpers.ravenInMs = 1500;
  s.helpers.golemInMs = 0;
  // Eventos simples a partir do dia 3 (cerca de 1 em cada 3 dias).
  s.event = s.day >= 3 && d.ctx.random() < 0.35 ? pick<DayEventId>(['feira', 'caravana', 'chuva'], d.ctx.random) : null;
  expireOrder(d);
  maybeCreateOrder(d);
  d.events.push({ type: 'DAY_STARTED', day: s.day, event: s.event });
  return true;
}

/** Avança o tempo real (ms). O caldeirão trabalha sempre; relógio e clientes só no expediente. */
export function advance(d: Draft, ms: number): boolean {
  const s = d.s;
  if (ms <= 0 || s.phase === 'fechamento') return false;
  const before = s.brew?.elapsedMs;
  advanceBrew(d, ms);
  if (s.phase !== 'expediente') {
    const helped = advanceHelpers(d, ms);
    return helped || before !== s.brew?.elapsedMs;
  }
  s.clockMin = Math.min(CLOSE_MIN, s.clockMin + (ms / 1000) * GAME_MIN_PER_SECOND);
  advanceCustomers(d, ms);
  advanceHelpers(d, ms);
  if (s.clockMin >= CLOSE_MIN) closeDay(d);
  return true;
}
