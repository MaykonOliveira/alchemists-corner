// Receitas lendárias (pacote U): seis receitas fora do livro, achadas só por experimento.
// Páginas rasgadas (baú da semana, vitória sobre a rival, contratos, capítulos do Concurso) revelam os ingredientes.
import { RECIPES } from '../data/recipes';
import type { GameSave } from '../models/types';
import { pick, type Draft } from './context';

/** Nível a partir do qual as páginas rasgadas começam a aparecer. */
export const LEGEND_LEVEL = 10;
/** Cristais e XP por achar uma receita lendária. */
export const LEGEND_CRYSTALS = 5;
export const LEGEND_XP = 250;

export const LEGENDS = RECIPES.filter((r) => r.legend);

export const legendKnown = (s: GameSave) => LEGENDS.filter((r) => s.knownRecipes.includes(r.id)).length;

/** Quantos ingredientes da lenda já foram revelados (as páginas seguem a ordem da receita). */
export const pagesFor = (s: GameSave, id: string) => Math.min(s.pages[id] ?? 0, LEGENDS.find((r) => r.id === id)?.ingredients.length ?? 0);

/** Uma página rasgada: revela mais um ingrediente de uma lenda ainda não descoberta. */
export function findPage(d: Draft, source: string): boolean {
  const s = d.s;
  if (s.level < LEGEND_LEVEL) return false;
  const open = LEGENDS.filter((r) => !s.knownRecipes.includes(r.id) && pagesFor(s, r.id) < r.ingredients.length);
  if (!open.length) return false;
  // Prefere continuar uma lenda já começada: a receita fecha antes.
  const started = open.filter((r) => pagesFor(s, r.id) > 0);
  const r = pick(started.length ? started : open, d.ctx.random);
  const n = pagesFor(s, r.id);
  s.pages = { ...s.pages, [r.id]: n + 1 };
  d.events.push({ type: 'PAGE_FOUND', recipeId: r.id, ingredientId: r.ingredients[n].ingredientId, source });
  return true;
}
