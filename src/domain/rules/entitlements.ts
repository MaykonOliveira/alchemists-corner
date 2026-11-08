// Direitos do jogador sobre itens do catálogo (pacote L) e decoração da loja (pacote K).
// Toda pergunta "o jogador tem o item X?" passa por `owns`. Hoje a resposta vem só do save
// (itens ganhos jogando). No futuro, compras de uma loja de apps entram pela mesma porta
// (ver src/monetization/), sem mudar nenhuma regra do jogo.
import { CATALOG_BY_ID, DEFAULT_DECOR, type DecorSlot } from '../data/catalog';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';

export const owns = (s: GameSave, itemId: string) => s.owned.includes(itemId);

/** Entrega um item (sem custo). Devolve false se o jogador já tinha. */
export function grantItem(d: Draft, itemId: string, source: string): boolean {
  if (!CATALOG_BY_ID[itemId] || owns(d.s, itemId)) return false;
  d.s.owned = [...d.s.owned, itemId];
  d.events.push({ type: 'ITEM_GRANTED', itemId, source });
  return true;
}

export function grantCrystals(d: Draft, n: number, reason: string) {
  if (n <= 0) return;
  d.s.crystals += n;
  d.events.push({ type: 'CRYSTALS', n, reason });
}

/** Compra decoração com Cristais de luar e já coloca na loja. */
export function buyDecor(d: Draft, itemId: string): boolean {
  const s = d.s;
  const it = CATALOG_BY_ID[itemId];
  if (!it) return fail(d, 'Item desconhecido.');
  if (owns(s, itemId)) return placeDecor(d, itemId);
  if (it.crystals === null) return fail(d, 'Este item não se compra: ele vem da trilha, das festas ou de presente.');
  if (s.crystals < it.crystals) return fail(d, `Faltam ${it.crystals - s.crystals} Cristais de luar.`);
  s.crystals -= it.crystals;
  s.owned = [...s.owned, itemId];
  d.events.push({ type: 'DECOR_BOUGHT', itemId });
  s.decor = { ...s.decor, [it.slot]: itemId };
  return true;
}

export function placeDecor(d: Draft, itemId: string): boolean {
  const s = d.s;
  const it = CATALOG_BY_ID[itemId];
  if (!it || !owns(s, itemId)) return fail(d, 'Você ainda não tem este item.');
  if (s.decor[it.slot] === itemId) return false;
  s.decor = { ...s.decor, [it.slot]: itemId };
  return true;
}

export const decorAt = (s: GameSave, slot: DecorSlot) => CATALOG_BY_ID[s.decor[slot] ?? DEFAULT_DECOR[slot]] ?? CATALOG_BY_ID[DEFAULT_DECOR[slot]];

/** Encanto da decoração colocada (cada ponto vale +1 de reputação por dia, até 3). */
export const MAX_CHARM = 3;
export function charm(s: GameSave): number {
  const total = Object.values(s.decor).reduce((n, id) => n + (CATALOG_BY_ID[id]?.charm ?? 0), 0);
  return Math.min(MAX_CHARM, total);
}
