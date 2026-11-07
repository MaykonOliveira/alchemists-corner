import { RECIPES } from '../data/recipes';
import type { Draft } from './context';

export const MAX_LEVEL = 10;

/** XP total necessário para alcançar o nível informado (nível 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Curva: 205, 540, 1035, 1720, 2625... (nível 10 perto de 9000 XP)
  const n = level - 1;
  return 150 * n + 50 * n * n + 5 * n * n * n;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Progresso (0..1) dentro do nível atual. */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return 1;
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return (xp - start) / (end - start);
}

/** Concede experiência e aplica subidas de nível (com receitas liberadas). */
export function gainXp(d: Draft, amount: number) {
  const s = d.s;
  s.xp += Math.max(0, Math.round(amount));
  const newLevel = levelFromXp(s.xp);
  while (s.level < newLevel) {
    s.level += 1;
    const recipes = RECIPES.filter((r) => r.unlockLevel === s.level && !s.knownRecipes.includes(r.id)).map((r) => r.id);
    s.knownRecipes.push(...recipes);
    for (const id of recipes) if (s.prices[id] === undefined) s.prices[id] = RECIPES.find((r) => r.id === id)!.basePrice;
    d.events.push({ type: 'LEVEL_UP', level: s.level, recipes });
  }
}

export function gainReputation(d: Draft, amount: number) {
  d.s.reputation = Math.max(0, Math.min(999, d.s.reputation + amount));
}

/** Nome do título da loja de acordo com a reputação. */
export function reputationTitle(rep: number): string {
  if (rep >= 450) return 'Lendária';
  if (rep >= 280) return 'Famosa';
  if (rep >= 160) return 'Respeitada';
  if (rep >= 80) return 'Conhecida';
  if (rep >= 30) return 'Promissora';
  return 'Desconhecida';
}
