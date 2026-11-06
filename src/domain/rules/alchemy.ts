import { INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES, RECIPES_BY_ID } from '../data/recipes';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { addPotions, countPotions, has, potionCapacity } from './economy';
import { gainXp } from './progression';

export const MAX_BATCHES = 5;
export const POTIONS_PER_BATCH = 2;
/** Milissegundos reais por minuto de preparo (60 min ≈ 9 s). */
const MS_PER_BREW_MIN = 150;

export function brewDurationMs(s: GameSave, recipeId: string, batches: number) {
  const r = RECIPES_BY_ID[recipeId];
  const speed = has(s, 'caldeirao-reforcado') ? 0.7 : 1;
  return Math.round(r.durationMin * MS_PER_BREW_MIN * (1 + 0.5 * (batches - 1)) * speed);
}

/** Quantos lotes dá para preparar com os ingredientes e o espaço disponíveis. */
export function maxBatches(s: GameSave, recipeId: string) {
  const r = RECIPES_BY_ID[recipeId];
  const byIngredients = Math.min(...r.ingredients.map((i) => Math.floor((s.ingredients[i.ingredientId] ?? 0) / i.qty)));
  const bySpace = Math.floor((potionCapacity(s) - countPotions(s)) / POTIONS_PER_BATCH);
  return Math.max(0, Math.min(MAX_BATCHES, byIngredients, bySpace));
}

export function startBrew(d: Draft, recipeId: string, batches: number): boolean {
  const s = d.s;
  const r = RECIPES_BY_ID[recipeId];
  if (!r || !s.knownRecipes.includes(recipeId)) return fail(d, 'Receita desconhecida.');
  if (s.phase === 'fechamento') return fail(d, 'A loja está fechando.');
  if (s.brew) return fail(d, 'O caldeirão já está ocupado.');
  if (!Number.isInteger(batches) || batches < 1) return fail(d, 'Escolha ao menos um lote.');
  if (batches > maxBatches(s, recipeId)) {
    const space = Math.floor((potionCapacity(s) - countPotions(s)) / POTIONS_PER_BATCH);
    return fail(d, space < batches ? 'Não há espaço nas prateleiras.' : 'Ingredientes insuficientes.');
  }
  for (const i of r.ingredients) s.ingredients[i.ingredientId] -= i.qty * batches;
  s.brew = { recipeId, batches, elapsedMs: 0, totalMs: brewDurationMs(s, recipeId, batches) };
  d.events.push({ type: 'BREW_STARTED', recipeId, batches });
  return true;
}

export function advanceBrew(d: Draft, ms: number) {
  const b = d.s.brew;
  if (!b) return;
  b.elapsedMs = Math.min(b.totalMs, b.elapsedMs + ms);
  if (b.elapsedMs < b.totalMs) return;
  const qty = b.batches * POTIONS_PER_BATCH;
  addPotions(d.s, b.recipeId, qty);
  d.s.brew = null;
  d.events.push({ type: 'BREW_DONE', recipeId: b.recipeId, qty });
  gainXp(d, 3 * b.batches);
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
