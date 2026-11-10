// Pacote M: presente para um amigo e desafio da semana. Tudo funciona sem servidor.
import { INGREDIENTS } from '../data/ingredients';
import type { GameSave } from '../models/types';
import { fail, type Draft, type RuleContext } from './context';
import { grantCrystals, grantItem } from './entitlements';
import { dateKey, realWeek } from './retention';
import { addIngredients } from './street';

import { tr } from '../../i18n';
// --------------------------------------------------------------- presentes

/** Conteúdo de um código de presente (o texto do código fica em src/features/share/giftCode.ts). */
export interface GiftPayload {
  /** Nome da loja que mandou. */
  from: string;
  /** Identificador da partida que mandou (para ninguém resgatar o próprio presente). */
  sender: number;
  /** Id único do presente. */
  id: string;
}

export const GIFT_CRYSTALS = 5;

/** O que um presente dá para quem recebe: ingredientes que a loja dele já consegue usar. */
export function giftContents(s: GameSave) {
  const usable = INGREDIENTS.filter((i) => !i.season && i.supplierLevel <= Math.max(2, s.level) && i.rarity !== 'comum');
  const items = usable.slice(-3).map((i) => ({ ingredientId: i.id, qty: 3 }));
  return { items, crystals: GIFT_CRYSTALS };
}

export const canSendGift = (s: GameSave, now: number) => s.giftSentDate !== dateKey(now);

/** Mandar um presente (uma vez por dia real). O primeiro dá o quadro "Laço da amizade". */
export function sendGift(d: Draft): boolean {
  const s = d.s;
  if (!canSendGift(s, d.ctx.now)) return fail(d, tr('Você já mandou um presente hoje. Amanhã tem mais.'));
  s.giftSentDate = dateKey(d.ctx.now);
  s.giftsSent += 1;
  const first = grantItem(d, 'quadro-amizade', 'presente');
  d.events.push({ type: 'GIFT_SENT', first });
  return true;
}

export function redeemGift(d: Draft, gift: GiftPayload): boolean {
  const s = d.s;
  if (!gift || typeof gift.id !== 'string' || typeof gift.sender !== 'number') return fail(d, tr('Esse código de presente não é válido.'));
  if (gift.sender === s.createdAt) return fail(d, tr('Esse presente foi mandado por esta mesma loja. Mande para um amigo!'));
  if (s.giftsRedeemed.includes(gift.id)) return fail(d, tr('Esse presente já foi aberto.'));
  const { items, crystals } = giftContents(s);
  addIngredients(s, items);
  s.giftsRedeemed = [...s.giftsRedeemed, gift.id].slice(-50);
  d.events.push({ type: 'GIFT_REDEEMED', from: String(gift.from ?? tr('Uma loja amiga')).slice(0, 40), crystals, items });
  grantCrystals(d, crystals, 'presente');
  return true;
}

// --------------------------------------------------------- desafio da semana

/** Semente da semana: igual para todos os jogadores. */
export const challengeSeed = (week: number) => (Math.imul(week + 1, 2654435761) ^ 0x5eed) >>> 0;

export const challengeAvailable = (s: GameSave, now: number) => !s.challenge?.active && s.challengeBest?.week !== realWeek(now) && s.level >= 2;

export function startChallenge(d: Draft): boolean {
  const s = d.s;
  if (s.phase !== 'preparacao') return fail(d, tr('O desafio começa na preparação, antes de abrir a loja.'));
  if (s.level < 2) return fail(d, tr('O desafio da semana abre no nível 2.'));
  const week = realWeek(d.ctx.now);
  if (s.challengeBest?.week === week) return fail(d, tr('Você já jogou o desafio desta semana. Volte na próxima!'));
  s.challenge = { week, active: true, rng: challengeSeed(week), score: null };
  d.events.push({ type: 'CHALLENGE_STARTED', week });
  return true;
}

/** Durante o desafio, o sorteio dos clientes usa a semente da semana (guardada no save). */
export function challengeContext(s: GameSave, ctx: RuleContext): RuleContext {
  const ch = s.challenge;
  if (!ch?.active) return ctx;
  return {
    now: ctx.now,
    random: () => {
      ch.rng = (ch.rng + 0x6d2b79f5) >>> 0;
      let t = ch.rng;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Pontuação do dia de desafio: atendimento, faturamento e pedidos, com desconto para quem foi embora. */
export const challengeScore = (st: GameSave['stats']) => Math.max(0, Math.round(st.served * 10 + st.revenue + st.ordersDone * 50 - st.lost * 5));

export function finishChallenge(d: Draft) {
  const s = d.s;
  const ch = s.challenge;
  if (!ch?.active) return;
  const score = challengeScore(s.stats);
  const best = !s.challengeBest || s.challengeBest.week !== ch.week || score > s.challengeBest.score;
  s.challenge = { ...ch, active: false, score };
  if (best) s.challengeBest = { week: ch.week, score };
  d.events.push({ type: 'CHALLENGE_DONE', week: ch.week, score, best });
  grantCrystals(d, 3, 'desafio');
}
