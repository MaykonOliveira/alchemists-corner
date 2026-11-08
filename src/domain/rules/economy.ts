import { INGREDIENTS, INGREDIENTS_BY_ID } from '../data/ingredients';
import { RECIPES_BY_ID } from '../data/recipes';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { GameSave, Ingredient } from '../models/types';
import { fail, type Draft } from './context';
import { masteryStars, STAR_BONUS, talentBonus } from './mastery';
import { gainXp } from './progression';
import { MOON_MARKET_EXTRA, seasonalStock } from './street';

export const PRICE_MIN_FACTOR = 0.8;
export const PRICE_MAX_FACTOR = 1.3;

export const has = (s: GameSave, upgradeId: string) => s.upgrades.includes(upgradeId);

/** Faixa de preço permitida. Cada estrela de maestria sobe o teto junto com o que o cliente aceita pagar. */
export function priceRange(s: GameSave, recipeId: string) {
  const base = RECIPES_BY_ID[recipeId].basePrice;
  const maxFactor = PRICE_MAX_FACTOR + masteryStars(s, recipeId) * STAR_BONUS;
  return { min: Math.max(1, Math.round(base * PRICE_MIN_FACTOR)), max: Math.round(base * maxFactor), base };
}

/** Preço de um ingrediente no fornecedor (com o desconto do talento "Amigo do fornecedor"). */
export const ingredientPrice = (s: GameSave, ingredientId: string) =>
  Math.max(1, Math.round(INGREDIENTS_BY_ID[ingredientId].price * (1 - talentBonus(s, 'fornecedor-amigo'))));

export const getPrice = (s: GameSave, recipeId: string) => s.prices[recipeId] ?? RECIPES_BY_ID[recipeId].basePrice;

export const potionCapacity = (s: GameSave) =>
  16 + (has(s, 'prateleira-extra') ? 12 : 0) + (has(s, 'despensa-encantada') ? 12 : 0);
export const ingredientCapacity = (s: GameSave) =>
  40 + (has(s, 'armario-organizado') ? 30 : 0) + (has(s, 'despensa-encantada') ? 40 : 0);
export const countPotions = (s: GameSave) => s.potions.reduce((n, p) => n + p.quantity, 0);
export const countIngredients = (s: GameSave) => Object.values(s.ingredients).reduce((n, q) => n + q, 0);
export const potionStock = (s: GameSave, recipeId: string) => s.potions.find((p) => p.recipeId === recipeId)?.quantity ?? 0;

/** Salário diário dos ajudantes contratados (mesmo descansando, continuam na folha). */
export const helperWages = (s: GameSave) => s.upgrades.reduce((n, id) => n + (UPGRADES_BY_ID[id]?.upkeep ?? 0), 0);

/** Custo de manutenção cobrado no fechamento (aluguel, lenha, velas e salários). Informado antes de fechar. */
export const maintenanceCost = (s: GameSave) => 10 + 5 * (s.level - 1) + 3 * s.upgrades.length + helperWages(s);

/** Custo dos ingredientes de um lote, pelos preços atuais do fornecedor. */
export const recipeCost = (s: GameSave, recipeId: string) =>
  RECIPES_BY_ID[recipeId].ingredients.reduce((n, i) => n + ingredientPrice(s, i.ingredientId) * i.qty, 0);

/** Estoque de um ingrediente no fornecedor para o dia (0 = indisponível no nível atual). */
export function ingredientStockFor(s: GameSave, i: Ingredient): number | null {
  if (i.season) return seasonalStock(s, i);
  if (s.level < i.supplierLevel) return 0;
  // No Mercado da Lua Cheia os itens raros vêm em maior quantidade.
  return i.dailyStock !== null && s.event === 'lua-cheia' ? i.dailyStock + MOON_MARKET_EXTRA : i.dailyStock;
}

/** Estoque do fornecedor para um novo dia. 0 = indisponível no nível atual. */
export function supplierStock(s: GameSave): Record<string, number | null> {
  return Object.fromEntries(INGREDIENTS.map((i) => [i.id, ingredientStockFor(s, i)]));
}

/** Subiu de nível no meio do dia: o fornecedor já traz hoje o que o nível novo liberou. */
export function restockUnlocked(s: GameSave, level: number) {
  for (const i of INGREDIENTS) if (i.supplierLevel === level) s.supplier[i.id] = ingredientStockFor(s, i);
}

/** Quantas unidades do ingrediente o fornecedor ainda tem hoje (Infinity = sem limite). */
export function supplierLeft(s: GameSave, ingredientId: string) {
  const ing = INGREDIENTS_BY_ID[ingredientId];
  if (!ing || s.level < ing.supplierLevel) return 0;
  const available = s.supplier[ingredientId];
  if (available === undefined) return ing.season || ing.dailyStock !== null ? 0 : Infinity;
  return available === null ? Infinity : available;
}

/** Valida uma compra. Retorna a mensagem de erro ou null se a compra é possível. */
export function purchaseError(s: GameSave, ingredientId: string, qty: number): string | null {
  const ing = INGREDIENTS_BY_ID[ingredientId];
  if (!ing || !Number.isInteger(qty) || qty <= 0) return 'Quantidade inválida.';
  if (s.phase === 'fechamento') return 'O fornecedor já foi embora hoje.';
  if (s.level < ing.supplierLevel) return `${ing.name} só aparece no nível ${ing.supplierLevel}.`;
  const available = supplierLeft(s, ingredientId);
  if (qty > available) return `O fornecedor só tem ${available} hoje.`;
  if (countIngredients(s) + qty > ingredientCapacity(s)) return 'O armário está cheio.';
  if (ingredientPrice(s, ingredientId) * qty > s.coins) return 'Moedas insuficientes.';
  return null;
}

/** Aplica uma compra já validada e devolve o custo. */
export function applyPurchase(s: GameSave, ingredientId: string, qty: number) {
  const cost = ingredientPrice(s, ingredientId) * qty;
  const available = s.supplier[ingredientId];
  s.coins -= cost;
  s.ingredients[ingredientId] = (s.ingredients[ingredientId] ?? 0) + qty;
  if (available !== null && available !== undefined) s.supplier[ingredientId] = available - qty;
  s.stats.ingredientCost += cost;
  return cost;
}

export function buyIngredient(d: Draft, ingredientId: string, qty: number): boolean {
  const err = purchaseError(d.s, ingredientId, qty);
  if (err) return fail(d, err);
  const cost = applyPurchase(d.s, ingredientId, qty);
  d.events.push({ type: 'PURCHASE', ingredientId, qty, cost });
  return true;
}

/** O que falta comprar para preparar `batches` lotes da receita. */
export function missingFor(s: GameSave, recipeId: string, batches: number) {
  const r = RECIPES_BY_ID[recipeId];
  return r.ingredients
    .map((i) => ({ ingredientId: i.ingredientId, qty: Math.max(0, i.qty * batches - (s.ingredients[i.ingredientId] ?? 0)) }))
    .filter((m) => m.qty > 0);
}

/** Custo e possível impedimento de comprar tudo o que falta (null = dá para comprar). */
export function missingPurchase(s: GameSave, recipeId: string, batches: number) {
  const items = missingFor(s, recipeId, batches);
  const cost = items.reduce((n, m) => n + ingredientPrice(s, m.ingredientId) * m.qty, 0);
  const qty = items.reduce((n, m) => n + m.qty, 0);
  let error: string | null = null;
  if (s.phase === 'fechamento') error = 'O fornecedor já foi embora hoje.';
  for (const m of items) {
    if (error) break;
    const ing = INGREDIENTS_BY_ID[m.ingredientId];
    if (s.level < ing.supplierLevel) error = `${ing.name} só aparece no nível ${ing.supplierLevel}.`;
    else if (supplierLeft(s, m.ingredientId) < m.qty) {
      const left = supplierLeft(s, m.ingredientId);
      error = left > 0 ? `O fornecedor só tem ${left} ${ing.name} hoje.` : `O fornecedor está sem ${ing.name} hoje.`;
    }
  }
  if (!error && countIngredients(s) + qty > ingredientCapacity(s)) error = 'O armário está cheio.';
  if (!error && cost > s.coins) error = `Faltam ${cost - s.coins} moedas.`;
  return { items, cost, error };
}

/** Compra de uma vez tudo o que falta para a receita (ou nada, se algo impedir). */
export function buyMissing(d: Draft, recipeId: string, batches: number): boolean {
  if (!RECIPES_BY_ID[recipeId] || !Number.isInteger(batches) || batches < 1) return fail(d, 'Quantidade inválida.');
  const { items, error } = missingPurchase(d.s, recipeId, batches);
  if (!items.length) return fail(d, 'Você já tem tudo para esta receita.');
  if (error) return fail(d, error);
  for (const m of items) {
    const cost = applyPurchase(d.s, m.ingredientId, m.qty);
    d.events.push({ type: 'PURCHASE', ingredientId: m.ingredientId, qty: m.qty, cost });
  }
  return true;
}

export function setPrice(d: Draft, recipeId: string, price: number): boolean {
  if (!RECIPES_BY_ID[recipeId]) return false;
  const { min, max } = priceRange(d.s, recipeId);
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
  if (up.requires && !has(s, up.requires)) return fail(d, `Compre antes: ${UPGRADES_BY_ID[up.requires].name}.`);
  if (s.coins < up.cost) return fail(d, 'Moedas insuficientes.');
  s.coins -= up.cost;
  s.upgrades.push(upgradeId);
  // Ajudante recém-contratado começa a trabalhar logo.
  if (upgradeId === 'corvo-entregador') s.helpers.ravenInMs = Math.min(s.helpers.ravenInMs, 1500);
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

/** Colheita da estufa no começo do dia (só o que couber no armário). */
export const GREENHOUSE_YIELD: { ingredientId: string; qty: number }[] = [
  { ingredientId: 'folha-lunar', qty: 4 },
  { ingredientId: 'hortela-brava', qty: 4 },
  { ingredientId: 'raiz-mandragora', qty: 2 },
];

export function harvestGreenhouse(d: Draft) {
  const s = d.s;
  if (!has(s, 'estufa')) return;
  let room = ingredientCapacity(s) - countIngredients(s);
  const items: { ingredientId: string; qty: number }[] = [];
  for (const it of GREENHOUSE_YIELD) {
    const qty = Math.min(it.qty, room);
    if (qty <= 0) break;
    s.ingredients[it.ingredientId] = (s.ingredients[it.ingredientId] ?? 0) + qty;
    room -= qty;
    items.push({ ingredientId: it.ingredientId, qty });
  }
  if (items.length) d.events.push({ type: 'GREENHOUSE_HARVEST', items });
}

export function addPotions(s: GameSave, recipeId: string, qty: number) {
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (stack) stack.quantity += qty;
  else s.potions.push({ recipeId, quantity: qty, quality: 1, forSale: true });
}
