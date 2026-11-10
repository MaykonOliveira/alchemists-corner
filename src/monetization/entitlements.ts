// Alicerce para monetizar (pacote L). NADA é vendido hoje: PURCHASES_ENABLED fica false.
//
// Como funciona: o jogo pergunta "o jogador tem o item X?" sempre por `owns` (src/domain/rules/entitlements.ts),
// que olha a lista `owned` do save. Itens ganhos jogando entram nessa lista pelas regras.
// Quando houver uma loja de verdade (Google Play Billing, App Store ou Stripe), um `PurchaseProvider`
// confirma a compra e o jogo só precisa despachar um comando que acrescenta o id em `owned`.
// As regras do jogo não mudam, e nada que dá vantagem (moedas, XP, rival) entra no catálogo.

import { CATALOG, type CatalogItem } from '../domain/data/catalog';

import { tr } from '../i18n';
export const PURCHASES_ENABLED = false;

export interface PurchaseResult {
  ok: boolean;
  itemId: string;
  /** Recibo do provedor, para validar no servidor quando houver um. */
  receipt?: string;
  error?: string;
}

/** Um provedor de compras (loja de apps, Stripe...). */
export interface PurchaseProvider {
  id: string;
  /** O provedor funciona neste aparelho? */
  available(): boolean;
  /** Itens já comprados (para restaurar compras num aparelho novo). */
  restore(): Promise<string[]>;
  buy(itemId: string): Promise<PurchaseResult>;
}

/** Provedor padrão: não vende nada. */
export const noStore: PurchaseProvider = {
  id: 'nenhum',
  available: () => false,
  restore: async () => [],
  buy: async (itemId) => ({ ok: false, itemId, error: tr('Compras não estão ativas nesta versão.') }),
};

let provider: PurchaseProvider = noStore;
export const setPurchaseProvider = (p: PurchaseProvider) => { provider = p; };
export const purchaseProvider = () => provider;

/** Itens que poderiam ter preço em dinheiro no futuro (só cosméticos). Hoje a lista sai vazia. */
export function sellableItems(): CatalogItem[] {
  if (!PURCHASES_ENABLED) return [];
  return CATALOG.filter((i) => i.price !== null);
}

/**
 * Princípios que valem para qualquer monetização futura deste jogo:
 * sem caixas-surpresa pagas, sem energia ou espera paga, sem pagar para ganhar,
 * sem sequência que zera e sem pressão de tempo falsa (itens de festa voltam no ano seguinte).
 */
export const PRINCIPLES = [
  tr('Tudo que se compra é visto antes (sem caixas-surpresa pagas).'),
  tr('Ninguém paga para o caldeirão andar mais rápido.'),
  tr('Moedas, XP e a rival não se compram.'),
  tr('Faltar um dia nunca tira nada.'),
  tr('Itens de festa voltam no ano seguinte.'),
] as const;
