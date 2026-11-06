import { ARCHETYPES } from '../data/customers';
import { DAY_EVENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Customer, CustomerArchetype, GameSave } from '../models/types';
import { fail, nextId, pick, weightedPick, type Draft } from './context';
import { getPrice, has, potionStock, takePotions } from './economy';
import { gainReputation, gainXp } from './progression';
import { CLOSE_MIN } from './time';

export const MAX_CUSTOMERS = 3;
/** Margem acima do orçamento em que o cliente ainda negocia, em vez de ir embora. */
export const NEGOTIATION_MARGIN = 1.2;

export function nextSpawnDelay(s: GameSave, random: () => number) {
  const event = s.event ? DAY_EVENTS[s.event].spawnFactor : 1;
  const sign = has(s, 'letreiro-novo') ? 0.75 : 1;
  const fame = 1 + Math.min(s.reputation, 200) / 160;
  return Math.round((15000 * event * sign) / fame * (0.7 + random() * 0.6));
}

export function spawnCustomer(d: Draft) {
  const { s, ctx } = d;
  const weights = { aventureiro: 1, estudioso: 1, morador: 1.2, viajante: 0.8 } as Record<CustomerArchetype, number>;
  if (s.event) for (const [k, w] of Object.entries(DAY_EVENTS[s.event].archetypeBoost)) weights[k as CustomerArchetype] += w;
  const archetype = weightedPick(weights, ctx.random);
  const info = ARCHETYPES[archetype];

  // O primeiro cliente do jogo sempre pede algo que você tem, para ensinar a vender.
  const firstEver = s.day === 1 && s.stats.served === 0 && s.stats.lost === 0 && s.customers.length === 0;
  const known = info.wants.filter((id) => s.knownRecipes.includes(id));
  let wanted: string;
  if (firstEver && potionStock(s, 'cura-simples') > 0) wanted = 'cura-simples';
  else if (known.length && (s.day <= 2 || ctx.random() < 0.8)) wanted = pick(known, ctx.random);
  else wanted = pick(info.wants, ctx.random);

  const bonus = s.event ? DAY_EVENTS[s.event].budgetBonus : 0;
  const customer: Customer = {
    id: nextId(d, 'c'),
    archetype,
    wantedRecipeId: wanted,
    budgetFactor: +(info.budget + (ctx.random() - 0.5) * 0.16 + bonus).toFixed(3),
    patienceMs: Math.round(info.patienceMs * (0.85 + ctx.random() * 0.3)),
    waitedMs: 0,
    offer: null,
    remark: RECIPES_BY_ID[wanted].request,
  };
  s.customers.push(customer);
  d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: customer.id });
}

/** Preço máximo que o cliente aceita por uma poção. */
export function maxPriceFor(s: GameSave, c: Customer, recipeId: string) {
  const r = RECIPES_BY_ID[recipeId];
  const substitute = recipeId !== c.wantedRecipeId;
  const fame = 1 + Math.min(s.reputation, 240) / 800;
  const decor = (has(s, 'prateleira-extra') ? 1.03 : 1) * (has(s, 'iluminacao-aconchegante') ? 1.04 : 1);
  return Math.round(r.basePrice * c.budgetFactor * fame * decor * (substitute ? 0.9 : 1));
}

/** Uma poção serve para o cliente? (a pedida, ou outra da mesma categoria como substituta) */
export function suits(c: Customer, recipeId: string) {
  return recipeId === c.wantedRecipeId || RECIPES_BY_ID[recipeId].category === RECIPES_BY_ID[c.wantedRecipeId].category;
}

/** Chance estimada de aceitar, para orientar o jogador: 'sim' | 'negocia' | 'nao'. */
export function priceVerdict(s: GameSave, c: Customer, recipeId: string): 'sim' | 'negocia' | 'nao' {
  const max = maxPriceFor(s, c, recipeId);
  const price = getPrice(s, recipeId);
  if (price <= max) return 'sim';
  if (price <= max * NEGOTIATION_MARGIN) return 'negocia';
  return 'nao';
}

function removeCustomer(d: Draft, c: Customer, reason: 'paciencia' | 'preco' | 'recusou-oferta' | 'fechou' | 'atendido') {
  d.s.customers = d.s.customers.filter((x) => x.id !== c.id);
  d.events.push({ type: 'CUSTOMER_LEFT', customerId: c.id, reason });
  if (reason !== 'atendido' && reason !== 'fechou') d.s.stats.lost += 1;
}

function completeSale(d: Draft, c: Customer, recipeId: string, price: number) {
  const s = d.s;
  const r = RECIPES_BY_ID[recipeId];
  takePotions(s, recipeId, 1);
  s.coins += price;
  s.stats.revenue += price;
  s.stats.salesByRecipe[recipeId] = (s.stats.salesByRecipe[recipeId] ?? 0) + 1;
  s.stats.served += 1;
  const fair = price <= r.basePrice ? 1 : 0;
  const cozy = has(s, 'iluminacao-aconchegante') ? 1 : 0;
  gainReputation(d, 1 + fair + cozy);
  d.events.push({ type: 'SALE', customerId: c.id, recipeId, price, substitute: recipeId !== c.wantedRecipeId });
  removeCustomer(d, c, 'atendido');
  gainXp(d, 6 + Math.round(r.basePrice / 5));
}

export function serveCustomer(d: Draft, customerId: string, recipeId: string): boolean {
  const s = d.s;
  const c = s.customers.find((x) => x.id === customerId);
  if (!c) return fail(d, 'Esse cliente já foi embora.');
  if (s.phase !== 'expediente') return fail(d, 'A loja está fechada.');
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (!stack || stack.quantity < 1 || !stack.forSale) return fail(d, 'Essa poção não está à venda.');
  if (!suits(c, recipeId)) {
    c.remark = 'Hmm… não é bem disso que eu preciso.';
    d.events.push({ type: 'CUSTOMER_REFUSED', customerId, reason: 'produto' });
    return true;
  }
  const price = getPrice(s, recipeId);
  const max = maxPriceFor(s, c, recipeId);
  if (price <= max) {
    completeSale(d, c, recipeId, price);
  } else if (price <= max * NEGOTIATION_MARGIN) {
    c.offer = { recipeId, price: max };
    c.remark = `Está um pouco caro… Faz por ${max} moedas?`;
    d.events.push({ type: 'COUNTER_OFFER', customerId, price: max });
  } else {
    c.remark = 'Caro demais para mim. Fica para outro dia.';
    d.events.push({ type: 'CUSTOMER_REFUSED', customerId, reason: 'preco' });
    removeCustomer(d, c, 'preco');
  }
  return true;
}

export function acceptOffer(d: Draft, customerId: string): boolean {
  const c = d.s.customers.find((x) => x.id === customerId);
  if (!c?.offer) return false;
  if (d.s.phase !== 'expediente') return fail(d, 'A loja está fechada.');
  if (potionStock(d.s, c.offer.recipeId) < 1) return fail(d, 'Essa poção acabou.');
  completeSale(d, c, c.offer.recipeId, c.offer.price);
  return true;
}

export function declineOffer(d: Draft, customerId: string): boolean {
  const c = d.s.customers.find((x) => x.id === customerId);
  if (!c?.offer) return false;
  removeCustomer(d, c, 'recusou-oferta');
  return true;
}

/** Dispensar com educação ("hoje não tenho"): sem perda de reputação. */
export function dismissCustomer(d: Draft, customerId: string): boolean {
  const c = d.s.customers.find((x) => x.id === customerId);
  if (!c) return false;
  removeCustomer(d, c, 'preco');
  return true;
}

export function advanceCustomers(d: Draft, ms: number) {
  const s = d.s;
  for (const c of [...s.customers]) {
    c.waitedMs += ms;
    if (c.waitedMs >= c.patienceMs) {
      gainReputation(d, -1);
      removeCustomer(d, c, 'paciencia');
    }
  }
  s.spawnInMs -= ms;
  if (s.spawnInMs <= 0) {
    s.spawnInMs = nextSpawnDelay(s, d.ctx.random);
    // Ninguém entra nos últimos 30 minutos do expediente.
    if (s.customers.length < MAX_CUSTOMERS && s.clockMin < CLOSE_MIN - 30) spawnCustomer(d);
  }
}

export function sendAllCustomersHome(d: Draft) {
  for (const c of [...d.s.customers]) removeCustomer(d, c, 'fechou');
}
