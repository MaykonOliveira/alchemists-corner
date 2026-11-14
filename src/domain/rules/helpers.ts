import { INGREDIENTS } from '../data/ingredients';
import { HELPER_IDS } from '../data/upgrades';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Customer, GameSave, HelperWork } from '../models/types';
import { freeCauldron, maxBatches, potionsPerBatch, startBrew } from './alchemy';
import { fail, type Draft } from './context';
import { dismissCustomer, priceVerdict, reservedForOrder, serveCustomer, suits } from './customers';
import { deliverOrder } from './orders';
import { applyPurchase, countIngredients, has, ingredientCapacity, ingredientPrice, potionStock, staffOn, supplierLeft } from './economy';

import { evoRandom, perkCount, staffSpeed } from './evoCore';
import { advanceStaff, EXPLORER } from './staff';
import { SALAMANDER } from './alchemy';

import { tr } from '../../i18n';
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
  staffOn(s, id) && !(id === RAVEN && s.expedition && !s.expedition.byExplorer) && !(id === EXPLORER && s.expedition?.byExplorer);

/** Funcionários novos: gnomo (estufa), coruja (charadas e pedido especial) e bardo (porta). */
export { GNOME } from './economy';
export { BARD } from './customers';
export const OWL = 'coruja-sabia';
/** Coruja: tempo pensando na charada antes de responder (dá a vez ao jogador). */
export const OWL_THINK_MS = 6_000;
/** Golem: clientes especiais (capítulo da história do freguês, visita) esperam mais antes de ele atender. */
export const GOLEM_SPECIAL_DELAY_MS = 9_000;

export function setHelper(d: Draft, upgradeId: string, on: boolean): boolean {
  const s = d.s;
  if (!HELPER_IDS.includes(upgradeId)) return false;
  if (!has(s, upgradeId)) return fail(d, tr('Contrate este ajudante primeiro.'));
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

/** Segunda evolução (mestres da equipe). */
export const GUILD_RAVEN = 'corvo-da-guilda';
export const PRODIGY_APPRENTICE = 'aprendiz-prodigio';
export const CRYSTAL_GOLEM = 'golem-de-cristal';
/** Desconto que o corvo da guilda consegue no fornecedor. */
export const GUILD_DISCOUNT = 0.2;

const ravenFee = (s: GameSave) => (has(s, FAST_RAVEN) ? 0 : RAVEN_FEE);
const apprenticeTarget = (s: GameSave) => (has(s, DEDICATED_APPRENTICE) ? 10 : APPRENTICE_TARGET) + 2 * perkCount(s, APPRENTICE, 'a');
const apprenticeMaxBatches = (s: GameSave) => (has(s, DEDICATED_APPRENTICE) ? 5 : APPRENTICE_MAX_BATCHES) + perkCount(s, APPRENTICE, 'a');
/** Quantos clientes o golem atende antes de descansar as engrenagens. */
const golemPerTurn = (s: GameSave) => (has(s, CRYSTAL_GOLEM) ? 2 : 1);
/** Espera mínima do cliente antes de o golem atender (o golem polido é mais rápido). */
export const golemDelayMs = (s: GameSave) => (has(s, POLISHED_GOLEM) ? 2_500 : GOLEM_DELAY_MS) / staffSpeed(s, GOLEM);
const golemCooldownMs = (s: GameSave) => (has(s, POLISHED_GOLEM) ? 1_200 : GOLEM_COOLDOWN_MS) / staffSpeed(s, GOLEM);

function runRaven(d: Draft, ms: number) {
  const s = d.s;
  s.helpers.ravenInMs -= ms;
  if (s.helpers.ravenInMs > 0) return;
  s.helpers.ravenInMs = (has(s, FAST_RAVEN) ? RAVEN_INTERVAL_MS / 2 : RAVEN_INTERVAL_MS) / staffSpeed(s, RAVEN);
  const items = ravenShoppingList(s);
  if (!items.length) return;
  let cost = 0;
  const fee = ravenFee(s);
  for (const it of items) cost += applyPurchase(s, it.ingredientId, it.qty);
  // Corvo da guilda: conhece o fornecedor e volta com o troco.
  // Bom de troco (carreira): 4% de volta por escolha.
  const discount = (has(s, GUILD_RAVEN) ? GUILD_DISCOUNT : 0) + 0.04 * perkCount(s, RAVEN, 'b');
  if (discount > 0) {
    const back = Math.round(cost * discount);
    s.coins += back;
    s.stats.ingredientCost -= back;
    cost -= back;
  }
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
  // O aprendiz prodígio já mexe como gente grande: o preparo dele sai Fino.
  // Salamandra (E2): acerta o fogo e o ponto, então o preparo da equipe sai Fino.
  // Caprichoso (carreira do aprendiz) e Ponto perfeito (da salamandra) dão chance de subir mais um grau.
  const s = d.s;
  const salamander = staffOn(s, SALAMANDER);
  for (const job of [s.brew, s.brew2]) {
    if (job && job.elapsedMs === 0 && job.hits === undefined) {
      job.byHelper = true;
      let q = has(s, PRODIGY_APPRENTICE) || salamander ? 2 : 1;
      const fussy = perkCount(s, APPRENTICE, 'b');
      if (fussy && evoRandom(s, 500 + d.events.length) < 0.2 * fussy) q += 1;
      if (salamander && evoRandom(s, 600 + d.events.length) < 0.1 + 0.1 * perkCount(s, SALAMANDER, 'b')) q = 3;
      if (q >= 2) job.hits = Math.min(3, q);
    }
  }
  d.s.stats.helperWork.brews += 1;
}

// -------------------------------------------------------------------- golem

/**
 * Clientes que o golem atende: todos, menos a charada do Cliente misterioso (essa é da coruja).
 * Sintomas: com o golem trabalhando a loja reconhece qualquer problema (ver golemReads).
 * Capítulos da história dos fregueses e visitas especiais também, mas ele espera mais: dá a vez a você.
 */
export const golemServes = (_s: GameSave, c: Customer) => !c.mystery;

/** Cliente especial: o golem espera mais antes de atender, para o jogador poder fazer isso. */
const special = (c: Customer) => c.chapter !== undefined || !!c.vip;
export const golemWaitFor = (s: GameSave, c: Customer) => (special(c) ? Math.max(GOLEM_SPECIAL_DELAY_MS, golemDelayMs(s)) : golemDelayMs(s));

/**
 * A poção que o golem entrega: a pedida (ou a do sintoma) se houver; senão uma parecida da mesma
 * família que o cliente aceita, deixando de lado o que está guardado para o pedido especial.
 */
export function golemChoice(s: GameSave, c: Customer): string | null {
  if (!golemServes(s, c)) return null;
  const forSale = s.potions.filter((p) => p.forSale && p.quantity - reservedForOrder(s, p.recipeId) > 0).map((p) => p.recipeId);
  if (forSale.includes(c.wantedRecipeId)) return c.wantedRecipeId;
  // Capítulo da história: o freguês precisa daquela poção, não de uma parecida.
  if (c.chapter !== undefined) return null;
  const similar = forSale.filter((id) => id !== c.wantedRecipeId && suits(c, id));
  if (!similar.length) return null;
  if (c.vip) return similar.sort((a, b) => RECIPES_BY_ID[b].basePrice - RECIPES_BY_ID[a].basePrice)[0];
  const rank = { sim: 0, negocia: 1, nao: 2 } as const;
  return similar.sort((a, b) => rank[priceVerdict(s, c, a)] - rank[priceVerdict(s, c, b)] || RECIPES_BY_ID[b].basePrice - RECIPES_BY_ID[a].basePrice)[0];
}

function runGolem(d: Draft, ms: number) {
  const s = d.s;
  s.helpers.golemInMs = Math.max(0, s.helpers.golemInMs - ms);
  if (s.helpers.golemInMs > 0 || s.phase !== 'expediente') return;
  let done = 0;
  for (const c of [...s.customers]) {
    if (done >= golemPerTurn(s)) break;
    // A charada fica com a coruja (ou com você); quem já está negociando com você, fica com você.
    if (!golemServes(s, c) || c.offer || c.waitedMs < golemWaitFor(s, c)) continue;
    const recipeId = golemChoice(s, c);
    if (!recipeId) {
      if (c.waitedMs < c.patienceMs * GOLEM_DISMISS_AT) continue;
      dismissCustomer(d, c.id);
      d.events.push({ type: 'GOLEM_DISMISSED', customerId: c.id });
      done += 1;
      continue;
    }
    const from = d.events.length;
    serveCustomer(d, c.id, recipeId, { golem: true });
    const sold = d.events.slice(from).filter((e) => e.type === 'SALE');
    for (const e of sold) if (e.type === 'SALE') e.by = 'golem';
    // Charmoso (carreira do golem): gorjeta de 3% por escolha.
    const charm = perkCount(s, GOLEM, 'b');
    if (charm) {
      const tip = sold.reduce((n, e) => n + (e.type === 'SALE' ? Math.round(e.price * 0.03 * charm) : 0), 0);
      if (tip > 0) {
        s.coins += tip;
        s.stats.revenue += tip;
        d.events.push({ type: 'STAFF_TIP', staffId: GOLEM, coins: tip });
      }
    }
    s.stats.helperWork.served += sold.length;
    done += 1;
  }
  if (done) s.helpers.golemInMs = golemCooldownMs(s);
}

// -------------------------------------------------------------------- coruja

/** A coruja decifra a charada (se a poção está na prateleira) e entrega o pedido especial quando ele fica pronto. */
function runOwl(d: Draft) {
  const s = d.s;
  if (s.phase !== 'expediente') return false;
  let busy = false;
  for (const c of [...s.customers]) {
    if (!c.mystery || c.waitedMs < OWL_THINK_MS / staffSpeed(s, OWL)) continue;
    if (!s.potions.some((p) => p.recipeId === c.wantedRecipeId && p.forSale && p.quantity > 0)) continue;
    const from = d.events.length;
    serveCustomer(d, c.id, c.wantedRecipeId);
    for (const e of d.events.slice(from)) if (e.type === 'SALE') e.by = 'coruja';
    s.stats.helperWork.riddles = (s.stats.helperWork.riddles ?? 0) + 1;
    busy = true;
  }
  const o = s.order;
  if (o && potionStock(s, o.recipeId) >= o.qty) {
    const from = d.events.length;
    const bonus = Math.round(o.rewardCoins * 0.1 * perkCount(s, OWL, 'b'));
    if (deliverOrder(d)) {
      for (const e of d.events.slice(from)) if (e.type === 'ORDER_DONE') e.by = 'coruja';
      // Negociadora (carreira da coruja): o pedido rende mais.
      if (bonus > 0) {
        s.coins += bonus;
        s.stats.orderRewards += bonus;
        d.events.push({ type: 'STAFF_TIP', staffId: OWL, coins: bonus });
      }
      s.stats.helperWork.orders = (s.stats.helperWork.orders ?? 0) + 1;
      busy = true;
    }
  }
  return busy;
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
  if (helperActive(s, OWL)) busy = runOwl(d) || busy;
  busy = advanceStaff(d, ms) || busy;
  return busy;
}
