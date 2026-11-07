import { INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES, RECIPES_BY_ID } from '../data/recipes';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { addPotions, countPotions, has, potionCapacity } from './economy';
import { addMastery, talentBonus } from './mastery';
import { gainXp } from './progression';

export const MAX_BATCHES = 5;
export const POTIONS_PER_BATCH = 2;

/** Poções por lote (o alambique de prata rende uma a mais). */
export const potionsPerBatch = (s: GameSave) => POTIONS_PER_BATCH + (has(s, 'alambique-prata') ? 1 : 0);
/** Lotes máximos por preparo (o talento "Caldeirão grande" aumenta). */
export const maxBatchesCap = (s: GameSave) => MAX_BATCHES + talentBonus(s, 'caldeirao-grande');
/** Milissegundos reais por minuto de preparo (60 min ≈ 9 s). */
const MS_PER_BREW_MIN = 150;

export function brewDurationMs(s: GameSave, recipeId: string, batches: number) {
  const r = RECIPES_BY_ID[recipeId];
  const speed = (has(s, 'caldeirao-reforcado') ? 0.7 : 1) * (1 - talentBonus(s, 'maos-ageis'));
  return Math.round(r.durationMin * MS_PER_BREW_MIN * (1 + 0.5 * (batches - 1)) * speed);
}

/** Quantos lotes dá para preparar com os ingredientes e o espaço disponíveis. */
export function maxBatches(s: GameSave, recipeId: string) {
  const r = RECIPES_BY_ID[recipeId];
  const byIngredients = Math.min(...r.ingredients.map((i) => Math.floor((s.ingredients[i.ingredientId] ?? 0) / i.qty)));
  const bySpace = Math.floor((potionCapacity(s) - countPotions(s)) / potionsPerBatch(s));
  return Math.max(0, Math.min(maxBatchesCap(s), byIngredients, bySpace));
}

/** A loja tem o segundo caldeirão (expansão "Sala dos fundos")? */
export const hasSecondCauldron = (s: GameSave) => has(s, 'sala-dos-fundos');
/** Qual caldeirão está livre agora (1, 2) ou null. */
export function freeCauldron(s: GameSave): 1 | 2 | null {
  if (!s.brew) return 1;
  if (hasSecondCauldron(s) && !s.brew2) return 2;
  return null;
}

export function startBrew(d: Draft, recipeId: string, batches: number): boolean {
  const s = d.s;
  const r = RECIPES_BY_ID[recipeId];
  if (!r || !s.knownRecipes.includes(recipeId)) return fail(d, 'Receita desconhecida.');
  if (s.phase === 'fechamento') return fail(d, 'A loja está fechando.');
  const slot = freeCauldron(s);
  if (!slot) return fail(d, hasSecondCauldron(s) ? 'Os dois caldeirões estão ocupados.' : 'O caldeirão já está ocupado.');
  if (!Number.isInteger(batches) || batches < 1) return fail(d, 'Escolha ao menos um lote.');
  if (batches > maxBatches(s, recipeId)) {
    const space = Math.floor((potionCapacity(s) - countPotions(s)) / potionsPerBatch(s));
    return fail(d, space < batches ? 'Não há espaço nas prateleiras.' : 'Ingredientes insuficientes.');
  }
  for (const i of r.ingredients) s.ingredients[i.ingredientId] -= i.qty * batches;
  const job = { recipeId, batches, elapsedMs: 0, totalMs: brewDurationMs(s, recipeId, batches) };
  if (slot === 1) s.brew = job;
  else s.brew2 = job;
  d.events.push(slot === 1 ? { type: 'BREW_STARTED', recipeId, batches } : { type: 'BREW_STARTED', recipeId, batches, slot: 2 });
  return true;
}

export function advanceBrew(d: Draft, ms: number) {
  for (const slot of [1, 2] as const) {
    const b = slot === 1 ? d.s.brew : d.s.brew2;
    if (!b) continue;
    b.elapsedMs = Math.min(b.totalMs, b.elapsedMs + ms);
    if (b.elapsedMs < b.totalMs) continue;
    const qty = b.batches * potionsPerBatch(d.s);
    addPotions(d.s, b.recipeId, qty);
    if (slot === 1) d.s.brew = null;
    else d.s.brew2 = null;
    d.events.push(slot === 1 ? { type: 'BREW_DONE', recipeId: b.recipeId, qty } : { type: 'BREW_DONE', recipeId: b.recipeId, qty, slot: 2 });
    addMastery(d, b.recipeId, qty);
    gainXp(d, 3 * b.batches);
  }
}

/**
 * Experimentação assistida: combinar 2 ou 3 ingredientes diferentes.
 * Acerto ensina a receita; erro consome só 1 unidade e dá uma pista.
 */
export function experiment(d: Draft, ingredientIds: string[]): boolean {
  const s = d.s;
  const ids = [...new Set(ingredientIds)];
  if (ids.length < 2 || ids.length > 3) return fail(d, 'Escolha 2 ou 3 ingredientes diferentes.');
  if (s.phase === 'fechamento') return fail(d, 'A loja está fechando.');
  if (ids.some((id) => !INGREDIENTS_BY_ID[id] || (s.ingredients[id] ?? 0) < 1)) return fail(d, 'Você precisa de 1 unidade de cada ingrediente.');

  const key = [...ids].sort().join('|');
  const match = RECIPES.find((r) => r.ingredients.map((i) => i.ingredientId).sort().join('|') === key);

  if (match && !s.knownRecipes.includes(match.id)) {
    for (const id of ids) s.ingredients[id] -= 1;
    s.knownRecipes.push(match.id);
    s.prices[match.id] ??= match.basePrice;
    d.events.push({ type: 'DISCOVERY', recipeId: match.id });
    gainXp(d, 30);
    return true;
  }

  // Erro: consome apenas o primeiro ingrediente e revela uma pista concreta.
  s.ingredients[ids[0]] -= 1;
  s.researchPoints += 1;
  const unknown = RECIPES.filter((r) => !s.knownRecipes.includes(r.id));
  let hint: string;
  if (match) hint = `Você já conhece essa mistura: ${match.name}.`;
  else if (unknown.length === 0) hint = 'Você já descobriu todas as receitas do livro!';
  else {
    const target = unknown[s.researchPoints % unknown.length];
    const ing = target.ingredients[s.researchPoints % target.ingredients.length];
    hint = `A mistura chiou e apagou. Mas uma anotação aparece no livro: “${target.name}” leva ${INGREDIENTS_BY_ID[ing.ingredientId].name}.`;
  }
  d.events.push({ type: 'EXPERIMENT_FAILED', hint });
  gainXp(d, 2);
  return true;
}
