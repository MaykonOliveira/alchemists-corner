import { RECIPES } from '../data/recipes';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { learnTalent, masteredRecipes, sealsSpent, talentBonus } from './mastery';
import { grantCrystals } from './entitlements';
import { LEVEL_GIFTS } from '../data/retention';
import { addIngredients } from './street';
import { restockUnlocked } from './economy';
import { villageBonus } from './villageBonus';

import { tr } from '../../i18n';
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
  if (s.level < SEAL_LEVEL) return fail(d, tr('A Guilda só aceita doações de lojas nível {0} ou mais.', SEAL_LEVEL));
  const cost = sealPrice(s);
  if (s.coins < cost) return fail(d, tr('Moedas insuficientes.'));
  s.coins -= cost;
  s.sealsBought += 1;
  d.events.push({ type: 'SEAL_BOUGHT', cost });
  return true;
}

/**
 * Uma moeda de prestígio só (auditoria P1.1): os Selos de Mestre viraram Cristais de luar.
 * As fontes de Selo continuam as mesmas (níveis 11+, graus de Mestre, receitas dominadas, contratos,
 * doações), mas cada Selo ganho entra no bolso como SEAL_CRYSTALS cristais. Talentos e decoração
 * disputam o mesmo cristal: é uma escolha entre deixar a loja mais forte ou mais bonita.
 */
export const SEAL_CRYSTALS = 10;

/** Selos que ainda não foram trocados por cristais (o que sobrou de saves antigos, antes da troca). */
export const sealsUnspentLegacy = (s: GameSave) => Math.max(0, sealsEarned(s) - sealsSpent(s));

/** Paga em cristais os Selos ganhos desde a última vez. Roda depois de cada comando. */
export function paySeals(d: Draft) {
  const due = sealsEarned(d.s) - (d.s.sealsPaid ?? 0);
  if (due <= 0) return;
  d.s.sealsPaid = (d.s.sealsPaid ?? 0) + due;
  grantCrystals(d, due * SEAL_CRYSTALS, 'selo');
}

/** O Grimório desperta no nível 11 ou com a primeira receita dominada, como antes da troca. */
export const grimoireAwake = (s: GameSave) => s.level >= SEAL_LEVEL || sealsEarned(s) > 0;

export function learnTalentCmd(d: Draft, talentId: string): boolean {
  if (!grimoireAwake(d.s)) return fail(d, tr('O Grimório desperta no nível {0}.', SEAL_LEVEL));
  return learnTalent(d, talentId);
}

/** Libera as receitas do nível (usado ao subir de nível e ao migrar saves antigos). */
export function unlockRecipesUpTo(s: GameSave, level: number): string[] {
  const recipes = RECIPES.filter((r) => r.unlockLevel <= level && !s.knownRecipes.includes(r.id)).map((r) => r.id);
  s.knownRecipes.push(...recipes);
  for (const id of recipes) if (s.prices[id] === undefined) s.prices[id] = RECIPES.find((r) => r.id === id)!.basePrice;
  return recipes;
}

/**
 * O nível não ensina mais a receita pronta (auditoria P1.2): ele libera os ingredientes e deixa uma pista.
 * A receita entra no livro quando o jogador acerta a mistura na bancada.
 */
export function hintRecipesUpTo(s: GameSave, level: number): string[] {
  const hints = s.recipeHints ?? [];
  const fresh = RECIPES.filter((r) => r.unlockLevel <= level && !r.secret && !r.legend && !s.knownRecipes.includes(r.id) && !hints.includes(r.id)).map((r) => r.id);
  s.recipeHints = [...hints, ...fresh];
  return fresh;
}

/** Concede experiência e aplica subidas de nível (com receitas liberadas) e graus de Mestre. */
export function gainXp(d: Draft, amount: number) {
  const s = d.s;
  const rankBefore = masterRank(s.xp);
  s.xp += Math.max(0, Math.round(amount * (1 + talentBonus(s, 'sabedoria')) * (1 + villageBonus(s, 'experiencia'))));
  const newLevel = levelFromXp(s.xp);
  while (s.level < newLevel) {
    s.level += 1;
    const recipes = hintRecipesUpTo(s, s.level);
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

export const MAX_REPUTATION = 999;
/** No teto, cada tanto de reputação a mais vira 1 Cristal de luar (auditoria P2.2: o topo tem uso). */
export const FAME_PER_CRYSTAL = 25;

export function gainReputation(d: Draft, amount: number) {
  const raw = d.s.reputation + amount;
  d.s.reputation = Math.max(0, Math.min(MAX_REPUTATION, raw));
  if (raw <= MAX_REPUTATION) return;
  const pool = (d.s.fameOverflow ?? 0) + (raw - MAX_REPUTATION);
  const n = Math.floor(pool / FAME_PER_CRYSTAL);
  d.s.fameOverflow = pool - n * FAME_PER_CRYSTAL;
  if (n > 0) grantCrystals(d, n, 'fama');
}

/** Nome do título da loja de acordo com a reputação. */
export function reputationTitle(rep: number): string {
  if (rep >= 800) return tr('Real');
  if (rep >= 620) return tr('Mítica');
  if (rep >= 450) return tr('Lendária');
  if (rep >= 280) return tr('Famosa');
  if (rep >= 160) return tr('Respeitada');
  if (rep >= 80) return tr('Conhecida');
  if (rep >= 30) return tr('Promissora');
  return tr('Recém-aberta');
}
