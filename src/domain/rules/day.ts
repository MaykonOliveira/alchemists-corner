import type { DayEventId, DayReport, DayStats, GameSave } from '../models/types';
import { ensureGoals } from './goals';
import { fail, pick, type Draft } from './context';
import { advanceCustomers, sendAllCustomersHome } from './customers';
import { harvestGreenhouse, helperWages, maintenanceCost, supplierStock } from './economy';
import { DAY_EVENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import { advanceHelpers, emptyHelperWork } from './helpers';
import { updateContracts } from './contracts';
import { seasonOf } from './world';
import { expireOrder, maybeCreateOrder } from './orders';
import { CLOSE_MIN, GAME_MIN_PER_SECOND, OPEN_MIN } from './time';
import { advanceBrew } from './alchemy';
import { createVisitorOrder, returnExpedition, rivalOnClose, rollRareEvent } from './street';
import { checkVisit, clockFactor, debutOrder, writeLetter } from './retention';
import { charm } from './entitlements';
import { finishChallenge } from './social';
import { daysToNextSeason } from './world';
import { gainReputation, gainXp, xpForLevel } from './progression';
import { noteDay } from './records';
import { royalNewDay } from './royal';

export function freshStats(s: GameSave): DayStats {
  return {
    revenue: 0, ingredientCost: 0, orderRewards: 0, salesByRecipe: {}, served: 0, lost: 0,
    repStart: s.reputation, xpStart: s.xp, levelStart: s.level, ordersDone: 0,
    helperWork: emptyHelperWork(), regularsSeen: [], lostByRecipe: {}, mystery: false,
  };
}

export function openShop(d: Draft): boolean {
  if (d.s.phase !== 'preparacao') return false;
  d.s.phase = 'expediente';
  d.s.spawnInMs = 2500;
  return true;
}

/** Clientes atendidos no dia 1 para a estreia garantir o nível 2. */
export const DEBUT_LEVEL_SERVED = 3;

export function closeDay(d: Draft): boolean {
  const s = d.s;
  if (s.phase !== 'expediente') return false;
  sendAllCustomersHome(d);
  // Encanto da decoração: um pouco de reputação a cada dia.
  const ch = charm(s);
  if (ch > 0) gainReputation(d, ch);
  const maintenance = Math.min(s.coins, maintenanceCost(s));
  s.coins -= maintenance;
  // Estreia generosa: quem atendeu ao menos alguns clientes no dia 1 fecha no nível 2.
  // Um dia parado não é premiado: o nível vem pelo caminho normal.
  if (s.day === 1 && s.level < 2 && s.stats.served >= DEBUT_LEVEL_SERVED) gainXp(d, xpForLevel(2) - s.xp);
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
    lostByRecipe: { ...(st.lostByRecipe ?? {}) },
    level: st.levelStart,
  };
  const records = noteDay(d, report);
  if (records.length) report.records = records;
  rivalOnClose(d, report);
  s.reports = [...s.reports, report].slice(-30);
  s.phase = 'fechamento';
  finishChallenge(d);
  writeLetter(d, st.regularsSeen ?? []);
  s.nextEvent = rollNextEvent(d);
  s.nextTrend = rollTrend(d);
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
  s.stats = freshStats(s);
  // O corvo faz a entrega da manhã logo que o dia começa.
  s.helpers.ravenInMs = 1500;
  s.helpers.golemInMs = 0;
  // Eventos simples a partir do dia 3 (cerca de 1 em cada 3 dias).
  // Eventos especiais raros (Eclipse, Lua Cheia, Visitante) têm sorteio próprio, cerca de 1 em cada 8 dias.
  expireOrder(d);
  // O evento de amanhã já foi sorteado no fechamento (a prévia do relatório mostra ele).
  s.event = s.nextEvent;
  s.nextEvent = null;
  s.trend = s.nextTrend ?? [];
  s.nextTrend = [];
  if (s.festivalSponsored) s.event = 'festival';
  s.festivalSponsored = false;
  // O estoque do fornecedor depende da estação e do evento do dia.
  s.supplier = supplierStock(s);
  harvestGreenhouse(d);
  returnExpedition(d);
  if (s.event === 'visitante' && !s.order) createVisitorOrder(d);
  debutOrder(d);
  maybeCreateOrder(d);
  checkVisit(d);
  updateContracts(d);
  royalNewDay(d);
  if (seasonOf(s.day).id !== seasonOf(s.day - 1).id) d.events.push({ type: 'SEASON_STARTED', season: seasonOf(s.day).id });
  ensureGoals(s);
  d.events.push({ type: 'DAY_STARTED', day: s.day, event: s.event });
  return true;
}

/**
 * Sorteio do evento do dia seguinte, feito no fechamento.
 * Eventos simples a partir do dia 3 (cerca de 1 em cada 3 dias); eventos raros têm sorteio próprio
 * (cerca de 1 em cada 8 dias) e o último dia de cada estação é a festa da estação.
 */
export function rollNextEvent(d: Draft): DayEventId | null {
  const s = d.s;
  const day = s.day + 1;
  if (day >= 7 && daysToNextSeason(day) === 1) return 'festa-estacao';
  const events = (Object.keys(DAY_EVENTS) as DayEventId[]).filter((id) => !DAY_EVENTS[id].rare && id !== 'festa-estacao' && s.level >= (DAY_EVENTS[id].minLevel ?? 1));
  return rollRareEvent(d) ?? (day >= 3 && d.ctx.random() < 0.35 ? pick<DayEventId>(events, d.ctx.random) : null);
}

/**
 * Procura de amanhã (auditoria P0.4): duas poções conhecidas que a rua vai pedir bem mais.
 * Sai no relatório do fechamento, para a preparação virar planejamento.
 */
export function rollTrend(d: Draft): string[] {
  const s = d.s;
  const pool = s.knownRecipes.filter((id) => !RECIPES_BY_ID[id].legend && !RECIPES_BY_ID[id].season && !RECIPES_BY_ID[id].secret);
  if (pool.length < 3) return [];
  const first = pick(pool, d.ctx.random);
  const rest = pool.filter((id) => id !== first);
  return pool.length >= 5 ? [first, pick(rest, d.ctx.random)] : [first];
}

/** Preço para patrocinar o Festival das Lanternas no dia seguinte (cresce com o nível). */
export const festivalPrice = (s: GameSave) => 600 + 150 * s.level;

export function sponsorFestival(d: Draft): boolean {
  const s = d.s;
  const minLevel = DAY_EVENTS.festival.minLevel ?? 1;
  if (s.level < minLevel) return fail(d, `O festival só pode ser patrocinado a partir do nível ${minLevel}.`);
  if (s.festivalSponsored) return fail(d, 'O festival de amanhã já está garantido.');
  const cost = festivalPrice(s);
  if (s.coins < cost) return fail(d, 'Moedas insuficientes.');
  s.coins -= cost;
  s.festivalSponsored = true;
  d.events.push({ type: 'FESTIVAL_SPONSORED', cost });
  return true;
}

/** Avança o tempo real (ms). O caldeirão trabalha sempre; relógio e clientes só no expediente. */
export function advance(d: Draft, ms: number): boolean {
  const s = d.s;
  if (ms <= 0 || s.phase === 'fechamento') return false;
  const before = [s.brew?.elapsedMs, s.brew2?.elapsedMs];
  advanceBrew(d, ms);
  if (s.phase !== 'expediente') {
    const helped = advanceHelpers(d, ms);
    return helped || before[0] !== s.brew?.elapsedMs || before[1] !== s.brew2?.elapsedMs;
  }
  s.clockMin = Math.min(CLOSE_MIN, s.clockMin + (ms / 1000) * GAME_MIN_PER_SECOND * clockFactor(s));
  advanceCustomers(d, ms);
  advanceHelpers(d, ms);
  if (s.clockMin >= CLOSE_MIN) closeDay(d);
  return true;
}
