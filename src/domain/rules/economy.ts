import { INGREDIENTS, INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES_BY_ID } from '../data/recipes';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { gainXp } from './progression';

export const PRICE_MIN_FACTOR = 0.8;
export const PRICE_MAX_FACTOR = 1.3;

export const has = (s: GameSave, upgradeId: string) => s.upgrades.includes(upgradeId);

export function priceRange(recipeId: string) {
  const base = RECIPES_BY_ID[recipeId].basePrice;
  return { min: Math.max(1, Math.round(base * PRICE_MIN_FACTOR)), max: Math.round(base * PRICE_MAX_FACTOR), base };
}

export const getPrice = (s: GameSave, recipeId: string) => s.prices[recipeId] ?? RECIPES_BY_ID[recipeId].basePrice;

export const potionCapacity = (s: GameSave) => 16 + (has(s, 'prateleira-extra') ? 12 : 0);
export const ingredientCapacity = (s: GameSave) => 40 + (has(s, 'armario-organizado') ? 30 : 0);
export const countPotions = (s: GameSave) => s.potions.reduce((n, p) => n + p.quantity, 0);
export const countIngredients = (s: GameSave) => Object.values(s.ingredients).reduce((n, q) => n + q, 0);
export const potionStock = (s: GameSave, recipeId: string) => s.potions.find((p) => p.recipeId === recipeId)?.quantity ?? 0;

/** Custo de manutenção cobrado no fechamento (aluguel, lenha, velas). Informado antes de fechar. */
export const maintenanceCost = (s: GameSave) => 10 + 5 * (s.level - 1) + 3 * s.upgrades.length;

/** Custo dos ingredientes de um lote, pelos preços atuais do fornecedor. */
export const recipeCost = (recipeId: string) =>
  RECIPES_BY_ID[recipeId].ingredients.reduce((n, i) => n + INGREDIENTS_BY_ID[i.ingredientId].price * i.qty, 0);

/** Estoque do fornecedor para um novo dia. 0 = indisponível no nível atual. */
export function supplierStock(s: GameSave): Record<string, number | null> {
  return Object.fromEntries(INGREDIENTS.map((i) => [i.id, s.level >= i.supplierLevel ? i.dailyStock : 0]));
}

export function buyIngredient(d: Draft, ingredientId: string, qty: number): boolean {
  const s = d.s;
  const ing = INGREDIENTS_BY_ID[ingredientId];
  if (!ing || !Number.isInteger(qty) || qty <= 0) return fail(d, 'Quantidade inválida.');
  if (s.phase === 'fechamento') return fail(d, 'O fornecedor já foi embora hoje.');
  if (s.level < ing.supplierLevel) return fail(d, `${ing.name} só aparece no nível ${ing.supplierLevel}.`);
  const available = s.supplier[ingredientId];
  if (available !== null && available !== undefined && qty > available) return fail(d, `O fornecedor só tem ${available} hoje.`);
  if (countIngredients(s) + qty > ingredientCapacity(s)) return fail(d, 'O armário está cheio.');
  const cost = ing.price * qty;
  if (cost > s.coins) return fail(d, 'Moedas insuficientes.');
  s.coins -= cost;
  s.ingredients[ingredientId] = (s.ingredients[ingredientId] ?? 0) + qty;
  if (available !== null && available !== undefined) s.supplier[ingredientId] = available - qty;
  s.stats.ingredientCost += cost;
  d.events.push({ type: 'PURCHASE', ingredientId, qty, cost });
  return true;
}

export function setPrice(d: Draft, recipeId: string, price: number): boolean {
  if (!RECIPES_BY_ID[recipeId]) return false;
  const { min, max } = priceRange(recipeId);
  const p = Math.round(Math.min(max, Math.max(min, price)));
  if (d.s.prices[recipeId] === p) return false;
  d.s.prices[recipeId] = p;
  return true;
}

export function setForSale(d: Draft, recipeId: string, forSale: boolean): boolean {
  const stack = d.s.potions.find((p) => p.recipeId === recipeId);
  if (!stack || stack.forSale === forSale) return false;
  stack.forSale = forSale;
  return true;
}

export function buyUpgrade(d: Draft, upgradeId: string): boolean {
  const s = d.s;
  const up = UPGRADES_BY_ID[upgradeId];
  if (!up) return false;
  if (has(s, upgradeId)) return fail(d, 'Você já tem esta melhoria.');
  if (s.level < up.requiredLevel) return fail(d, `Disponível no nível ${up.requiredLevel}.`);
  if (s.coins < up.cost) return fail(d, 'Moedas insuficientes.');
  s.coins -= up.cost;
  s.upgrades.push(upgradeId);
  d.events.push({ type: 'UPGRADE_BOUGHT', upgradeId });
  gainXp(d, 20);
  return true;
}

/** Retira poções do estoque (removendo pilhas vazias). */
export function takePotions(s: GameSave, recipeId: string, qty: number) {
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (!stack || stack.quantity < qty) return false;
  stack.quantity -= qty;
  if (stack.quantity === 0) s.potions = s.potions.filter((p) => p !== stack);
  return true;
}

export function addPotions(s: GameSave, recipeId: string, qty: number) {
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (stack) stack.quantity += qty;
  else s.potions.push({ recipeId, quantity: qty, quality: 1, forSale: true });
}
