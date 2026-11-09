import { INGREDIENTS } from '../data/ingredients';
import { HELPER_IDS } from '../data/upgrades';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Customer, GameSave, HelperWork } from '../models/types';
import { freeCauldron, maxBatches, potionsPerBatch, startBrew } from './alchemy';
import { fail, type Draft } from './context';
import { dismissCustomer, serveCustomer } from './customers';
import { applyPurchase, countIngredients, has, ingredientCapacity, ingredientPrice, potionStock, supplierLeft } from './economy';

// ---------------------------------------------------------------------------
// Ajudantes automáticos (melhorias da categoria 'ajudante').
// Cada um automatiza uma parte do trabalho usando exatamente as mesmas regras
// que o jogador usa: comprar no fornecedor, preparar no caldeirão e atender.
// ---------------------------------------------------------------------------

export const RAVEN = 'corvo-entregador';
export const APPRENTICE = 'aprendiz';
export const GOLEM = 'golem-balconista';

/** Corvo: intervalo entre conferências do armário (30 s reais ≈ 1 hora de jogo). */
export const RAVEN_INTERVAL_MS = 30_000;
/** Taxa por viagem (petiscos do corvo). */
export const RAVEN_FEE = 3;
/** O corvo nunca gasta as últimas moedas do caixa. */
export const RAVEN_RESERVE = 40;
/** Quantos lotes de cada receita conhecida o corvo tenta manter no armário. */
export const RAVEN_BATCHES = 2;

/** Aprendiz: estoque-alvo por receita e lotes máximos por preparo. */
export const APPRENTICE_TARGET = 6;
export const APPRENTICE_MAX_BATCHES = 3;

/** Golem: espera mínima do cliente (dá a vez ao jogador) e intervalo entre atendimentos. */
export const GOLEM_DELAY_MS = 4_000;
export const GOLEM_COOLDOWN_MS = 2_500;
/** Sem a poção certa, o golem dispensa quando o cliente já gastou esta fração da paciência. */
export const GOLEM_DISMISS_AT = 0.6;

export const emptyHelperWork = (): HelperWork => ({ brews: 0, served: 0, deliveries: 0, delivered: 0 });

/** Ajudante contratado e trabalhando (não está descansando). */
export const helperActive = (s: GameSave, id: string) =>
  has(s, id) && !s.helpers.off.includes(id) && !(id === RAVEN && s.expedition);

export function setHelper(d: Draft, upgradeId: string, on: boolean): boolean {
  const s = d.s;
  if (!HELPER_IDS.includes(upgradeId)) return false;
  if (!has(s, upgradeId)) return fail(d, 'Contrate este ajudante primeiro.');
  const isOn = !s.helpers.off.includes(upgradeId);
  if (isOn === on) return false;
  s.helpers.off = on ? s.helpers.off.filter((id) => id !== upgradeId) : [...s.helpers.off, upgradeId];
  if (on && upgradeId === RAVEN) s.helpers.ravenInMs = Math.min(s.helpers.ravenInMs, 1500);
  d.events.push({ type: 'HELPER_TOGGLED', upgradeId, on });
  return true;
}

// ------------------------------------------------------------------- corvo

/** Quanto de cada ingrediente o corvo quer no armário: RAVEN_BATCHES lotes de cada receita conhecida. */
export function ravenTargets(s: GameSave): Record<string, number> {
  const t: Record<string, number> = {};
  for (const id of s.knownRecipes) {
    for (const i of RECIPES_BY_ID[id].ingredients) t[i.ingredientId] = (t[i.ingredientId] ?? 0) + i.qty * RAVEN_BATCHES;
  }
  return t;
}

/** Lista de compras do corvo. Vazia quando nada está acabando (menos da metade do alvo). */
export function ravenShoppingList(s: GameSave): { ingredientId: string; qty: number }[] {
  const targets = ravenTargets(s);
  const low = Object.entries(targets).some(([id, t]) => (s.ingredients[id] ?? 0) < Math.ceil(t / 2) && supplierLeft(s, id) > 0);
  if (!low) return [];
  let budget = s.coins - RAVEN_RESERVE - RAVEN_FEE;
  let room = ingredientCapacity(s) - countIngredients(s);
  const items: { ingredientId: string; qty: number }[] = [];
  for (const ing of INGREDIENTS) {
    const need = (targets[ing.id] ?? 0) - (s.ingredients[ing.id] ?? 0);
    if (need <= 0) continue;
    const price = ingredientPrice(s, ing.id);
    const qty = Math.min(need, supplierLeft(s, ing.id), room, Math.floor(budget / price));
    if (qty <= 0) continue;
    items.push({ ingredientId: ing.id, qty });
    budget -= qty * price;
    room -= qty;
  }
  return items;
}

/** Treino da equipe (pacote X): versões evoluídas dos ajudantes. */
export const FAST_RAVEN = 'corvo-veloz';
export const DEDICATED_APPRENTICE = 'aprendiz-dedicado';
export const POLISHED_GOLEM = 'golem-polido';

const ravenFee = (s: GameSave) => (has(s, FAST_RAVEN) ? 0 : RAVEN_FEE);
const apprenticeTarget = (s: GameSave) => (has(s, DEDICATED_APPRENTICE) ? 10 : APPRENTICE_TARGET);
const apprenticeMaxBatches = (s: GameSave) => (has(s, DEDICATED_APPRENTICE) ? 5 : APPRENTICE_MAX_BATCHES);
/** Espera mínima do cliente antes de o golem atender (o golem polido é mais rápido). */
export const golemDelayMs = (s: GameSave) => (has(s, POLISHED_GOLEM) ? 2_500 : GOLEM_DELAY_MS);
const golemCooldownMs = (s: GameSave) => (has(s, POLISHED_GOLEM) ? 1_200 : GOLEM_COOLDOWN_MS);

function runRaven(d: Draft, ms: number) {
  const s = d.s;
  s.helpers.ravenInMs -= ms;
  if (s.helpers.ravenInMs > 0) return;
  s.helpers.ravenInMs = has(s, FAST_RAVEN) ? RAVEN_INTERVAL_MS / 2 : RAVEN_INTERVAL_MS;
  const items = ravenShoppingList(s);
  if (!items.length) return;
  let cost = 0;
  const fee = ravenFee(s);
  for (const it of items) cost += applyPurchase(s, it.ingredientId, it.qty);
  s.coins -= fee;
  s.stats.ingredientCost += fee;
  s.stats.helperWork.deliveries += 1;
  s.stats.helperWork.delivered += items.reduce((n, it) => n + it.qty, 0);
  d.events.push({ type: 'RAVEN_DELIVERY', items, cost: cost + fee, fee });
}

// ----------------------------------------------------------------- aprendiz

/** O que o aprendiz prepararia agora (ou null). Pedido especial pendente tem prioridade. */
export function apprenticePlan(s: GameSave): { recipeId: string; batches: number } | null {
  if (!freeCauldron(s) || s.phase === 'fechamento') return null;
  const order = s.order;
  const plans = s.knownRecipes
    .map((id) => {
      const target = order?.recipeId === id ? Math.max(apprenticeTarget(s), order.qty + 2) : apprenticeTarget(s);
      return { id, target, stock: potionStock(s, id), max: maxBatches(s, id), priority: order?.recipeId === id && potionStock(s, id) < order.qty };
    })
    .filter((p) => p.stock < p.target && p.max > 0)
    .sort((a, b) =>
      Number(b.priority) - Number(a.priority) ||
      a.stock / a.target - b.stock / b.target ||
      RECIPES_BY_ID[b.id].basePrice - RECIPES_BY_ID[a.id].basePrice);
  const p = plans[0];
  if (!p) return null;
  const batches = Math.min(p.max, apprenticeMaxBatches(s), Math.ceil((p.target - p.stock) / potionsPerBatch(s)));
  return { recipeId: p.id, batches };
}

function runApprentice(d: Draft) {
  const plan = apprenticePlan(d.s);
  if (!plan) return;
  const from = d.events.length;
  if (!startBrew(d, plan.recipeId, plan.batches)) return;
  for (const e of d.events.slice(from)) if (e.type === 'BREW_STARTED') e.by = 'aprendiz';
  // O aprendiz não tem o toque de mestre: o preparo dele sai Comum.
  for (const job of [d.s.brew, d.s.brew2]) if (job && job.elapsedMs === 0 && job.hits === undefined) job.byHelper = true;
  d.s.stats.helperWork.brews += 1;
}

// -------------------------------------------------------------------- golem

/**
 * Clientes que o golem atende: só quem pede uma poção pelo nome.
 * Charadas, sintomas, fregueses fiéis e visitas especiais ficam para o jogador.
 */
export const golemServes = (c: Customer) => !c.mystery && !c.symptom && !c.regularId && !c.vip;

/** A poção que o golem entrega: exatamente a pedida (ele não sugere trocas), ou null. */
export function golemChoice(s: GameSave, c: Customer): string | null {
  if (!golemServes(c)) return null;
  const stack = s.potions.find((p) => p.recipeId === c.wantedRecipeId && p.forSale && p.quantity > 0);
  return stack ? stack.recipeId : null;
}

function runGolem(d: Draft, ms: number) {
  const s = d.s;
  s.helpers.golemInMs = Math.max(0, s.helpers.golemInMs - ms);
  if (s.helpers.golemInMs > 0 || s.phase !== 'expediente') return;
  for (const c of s.customers) {
    // Quem não é do golem (charada, sintoma, freguês, visita) ou já está negociando com você, fica com você.
    if (!golemServes(c) || c.offer || c.waitedMs < golemDelayMs(s)) continue;
    const from = d.events.length;
    {
      const recipeId = golemChoice(s, c);
      if (!recipeId) {
        if (c.waitedMs < c.patienceMs * GOLEM_DISMISS_AT) continue;
        dismissCustomer(d, c.id);
        d.events.push({ type: 'GOLEM_DISMISSED', customerId: c.id });
        s.helpers.golemInMs = golemCooldownMs(s);
        return;
      }
      serveCustomer(d, c.id, recipeId, { basePrice: true });
    }
    const sold = d.events.slice(from).filter((e) => e.type === 'SALE');
    for (const e of sold) if (e.type === 'SALE') e.by = 'golem';
    s.stats.helperWork.served += sold.length;
    s.helpers.golemInMs = golemCooldownMs(s);
    return;
  }
}

/** Avança os ajudantes. Retorna true se algum está trabalhando (o estado mudou). */
export function advanceHelpers(d: Draft, ms: number): boolean {
  const s = d.s;
  if (s.phase === 'fechamento') return false;
  let busy = false;
  if (helperActive(s, RAVEN)) {
    runRaven(d, ms);
    busy = true;
  }
  if (helperActive(s, APPRENTICE)) {
    const before = [s.brew, s.brew2];
    runApprentice(d);
    busy ||= before[0] !== s.brew || before[1] !== s.brew2;
  }
  if (helperActive(s, GOLEM) && s.phase === 'expediente') {
    runGolem(d, ms);
    busy = true;
  }
  return busy;
}
