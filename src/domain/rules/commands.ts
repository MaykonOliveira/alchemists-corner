import type { GameEvent, GameSave, Settings } from '../models/types';
import { experiment, startBrew } from './alchemy';
import type { Draft, RuleContext } from './context';
import { acceptOffer, declineOffer, dismissCustomer, serveCustomer } from './customers';
import { advance, closeDay, openShop, startNextDay } from './day';
import { buyIngredient, buyUpgrade, setForSale, setPrice } from './economy';
import { setHelper } from './helpers';
import { deliverOrder } from './orders';
import { buySeal, learnTalentCmd } from './progression';
import { sponsorFestival } from './day';

/**
 * Comandos tipados que alteram o estado canônico da partida.
 * React e Phaser enviam estes comandos; nenhum dos dois altera o save diretamente.
 */
export type DomainCommand =
  | { type: 'BUY_INGREDIENT'; ingredientId: string; qty: number }
  | { type: 'START_BREW'; recipeId: string; batches: number }
  | { type: 'SET_PRICE'; recipeId: string; price: number }
  | { type: 'SET_FOR_SALE'; recipeId: string; forSale: boolean }
  | { type: 'OPEN_SHOP' }
  | { type: 'CLOSE_SHOP' }
  | { type: 'START_NEXT_DAY' }
  | { type: 'ADVANCE'; ms: number }
  | { type: 'SERVE_CUSTOMER'; customerId: string; recipeId: string }
  | { type: 'ACCEPT_OFFER'; customerId: string }
  | { type: 'DECLINE_OFFER'; customerId: string }
  | { type: 'DISMISS_CUSTOMER'; customerId: string }
  | { type: 'DELIVER_ORDER' }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'SET_HELPER'; upgradeId: string; on: boolean }
  | { type: 'EXPERIMENT'; ingredientIds: string[] }
  | { type: 'LEARN_TALENT'; talentId: string }
  | { type: 'BUY_SEAL' }
  | { type: 'SPONSOR_FESTIVAL' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_TUTORIAL'; step: number };

export interface CommandResult {
  save: GameSave;
  events: GameEvent[];
}

const defaultCtx = (): RuleContext => ({ now: Date.now(), random: Math.random });

/** Aplica um comando. Função pura: o save recebido nunca é alterado. */
export function applyCommand(save: GameSave, cmd: DomainCommand, ctx: RuleContext = defaultCtx()): CommandResult {
  const d: Draft = { s: structuredClone(save), events: [], ctx };
  const changed = run(d, cmd);
  if (!changed) return { save, events: d.events };
  d.s.updatedAt = ctx.now;
  return { save: d.s, events: d.events };
}

function run(d: Draft, cmd: DomainCommand): boolean {
  switch (cmd.type) {
    case 'BUY_INGREDIENT': return buyIngredient(d, cmd.ingredientId, cmd.qty);
    case 'START_BREW': return startBrew(d, cmd.recipeId, cmd.batches);
    case 'SET_PRICE': return setPrice(d, cmd.recipeId, cmd.price);
    case 'SET_FOR_SALE': return setForSale(d, cmd.recipeId, cmd.forSale);
    case 'OPEN_SHOP': return openShop(d);
    case 'CLOSE_SHOP': return closeDay(d);
    case 'START_NEXT_DAY': return startNextDay(d);
    case 'ADVANCE': return advance(d, cmd.ms);
    case 'SERVE_CUSTOMER': return serveCustomer(d, cmd.customerId, cmd.recipeId);
    case 'ACCEPT_OFFER': return acceptOffer(d, cmd.customerId);
    case 'DECLINE_OFFER': return declineOffer(d, cmd.customerId);
    case 'DISMISS_CUSTOMER': return dismissCustomer(d, cmd.customerId);
    case 'DELIVER_ORDER': return deliverOrder(d);
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
  }
}
