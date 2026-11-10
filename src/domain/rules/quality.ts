// Toque de mestre (fase 4, pacote V): a qualidade das poções depende da sua mão no caldeirão.
// Os ajudantes só fazem poções Comuns; mexer no tempo certo rende Finas e Primorosas, que valem mais.
import { RECIPES_BY_ID } from '../data/recipes';
import type { GameSave, PotionStack, RecipeCategory } from '../models/types';
import { fail, type Draft } from './context';

import { tr } from '../../i18n';
export type Quality = 1 | 2 | 3;
export const QUALITY_NAME: Record<Quality, string> = { 1: tr('Comum'), 2: tr('Fina'), 3: tr('Primorosa') };
/** Quanto a mais o cliente paga por qualidade (sobre o preço da prateleira). */
export const QUALITY_BONUS: Record<Quality, number> = { 1: 0, 2: 0.2, 3: 0.5 };
/** Nível em que o toque de mestre aparece no caldeirão. */
export const STIR_LEVEL = 5;
export const STIR_TAPS = 3;

export const qualityFromHits = (hits: number | undefined): Quality => (hits === undefined ? 1 : hits >= 3 ? 3 : hits === 2 ? 2 : 1);

/**
 * Caldeirão com verbo próprio (auditoria P2.3): o toque de mestre são três gestos de alquimista,
 * cada um vale um acerto.
 * 1. Ordem: pôr os ingredientes na ordem do livro de receitas.
 * 2. Fogo: segurar a chama na faixa da receita (cada família tem o seu fogo).
 * 3. Ponto: tirar do fogo quando o líquido chega na cor da poção.
 * Saber a receita (ordem e fogo) vale tanto quanto ter a mão rápida.
 */
export const HEAT: Record<RecipeCategory, { band: [number, number]; name: string }> = {
  cura: { band: [14, 36], name: tr('brando') },
  mente: { band: [34, 56], name: tr('médio') },
  utilidade: { band: [50, 72], name: tr('firme') },
  vigor: { band: [66, 88], name: tr('forte') },
};
/** Faixa do ponto certo na barra do ponto (0 = cru, 100 = passou). */
export const POINT_BAND: [number, number] = [68, 84];

export interface BrewSteps {
  /** Ingredientes na ordem certa (a do livro). */
  order: string[];
  heat: { band: [number, number]; name: string };
  color: string;
}

export function brewSteps(recipeId: string): BrewSteps {
  const r = RECIPES_BY_ID[recipeId];
  const order = [...new Set(r.ingredients.map((i) => i.ingredientId))];
  return { order, heat: HEAT[r.category], color: r.color };
}

/** Embaralha a ordem para mostrar os ingredientes no gesto 1 (sempre diferente da certa quando dá). */
export function shuffledOrder(order: string[], seed: number): string[] {
  const out = [...order];
  let x = (seed >>> 0) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) >>> 0;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((id, i) => id === order[i])) out.push(out.shift()!);
  return out;
}

/** Quantas poções de cada qualidade há numa pilha. */
export function stackQualities(p: PotionStack | undefined) {
  const prime = Math.min(p?.prime ?? 0, p?.quantity ?? 0);
  const fine = Math.min(p?.fine ?? 0, (p?.quantity ?? 0) - prime);
  return { prime, fine, common: (p?.quantity ?? 0) - prime - fine };
}

/** Registra a qualidade das poções que acabaram de entrar na pilha. */
export function markQuality(s: GameSave, recipeId: string, qty: number, q: Quality) {
  if (q === 1) return;
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (!stack) return;
  if (q === 3) stack.prime = (stack.prime ?? 0) + qty;
  else stack.fine = (stack.fine ?? 0) + qty;
}

/** Depois de tirar poções sem escolher (pedidos, entregas, doações), as Comuns saem primeiro. */
export function clampQualities(stack: PotionStack) {
  const prime = Math.min(stack.prime ?? 0, stack.quantity);
  const fine = Math.min(stack.fine ?? 0, stack.quantity - prime);
  if (prime) stack.prime = prime; else delete stack.prime;
  if (fine) stack.fine = fine; else delete stack.fine;
}

/** Na venda sai a melhor poção da pilha. Retorna a qualidade da que saiu (antes de tirar a unidade). */
export function takeBestQuality(s: GameSave, recipeId: string): Quality {
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (!stack) return 1;
  const q = stackQualities(stack);
  if (q.prime > 0) { stack.prime = q.prime - 1; return 3; }
  if (q.fine > 0) { stack.fine = q.fine - 1; return 2; }
  return 1;
}

/** O jogador mexeu o caldeirão: guarda os acertos (uma vez por preparo). */
export function stir(d: Draft, slot: 1 | 2, hits: number): boolean {
  const s = d.s;
  if (s.level < STIR_LEVEL) return fail(d, tr('O toque de mestre aparece no nível {0}.', STIR_LEVEL));
  const job = slot === 1 ? s.brew : s.brew2;
  if (!job) return fail(d, tr('O caldeirão está vazio.'));
  if (job.byHelper) return fail(d, tr('Este preparo é do aprendiz.'));
  if (job.hits !== undefined) return false;
  job.hits = Math.max(0, Math.min(STIR_TAPS, Math.floor(hits)));
  d.events.push({ type: 'STIRRED', hits: job.hits, slot });
  return true;
}
