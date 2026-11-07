// Pacote E: estações com ingredientes e poções próprios, a rival da rua, eventos raros e expedições.
import { DAY_EVENTS } from '../data/orders';
import { INGREDIENTS, INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES, RECIPES_BY_ID } from '../data/recipes';
import {
  EXPEDITIONS_BY_ID, FIND_CHANCE, FINDS_BY_ID, FOREST_SEASONAL, RIVAL, VISITOR_FINDS,
} from '../data/street';
import type { DayEventId, DayReport, GameSave, Ingredient, Recipe } from '../models/types';
import { fail, nextId, pick, type Draft } from './context';
import { countIngredients, has, ingredientCapacity } from './economy';
import { RAVEN } from './helpers';
import { gainReputation } from './progression';
import { seasonOf } from './world';

// ------------------------------------------------------------- estação

/** A poção ou o ingrediente pode ser usado hoje? (os que não são da estação, sempre) */
export const inSeason = (s: GameSave, item: Pick<Recipe | Ingredient, 'season'>) => !item.season || seasonOf(s.day).id === item.season;

/** Poção da estação atual (ou null). */
export const seasonalRecipe = (s: GameSave) => RECIPES.find((r) => r.season === seasonOf(s.day).id) ?? null;
export const seasonalIngredient = (s: GameSave) => INGREDIENTS.find((i) => i.season === seasonOf(s.day).id) ?? null;

/**
 * Estoque do dia de um ingrediente da estação: só na estação dele, a partir do nível do fornecedor.
 * No Mercado da Lua Cheia aparecem os das quatro estações.
 */
export function seasonalStock(s: GameSave, ing: Ingredient): number {
  if (s.level < ing.supplierLevel) return 0;
  if (s.event === 'lua-cheia') return ing.season === seasonOf(s.day).id ? (ing.dailyStock ?? 6) + 4 : 4;
  return ing.season === seasonOf(s.day).id ? ing.dailyStock ?? 6 : 0;
}

/** Itens raros com estoque maior no Mercado da Lua Cheia. */
export const MOON_MARKET_EXTRA = 3;

// ------------------------------------------------------------------ rival

export const rivalActive = (s: GameSave) => s.level >= RIVAL.minLevel && s.day >= RIVAL.minDay;
export const weekOf = (day: number) => Math.floor((Math.max(1, day) - 1) / 7);
/** Dias que faltam para fechar a semana da disputa (1 = hoje é o último dia). */
export const rivalDaysLeft = (day: number) => 7 - ((Math.max(1, day) - 1) % 7);

/** Quanto a rival fatura num dia: um pouco acima da média recente da sua loja. */
export function rivalDailyPace(s: GameSave): number {
  const recent = s.reports.slice(-7);
  const avg = recent.length ? recent.reduce((n, r) => n + r.revenue + r.orderRewards, 0) / recent.length : 120;
  return Math.max(80, avg * 1.06);
}

export const rivalPrize = (s: GameSave) => 150 + 40 * s.level;

/** No fechamento: soma o dia ao placar e, no último dia da semana, decide a disputa. */
export function rivalOnClose(d: Draft, report: DayReport) {
  const s = d.s;
  if (!rivalActive(s)) return;
  const week = weekOf(s.day);
  if (s.rival.week !== week) s.rival = { ...s.rival, week, me: 0, her: 0 };
  const pace = rivalDailyPace(s);
  const me = s.rival.me + report.revenue + report.orderRewards;
  const her = s.rival.her + Math.round(pace * (0.85 + d.ctx.random() * 0.3));
  s.rival = { ...s.rival, me, her };
  let result: 'win' | 'loss' | null = null;
  if (rivalDaysLeft(s.day) === 1) {
    const win = me > her;
    result = win ? 'win' : 'loss';
    let coins = 0;
    if (win) {
      coins = rivalPrize(s);
      s.coins += coins;
      gainReputation(d, 4);
      // Um mimo da despensa dela: ingredientes raros que você já conhece.
      const rares = INGREDIENTS.filter((i) => i.rarity === 'raro' && !i.season && s.level >= i.supplierLevel);
      if (rares.length) addIngredients(s, [{ ingredientId: pick(rares, d.ctx.random).id, qty: 3 }]);
      s.rival = { ...s.rival, wins: s.rival.wins + 1 };
    } else {
      s.rival = { ...s.rival, losses: s.rival.losses + 1 };
    }
    d.events.push({ type: 'RIVAL_RESULT', win, me, her, coins });
  }
  report.rival = { me, her, result };
}

// --------------------------------------------------------- eventos raros

/** Sorteio do evento especial raro do dia (cerca de 1 em cada 8 dias, a partir do nível 5). */
export function rollRareEvent(d: Draft): DayEventId | null {
  const s = d.s;
  if (s.day < 6 || d.ctx.random() >= 0.13) return null;
  const ids = (Object.keys(DAY_EVENTS) as DayEventId[]).filter(
    (id) => DAY_EVENTS[id].rare && s.level >= (DAY_EVENTS[id].minLevel ?? 1) && (id !== 'visitante' || !s.order),
  );
  return ids.length ? pick(ids, d.ctx.random) : null;
}

/** Multiplicador de preço do evento para a categoria (Eclipse: mente vale quase o dobro). */
export function eventCategoryFactor(s: GameSave, recipeId: string) {
  const boost = s.event ? DAY_EVENTS[s.event].categoryBoost : undefined;
  return boost && RECIPES_BY_ID[recipeId]?.category === boost.category ? boost.factor : 1;
}

/** O Visitante Misterioso deixa um pedido que vale só no dia e paga com um achado lendário. */
export function createVisitorOrder(d: Draft) {
  const s = d.s;
  const options = s.knownRecipes.filter((id) => RECIPES_BY_ID[id] && inSeason(s, RECIPES_BY_ID[id]) && RECIPES_BY_ID[id].unlockLevel >= 2);
  const recipeId = pick(options.length ? options : s.knownRecipes, d.ctx.random);
  const r = RECIPES_BY_ID[recipeId];
  const missing = VISITOR_FINDS.filter((f) => !s.finds.includes(f));
  const qty = 3;
  s.order = {
    id: nextId(d, 'o'),
    client: 'Visitante Misterioso',
    text: 'Preciso disto antes do anoitecer. Pago com algo que não se vende em loja nenhuma.',
    recipeId,
    qty,
    rewardCoins: Math.round(r.basePrice * qty * 2),
    rewardRep: 6,
    rewardXp: 60,
    dueDay: s.day,
    visitor: true,
    rewardSeal: true,
    rewardFind: missing.length ? pick(missing, d.ctx.random) : undefined,
  };
  d.events.push({ type: 'ORDER_NEW', orderId: s.order.id });
}

// ------------------------------------------------------------ expedições

export const canExplore = (s: GameSave) => has(s, RAVEN);

export function addIngredients(s: GameSave, items: { ingredientId: string; qty: number }[]) {
  const out: { ingredientId: string; qty: number }[] = [];
  for (const it of items) {
    const room = Math.max(0, ingredientCapacity(s) - countIngredients(s));
    const qty = Math.min(it.qty, room);
    if (qty <= 0) continue;
    s.ingredients[it.ingredientId] = (s.ingredients[it.ingredientId] ?? 0) + qty;
    out.push({ ingredientId: it.ingredientId, qty });
  }
  return out;
}

export function sendExpedition(d: Draft, dest: string): boolean {
  const s = d.s;
  const info = EXPEDITIONS_BY_ID[dest];
  if (!info) return fail(d, 'Destino desconhecido.');
  if (!canExplore(s)) return fail(d, 'Contrate o corvo entregador para mandar expedições.');
  if (s.level < info.minLevel) return fail(d, `Esse destino abre no nível ${info.minLevel}.`);
  if (s.expedition) return fail(d, 'O corvo já está em viagem.');
  if (s.phase === 'fechamento') return fail(d, 'O corvo sai de manhã cedo. Mande amanhã.');
  if (s.coins < info.cost) return fail(d, 'Moedas insuficientes para as provisões.');
  s.coins -= info.cost;
  s.stats.ingredientCost += info.cost;
  s.expedition = { dest, returnDay: s.day + info.days };
  d.events.push({ type: 'EXPEDITION_SENT', dest, returnDay: s.expedition.returnDay });
  return true;
}

/** No começo do dia: o corvo volta com o que achou. */
export function returnExpedition(d: Draft) {
  const s = d.s;
  const ex = s.expedition;
  if (!ex || s.day < ex.returnDay) return;
  const info = EXPEDITIONS_BY_ID[ex.dest];
  s.expedition = null;
  if (!info) return;
  const r = d.ctx.random;
  const loot: { ingredientId: string; qty: number }[] = [];
  for (const [id, min, max, lvl] of info.loot) {
    if (s.level < lvl || !INGREDIENTS_BY_ID[id]) continue;
    const qty = min + Math.floor(r() * (max - min + 1));
    if (qty > 0) loot.push({ ingredientId: id, qty });
  }
  if (info.id === 'floresta') {
    const sea = seasonalIngredient(s);
    if (sea && s.level >= sea.supplierLevel) loot.push({ ingredientId: sea.id, qty: FOREST_SEASONAL.min + Math.floor(r() * (FOREST_SEASONAL.max - FOREST_SEASONAL.min + 1)) });
  }
  const items = addIngredients(s, loot);
  const missing = info.finds.filter((f) => !s.finds.includes(f));
  const find = missing.length && r() < FIND_CHANCE ? pick(missing, r) : null;
  if (find) s.finds = [...s.finds, find];
  s.expeditionsDone += 1;
  s.helpers.ravenInMs = 1500;
  d.events.push({ type: 'EXPEDITION_BACK', dest: info.id, items, find });
}

/** Achado entregue pelo Visitante Misterioso. */
export function grantFind(d: Draft, id: string | undefined) {
  if (!id || !FINDS_BY_ID[id] || d.s.finds.includes(id)) return;
  d.s.finds = [...d.s.finds, id];
  d.events.push({ type: 'FIND', id });
}
