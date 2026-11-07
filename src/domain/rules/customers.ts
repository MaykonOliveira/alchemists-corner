import { ARCHETYPES, NOBLE_LEVEL } from '../data/customers';
import { DAY_EVENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Customer, CustomerArchetype, GameSave } from '../models/types';
import { fail, nextId, pick, weightedPick, type Draft } from './context';
import { getPrice, has, potionStock, takePotions } from './economy';
import { masteryStars, STAR_BONUS, talentBonus } from './mastery';
import { gainReputation, gainXp } from './progression';
import { CLOSE_MIN } from './time';
import { availableRegulars, befriend, REGULAR_CHANCE, seasonCategory } from './world';
import { SEASON_PRICE_BONUS } from '../data/world';
import { eventCategoryFactor, inSeason, seasonalRecipe } from './street';

export const MAX_CUSTOMERS = 3;
/** Clientes que cabem no balcão (o balcão duplo abre espaço para mais um). */
export const maxCustomers = (s: GameSave) => MAX_CUSTOMERS + (has(s, 'balcao-duplo') ? 1 : 0);
/** Margem acima do orçamento em que o cliente ainda negocia, em vez de ir embora. */
export const NEGOTIATION_MARGIN = 1.2;

export function nextSpawnDelay(s: GameSave, random: () => number) {
  const event = s.event ? DAY_EVENTS[s.event].spawnFactor : 1;
  const sign = (has(s, 'letreiro-novo') ? 0.75 : 1) * (has(s, 'sino-encantado') ? 0.9 : 1) * (has(s, 'balcao-duplo') ? 0.9 : 1);
  const fame = (1 + Math.min(s.reputation, 400) / 800) * (1 + talentBonus(s, 'fama'));
  return Math.round((16000 * event * sign) / fame * (0.7 + random() * 0.6));
}

export function spawnCustomer(d: Draft) {
  const { s, ctx } = d;
  // De vez em quando quem entra é um freguês fiel, que já chega pedindo o de sempre.
  const regulars = s.day >= 2 ? availableRegulars(s) : [];
  if (regulars.length && ctx.random() < REGULAR_CHANCE) {
    const r = pick(regulars, ctx.random);
    const info = ARCHETYPES[r.archetype];
    const regular: Customer = {
      id: nextId(d, 'c'),
      archetype: r.archetype,
      wantedRecipeId: r.favorite,
      budgetFactor: +(info.budget + 0.08).toFixed(3),
      patienceMs: Math.round(info.patienceMs * 1.3 * patienceFactor(s)),
      waitedMs: 0,
      offer: null,
      remark: r.greeting,
      regularId: r.id,
    };
    s.customers.push(regular);
    d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: regular.id });
    return;
  }
  const noble = s.level >= NOBLE_LEVEL ? 0.6 + (has(s, 'vitral-arcano') ? 0.4 : 0) : 0;
  const weights = { aventureiro: 1, estudioso: 1, morador: 1.2, viajante: 0.8, nobre: noble } as Record<CustomerArchetype, number>;
  if (s.event) for (const [k, w] of Object.entries(DAY_EVENTS[s.event].archetypeBoost)) weights[k as CustomerArchetype] += w;
  if (s.level < NOBLE_LEVEL) weights.nobre = 0;
  const archetype = weightedPick(weights, ctx.random);
  const info = ARCHETYPES[archetype];
  // Ninguém pede o que só aparece muitos níveis depois.
  // Poções da estação só são pedidas na estação delas.
  const wants = info.wants.filter((id) => RECIPES_BY_ID[id].unlockLevel <= s.level + 1 && inSeason(s, RECIPES_BY_ID[id]));

  // O primeiro cliente do jogo sempre pede algo que você tem, para ensinar a vender.
  const firstEver = s.day === 1 && s.stats.served === 0 && s.stats.lost === 0 && s.customers.length === 0;
  // Poção da estação só vira pedido frequente depois que a loja já preparou ela alguma vez.
  const known = wants.filter((id) => s.knownRecipes.includes(id) && (!RECIPES_BY_ID[id].season || (s.mastery[id] ?? 0) > 0));
  let wanted: string;
  const special = seasonalRecipe(s);
  if (firstEver && potionStock(s, 'cura-simples') > 0) wanted = 'cura-simples';
  // A poção da estação é a sensação da rua: um em cada cinco clientes pede por ela.
  else if (special && (s.mastery[special.id] ?? 0) > 0 && ctx.random() < 0.2) wanted = special.id;
  else if (known.length && (s.day <= 2 || ctx.random() < 0.8)) {
    // A estação puxa a procura para a categoria dela.
    const inSeason = known.filter((id) => RECIPES_BY_ID[id].category === seasonCategory(s));
    wanted = pick(inSeason.length && ctx.random() < 0.4 ? inSeason : known, ctx.random);
  }
  else wanted = pick(wants.length ? wants : info.wants, ctx.random);

  const bonus = s.event ? DAY_EVENTS[s.event].budgetBonus : 0;
  const customer: Customer = {
    id: nextId(d, 'c'),
    archetype,
    wantedRecipeId: wanted,
    budgetFactor: +(info.budget + (ctx.random() - 0.5) * 0.16 + bonus).toFixed(3),
    patienceMs: Math.round(info.patienceMs * (0.85 + ctx.random() * 0.3) * patienceFactor(s)),
    waitedMs: 0,
    offer: null,
    remark: RECIPES_BY_ID[wanted].request,
  };
  s.customers.push(customer);
  d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: customer.id });
}

/** Multiplicador de paciência (sino encantado e talento "Freguesia fiel"). */
export const patienceFactor = (s: GameSave) => (has(s, 'sino-encantado') ? 1.3 : 1) * (1 + talentBonus(s, 'freguesia'));

/** Preço máximo que o cliente aceita por uma poção. */
export function maxPriceFor(s: GameSave, c: Customer, recipeId: string) {
  const r = RECIPES_BY_ID[recipeId];
  const substitute = recipeId !== c.wantedRecipeId;
  const fame = 1 + Math.min(s.reputation, 240) / 800;
  const decor = (has(s, 'prateleira-extra') ? 1.03 : 1) * (has(s, 'iluminacao-aconchegante') ? 1.04 : 1) * (has(s, 'vitral-arcano') ? 1.05 : 1) * (has(s, 'torre-alquimista') ? 1.08 : 1);
  const skill = (1 + masteryStars(s, recipeId) * STAR_BONUS) * (1 + talentBonus(s, 'labia'));
  const season = r.category === seasonCategory(s) ? SEASON_PRICE_BONUS : 1;
  const event = eventCategoryFactor(s, recipeId);
  return Math.round(r.basePrice * c.budgetFactor * fame * decor * skill * season * event * (substitute ? 0.9 : 1));
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

/**
 * A melhor poção para oferecer: a pedida, se houver; senão a substituta parecida
 * que o cliente aceita pagar (ou a mais barata das parecidas).
 */
export function bestOffer(save: GameSave, c: Customer): string | null {
  const forSale = save.potions.filter((p) => p.forSale && p.quantity > 0).map((p) => p.recipeId);
  if (forSale.includes(c.wantedRecipeId)) return c.wantedRecipeId;
  const similar = forSale.filter((id) => suits(c, id));
  if (similar.length === 0) return null;
  const rank = { sim: 0, negocia: 1, nao: 2 } as const;
  return [...similar].sort((a, b) => rank[priceVerdict(save, c, a)] - rank[priceVerdict(save, c, b)] || getPrice(save, a) - getPrice(save, b))[0];
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
  const cozy = (has(s, 'iluminacao-aconchegante') ? 1 : 0) + (has(s, 'vitral-arcano') && c.archetype === 'nobre' ? 1 : 0);
  gainReputation(d, fair + cozy);
  s.lifetime = { sold: s.lifetime.sold + 1, earned: s.lifetime.earned + price };
  d.events.push({ type: 'SALE', customerId: c.id, recipeId, price, substitute: recipeId !== c.wantedRecipeId });
  const tip = befriend(d, c, recipeId, price);
  if (tip) s.lifetime = { ...s.lifetime, earned: s.lifetime.earned + tip };
  removeCustomer(d, c, 'atendido');
  gainXp(d, 6 + Math.round(r.basePrice / 5) + masteryStars(s, recipeId));
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
    if (s.customers.length < maxCustomers(s) && s.clockMin < CLOSE_MIN - 30) spawnCustomer(d);
  }
}

export function sendAllCustomersHome(d: Draft) {
  for (const c of [...d.s.customers]) removeCustomer(d, c, 'fechou');
}
