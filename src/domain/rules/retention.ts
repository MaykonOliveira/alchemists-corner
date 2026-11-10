// Fase 3: primeiros minutos (pacote I), voltar amanhã (pacote J) e trilha da temporada (pacote K).
import { ROYAL_CHAPTERS } from '../data/royal';
import { ARCHETYPES } from '../data/customers';
import { DAY_EVENTS } from '../data/orders';
import { RECIPES, RECIPES_BY_ID } from '../data/recipes';
import { REGULARS_BY_ID, SEASONS } from '../data/world';
import {
  DEBUT, LETTERS, SEASON_FESTS, TRACK_DAYS, TRACK_NAMES, TRACK_POINTS, TRACK_REWARDS, TRACK_STEP, VISIT_GIFTS,
} from '../data/retention';
import type { AwayReport, Customer, GameEvent, GameSave } from '../models/types';
import { nextId, type Draft } from './context';
import { advanceBrew, startBrew } from './alchemy';
import { getPrice, takePotions } from './economy';
import { grantCrystals, grantItem } from './entitlements';
import { APPRENTICE, apprenticePlan, GOLEM, helperActive } from './helpers';
import { gainXp } from './progression';
import { addIngredients, weekOf } from './street';
import { daysToNextSeason, seasonOf } from './world';

import { tr } from '../../i18n';
// ------------------------------------------------------------------ datas reais

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');
/** Dia real no horário local (AAAA-MM-DD). */
export function dateKey(now: number): string {
  const t = new Date(now);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}
/** Dias reais desde 1/1/2026 (horário local), para a trilha e o desafio. */
export function realDay(now: number): number {
  const t = new Date(now);
  return Math.floor((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(2026, 0, 1)) / DAY_MS);
}
/** Temporada da trilha: blocos de 28 dias reais. */
export const trackPeriod = (now: number) => Math.floor(realDay(now) / TRACK_DAYS);
export const trackTheme = (period: number) => SEASONS[((period % 4) + 4) % 4];
export const trackName = (period: number) => TRACK_NAMES[trackTheme(period).id];
/** Dias reais até a temporada da trilha acabar (1 = acaba hoje). */
export const trackDaysLeft = (now: number) => TRACK_DAYS - (((realDay(now) % TRACK_DAYS) + TRACK_DAYS) % TRACK_DAYS);
/** Semana real (para o desafio da semana, igual para todos). */
export const realWeek = (now: number) => Math.floor((realDay(now) + 3) / 7);

// ------------------------------------------------------- pacote I: primeiro dia

/** O primeiro dia passa duas vezes mais rápido (cerca de 3 minutos reais). */
export const clockFactor = (s: GameSave) => (s.day === 1 ? 2 : 1);

/** Hora (minutos de jogo) em que a Condessa aparece no dia 1. */
export const DEBUT_AT = 14 * 60;
/** Hora em que o convidado da festa da estação aparece. */
export const FEST_AT = 11 * 60;

function vipCustomer(d: Draft, archetype: Customer['archetype'], wanted: string, remark: string, vip: NonNullable<Customer['vip']>): Customer {
  return {
    id: nextId(d, 'c'), archetype, wantedRecipeId: wanted, budgetFactor: 3, patienceMs: Math.round(ARCHETYPES[archetype].patienceMs * 2.5),
    waitedMs: 0, offer: null, remark, regularId: null, vip,
  };
}

/** Visitas especiais que entram sem sorteio: a Condessa no dia 1 e o convidado da festa da estação. */
export function maybeSpawnVip(d: Draft, room: boolean): boolean {
  const s = d.s;
  if (!room) return false;
  if (s.day === 1 && !s.debutDone && s.clockMin >= DEBUT_AT) {
    const stock = s.potions.filter((p) => p.forSale && p.quantity > 0).sort((a, b) => RECIPES_BY_ID[a.recipeId].basePrice - RECIPES_BY_ID[b.recipeId].basePrice)[0];
    const c = vipCustomer(d, 'nobre', stock?.recipeId ?? 'cura-simples', DEBUT.remark, { name: DEBUT.name, pays: DEBUT.pays, kind: 'estreia' });
    s.debutDone = true;
    s.customers.push(c);
    d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: c.id }, { type: 'VIP_ARRIVED', customerId: c.id, name: DEBUT.name });
    return true;
  }
  if (s.event === 'festa-estacao' && !s.festsDone.includes(s.day) && s.clockMin >= FEST_AT) {
    const fest = SEASON_FESTS[seasonOf(s.day).id];
    const cat = RECIPES_BY_ID[fest.wants].category;
    const wanted = s.knownRecipes.includes(fest.wants) ? fest.wants
      : s.knownRecipes.find((id) => RECIPES_BY_ID[id]?.category === cat && !RECIPES_BY_ID[id].season) ?? s.knownRecipes[0];
    const c = vipCustomer(d, fest.archetype, wanted, fest.remark, { name: fest.guest, pays: 3, kind: 'festa' });
    s.festsDone = [...s.festsDone, s.day].slice(-20);
    s.customers.push(c);
    d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: c.id }, { type: 'VIP_ARRIVED', customerId: c.id, name: fest.guest });
    return true;
  }
  return false;
}

/** Depois da venda para uma visita especial: carta, lembrança da festa. */
export function onVipServed(d: Draft, c: Customer, price: number) {
  const s = d.s;
  if (!c.vip) return;
  d.events.push({ type: 'VIP_SERVED', name: c.vip.name, coins: price, kind: c.vip.kind });
  if (c.vip.kind === 'estreia') s.debutServed = true;
  if (c.vip.kind === 'festa') {
    const fest = SEASON_FESTS[seasonOf(s.day).id];
    if (!grantItem(d, fest.reward, 'festa')) grantCrystals(d, 10, fest.name);
  }
}

/** Freguês fiel que mandou carta: entra primeiro no dia combinado. */
export function letterVisitor(s: GameSave): string | null {
  const l = s.letter;
  if (!l || l.done || l.day !== s.day || !REGULARS_BY_ID[l.from]) return null;
  if (s.customers.some((c) => c.regularId === l.from)) return null;
  return l.from;
}

// ------------------------------------------------------ pacote J: fechamento

/** PRNG pequeno (mulberry32), para sorteios que não podem mexer na sequência aleatória do jogo. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** No fechamento: carta da Condessa (dia 1) ou de um freguês que veio hoje. */
export function writeLetter(d: Draft, visitedToday: string[]) {
  const s = d.s;
  if (s.day === 1) {
    s.letter = { from: 'condessa-estreia', text: s.debutServed ? DEBUT.letter : DEBUT.letterMissed, day: 2, done: false };
    d.events.push({ type: 'LETTER', from: 'condessa-estreia' });
    return;
  }
  const rnd = seeded(s.day * 4099 + (s.createdAt % 9973));
  const friends = visitedToday.filter((id) => (s.regulars[id]?.hearts ?? 0) >= 1 && LETTERS[id]);
  if (!friends.length || rnd() > 0.45) { s.letter = null; return; }
  const from = friends[Math.floor(rnd() * friends.length)];
  const lines = LETTERS[from];
  s.letter = { from, text: lines[Math.floor(rnd() * lines.length)], day: s.day + 1, done: false };
  d.events.push({ type: 'LETTER', from });
}

/** Encomenda prometida pela Condessa na carta do dia 1. */
export function debutOrder(d: Draft): boolean {
  const s = d.s;
  if (s.letter?.from !== 'condessa-estreia' || s.letter.day !== s.day || s.letter.done || s.order) return false;
  const o = DEBUT.order;
  s.order = { id: nextId(d, 'o'), client: o.client, text: o.text, recipeId: o.recipeId, qty: o.qty, rewardCoins: o.rewardCoins, rewardRep: o.rewardRep, rewardXp: o.rewardXp, dueDay: s.day + 1 };
  s.letter = { ...s.letter, done: true };
  d.events.push({ type: 'ORDER_NEW', orderId: s.order.id });
  return true;
}

export interface PreviewLine { icon: string; text: string; tone?: 'gold' | 'warn' }

/** Prévia de amanhã, mostrada no fim do relatório: o motivo concreto para voltar. */
export function tomorrowPreview(s: GameSave): PreviewLine[] {
  const day = s.day + 1;
  const out: PreviewLine[] = [];
  const event = s.festivalSponsored ? 'festival' : s.nextEvent;
  if (event === 'festa-estacao') {
    const f = SEASON_FESTS[seasonOf(day).id];
    out.push({ icon: '🎉', text: tr('{0}: {1} vem à loja e paga o triplo. Lembrança exclusiva para quem atender.', f.name, f.guest), tone: 'gold' });
  } else if (event) {
    out.push({ icon: DAY_EVENTS[event].rare ? '🌘' : '📣', text: `${DAY_EVENTS[event].name}: ${DAY_EVENTS[event].text}`, tone: DAY_EVENTS[event].rare ? 'gold' : undefined });
  }
  if (s.nextTrend?.length) {
    const names = s.nextTrend.map((id) => RECIPES_BY_ID[id]?.shortName ?? id);
    out.push({ icon: '📈', text: tr('Amanhã a rua vai procurar {0}. Prepare antes de abrir.', names.join(' e ')), tone: 'gold' });
  }
  if (s.letter && !s.letter.done && s.letter.day === day) {
    const who = s.letter.from === 'condessa-estreia' ? tr('Condessa Amélia') : REGULARS_BY_ID[s.letter.from]?.name ?? tr('Um freguês');
    out.push({ icon: '✉️', text: tr('Carta de {0}: “{1}”', who, s.letter.text), tone: 'gold' });
  }
  if (daysToNextSeason(s.day) === 1) {
    const next = seasonOf(day);
    out.push({ icon: next.icon, text: tr('Começa {0} {1}. {2}', next.id === 'primavera' ? 'a' : 'o', next.name.toLowerCase(), next.text) });
  }
  if (s.expedition?.returnDay === day) out.push({ icon: '🐦‍⬛', text: tr('O corvo volta da expedição com ingredientes raros.') });
  if (s.contract?.accepted && s.contract.dueDay === day) out.push({ icon: '📜', text: tr('Último dia do contrato de {0}.', s.contract.client), tone: 'warn' });
  const royal = s.royal && s.royal.chapter < ROYAL_CHAPTERS.length ? ROYAL_CHAPTERS[s.royal.chapter] : null;
  if (royal && s.royal!.seen >= s.royal!.chapter) {
    const last = s.royal!.dueDay === day;
    out.push({ icon: '👑', text: tr('Concurso Real: {0}{1}. {2}', royal.title, last ? tr(' (último dia do prazo!)') : '', royal.task), tone: last ? 'warn' : 'gold' });
  }
  if (s.order && s.order.dueDay === day) out.push({ icon: '📌', text: tr('O pedido de {0} vence amanhã.', s.order.client), tone: 'warn' });
  if (s.rival.week === weekOf(s.day) && weekOf(day) === weekOf(s.day) && (day - 1) % 7 === 6 && s.level >= 4 && s.day >= 8) {
    out.push({ icon: '⚔️', text: tr('Último dia da disputa da semana com a Madame Vesper.') });
  }
  out.push({ icon: '🎁', text: tr('Presente de visita nº {0}: {1}.', (s.visits.count % VISIT_GIFTS.length) + 1, VISIT_GIFTS[s.visits.count % VISIT_GIFTS.length].label) });
  return out;
}

// ------------------------------------------------- pacote J: voltar para a loja

/** Tempo mínimo fora para a loja trabalhar sozinha, e o máximo que conta. */
export const AWAY_MIN_MS = 10 * 60_000;
export const AWAY_MAX_MS = 8 * 3_600_000;
/** Vendas pela janela por hora (golem) e preparos por hora (aprendiz), fora do jogo. */
export const AWAY_SALES_PER_HOUR = 3;
export const AWAY_BREWS_PER_HOUR = 1.5;
/** Desconto da venda pela janela. */
export const AWAY_PRICE = 0.9;

/** O que a loja faz enquanto o jogador está fora (até 8 horas). Devolve o livro do caixa. */
export function simulateAway(d: Draft, awayMs: number): AwayReport | null {
  const s = d.s;
  if (awayMs < AWAY_MIN_MS) return null;
  const ms = Math.min(awayMs, AWAY_MAX_MS);
  const hours = ms / 3_600_000;
  const from = d.events.length;
  const report: AwayReport = { awayMs: ms, sold: 0, coins: 0, xp: 0, brewed: {}, helpers: false };
  // O caldeirão termina o que estava no fogo.
  advanceBrew(d, ms);
  const apprentice = s.phase !== 'fechamento' && helperActive(s, APPRENTICE);
  const golem = helperActive(s, GOLEM);
  report.helpers = apprentice || golem;
  const totalBrews = apprentice ? Math.min(8, Math.floor(hours * AWAY_BREWS_PER_HOUR)) : 0;
  const totalSales = golem ? Math.min(24, Math.floor(hours * AWAY_SALES_PER_HOUR)) : 0;
  const xpBefore = s.xp;
  let brews = 0;
  let sales = 0;
  // Hora a hora: o golem vende pela janela e o aprendiz repõe o que abriu espaço nas prateleiras.
  const steps = Math.max(1, Math.ceil(hours));
  for (let h = 1; h <= steps; h++) {
    const salesGoal = Math.min(totalSales, Math.round((totalSales * h) / steps));
    for (; sales < salesGoal; sales++) {
      const stack = s.potions.filter((p) => p.forSale && p.quantity > 0).sort((a, b) => b.quantity - a.quantity)[0];
      if (!stack) break;
      const price = Math.round(getPrice(s, stack.recipeId) * AWAY_PRICE);
      takePotions(s, stack.recipeId, 1);
      s.coins += price;
      s.lifetime = { sold: s.lifetime.sold + 1, earned: s.lifetime.earned + price };
      report.sold += 1;
      report.coins += price;
      gainXp(d, 3 + Math.round(RECIPES_BY_ID[stack.recipeId].basePrice / 10));
    }
    const brewsGoal = Math.min(totalBrews, Math.round((totalBrews * h) / steps));
    for (; brews < brewsGoal; brews++) {
      const plan = apprenticePlan(s);
      if (!plan || !startBrew(d, plan.recipeId, plan.batches)) break; // tenta de novo na próxima hora
      advanceBrew(d, 24 * 3_600_000);
    }
  }
  report.xp = s.xp - xpBefore;
  for (const e of d.events.slice(from)) if (e.type === 'BREW_DONE') report.brewed[e.recipeId] = (report.brewed[e.recipeId] ?? 0) + e.qty;
  // Os avisos de cada preparo ficam no livro do caixa, não na tela.
  d.events = [...d.events.slice(0, from), ...d.events.slice(from).filter((e) => e.type !== 'BREW_DONE' && e.type !== 'BREW_STARTED' && e.type !== 'ERROR')];
  return report;
}

/** Abertura de uma sessão: livro do caixa, presente de visita e temporada da trilha. */
export function sessionStart(d: Draft): boolean {
  const s = d.s;
  const away = simulateAway(d, d.ctx.now - s.updatedAt);
  if (away) {
    s.away = away;
    d.events.push({ type: 'AWAY_REPORT', report: away });
  }
  checkVisit(d);
  ensureTrack(d);
  return true;
}

/** Um presente fica pronto a cada dia real em que a loja é aberta. */
export function checkVisit(d: Draft) {
  const today = dateKey(d.ctx.now);
  if (d.s.visits.lastDate === today) return;
  d.s.visits = { ...d.s.visits, lastDate: today, ready: true };
}

export const visitGift = (s: GameSave) => VISIT_GIFTS[s.visits.count % VISIT_GIFTS.length];

export function claimVisitGift(d: Draft): boolean {
  const s = d.s;
  if (!s.visits.ready) {
    d.events.push({ type: 'ERROR', message: tr('O próximo presente chega amanhã.') });
    return false;
  }
  const n = s.visits.count % VISIT_GIFTS.length;
  const g = VISIT_GIFTS[n];
  s.coins += g.coins;
  addIngredients(s, g.items);
  if (g.crystals) s.crystals += g.crystals;
  const decor = g.decor && grantItem(d, g.decor, 'visita') ? g.decor : null;
  if (g.decor && !decor) s.crystals += 5;
  s.visits = { ...s.visits, count: s.visits.count + 1, ready: false };
  d.events.push({ type: 'VISIT_GIFT', n: n + 1, coins: g.coins, crystals: g.crystals + (g.decor && !decor ? 5 : 0), items: g.items, decor });
  addTrackPoints(d, TRACK_POINTS.visit);
  return true;
}

// -------------------------------------------------- pacote K: trilha e cristais

export function ensureTrack(d: Draft) {
  const period = trackPeriod(d.ctx.now);
  if (d.s.track.period !== period) d.s.track = { period, points: 0, tier: 0 };
}

export function trackRewardLabel(i: number): string {
  const r = TRACK_REWARDS[i];
  switch (r.kind) {
    case 'coins': return tr('{0} moedas', r.n);
    case 'crystals': return `${r.n} cristais`;
    case 'ingredients': return r.items.map((it) => `${it.qty}× ${it.ingredientId.replace(/-/g, ' ')}`).join(', ');
    case 'item': return tr('decoração exclusiva');
  }
}

/** Soma pontos na trilha e entrega as recompensas alcançadas. */
export function addTrackPoints(d: Draft, n: number) {
  const s = d.s;
  ensureTrack(d);
  s.track = { ...s.track, points: s.track.points + n };
  while (s.track.tier < TRACK_REWARDS.length && s.track.points >= (s.track.tier + 1) * TRACK_STEP) {
    const r = TRACK_REWARDS[s.track.tier];
    if (r.kind === 'coins') s.coins += r.n;
    else if (r.kind === 'crystals') s.crystals += r.n;
    else if (r.kind === 'ingredients') addIngredients(s, r.items);
    else if (!grantItem(d, r.id, 'trilha')) s.crystals += 10;
    s.track = { ...s.track, tier: s.track.tier + 1 };
    d.events.push({ type: 'TRACK_TIER', tier: s.track.tier, reward: trackRewardLabel(s.track.tier - 1) });
  }
}

/** Cristais e pontos da trilha pelos feitos do comando (metas, pedidos, contratos, fechamento...). */
export function rewardFromEvents(d: Draft, events: GameEvent[]) {
  let crystals = 0;
  let points = 0;
  for (const e of events) {
    if (e.type === 'GOAL_DONE') { crystals += 1 + (e.allDone ? 1 : 0); points += TRACK_POINTS.goal + (e.allDone ? TRACK_POINTS.allGoals : 0); }
    else if (e.type === 'CHEST_OPENED') crystals += 5;
    else if (e.type === 'ACHIEVEMENT') crystals += 2;
    else if (e.type === 'ORDER_DONE') points += TRACK_POINTS.order;
    else if (e.type === 'CONTRACT_DONE') points += TRACK_POINTS.contract;
    else if (e.type === 'DAY_CLOSED') points += TRACK_POINTS.dayClosed;
  }
  if (crystals) grantCrystals(d, crystals, 'feitos');
  if (points) addTrackPoints(d, points);
}

/** Recipes conhecidas mais usadas, para o cartão da loja. */
export function bestPotion(s: GameSave): string | null {
  const known = RECIPES.filter((r) => s.knownRecipes.includes(r.id));
  if (!known.length) return null;
  return [...known].sort((a, b) => (s.mastery[b.id] ?? 0) - (s.mastery[a.id] ?? 0) || b.basePrice - a.basePrice)[0].id;
}
