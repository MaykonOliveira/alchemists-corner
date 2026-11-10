// Metas do dia e baú da semana (pacote G).
// As metas são sorteadas com uma semente do próprio dia (não usam ctx.random), então o mesmo dia
// sempre traz as mesmas metas e o sorteio não muda a sequência aleatória do resto das regras.
import { CATEGORY_LABEL } from '../data/world';
import { INGREDIENTS } from '../data/ingredients';
import { RECIPES_BY_ID } from '../data/recipes';
import type { DailyGoal, GameEvent, GameSave, GoalKind, GoalsState, RecipeCategory } from '../models/types';
import type { Draft } from './context';
import { gainXp } from './progression';
import { findPage } from './legends';
import { addIngredients, inSeason, weekOf } from './street';

import { tr } from '../../i18n';
/** Metas cumpridas na semana para abrir o baú (de 21 possíveis). */
export const CHEST_GOAL = 10;

/** PRNG pequeno (mulberry32) com semente. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

function make(s: GameSave, kind: GoalKind, rnd: () => number, i: number): DailyGoal | null {
  const L = s.level;
  const known = s.knownRecipes.filter((id) => RECIPES_BY_ID[id] && inSeason(s, RECIPES_BY_ID[id]));
  const base = { id: `g${s.day}-${i}`, kind, progress: 0, done: false, coins: round5(15 + 10 * L), xp: 10 + 5 * L };
  switch (kind) {
    case 'vender': return { ...base, target: Math.min(24, 3 + L + Math.floor(rnd() * 3)) };
    case 'faturar': return { ...base, target: round5(60 + 45 * L + rnd() * 30 * L), coins: round5(20 + 12 * L) };
    case 'categoria': {
      const cats = [...new Set(known.map((id) => RECIPES_BY_ID[id].category))];
      if (!cats.length) return null;
      return { ...base, ref: cats[Math.floor(rnd() * cats.length)], target: 2 + Math.floor(L / 3) };
    }
    case 'preparar': {
      if (!known.length) return null;
      return { ...base, ref: known[Math.floor(rnd() * known.length)], target: 1 + Math.floor(L / 6), xp: base.xp + 5 };
    }
    case 'sem-troca': return { ...base, target: 2 + Math.floor(L / 2) };
    case 'pedido': return s.order ? { ...base, target: 1, coins: round5(base.coins * 1.5) } : null;
    case 'carinho': return s.day >= 2 ? { ...base, target: 1, coins: round5(10 + 4 * L), xp: 5 + 2 * L } : null;
  }
}

/** Sorteia as três metas do dia. No primeiro dia elas acompanham o tutorial. */
export function rollGoals(s: GameSave): DailyGoal[] {
  if (s.day === 1) {
    return [
      // Prêmio pequeno em moedas: a primeira melhoria continua ficando para o dia 2 ou 3.
      { id: 'g1-0', kind: 'preparar', ref: 'cura-simples', target: 1, progress: 0, coins: 5, xp: 15, done: false },
      { id: 'g1-1', kind: 'vender', target: 3, progress: 0, coins: 5, xp: 15, done: false },
      { id: 'g1-2', kind: 'sem-troca', target: 2, progress: 0, coins: 5, xp: 20, done: false },
    ];
  }
  const rnd = seeded(s.day * 7919 + s.createdAt % 100000);
  const pool: GoalKind[] = ['vender', 'faturar', 'categoria', 'preparar', 'sem-troca', 'pedido', 'carinho'];
  const out: DailyGoal[] = [];
  while (out.length < 3 && pool.length) {
    const kind = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
    const g = make(s, kind, rnd, out.length);
    if (g) out.push(g);
  }
  return out;
}

/** Garante as metas do dia atual (e zera o baú quando a semana vira). */
export function ensureGoals(s: GameSave) {
  const week = weekOf(s.day);
  const g: GoalsState = s.goals ?? { day: 0, list: [], week, weekDone: 0, chestClaimed: false };
  if (g.week !== week) { g.week = week; g.weekDone = 0; g.chestClaimed = false; }
  if (g.day !== s.day) { g.day = s.day; g.list = rollGoals(s); }
  s.goals = g;
}

/** Quanto um evento faz avançar uma meta. */
function stepFor(goal: DailyGoal, e: GameEvent): number {
  switch (goal.kind) {
    case 'vender': return e.type === 'SALE' ? 1 : 0;
    case 'faturar': return e.type === 'SALE' ? e.price : 0;
    case 'categoria': return e.type === 'SALE' && RECIPES_BY_ID[e.recipeId]?.category === goal.ref ? 1 : 0;
    case 'preparar': return e.type === 'BREW_STARTED' && e.recipeId === goal.ref ? e.batches : 0;
    case 'sem-troca': return e.type === 'SALE' && !e.substitute ? 1 : 0;
    case 'pedido': return e.type === 'ORDER_DONE' ? 1 : 0;
    case 'carinho': return e.type === 'CAT_PETTED' ? 1 : 0;
  }
}

/** Avança as metas com os eventos do comando e paga as que foram cumpridas. */
export function trackGoals(d: Draft, from: number) {
  const s = d.s;
  if (!s.goals || s.goals.day !== s.day) return;
  const events = d.events.slice(from);
  for (const goal of s.goals.list) {
    if (goal.done) continue;
    for (const e of events) goal.progress += stepFor(goal, e);
    if (goal.progress < goal.target) continue;
    goal.progress = goal.target;
    goal.done = true;
    s.coins += goal.coins;
    s.goals.weekDone += 1;
    gainXp(d, goal.xp);
    d.events.push({ type: 'GOAL_DONE', goalId: goal.id, coins: goal.coins, xp: goal.xp, allDone: s.goals.list.every((x) => x.done) });
  }
}

export const chestReady = (s: GameSave) => !!s.goals && !s.goals.chestClaimed && s.goals.weekDone >= CHEST_GOAL;

/** Prêmio do baú da semana: moedas e ingredientes raros que o fornecedor já vende para a loja. */
export function chestPrize(s: GameSave) {
  const coins = round5(150 + 60 * s.level);
  const rares = INGREDIENTS.filter((i) => i.rarity === 'raro' && s.level >= i.supplierLevel && inSeason(s, i));
  const pickN = rares.slice(-3);
  const items = (pickN.length ? pickN : INGREDIENTS.slice(0, 2)).map((i) => ({ ingredientId: i.id, qty: 2 + Math.floor(s.level / 5) }));
  return { coins, items };
}

export function claimChest(d: Draft): boolean {
  const s = d.s;
  if (!chestReady(s)) {
    d.events.push({ type: 'ERROR', message: tr('Cumpra {0} metas na semana para abrir o baú.', CHEST_GOAL) });
    return false;
  }
  const { coins, items } = chestPrize(s);
  s.coins += coins;
  addIngredients(s, items);
  s.goals.chestClaimed = true;
  d.events.push({ type: 'CHEST_OPENED', coins, items });
  findPage(d, tr('o baú da semana'));
  return true;
}

/** Texto curto de cada meta, para a interface. */
export function goalText(g: DailyGoal): string {
  switch (g.kind) {
    case 'vender': return tr('Venda {0} poções', g.target);
    case 'faturar': return tr('Fature {0} moedas em vendas', g.target);
    case 'categoria': return tr('Venda {0} poções de {1}', g.target, CATEGORY_LABEL[g.ref as RecipeCategory] ?? g.ref);
    case 'preparar': return tr('Prepare {0} {1} de {2}', g.target, g.target > 1 ? tr('lotes') : tr('lote'), RECIPES_BY_ID[g.ref ?? '']?.shortName ?? tr('poção'));
    case 'sem-troca': return tr('Atenda {0} clientes com a poção que pediram', g.target);
    case 'pedido': return tr('Entregue o pedido especial');
    case 'carinho': return tr('Faça carinho no gato da loja');
  }
}

export const GOAL_ICON: Record<GoalKind, string> = {
  vender: '🧪', faturar: '🪙', categoria: '🏷️', preparar: '⚗️', 'sem-troca': '😊', pedido: '📜', carinho: '🐈',
};
