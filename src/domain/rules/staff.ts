// Carreira da equipe (E1) e os funcionários novos (E2): fada contadora, mascate, exploradora,
// salamandra e gerente noturno. As contas puras ficam em evoCore.ts.
import { COURSE_COST, PERK_LEVELS, STAFF_BASE_CAP, STAFF_BY_ID, STAFF_DAY_XP, STAFF_MAX_LEVEL } from '../data/staff';
import { EXPEDITIONS } from '../data/street';
import { RECIPES_BY_ID } from '../data/recipes';
import { HELPER_IDS } from '../data/upgrades';
import type { FairyStrategy, GameEvent, GameSave, PerkSide, StaffMember } from '../models/types';
import { fail, type Draft } from './context';
import { getPrice, has, potionCapacity, potionStock, priceRange, shelfPerRecipe, staffOn, takePotions } from './economy';
import { pendingPerks, perkCount, staffLevel, staffLevelUncapped, staffSpeed, staffXpFor } from './evoCore';
import { masteryStars } from './mastery';
import { gainReputation } from './progression';

import { tr } from '../../i18n';

export const FAIRY = 'fada-contadora';
export const PEDDLER = 'mascate';
export const EXPLORER = 'exploradora';
export const NIGHT_MANAGER = 'gerente-noturno';

/** A fada revê os preços a cada 20 s reais (≈ 40 min de jogo). */
export const FAIRY_INTERVAL_MS = 20_000;
/** O mascate faz uma viagem à praça a cada 25 s reais. */
export const PEDDLER_INTERVAL_MS = 25_000;
/** Fração da etiqueta que o mascate consegue na praça. */
export const PEDDLER_PRICE = 0.7;
/** Moedas que a exploradora sempre deixa no caixa. */
export const EXPLORER_RESERVE = 200;

// ------------------------------------------------------------------ carreira

export function ensureMember(s: GameSave, id: string): StaffMember {
  const m = s.evo.staff[id];
  if (m) return m;
  const fresh: StaffMember = { xp: 0, cap: STAFF_BASE_CAP, perks: [] };
  s.evo.staff = { ...s.evo.staff, [id]: fresh };
  return fresh;
}

/** Nome do funcionário: o que o jogador deu, ou o cargo. */
export const staffName = (s: GameSave, id: string) => s.evo.staff[id]?.name || STAFF_BY_ID[id]?.role || id;

/** Soma experiência ao funcionário. Subiu de nível: festa na cena e notícia para a Gazeta. */
export function gainStaffXp(d: Draft, id: string, n: number) {
  const s = d.s;
  if (n <= 0 || !STAFF_BY_ID[id] || !has(s, id)) return;
  const before = staffLevel(s, id);
  const m = ensureMember(s, id);
  m.xp += Math.round(n);
  s.evo.dayWork = { ...s.evo.dayWork, [id]: (s.evo.dayWork[id] ?? 0) + Math.round(n) };
  const after = staffLevel(s, id);
  for (let lvl = before + 1; lvl <= after; lvl++) {
    const perk = PERK_LEVELS.includes(lvl);
    d.events.push({ type: 'STAFF_LEVEL', staffId: id, level: lvl, perk });
    s.evo.news = [...s.evo.news, { kind: 'staff-level' as const, ref: id, n: lvl }].slice(-20);
  }
}

/** Experiência por trabalho feito, lida dos eventos de cada comando. */
export function staffFromEvents(d: Draft, events: GameEvent[]) {
  const s = d.s;
  if (!s.evo) return;
  for (const e of events) {
    switch (e.type) {
      case 'SALE':
        if (e.by === 'golem') gainStaffXp(d, 'golem-balconista', 1);
        if (e.by === 'coruja') gainStaffXp(d, 'coruja-sabia', 4);
        break;
      case 'BREW_STARTED':
        if (e.by === 'aprendiz') gainStaffXp(d, 'aprendiz', 3);
        if (staffOn(s, 'salamandra')) gainStaffXp(d, 'salamandra', 3);
        break;
      case 'RAVEN_DELIVERY': gainStaffXp(d, 'corvo-entregador', 4); break;
      case 'ORDER_DONE': if (e.by === 'coruja') gainStaffXp(d, 'coruja-sabia', 6); break;
      case 'GREENHOUSE_HARVEST': if (staffOn(s, 'gnomo-jardineiro')) gainStaffXp(d, 'gnomo-jardineiro', 8); break;
      case 'CUSTOMER_ARRIVED': if (staffOn(s, 'bardo-da-porta')) gainStaffXp(d, 'bardo-da-porta', 1); break;
      case 'PRICE_TUNED': gainStaffXp(d, FAIRY, e.count); break;
      case 'PEDDLER_SALE': gainStaffXp(d, PEDDLER, e.qty); break;
      case 'EXPEDITION_BACK': if (e.byExplorer) gainStaffXp(d, EXPLORER, 20); break;
      case 'AWAY_REPORT': if (staffOn(s, NIGHT_MANAGER)) gainStaffXp(d, NIGHT_MANAGER, e.report.sold + 5); break;
    }
  }
}

/** Fechamento: cada funcionário ligado ganha a experiência do dia, e sai o funcionário do dia. */
export function closeStaffDay(d: Draft): { id: string; work: number } | null {
  const s = d.s;
  for (const id of HELPER_IDS) if (staffOn(s, id) && STAFF_BY_ID[id]) gainStaffXp(d, id, STAFF_DAY_XP);
  // Fada simpática: a loja fica mais querida.
  if (staffOn(s, FAIRY)) gainReputation(d, perkCount(s, FAIRY, 'b'));
  let best: { id: string; work: number } | null = null;
  for (const [id, work] of Object.entries(s.evo.dayWork)) {
    const real = work - (staffOn(s, id) ? STAFF_DAY_XP : 0);
    if (real > 0 && (!best || real > best.work)) best = { id, work: real };
  }
  return best;
}

export function choosePerk(d: Draft, id: string, side: PerkSide): boolean {
  const s = d.s;
  if (!has(s, id) || !STAFF_BY_ID[id]) return fail(d, tr('Contrate este ajudante primeiro.'));
  if (side !== 'a' && side !== 'b') return false;
  if (pendingPerks(s, id) <= 0) return fail(d, tr('Nenhuma escolha de caminho em aberto.'));
  const m = ensureMember(s, id);
  m.perks = [...m.perks, side];
  d.events.push({ type: 'STAFF_PERK', staffId: id, side });
  return true;
}

/** Curso na Guilda: libera mais um nível de carreira (6 a 10). */
export const courseCost = (s: GameSave, id: string) => COURSE_COST[(s.evo.staff[id]?.cap ?? STAFF_BASE_CAP) + 1] ?? null;

export function buyCourse(d: Draft, id: string): boolean {
  const s = d.s;
  if (!has(s, id) || !STAFF_BY_ID[id]) return fail(d, tr('Contrate este ajudante primeiro.'));
  const m = ensureMember(s, id);
  if (m.cap >= STAFF_MAX_LEVEL) return fail(d, tr('Este funcionário já fez todos os cursos.'));
  const cost = COURSE_COST[m.cap + 1];
  if (s.coins < cost) return fail(d, tr('Moedas insuficientes.'));
  const before = staffLevel(s, id);
  s.coins -= cost;
  m.cap += 1;
  d.events.push({ type: 'STAFF_COURSE', staffId: id, cap: m.cap, cost });
  // A experiência guardada já pode valer o nível novo.
  const after = staffLevel(s, id);
  for (let lvl = before + 1; lvl <= after; lvl++) d.events.push({ type: 'STAFF_LEVEL', staffId: id, level: lvl, perk: PERK_LEVELS.includes(lvl) });
  return true;
}

export function renameStaff(d: Draft, id: string, name: string): boolean {
  const s = d.s;
  if (!has(s, id) || !STAFF_BY_ID[id]) return false;
  const clean = name.replace(/\s+/g, ' ').trim().slice(0, 16);
  const m = ensureMember(s, id);
  if ((m.name ?? '') === clean) return false;
  if (clean) m.name = clean;
  else delete m.name;
  return true;
}

/** Progresso dentro do nível (0..1) e quanto falta. */
export function staffProgress(s: GameSave, id: string) {
  const lvl = staffLevelUncapped(s, id);
  const xp = s.evo.staff[id]?.xp ?? 0;
  if (lvl >= STAFF_MAX_LEVEL) return { lvl, frac: 1, left: 0 };
  const start = staffXpFor(lvl);
  const end = staffXpFor(lvl + 1);
  return { lvl, frac: (xp - start) / (end - start), left: end - xp };
}

/** A experiência já passou do teto: falta o curso para subir. */
export const needsCourse = (s: GameSave, id: string) => staffLevelUncapped(s, id) > staffLevel(s, id) || (staffLevel(s, id) === (s.evo.staff[id]?.cap ?? STAFF_BASE_CAP) && staffProgress(s, id).frac >= 1);

// ---------------------------------------------------------------- fada contadora

export function setStrategy(d: Draft, strategy: FairyStrategy): boolean {
  if (strategy !== 'volume' && strategy !== 'lucro' && strategy !== 'fama') return false;
  if (d.s.evo.fairy.strategy === strategy) return false;
  d.s.evo.fairy = { ...d.s.evo.fairy, strategy, inMs: Math.min(d.s.evo.fairy.inMs, 800) };
  return true;
}

export function lockPrice(d: Draft, recipeId: string, locked: boolean): boolean {
  if (!RECIPES_BY_ID[recipeId]) return false;
  const list = d.s.evo.fairy.locked;
  if (list.includes(recipeId) === locked) return false;
  d.s.evo.fairy = { ...d.s.evo.fairy, locked: locked ? [...list, recipeId] : list.filter((id) => id !== recipeId) };
  return true;
}

/** Preço que a fada escolheria para a receita, pela estratégia e pela procura do dia. */
export function fairyPrice(s: GameSave, recipeId: string): number {
  const { min, max, base } = priceRange(s, recipeId);
  const strategy = s.evo.fairy.strategy;
  // Fama: a reputação só cresce com preço até o preço-base, então ela segura a etiqueta ali.
  if (strategy === 'fama') return Math.max(min, Math.min(max, base));
  let f = strategy === 'volume' ? 0.92 : 1.12 + masteryStars(s, recipeId) * 0.03;
  if (s.trend?.includes(recipeId)) f += 0.1;
  if (potionStock(s, recipeId) >= shelfPerRecipe(s)) f -= 0.08;
  const lostYesterday = s.reports[s.reports.length - 1]?.lostByRecipe?.[recipeId] ?? 0;
  if (strategy === 'lucro' && lostYesterday >= 2) f -= 0.05;
  return Math.max(min, Math.min(max, Math.round(base * f)));
}

function runFairy(d: Draft, ms: number) {
  const s = d.s;
  s.evo.fairy.inMs -= ms;
  if (s.evo.fairy.inMs > 0) return;
  s.evo.fairy.inMs = FAIRY_INTERVAL_MS / staffSpeed(s, FAIRY);
  let count = 0;
  for (const id of s.knownRecipes) {
    if (s.evo.fairy.locked.includes(id)) continue;
    const p = fairyPrice(s, id);
    if (getPrice(s, id) === p) continue;
    s.prices[id] = p;
    count++;
  }
  if (count) d.events.push({ type: 'PRICE_TUNED', count });
}

// ------------------------------------------------------------------ mascate

/** Quanto a pedida reserva para o pedido especial (o mascate não vende isso). */
const reserved = (s: GameSave, recipeId: string) => (s.order?.recipeId === recipeId ? s.order.qty : 0);

/** O que o mascate levaria agora para a praça (ou null). */
export function peddlerPlan(s: GameSave): { recipeId: string; qty: number } | null {
  const cap = shelfPerRecipe(s);
  const total = s.potions.reduce((n, p) => n + p.quantity, 0);
  const crowded = total >= potionCapacity(s) * 0.9;
  const perTrip = 3 + perkCount(s, PEDDLER, 'a');
  const stacks = s.potions
    .filter((p) => p.forSale)
    .map((p) => ({ id: p.recipeId, free: p.quantity - reserved(s, p.recipeId), over: p.quantity - reserved(s, p.recipeId) - (cap - 3) }))
    .sort((a, b) => b.over - a.over || b.free - a.free);
  const top = stacks[0];
  if (!top) return null;
  const qty = Math.min(perTrip, top.over > 0 ? top.over : crowded ? top.free : 0);
  return qty > 0 ? { recipeId: top.id, qty } : null;
}

function runPeddler(d: Draft, ms: number) {
  const s = d.s;
  s.evo.peddlerInMs -= ms;
  if (s.evo.peddlerInMs > 0) return;
  s.evo.peddlerInMs = PEDDLER_INTERVAL_MS;
  const plan = peddlerPlan(s);
  if (!plan) return;
  const unit = Math.max(1, Math.round(getPrice(s, plan.recipeId) * (PEDDLER_PRICE + 0.08 * perkCount(s, PEDDLER, 'b'))));
  if (!takePotions(s, plan.recipeId, plan.qty)) return;
  const coins = unit * plan.qty;
  s.coins += coins;
  s.stats.revenue += coins;
  s.stats.salesByRecipe = { ...s.stats.salesByRecipe, [plan.recipeId]: (s.stats.salesByRecipe[plan.recipeId] ?? 0) + plan.qty };
  s.lifetime = { sold: s.lifetime.sold + plan.qty, earned: s.lifetime.earned + coins };
  d.events.push({ type: 'PEDDLER_SALE', recipeId: plan.recipeId, qty: plan.qty, coins });
}

// --------------------------------------------------------------- exploradora

/** Destino que a exploradora escolhe: o que tem mais achados faltando; empate, o mais barato. */
export function explorerDestination(s: GameSave): string | null {
  const ok = EXPEDITIONS.filter((e) => s.level >= e.minLevel && s.coins - EXPLORER_RESERVE >= e.cost);
  if (!ok.length) return null;
  const missing = (e: (typeof EXPEDITIONS)[number]) => e.finds.filter((f) => !s.finds.includes(f)).length;
  return [...ok].sort((a, b) => missing(b) - missing(a) || b.minLevel - a.minLevel || a.cost - b.cost)[0].id;
}

function runExplorer(d: Draft) {
  const s = d.s;
  if (s.expedition || s.phase === 'fechamento') return false;
  const dest = explorerDestination(s);
  if (!dest) return false;
  const info = EXPEDITIONS.find((e) => e.id === dest)!;
  s.coins -= info.cost;
  s.stats.ingredientCost += info.cost;
  s.expedition = { dest, returnDay: s.day + info.days, byExplorer: true };
  d.events.push({ type: 'EXPEDITION_SENT', dest, returnDay: s.expedition.returnDay, byExplorer: true });
  return true;
}

// ------------------------------------------------------------------ rodada

/** Avança os funcionários do pacote E2 (chamado junto com os outros ajudantes). */
export function advanceStaff(d: Draft, ms: number): boolean {
  const s = d.s;
  if (s.phase === 'fechamento' || !s.evo) return false;
  let busy = false;
  if (staffOn(s, FAIRY)) {
    runFairy(d, ms);
    busy = true;
  }
  if (staffOn(s, PEDDLER) && s.phase === 'expediente') {
    runPeddler(d, ms);
    busy = true;
  }
  if (staffOn(s, EXPLORER)) busy = runExplorer(d) || busy;
  return busy;
}

/** Ofertas que dependem só do nível do funcionário (para mostrar no painel). */
export const staffLevelOf = staffLevel;
