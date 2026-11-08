import { INGREDIENTS_BY_ID } from '../data/ingredients';
import { CONTRACT_CLIENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Contract, GameSave } from '../models/types';
import { fail, nextId, pick, type Draft } from './context';
import { has, ingredientCapacity, countIngredients, potionStock, takePotions } from './economy';
import { talentBonus } from './mastery';
import { findPage } from './legends';
import { gainReputation, gainXp } from './progression';

/** Nível a partir do qual a loja recebe contratos de vários dias. */
export const CONTRACT_LEVEL = 6;
/** Dias para entregar depois de aceitar. */
export const CONTRACT_DAYS = 3;
/** A partir deste nível, contratos também rendem 1 Selo de Mestre. */
export const CONTRACT_SEAL_LEVEL = 12;
/** Reputação perdida quando um contrato aceito vence sem ser cumprido. */
export const CONTRACT_FAIL_REP = 5;

export const contractTotal = (c: Contract) => c.items.reduce((n, i) => n + i.qty, 0);
export const contractDelivered = (c: Contract) => c.items.reduce((n, i) => n + i.delivered, 0);

/** Monta uma oferta de contrato com 2 receitas (3 a partir do nível 11) entre as conhecidas. */
export function makeContract(d: Draft): Contract {
  const { s, ctx } = d;
  const pool = [...s.knownRecipes].sort((a, b) => RECIPES_BY_ID[b].basePrice - RECIPES_BY_ID[a].basePrice);
  const top = pool.slice(0, Math.max(3, Math.ceil(pool.length * 0.6)));
  const kinds = Math.min(top.length, s.level >= 11 ? 3 : 2);
  const chosen: string[] = [];
  while (chosen.length < kinds) {
    const id = pick(top.filter((x) => !chosen.includes(x)), ctx.random);
    chosen.push(id);
  }
  const items = chosen.map((recipeId) => ({ recipeId, qty: 4 + Math.floor(s.level / 3) + Math.floor(ctx.random() * 4), delivered: 0 }));
  const value = items.reduce((n, i) => n + RECIPES_BY_ID[i.recipeId].basePrice * i.qty, 0);
  const tower = has(s, 'torre-alquimista') ? 1.25 : 1;
  // Baú de ingredientes raros: os ingredientes mais caros das receitas pedidas.
  const rare = [...new Set(items.flatMap((i) => RECIPES_BY_ID[i.recipeId].ingredients.map((x) => x.ingredientId)))]
    .sort((a, b) => INGREDIENTS_BY_ID[b].price - INGREDIENTS_BY_ID[a].price)
    .slice(0, 2);
  const tpl = pick(CONTRACT_CLIENTS, ctx.random);
  return {
    id: nextId(d, 'k'),
    client: tpl.client,
    text: tpl.text,
    items,
    rewardCoins: Math.round(value * 2.2 * tower * (1 + talentBonus(s, 'contatos'))),
    rewardRep: 6 + kinds * 2,
    rewardXp: 60 + contractTotalOf(items) * 5,
    rewardIngredients: rare.map((ingredientId) => ({ ingredientId, qty: 4 })),
    rewardSeal: s.level >= CONTRACT_SEAL_LEVEL,
    dueDay: s.day + 1,
    accepted: false,
  };
}

const contractTotalOf = (items: Contract['items']) => items.reduce((n, i) => n + i.qty, 0);

/** Na virada do dia: vence contratos e, se for a hora, oferece um novo. */
export function updateContracts(d: Draft) {
  const s = d.s;
  const c = s.contract;
  if (c && s.day > c.dueDay) {
    if (c.accepted) {
      // O cliente paga pelo que já recebeu (metade do valor proporcional) e a reputação cai.
      const share = contractDelivered(c) / contractTotal(c);
      const coins = Math.round(c.rewardCoins * share * 0.5);
      s.coins += coins;
      s.reputation = Math.max(0, s.reputation - CONTRACT_FAIL_REP);
      d.events.push({ type: 'CONTRACT_FAILED', contractId: c.id, coins });
    }
    s.contract = null;
    s.nextContractDay = s.day + 1;
  }
  if (!s.contract && s.level >= CONTRACT_LEVEL && s.day >= s.nextContractDay) {
    s.contract = makeContract(d);
    d.events.push({ type: 'CONTRACT_OFFERED', contractId: s.contract.id });
  }
}

export function acceptContract(d: Draft): boolean {
  const s = d.s;
  const c = s.contract;
  if (!c) return fail(d, 'Não há contrato no quadro.');
  if (c.accepted) return false;
  c.accepted = true;
  c.dueDay = s.day + CONTRACT_DAYS;
  d.events.push({ type: 'CONTRACT_ACCEPTED', contractId: c.id });
  return true;
}

export function declineContract(d: Draft): boolean {
  const s = d.s;
  const c = s.contract;
  if (!c) return false;
  if (c.accepted) return fail(d, 'Contrato aceito não pode ser recusado. Entregue até o prazo.');
  s.contract = null;
  s.nextContractDay = s.day + 2;
  return true;
}

/** Entrega o que houver no estoque. Ao completar todas as linhas, paga a recompensa. */
export function deliverContract(d: Draft): boolean {
  const s = d.s;
  const c = s.contract;
  if (!c?.accepted) return fail(d, 'Aceite o contrato antes de entregar.');
  if (s.phase === 'fechamento') return fail(d, 'Entregue amanhã cedo.');
  let delivered = 0;
  for (const it of c.items) {
    const n = Math.min(it.qty - it.delivered, potionStock(s, it.recipeId));
    if (n <= 0) continue;
    takePotions(s, it.recipeId, n);
    it.delivered += n;
    delivered += n;
  }
  if (delivered === 0) return fail(d, 'Nenhuma poção do contrato no estoque.');
  if (contractDelivered(c) < contractTotal(c)) {
    d.events.push({ type: 'CONTRACT_PROGRESS', contractId: c.id, delivered });
    return true;
  }
  completeContract(d, c);
  return true;
}

function completeContract(d: Draft, c: Contract) {
  const s = d.s;
  s.coins += c.rewardCoins;
  s.stats.orderRewards += c.rewardCoins;
  for (const it of c.rewardIngredients) {
    const room = Math.max(0, ingredientCapacity(s) - countIngredients(s));
    const qty = Math.min(it.qty, room);
    if (qty > 0) s.ingredients[it.ingredientId] = (s.ingredients[it.ingredientId] ?? 0) + qty;
  }
  if (c.rewardSeal) s.contractSeals += 1;
  s.contractsDone += 1;
  s.contract = null;
  s.nextContractDay = s.day + 2;
  gainReputation(d, c.rewardRep);
  d.events.push({ type: 'CONTRACT_DONE', contractId: c.id, coins: c.rewardCoins, seal: c.rewardSeal });
  findPage(d, 'o cliente do contrato');
  gainXp(d, c.rewardXp);
}

/** Quanto do contrato dá para entregar agora (para a interface). */
export const contractReady = (s: GameSave) =>
  s.contract?.accepted ? s.contract.items.reduce((n, i) => n + Math.min(i.qty - i.delivered, potionStock(s, i.recipeId)), 0) : 0;
