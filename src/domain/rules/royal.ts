// Concurso Real de Alquimia (pacote T): regras da campanha do fim de jogo.
import { RECIPES_BY_ID } from '../data/recipes';
import { ROYAL_CHAPTERS, ROYAL_RECIPE, type RoyalChapter } from '../data/royal';
import type { Customer, GameSave, RoyalState } from '../models/types';
import { fail, type Draft } from './context';
import { potionStock, takePotions } from './economy';
import { masteryStars } from './mastery';
import { gainXp, MAX_LEVEL } from './progression';
import { grantCrystals } from './entitlements';

export const ROYAL_DONE = ROYAL_CHAPTERS.length;

/** Capítulo em andamento (null antes do convite ou depois da vitória). */
export function royalChapter(s: GameSave): RoyalChapter | null {
  const r = s.royal;
  return r && r.chapter < ROYAL_DONE ? ROYAL_CHAPTERS[r.chapter] : null;
}

export const royalWon = (s: GameSave) => (s.royal?.chapter ?? 0) >= ROYAL_DONE;

/** Quanto falta e quanto já foi feito no capítulo atual. */
export function royalGoal(s: GameSave): { done: number; total: number } {
  const ch = royalChapter(s);
  const r = s.royal;
  if (!ch || !r) return { done: 0, total: 0 };
  if (ch.goal.kind === 'entregar') {
    const total = ch.goal.items.reduce((n, i) => n + i.qty, 0);
    const done = ch.goal.items.reduce((n, i) => n + Math.min(i.qty, r.delivered[i.recipeId] ?? 0), 0);
    return { done, total };
  }
  return { done: Math.min(r.progress, ch.goal.qty), total: ch.goal.qty };
}

/** Último dia do prazo: começando cedo, o dia de hoje conta inteiro; no meio do dia, ganha um a mais. */
const dueFor = (s: GameSave, days: number | null) => (days ? s.day + days - (s.phase === 'preparacao' ? 1 : 0) : 0);

function startChapter(s: GameSave, index: number): RoyalState {
  const ch = ROYAL_CHAPTERS[index];
  if (ch?.id === 'coroa' && !s.knownRecipes.includes(ROYAL_RECIPE)) {
    s.knownRecipes.push(ROYAL_RECIPE);
    s.prices[ROYAL_RECIPE] ??= RECIPES_BY_ID[ROYAL_RECIPE].basePrice;
  }
  return {
    chapter: index,
    progress: 0,
    delivered: {},
    dueDay: dueFor(s, ch?.days ?? null),
    seen: s.royal?.seen ?? -1,
    retries: 0,
  };
}

/** O convite chega quando a loja alcança o nível máximo (também para quem já estava lá). */
export function checkRoyalInvite(d: Draft) {
  const s = d.s;
  if (s.royal || s.level < MAX_LEVEL) return;
  s.royal = startChapter(s, 0);
  d.events.push({ type: 'ROYAL_INVITE' });
}

/** A cena do capítulo (ou a cerimônia final) já foi vista. */
export function seeRoyal(d: Draft): boolean {
  const r = d.s.royal;
  if (!r || r.seen >= r.chapter) return false;
  d.s.royal = { ...r, seen: r.chapter };
  // O prazo só começa a contar quando o jogador lê o capítulo.
  const ch = royalChapter(d.s);
  if (ch?.days && r.progress === 0 && Object.keys(r.delivered).length === 0) d.s.royal.dueDay = dueFor(d.s, ch.days);
  return true;
}

function completeChapter(d: Draft) {
  const s = d.s;
  const r = s.royal!;
  const ch = ROYAL_CHAPTERS[r.chapter];
  s.coins += ch.reward.coins;
  grantCrystals(d, ch.reward.crystals, 'concurso');
  gainXp(d, 400 + 200 * r.chapter);
  d.events.push({ type: 'ROYAL_CHAPTER_DONE', chapter: r.chapter, coins: ch.reward.coins, crystals: ch.reward.crystals });
  const next = r.chapter + 1;
  if (next >= ROYAL_DONE) {
    s.royal = { ...r, chapter: ROYAL_DONE, progress: 0, delivered: {}, dueDay: 0 };
    d.events.push({ type: 'ROYAL_WON' });
  } else {
    s.royal = { ...startChapter(s, next), seen: r.seen };
  }
}

function addProgress(d: Draft, n: number) {
  const s = d.s;
  const ch = royalChapter(s)!;
  s.royal = { ...s.royal!, progress: s.royal!.progress + n };
  const g = royalGoal(s);
  d.events.push({ type: 'ROYAL_PROGRESS', chapter: s.royal.chapter, progress: g.done, goal: g.total });
  if (ch.goal.kind !== 'entregar' && s.royal.progress >= ch.goal.qty) completeChapter(d);
}

/** Capítulo aberto e com a cena já lida (antes disso nada conta, para o jogador saber o que fazer). */
const royalActive = (s: GameSave) => !!royalChapter(s) && s.royal!.seen >= s.royal!.chapter;

/** Venda feita (pelo jogador ou pelo golem). */
export function royalOnSale(d: Draft, c: Customer, recipeId: string) {
  const ch = royalChapter(d.s);
  if (!ch || !royalActive(d.s)) return;
  if (ch.goal.kind === 'vender' && RECIPES_BY_ID[recipeId].category === ch.goal.category) addProgress(d, 1);
  else if (ch.goal.kind === 'nobres' && c.archetype === 'nobre') addProgress(d, 1);
}

/** Cliente foi embora sem comprar: no baile, perder um nobre zera a sequência. */
export function royalOnLost(d: Draft, c: Customer) {
  const ch = royalChapter(d.s);
  if (!ch || !royalActive(d.s) || ch.goal.kind !== 'nobres' || c.archetype !== 'nobre') return;
  if (d.s.royal!.progress === 0) return;
  d.s.royal = { ...d.s.royal!, progress: 0 };
  d.events.push({ type: 'ROYAL_STREAK_LOST', chapter: d.s.royal.chapter });
}

/** O que dá para entregar agora (por receita). */
export function royalDeliverable(s: GameSave): { recipeId: string; qty: number }[] {
  const ch = royalChapter(s);
  if (!ch || ch.goal.kind !== 'entregar') return [];
  return ch.goal.items
    .map((i) => ({ recipeId: i.recipeId, qty: Math.min(potionStock(s, i.recipeId), i.qty - (s.royal!.delivered[i.recipeId] ?? 0)) }))
    .filter((i) => i.qty > 0);
}

/** Exigência de maestria do capítulo que ainda falta (ou null). */
export function royalStarsMissing(s: GameSave): { recipeId: string; n: number; have: number } | null {
  const ch = royalChapter(s);
  if (!ch?.stars) return null;
  const have = masteryStars(s, ch.stars.recipeId);
  return have >= ch.stars.n ? null : { ...ch.stars, have };
}

export function deliverRoyal(d: Draft): boolean {
  const s = d.s;
  const ch = royalChapter(s);
  if (!ch || ch.goal.kind !== 'entregar') return fail(d, 'Não há entrega no capítulo atual.');
  if (!royalActive(s)) return fail(d, 'Leia o capítulo primeiro.');
  const stars = royalStarsMissing(s);
  if (stars) return fail(d, `Os astrônomos só aceitam com ${stars.n} estrelas de maestria (você tem ${stars.have}).`);
  const items = royalDeliverable(s);
  if (!items.length) return fail(d, 'Nenhuma poção do capítulo nas prateleiras.');
  const delivered = { ...s.royal!.delivered };
  for (const i of items) {
    takePotions(s, i.recipeId, i.qty);
    delivered[i.recipeId] = (delivered[i.recipeId] ?? 0) + i.qty;
  }
  s.royal = { ...s.royal!, delivered };
  const g = royalGoal(s);
  d.events.push({ type: 'ROYAL_PROGRESS', chapter: s.royal.chapter, progress: g.done, goal: g.total });
  if (g.done >= g.total) completeChapter(d);
  return true;
}

/**
 * Virada do dia: prazo vencido recomeça a contagem de vendas e abre um prazo novo.
 * Poções já entregues continuam valendo: ninguém perde o que já fez.
 */
export function royalNewDay(d: Draft) {
  const s = d.s;
  const ch = royalChapter(s);
  const r = s.royal;
  if (!ch || !r || !r.dueDay || s.day <= r.dueDay) return;
  s.royal = { ...r, progress: 0, dueDay: dueFor(s, ch.days), retries: r.retries + 1 };
  d.events.push({ type: 'ROYAL_RETRY', chapter: r.chapter });
}

/** Dias que faltam no prazo (incluindo hoje), ou null se não tem prazo. */
export const royalDaysLeft = (s: GameSave) => (s.royal?.dueDay ? Math.max(0, s.royal.dueDay - s.day + 1) : null);
