import { ORDER_CLIENTS, ROYAL_CLIENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import { fail, nextId, pick, type Draft } from './context';
import { potionStock, takePotions } from './economy';
import { talentBonus } from './mastery';
import { gainReputation, gainXp } from './progression';

/** Cria um pedido especial se não houver nenhum ativo (a partir do dia 2). */
export function maybeCreateOrder(d: Draft) {
  const { s, ctx } = d;
  if (s.order || s.day < 2) return;
  const recipeId = pick(s.knownRecipes, ctx.random);
  const r = RECIPES_BY_ID[recipeId];
  const qty = 2 + Math.floor(ctx.random() * 3) + Math.floor(s.level / 3);
  const royal = s.level >= 10 && r.basePrice >= 50 && ctx.random() < 0.5;
  const tpl = pick(royal ? ROYAL_CLIENTS : ORDER_CLIENTS, ctx.random);
  s.order = {
    id: nextId(d, 'o'),
    client: tpl.client,
    text: tpl.text,
    recipeId,
    qty,
    rewardCoins: Math.round(r.basePrice * qty * 1.6 * (royal ? 1.25 : 1) * (1 + talentBonus(s, 'contatos'))),
    rewardRep: 3 + Math.floor(qty / 2),
    rewardXp: 25 + qty * 6,
    dueDay: s.day + 2,
  };
  d.events.push({ type: 'ORDER_NEW', orderId: s.order.id });
}

export function deliverOrder(d: Draft): boolean {
  const s = d.s;
  const o = s.order;
  if (!o) return fail(d, 'Não há pedido ativo.');
  if (s.phase === 'fechamento') return fail(d, 'Entregue amanhã cedo.');
  if (potionStock(s, o.recipeId) < o.qty) return fail(d, `Você precisa de ${o.qty} unidades.`);
  takePotions(s, o.recipeId, o.qty);
  s.coins += o.rewardCoins;
  s.stats.orderRewards += o.rewardCoins;
  s.stats.ordersDone += 1;
  gainReputation(d, o.rewardRep);
  s.order = null;
  d.events.push({ type: 'ORDER_DONE', orderId: o.id, coins: o.rewardCoins });
  gainXp(d, o.rewardXp);
  return true;
}

export function expireOrder(d: Draft) {
  const o = d.s.order;
  if (o && d.s.day > o.dueDay) {
    d.s.order = null;
    d.events.push({ type: 'ORDER_EXPIRED', orderId: o.id });
  }
}
