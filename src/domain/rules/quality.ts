// Toque de mestre (fase 4, pacote V): a qualidade das poções depende da sua mão no caldeirão.
// Os ajudantes só fazem poções Comuns; mexer no tempo certo rende Finas e Primorosas, que valem mais.
import type { GameSave, PotionStack } from '../models/types';
import { fail, type Draft } from './context';

export type Quality = 1 | 2 | 3;
export const QUALITY_NAME: Record<Quality, string> = { 1: 'Comum', 2: 'Fina', 3: 'Primorosa' };
/** Quanto a mais o cliente paga por qualidade (sobre o preço da prateleira). */
export const QUALITY_BONUS: Record<Quality, number> = { 1: 0, 2: 0.2, 3: 0.5 };
/** Nível em que o toque de mestre aparece no caldeirão. */
export const STIR_LEVEL = 5;
export const STIR_TAPS = 3;

export const qualityFromHits = (hits: number | undefined): Quality => (hits === undefined ? 1 : hits >= 3 ? 3 : hits === 2 ? 2 : 1);

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
  if (s.level < STIR_LEVEL) return fail(d, `O toque de mestre aparece no nível ${STIR_LEVEL}.`);
  const job = slot === 1 ? s.brew : s.brew2;
  if (!job) return fail(d, 'O caldeirão está vazio.');
  if (job.byHelper) return fail(d, 'Este preparo é do aprendiz.');
  if (job.hits !== undefined) return false;
  job.hits = Math.max(0, Math.min(STIR_TAPS, Math.floor(hits)));
  d.events.push({ type: 'STIRRED', hits: job.hits, slot });
  return true;
}
