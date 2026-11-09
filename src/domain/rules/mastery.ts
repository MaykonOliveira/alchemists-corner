// Maestria de receitas e Grimório do Mestre (meta-progressão do late game).
// Só depende dos dados: economia, alquimia e clientes importam daqui os bônus.
import { RECIPES } from '../data/recipes';
import { ENDLESS_TALENT_LEVEL, TALENTS_BY_ID, talentCost } from '../data/talents';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';

// ------------------------------------------------------------------ maestria

/** Poções preparadas necessárias para cada estrela de maestria (1 a 5). */
export const MASTERY_STEPS = [10, 30, 70, 140, 250] as const;
export const MAX_STARS = MASTERY_STEPS.length;
/** Cada estrela: clientes aceitam pagar este tanto a mais pela poção e o teto de preço sobe junto. */
export const STAR_BONUS = 0.04;

export const masteryCount = (s: GameSave, recipeId: string) => s.mastery[recipeId] ?? 0;

export function starsFor(count: number) {
  let stars = 0;
  while (stars < MAX_STARS && count >= MASTERY_STEPS[stars]) stars++;
  return stars;
}

export const masteryStars = (s: GameSave, recipeId: string) => starsFor(masteryCount(s, recipeId));

/** Progresso (0..1) até a próxima estrela. */
export function masteryProgress(s: GameSave, recipeId: string) {
  const n = masteryCount(s, recipeId);
  const stars = starsFor(n);
  if (stars >= MAX_STARS) return 1;
  const from = stars === 0 ? 0 : MASTERY_STEPS[stars - 1];
  return (n - from) / (MASTERY_STEPS[stars] - from);
}

/** Registra poções preparadas e avisa quando ganha estrela. */
export function addMastery(d: Draft, recipeId: string, qty: number) {
  const before = masteryStars(d.s, recipeId);
  d.s.mastery[recipeId] = masteryCount(d.s, recipeId) + qty;
  const after = masteryStars(d.s, recipeId);
  if (after > before) d.events.push({ type: 'MASTERY_STAR', recipeId, stars: after });
}

/** Receitas com maestria completa (cada uma rende 1 Selo de Mestre). */
export const masteredRecipes = (s: GameSave) => RECIPES.filter((r) => masteryStars(s, r.id) >= MAX_STARS).length;

// ------------------------------------------------------------------ talentos

export const talentRank = (s: GameSave, id: string) => s.talents[id] ?? 0;
/** Bônus total de um talento (grau × valor por grau). */
export const talentBonus = (s: GameSave, id: string) => talentRank(s, id) * (TALENTS_BY_ID[id]?.value ?? 0);

export const sealsSpent = (s: GameSave) =>
  Object.entries(s.talents).reduce((n, [, rank]) => n + (rank * (rank + 1)) / 2, 0);

/** Custo em cristais de luar do próximo grau (cada Selo de antes vale 10 cristais). */
export const talentCrystals = (rank: number) => talentCost(rank) * 10;

/** Algum talento cabe nos cristais de agora? (a aba do Grimório avisa) */
export const talentAffordable = (s: GameSave) =>
  Object.values(TALENTS_BY_ID).some((t) => talentRank(s, t.id) < t.max && (!t.endless || s.level >= ENDLESS_TALENT_LEVEL) && s.crystals >= talentCrystals(talentRank(s, t.id)));

export function learnTalent(d: Draft, talentId: string): boolean {
  const t = TALENTS_BY_ID[talentId];
  if (!t) return false;
  const rank = talentRank(d.s, talentId);
  if (rank >= t.max) return fail(d, 'Este talento já está no grau máximo.');
  if (t.endless && d.s.level < ENDLESS_TALENT_LEVEL) return fail(d, `Talentos sem fim abrem no nível ${ENDLESS_TALENT_LEVEL}.`);
  const cost = talentCrystals(rank);
  if (d.s.crystals < cost) return fail(d, `Faltam ${cost - d.s.crystals} Cristais de luar.`);
  d.s.crystals -= cost;
  d.s.talents[talentId] = rank + 1;
  d.events.push({ type: 'TALENT_LEARNED', talentId, rank: rank + 1 });
  return true;
}
