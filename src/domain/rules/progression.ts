import { RECIPES } from '../data/recipes';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { learnTalent, masteredRecipes, sealsSpent, talentBonus } from './mastery';
import { LEVEL_GIFTS } from '../data/retention';
import { addIngredients } from './street';
import { restockUnlocked } from './economy';

export const MAX_LEVEL = 15;
/** A partir deste nível cada nível novo rende 1 Selo de Mestre. */
export const SEAL_LEVEL = 11;
/** Depois do nível máximo, cada tanto de XP é um grau de Mestre (e mais 1 Selo). */
export const MASTER_STEP_XP = 3000;

/** XP total necessário para alcançar o nível informado (nível 1 = 0 XP). */
/** Os níveis 2 a 5 ficaram mais curtos na fase 3, para a primeira meia hora ter ritmo. */
const EARLY_LEVELS: Record<number, number> = { 2: 120, 3: 360, 4: 760, 5: 1400 };

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (EARLY_LEVELS[level] !== undefined) return EARLY_LEVELS[level];
  // Curva: 205, 540, 1035, 1720, 2625... (nível 10 perto de 9000 XP, nível 15 perto de 25600)
  const n = level - 1;
  return 150 * n + 50 * n * n + 5 * n * n * n;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Grau de Mestre (0 antes do nível máximo). Não tem fim. */
export function masterRank(xp: number): number {
  const base = xpForLevel(MAX_LEVEL);
  return xp < base ? 0 : Math.floor((xp - base) / MASTER_STEP_XP);
}

/** Progresso (0..1) dentro do nível atual (ou do grau de Mestre, no nível máximo). */
export function levelProgress(xp: number): number {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return ((xp - xpForLevel(MAX_LEVEL)) % MASTER_STEP_XP) / MASTER_STEP_XP;
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return (xp - start) / (end - start);
}

/** Selos de Mestre ganhos: níveis 11+, graus de Mestre e receitas com maestria completa. */
export const sealsEarned = (s: GameSave) =>
  Math.max(0, s.level - SEAL_LEVEL + 1) + masterRank(s.xp) + masteredRecipes(s) + s.sealsBought + (s.contractSeals ?? 0);

/** Doação à Guilda dos Alquimistas: troca moedas por um Selo (o preço sobe a cada compra). */
export const sealPrice = (s: GameSave) => 3000 * (s.sealsBought + 1);

export function buySeal(d: Draft): boolean {
  const s = d.s;
  if (s.level < SEAL_LEVEL) return fail(d, `A Guilda só aceita doações de lojas nível ${SEAL_LEVEL} ou mais.`);
  const cost = sealPrice(s);
  if (s.coins < cost) return fail(d, 'Moedas insuficientes.');
  s.coins -= cost;
  s.sealsBought += 1;
  d.events.push({ type: 'SEAL_BOUGHT', cost });
  return true;
}

export const sealsAvailable = (s: GameSave) => Math.max(0, sealsEarned(s) - sealsSpent(s));

export const learnTalentCmd = (d: Draft, talentId: string) => learnTalent(d, talentId, sealsAvailable(d.s));

/** Libera as receitas do nível (usado ao subir de nível e ao migrar saves antigos). */
export function unlockRecipesUpTo(s: GameSave, level: number): string[] {
  const recipes = RECIPES.filter((r) => r.unlockLevel <= level && !s.knownRecipes.includes(r.id)).map((r) => r.id);
  s.knownRecipes.push(...recipes);
  for (const id of recipes) if (s.prices[id] === undefined) s.prices[id] = RECIPES.find((r) => r.id === id)!.basePrice;
  return recipes;
}

/** Concede experiência e aplica subidas de nível (com receitas liberadas) e graus de Mestre. */
export function gainXp(d: Draft, amount: number) {
  const s = d.s;
  const rankBefore = masterRank(s.xp);
  s.xp += Math.max(0, Math.round(amount * (1 + talentBonus(s, 'sabedoria'))));
  const newLevel = levelFromXp(s.xp);
  while (s.level < newLevel) {
    s.level += 1;
    const recipes = unlockRecipesUpTo(s, s.level);
    restockUnlocked(s, s.level);
    const gift = LEVEL_GIFTS[s.level];
    if (gift) {
      s.coins += gift.coins;
      s.crystals = (s.crystals ?? 0) + gift.crystals;
      addIngredients(s, gift.items);
    }
    d.events.push({ type: 'LEVEL_UP', level: s.level, recipes, gift });
  }
  const rank = masterRank(s.xp);
  if (rank > rankBefore) d.events.push({ type: 'MASTER_RANK', rank });
}

export function gainReputation(d: Draft, amount: number) {
  d.s.reputation = Math.max(0, Math.min(999, d.s.reputation + amount));
}

/** Nome do título da loja de acordo com a reputação. */
export function reputationTitle(rep: number): string {
  if (rep >= 800) return 'Real';
  if (rep >= 620) return 'Mítica';
  if (rep >= 450) return 'Lendária';
  if (rep >= 280) return 'Famosa';
  if (rep >= 160) return 'Respeitada';
  if (rep >= 80) return 'Conhecida';
  if (rep >= 30) return 'Promissora';
  return 'Recém-aberta';
}
