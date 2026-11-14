// Filiais pelo reino (E3): o objetivo grande depois da vila e o destino do dinheiro parado.
import { BRANCH_COST, BRANCH_INCOME, BRANCH_SHIP, CITIES, CITIES_BY_ID, MANAGER_LEVEL, SHIP_PRICE } from '../data/kingdom';
import { STAFF_BY_ID } from '../data/staff';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { getPrice, has, potionStock, takePotions } from './economy';
import { perkCount, staffLevel } from './evoCore';
import { grantCrystals } from './entitlements';

import { tr } from '../../i18n';

/** Nível mínimo da loja para ver o mapa do reino. */
export const KINGDOM_LEVEL = 12;

/** Custo para abrir (tamanho 1) ou crescer a filial até o tamanho indicado. */
export const branchCost = (cityId: string, size: number) => Math.round(CITIES_BY_ID[cityId].cost * BRANCH_COST[size - 1]);

export const branchCount = (s: GameSave) => Object.keys(s.evo.branches).length;

export function openBranch(d: Draft, cityId: string): boolean {
  const s = d.s;
  const city = CITIES_BY_ID[cityId];
  if (!city) return fail(d, tr('Cidade desconhecida.'));
  if (s.evo.branches[cityId]) return fail(d, tr('Você já tem uma filial aqui.'));
  if (s.level < city.minLevel) return fail(d, tr('Esta cidade abre no nível {0}.', city.minLevel));
  const cost = branchCost(cityId, 1);
  if (s.coins < cost) return fail(d, tr('Moedas insuficientes.'));
  s.coins -= cost;
  s.evo.branches = { ...s.evo.branches, [cityId]: { size: 1, manager: null, earned: 0 } };
  s.evo.news = [...s.evo.news, { kind: 'branch-open' as const, ref: cityId, n: 1 }].slice(-20);
  d.events.push({ type: 'BRANCH_OPENED', cityId, size: 1 });
  return true;
}

export function growBranch(d: Draft, cityId: string): boolean {
  const s = d.s;
  const b = s.evo.branches[cityId];
  if (!b) return fail(d, tr('Abra a filial primeiro.'));
  if (b.size >= 3) return fail(d, tr('Esta filial já é um empório.'));
  const cost = branchCost(cityId, b.size + 1);
  if (s.coins < cost) return fail(d, tr('Moedas insuficientes.'));
  s.coins -= cost;
  s.evo.branches = { ...s.evo.branches, [cityId]: { ...b, size: b.size + 1 } };
  s.evo.news = [...s.evo.news, { kind: 'branch-open' as const, ref: cityId, n: b.size + 1 }].slice(-20);
  d.events.push({ type: 'BRANCH_OPENED', cityId, size: b.size + 1 });
  return true;
}

/** Funcionários que podem supervisionar uma filial (nível 5 ou mais). */
export const canManage = (s: GameSave, staffId: string) => has(s, staffId) && !!STAFF_BY_ID[staffId] && staffLevel(s, staffId) >= MANAGER_LEVEL;

export function setManager(d: Draft, cityId: string, staffId: string | null): boolean {
  const s = d.s;
  const b = s.evo.branches[cityId];
  if (!b) return fail(d, tr('Abra a filial primeiro.'));
  if (staffId !== null && !canManage(s, staffId)) return fail(d, tr('Só funcionários de nível {0} ou mais supervisionam uma filial.', MANAGER_LEVEL));
  if (b.manager === staffId) return false;
  // Cada funcionário cuida de uma filial só: sai de onde estava.
  const next = Object.fromEntries(Object.entries(s.evo.branches).map(([id, x]) => [id, x.manager === staffId && staffId !== null ? { ...x, manager: null } : x]));
  next[cityId] = { ...next[cityId], manager: staffId };
  s.evo.branches = next;
  return true;
}

/** Bônus do supervisor: +4% por nível dele, mais 5% por escolha de Capricho. */
export const managerBonus = (s: GameSave, staffId: string | null) =>
  staffId && has(s, staffId) ? 0.04 * staffLevel(s, staffId) + 0.05 * perkCount(s, staffId, 'b') : 0;

/** Quanto a filial rende de lucro fixo no fechamento. */
export const branchIncome = (s: GameSave, cityId: string) => {
  const b = s.evo.branches[cityId];
  if (!b) return 0;
  return Math.round(CITIES_BY_ID[cityId].cost * BRANCH_INCOME[b.size - 1] * (1 + managerBonus(s, b.manager)));
};

/** Previsão de quantas poções cada filial levaria hoje (para o painel). */
export function shipmentPlan(s: GameSave, cityId: string): { recipeId: string; qty: number }[] {
  const b = s.evo.branches[cityId];
  if (!b) return [];
  const out: { recipeId: string; qty: number }[] = [];
  for (const id of CITIES_BY_ID[cityId].favorites) {
    const keep = s.order?.recipeId === id ? s.order.qty : 0;
    const qty = Math.min(BRANCH_SHIP[b.size - 1], Math.max(0, potionStock(s, id) - keep));
    if (qty > 0) out.push({ recipeId: id, qty });
  }
  return out;
}

/**
 * Fechamento: cada filial paga o lucro do dia e leva a remessa das poções favoritas da cidade,
 * pagando 25% acima da etiqueta. Uma vez por semana, cada filial manda cristais (1 por tamanho).
 */
export function closeBranches(d: Draft): number {
  const s = d.s;
  let total = 0;
  let shipped = 0;
  for (const city of CITIES) {
    const b = s.evo.branches[city.id];
    if (!b) continue;
    let earned = branchIncome(s, city.id);
    for (const it of shipmentPlan(s, city.id)) {
      const unit = Math.round(getPrice(s, it.recipeId) * SHIP_PRICE);
      if (!takePotions(s, it.recipeId, it.qty)) continue;
      earned += unit * it.qty;
      shipped += it.qty;
    }
    s.evo.branches = { ...s.evo.branches, [city.id]: { ...b, earned: b.earned + earned } };
    total += earned;
  }
  if (!total) return 0;
  s.coins += total;
  s.lifetime = { ...s.lifetime, earned: s.lifetime.earned + total };
  d.events.push({ type: 'BRANCH_INCOME', total, shipped });
  s.evo.news = [...s.evo.news, { kind: 'branch' as const, n: total }].slice(-20);
  if (s.day % 7 === 0) {
    const crystals = Object.values(s.evo.branches).reduce((n, b) => n + b.size, 0);
    grantCrystals(d, crystals, 'filiais');
  }
  return total;
}
