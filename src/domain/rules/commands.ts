import type { GameEvent, GameSave, Settings } from '../models/types';
import { experiment, repeatBrew, startBrew } from './alchemy';
import type { Draft, RuleContext } from './context';
import { acceptOffer, declineOffer, dismissCustomer, serveCustomer } from './customers';
import { advance, closeDay, openShop, startNextDay } from './day';
import { buyIngredient, buyMissing, buyUpgrade, setForSale, setPrice } from './economy';
import { acceptContract, declineContract, deliverContract } from './contracts';
import { setHelper } from './helpers';
import { checkAchievements, petCat } from './world';
import { deliverOrder } from './orders';
import { buySeal, learnTalentCmd } from './progression';
import { sponsorFestival } from './day';
import { sendExpedition } from './street';
import { claimChest, trackGoals } from './goals';
import { buyDecor, placeDecor } from './entitlements';
import { claimVisitGift, rewardFromEvents, sessionStart } from './retention';
import { challengeContext, redeemGift, sendGift, startChallenge, type GiftPayload } from './social';
import { AWNINGS } from '../data/catalog';
import { checkRoyalInvite, deliverRoyal, seeRoyal } from './royal';
import { buildVillage } from './village';
import { stir } from './quality';

/**
 * Comandos tipados que alteram o estado canônico da partida.
 * React e Phaser enviam estes comandos; nenhum dos dois altera o save diretamente.
 */
export type DomainCommand =
  | { type: 'BUY_INGREDIENT'; ingredientId: string; qty: number }
  | { type: 'START_BREW'; recipeId: string; batches: number }
  | { type: 'REPEAT_BREW' }
  | { type: 'BUY_MISSING'; recipeId: string; batches: number }
  | { type: 'SET_PRICE'; recipeId: string; price: number }
  | { type: 'SET_FOR_SALE'; recipeId: string; forSale: boolean }
  | { type: 'OPEN_SHOP' }
  | { type: 'CLOSE_SHOP' }
  | { type: 'START_NEXT_DAY' }
  | { type: 'ADVANCE'; ms: number }
  | { type: 'SERVE_CUSTOMER'; customerId: string; recipeId: string; price?: number }
  | { type: 'ACCEPT_OFFER'; customerId: string }
  | { type: 'DECLINE_OFFER'; customerId: string }
  | { type: 'DISMISS_CUSTOMER'; customerId: string }
  | { type: 'DELIVER_ORDER' }
  | { type: 'ACCEPT_CONTRACT' }
  | { type: 'DECLINE_CONTRACT' }
  | { type: 'DELIVER_CONTRACT' }
  | { type: 'PET_CAT' }
  | { type: 'SEND_EXPEDITION'; dest: string }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'SET_HELPER'; upgradeId: string; on: boolean }
  | { type: 'EXPERIMENT'; ingredientIds: string[] }
  | { type: 'LEARN_TALENT'; talentId: string }
  | { type: 'BUY_SEAL' }
  | { type: 'SPONSOR_FESTIVAL' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_TUTORIAL'; step: number }
  | { type: 'CLAIM_CHEST' }
  | { type: 'SEE_TIP'; tipId: string }
  | { type: 'SEE_STORY' }
  | { type: 'SET_SHOP'; name: string; awning: string }
  | { type: 'SESSION_START' }
  | { type: 'DISMISS_AWAY' }
  | { type: 'CLAIM_VISIT_GIFT' }
  | { type: 'BUY_DECOR'; itemId: string }
  | { type: 'PLACE_DECOR'; itemId: string }
  | { type: 'SEND_GIFT' }
  | { type: 'REDEEM_GIFT'; gift: GiftPayload }
  | { type: 'START_CHALLENGE' }
  | { type: 'DELIVER_ROYAL' }
  | { type: 'SEE_ROYAL' }
  | { type: 'BUILD_VILLAGE'; projectId: string }
  | { type: 'STIR'; slot: 1 | 2; hits: number };

export interface CommandResult {
  save: GameSave;
  events: GameEvent[];
}

const defaultCtx = (): RuleContext => ({ now: Date.now(), random: Math.random });

/** Aplica um comando. Função pura: o save recebido nunca é alterado. */
export function applyCommand(save: GameSave, cmd: DomainCommand, ctx: RuleContext = defaultCtx()): CommandResult {
  const d: Draft = { s: structuredClone(save), events: [], ctx };
  // No desafio da semana, os sorteios usam a semente da semana (igual para todos).
  d.ctx = challengeContext(d.s, ctx);
  const changed = run(d, cmd);
  if (!changed) return { save, events: d.events };
  trackGoals(d, 0);
  checkRoyalInvite(d);
  checkAchievements(d);
  rewardFromEvents(d, [...d.events]);
  d.s.updatedAt = ctx.now;
  return { save: d.s, events: d.events };
}

function run(d: Draft, cmd: DomainCommand): boolean {
  switch (cmd.type) {
    case 'BUY_INGREDIENT': return buyIngredient(d, cmd.ingredientId, cmd.qty);
    case 'START_BREW': return startBrew(d, cmd.recipeId, cmd.batches);
    case 'REPEAT_BREW': return repeatBrew(d);
    case 'BUY_MISSING': return buyMissing(d, cmd.recipeId, cmd.batches);
    case 'SET_PRICE': return setPrice(d, cmd.recipeId, cmd.price);
    case 'SET_FOR_SALE': return setForSale(d, cmd.recipeId, cmd.forSale);
    case 'OPEN_SHOP': return openShop(d);
    case 'CLOSE_SHOP': return closeDay(d);
    case 'START_NEXT_DAY': return startNextDay(d);
    case 'ADVANCE': return advance(d, cmd.ms);
    case 'SERVE_CUSTOMER': return serveCustomer(d, cmd.customerId, cmd.recipeId, cmd.price !== undefined ? { price: cmd.price } : {});
    case 'ACCEPT_OFFER': return acceptOffer(d, cmd.customerId);
    case 'DECLINE_OFFER': return declineOffer(d, cmd.customerId);
    case 'DISMISS_CUSTOMER': return dismissCustomer(d, cmd.customerId);
    case 'DELIVER_ORDER': return deliverOrder(d);
    case 'ACCEPT_CONTRACT': return acceptContract(d);
    case 'DECLINE_CONTRACT': return declineContract(d);
    case 'DELIVER_CONTRACT': return deliverContract(d);
    case 'PET_CAT': return petCat(d);
    case 'SEND_EXPEDITION': return sendExpedition(d, cmd.dest);
    case 'BUY_UPGRADE': return buyUpgrade(d, cmd.upgradeId);
    case 'SET_HELPER': return setHelper(d, cmd.upgradeId, cmd.on);
    case 'EXPERIMENT': return experiment(d, cmd.ingredientIds);
    case 'LEARN_TALENT': return learnTalentCmd(d, cmd.talentId);
    case 'BUY_SEAL': return buySeal(d);
    case 'SPONSOR_FESTIVAL': return sponsorFestival(d);
    case 'SET_SETTINGS':
      d.s.settings = { ...d.s.settings, ...cmd.settings };
      return true;
    case 'SET_TUTORIAL':
      if (d.s.tutorialStep === cmd.step) return false;
      d.s.tutorialStep = cmd.step;
      return true;
    case 'CLAIM_CHEST': return claimChest(d);
    case 'SEE_TIP':
      if (d.s.tipsSeen.includes(cmd.tipId)) return false;
      d.s.tipsSeen = [...d.s.tipsSeen, cmd.tipId];
      // Telas novas visitadas também ficam nesta lista, mas não contam como a dica do dia.
      if (!cmd.tipId.includes(':')) d.s.tipDay = d.s.day;
      return true;
    case 'SEE_STORY':
      if (d.s.storySeen) return false;
      d.s.storySeen = true;
      return true;
    case 'SET_SHOP': {
      const name = cmd.name.replace(/\s+/g, ' ').trim().slice(0, 28);
      if (!name) return false;
      d.s.shopName = name;
      if (AWNINGS.some((a) => a.id === cmd.awning)) {
        if (!d.s.owned.includes(cmd.awning)) d.s.owned = [...d.s.owned, cmd.awning];
        d.s.awning = cmd.awning;
        d.s.decor = { ...d.s.decor, toldo: cmd.awning };
      }
      return true;
    }
    case 'SESSION_START': return sessionStart(d);
    case 'DISMISS_AWAY':
      if (!d.s.away) return false;
      d.s.away = null;
      return true;
    case 'CLAIM_VISIT_GIFT': return claimVisitGift(d);
    case 'BUY_DECOR': return buyDecor(d, cmd.itemId);
    case 'PLACE_DECOR': return placeDecor(d, cmd.itemId);
    case 'SEND_GIFT': return sendGift(d);
    case 'REDEEM_GIFT': return redeemGift(d, cmd.gift);
    case 'START_CHALLENGE': return startChallenge(d);
    case 'DELIVER_ROYAL': return deliverRoyal(d);
    case 'SEE_ROYAL': return seeRoyal(d);
    case 'BUILD_VILLAGE': return buildVillage(d, cmd.projectId);
    case 'STIR': return stir(d, cmd.slot, cmd.hits);
  }
}
