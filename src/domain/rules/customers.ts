import { ARCHETYPES, NOBLE_LEVEL } from '../data/customers';
import { DAY_EVENTS } from '../data/orders';
import { RECIPES_BY_ID } from '../data/recipes';
import type { Customer, CustomerArchetype, GameSave } from '../models/types';
import { fail, nextId, pick, weightedPick, type Draft } from './context';
import { getPrice, has, potionStock, priceRange, takePotions } from './economy';
import { masteryStars, STAR_BONUS, talentBonus } from './mastery';
import { gainReputation, gainXp } from './progression';
import { CLOSE_MIN } from './time';
import { availableRegulars, befriend, REGULAR_CHANCE, seasonCategory } from './world';
import { SEASON_PRICE_BONUS } from '../data/world';
import { eventCategoryFactor, inSeason, seasonalRecipe } from './street';
import { letterVisitor, maybeSpawnVip, onVipServed } from './retention';
import { noteSale } from './records';
import { villageBonus } from './villageBonus';
import { QUALITY_BONUS, takeBestQuality } from './quality';
import { grantCrystals } from './entitlements';
import { REGULARS_BY_ID } from '../data/world';
import { BALL_NOBLE_BOOST } from '../data/royal';
import { royalChapter, royalOnLost, royalOnSale, royalWon } from './royal';

export const MAX_CUSTOMERS = 3;
/** Clientes que cabem no balcão (o balcão duplo abre espaço para mais um). */
export const maxCustomers = (s: GameSave) => MAX_CUSTOMERS + (has(s, 'balcao-duplo') ? 1 : 0);
/** Margem acima do orçamento em que o cliente ainda negocia, em vez de ir embora. */
export const NEGOTIATION_MARGIN = 1.2;

export function nextSpawnDelay(s: GameSave, random: () => number) {
  const event = s.event ? DAY_EVENTS[s.event].spawnFactor : 1;
  const sign = (has(s, 'letreiro-novo') ? 0.75 : 1) * (has(s, 'sino-encantado') ? 0.9 : 1) * (has(s, 'balcao-duplo') ? 0.9 : 1);
  const fame = (1 + Math.min(s.reputation, 400) / 800) * (1 + talentBonus(s, 'fama')) * (1 + talentBonus(s, 'renome')) * (1 + villageBonus(s, 'movimento'));
  return Math.round((16000 * event * sign) / fame * (0.7 + random() * 0.6));
}

/** Nível em que o Cliente misterioso começa a aparecer (no máximo um por dia). */
export const MYSTERY_LEVEL = 7;
/** O Cliente misterioso paga este tanto do preço-base e deixa cristais. */
export const MYSTERY_PAYS = 3;
export const MYSTERY_CRYSTALS = 3;

/** Receitas que o Cliente misterioso pode pedir (as que têm charada e a loja conhece). */
export const mysteryRecipes = (s: GameSave) => s.knownRecipes.filter((id) => RECIPES_BY_ID[id]?.riddle);

function maybeSpawnMystery(d: Draft): boolean {
  const { s, ctx } = d;
  if (s.level < MYSTERY_LEVEL || s.stats.mystery || s.clockMin > 15 * 60 || s.day < 3) return false;
  const pool = mysteryRecipes(s);
  if (!pool.length || ctx.random() >= 0.12) return false;
  const id = pick(pool, ctx.random);
  s.stats.mystery = true;
  const c: Customer = {
    id: nextId(d, 'c'), archetype: 'viajante', wantedRecipeId: id, budgetFactor: 1,
    patienceMs: Math.round(60000 * patienceFactor(s)), waitedMs: 0, offer: null,
    remark: RECIPES_BY_ID[id].riddle!, mystery: true,
  };
  s.customers.push(c);
  d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: c.id });
  d.events.push({ type: 'MYSTERY_ARRIVED', customerId: c.id });
  return true;
}

export function spawnCustomer(d: Draft) {
  const { s, ctx } = d;
  if (maybeSpawnMystery(d)) return;
  // De vez em quando quem entra é um freguês fiel, que já chega pedindo o de sempre.
  const regulars = s.day >= 2 ? availableRegulars(s) : [];
  // Quem mandou carta ontem entra primeiro, como prometeu.
  const promised = letterVisitor(s);
  if (promised || (regulars.length && ctx.random() < REGULAR_CHANCE)) {
    const r = promised ? REGULARS_BY_ID[promised] : pick(regulars, ctx.random);
    if (promised && s.letter) s.letter = { ...s.letter, done: true };
    const info = ARCHETYPES[r.archetype];
    const regular: Customer = {
      id: nextId(d, 'c'),
      archetype: r.archetype,
      wantedRecipeId: r.favorite,
      budgetFactor: +(info.budget + (promised ? 0.4 : 0.08)).toFixed(3),
      patienceMs: Math.round(info.patienceMs * 1.3 * patienceFactor(s)),
      waitedMs: 0,
      offer: null,
      remark: promised ? 'Como prometi na carta! Hoje pago bem pelo de sempre.' : r.greeting,
      regularId: r.id,
    };
    s.customers.push(regular);
    d.events.push({ type: 'CUSTOMER_ARRIVED', customerId: regular.id });
    return;
  }
  const noble = s.level >= NOBLE_LEVEL ? 0.6 + (has(s, 'vitral-arcano') ? 0.4 : 0) : 0;
  const weights = { aventureiro: 1, estudioso: 1, morador: 1.2, viajante: 0.8, nobre: noble } as Record<CustomerArchetype, number>;
  if (s.event) for (const [k, w] of Object.entries(DAY_EVENTS[s.event].archetypeBoost)) weights[k as CustomerArchetype] += w;
  // No baile da nobreza (Concurso Real) a rua se enche de nobres.
  if (royalChapter(s)?.goal.kind === 'nobres') weights.nobre += BALL_NOBLE_BOOST;
  if (s.level < NOBLE_LEVEL) weights.nobre = 0;
  const archetype = weightedPick(weights, ctx.random);
  const info = ARCHETYPES[archetype];
  // Ninguém pede o que só aparece muitos níveis depois.
  // Poções da estação só são pedidas na estação delas.
  // A Poção da Coroa só vira pedido depois do Concurso Real.
  const wants = info.wants.filter((id) => (RECIPES_BY_ID[id].legend ? s.knownRecipes.includes(id) : RECIPES_BY_ID[id].secret ? royalWon(s) : RECIPES_BY_ID[id].unlockLevel <= s.level + 1) && inSeason(s, RECIPES_BY_ID[id]));

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
    // A procura do dia (anunciada no fechamento de ontem) puxa metade dos pedidos.
    const hot = known.filter((id) => s.trend?.includes(id));
    wanted = pick(hot.length && ctx.random() < 0.5 ? hot : inSeason.length && ctx.random() < 0.4 ? inSeason : known, ctx.random);
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
export const patienceFactor = (s: GameSave) => (has(s, 'sino-encantado') ? 1.3 : 1) * (1 + talentBonus(s, 'freguesia')) * (1 + villageBonus(s, 'paciencia'));

/** Preço máximo que o cliente aceita por uma poção. */
export function maxPriceFor(s: GameSave, c: Customer, recipeId: string) {
  const r = RECIPES_BY_ID[recipeId];
  const substitute = recipeId !== c.wantedRecipeId;
  const fame = 1 + Math.min(s.reputation, 240) / 800;
  const decor = (has(s, 'prateleira-extra') ? 1.03 : 1) * (has(s, 'iluminacao-aconchegante') ? 1.04 : 1) * (has(s, 'vitral-arcano') ? 1.05 : 1) * (has(s, 'torre-alquimista') ? 1.08 : 1);
  const skill = (1 + masteryStars(s, recipeId) * STAR_BONUS) * (1 + talentBonus(s, 'labia')) * (1 + talentBonus(s, 'toque-de-ouro')) * (1 + villageBonus(s, 'preco'));
  const season = r.category === seasonCategory(s) ? SEASON_PRICE_BONUS : 1;
  const event = eventCategoryFactor(s, recipeId);
  return Math.round(r.basePrice * c.budgetFactor * fame * decor * skill * season * event * (substitute ? 0.9 : 1));
}

/** Uma poção serve para o cliente? (a pedida, ou outra da mesma categoria como substituta) */
export function suits(c: Customer, recipeId: string) {
  // O Cliente misterioso só aceita a poção exata da charada.
  if (c.mystery) return recipeId === c.wantedRecipeId;
  // A Condessa da estreia aceita qualquer poção da loja nova.
  if (c.vip?.kind === 'estreia') return true;
  return recipeId === c.wantedRecipeId || RECIPES_BY_ID[recipeId].category === RECIPES_BY_ID[c.wantedRecipeId].category;
}

/** Chance estimada de aceitar, para orientar o jogador: 'sim' | 'negocia' | 'nao'. */
/** Quanto uma visita especial paga (preço fixo, várias vezes o preço-base). */
export const vipPrice = (c: Customer, recipeId: string) => Math.round(RECIPES_BY_ID[recipeId].basePrice * (c.vip?.pays ?? 1));

export function priceVerdict(s: GameSave, c: Customer, recipeId: string): 'sim' | 'negocia' | 'nao' {
  if (c.vip) return 'sim';
  const max = maxPriceFor(s, c, recipeId);
  const price = getPrice(s, recipeId);
  if (price <= max) return 'sim';
  if (price <= max * NEGOTIATION_MARGIN) return 'negocia';
  return 'nao';
}

/** Quantas poções desta receita ficam guardadas para o pedido especial em aberto. */
export function reservedForOrder(save: GameSave, recipeId: string): number {
  return save.order && save.order.recipeId === recipeId ? save.order.qty : 0;
}

/**
 * A melhor poção para oferecer: a pedida, se houver; senão a substituta parecida
 * que o cliente aceita pagar (ou a mais barata das parecidas).
 */
export function bestOffer(save: GameSave, c: Customer): string | null {
  // Poções guardadas para o pedido especial não saem no atendimento rápido.
  // A charada é para o jogador resolver: o atendimento rápido não entrega a resposta.
  if (c.mystery) return null;
  const forSale = save.potions.filter((p) => p.forSale && p.quantity - reservedForOrder(save, p.recipeId) > 0).map((p) => p.recipeId);
  if (forSale.includes(c.wantedRecipeId)) return c.wantedRecipeId;
  if (c.vip) return forSale.filter((id) => suits(c, id)).sort((a, b) => RECIPES_BY_ID[b].basePrice - RECIPES_BY_ID[a].basePrice)[0] ?? null;
  const similar = forSale.filter((id) => suits(c, id));
  if (similar.length === 0) return null;
  const rank = { sim: 0, negocia: 1, nao: 2 } as const;
  return [...similar].sort((a, b) => rank[priceVerdict(save, c, a)] - rank[priceVerdict(save, c, b)] || getPrice(save, a) - getPrice(save, b))[0];
}

function removeCustomer(d: Draft, c: Customer, reason: 'paciencia' | 'preco' | 'recusou-oferta' | 'fechou' | 'atendido') {
  d.s.customers = d.s.customers.filter((x) => x.id !== c.id);
  d.events.push({ type: 'CUSTOMER_LEFT', customerId: c.id, reason });
  if (reason !== 'atendido' && reason !== 'fechou') {
    d.s.stats.lost += 1;
    const lost = d.s.stats.lostByRecipe ?? {};
    d.s.stats.lostByRecipe = { ...lost, [c.wantedRecipeId]: (lost[c.wantedRecipeId] ?? 0) + 1 };
    royalOnLost(d, c);
  }
}

/** Fração da paciência até a qual o atendimento conta como rápido (reputação a mais). */
export const FAST_SERVICE = 0.4;

function completeSale(d: Draft, c: Customer, recipeId: string, price: number, discount = false) {
  const s = d.s;
  const r = RECIPES_BY_ID[recipeId];
  // Poções Finas e Primorosas saem primeiro e valem mais (toque de mestre).
  const quality = takeBestQuality(s, recipeId);
  price = Math.round(price * (1 + QUALITY_BONUS[quality]));
  takePotions(s, recipeId, 1);
  s.coins += price;
  s.stats.revenue += price;
  s.stats.salesByRecipe[recipeId] = (s.stats.salesByRecipe[recipeId] ?? 0) + 1;
  s.stats.served += 1;
  // Reputação vem de atender bem (a poção certa, sem demora, um agrado no preço), e não de cobrar pouco.
  const exact = recipeId === c.wantedRecipeId ? 1 : 0;
  const fast = c.waitedMs <= c.patienceMs * FAST_SERVICE ? 1 : 0;
  const cozy = (has(s, 'iluminacao-aconchegante') ? 1 : 0) + (has(s, 'vitral-arcano') && c.archetype === 'nobre' ? 1 : 0);
  gainReputation(d, exact + fast + (discount ? 1 : 0) + cozy);
  s.lifetime = { sold: s.lifetime.sold + 1, earned: s.lifetime.earned + price };
  d.events.push({ type: 'SALE', customerId: c.id, recipeId, price, substitute: recipeId !== c.wantedRecipeId, ...(quality > 1 ? { quality: quality as 2 | 3 } : {}) });
  noteSale(d, price);
  royalOnSale(d, c, recipeId);
  const tip = befriend(d, c, recipeId, price);
  if (tip) s.lifetime = { ...s.lifetime, earned: s.lifetime.earned + tip };
  removeCustomer(d, c, 'atendido');
  gainXp(d, 6 + Math.round(r.basePrice / 5) + masteryStars(s, recipeId));
}

/** Preços que o jogador pode pedir no balcão, a partir da etiqueta: com desconto, a etiqueta e um pedido mais alto. */
export function askOptions(s: GameSave, recipeId: string) {
  const { min, max } = priceRange(s, recipeId);
  const tag = getPrice(s, recipeId);
  return { discount: Math.max(min, Math.round(tag * 0.9)), tag, high: Math.min(max, Math.max(tag + 1, Math.round(tag * 1.15))) };
}

export function serveCustomer(d: Draft, customerId: string, recipeId: string, opts: { basePrice?: boolean; price?: number } = {}): boolean {
  const s = d.s;
  const c = s.customers.find((x) => x.id === customerId);
  if (!c) return fail(d, 'Esse cliente já foi embora.');
  if (s.phase !== 'expediente') return fail(d, 'A loja está fechada.');
  const stack = s.potions.find((p) => p.recipeId === recipeId);
  if (!stack || stack.quantity < 1 || !stack.forSale) return fail(d, 'Essa poção não está à venda.');
  if (c.mystery) {
    if (recipeId !== c.wantedRecipeId) {
      c.remark = `Hmm… não era bem isso. ${RECIPES_BY_ID[c.wantedRecipeId].riddle}`;
      c.waitedMs += c.patienceMs * 0.15;
      d.events.push({ type: 'MYSTERY_WRONG', customerId });
      return true;
    }
    const price = RECIPES_BY_ID[recipeId].basePrice * MYSTERY_PAYS;
    completeSale(d, c, recipeId, price);
    grantCrystals(d, MYSTERY_CRYSTALS, 'misterio');
    d.events.push({ type: 'MYSTERY_SOLVED', recipeId, coins: price, crystals: MYSTERY_CRYSTALS });
    return true;
  }
  if (!suits(c, recipeId)) {
    c.remark = 'Hmm… não é bem disso que eu preciso.';
    d.events.push({ type: 'CUSTOMER_REFUSED', customerId, reason: 'produto' });
    return true;
  }
  if (c.vip) {
    const price = vipPrice(c, recipeId);
    completeSale(d, c, recipeId, price);
    onVipServed(d, c, price);
    return true;
  }
  // O golem não negocia: cobra o preço-base, que é sempre aceito por quem pediu a poção pelo nome.
  const tag = getPrice(s, recipeId);
  let price = opts.basePrice ? RECIPES_BY_ID[recipeId].basePrice : tag;
  // Pedido feito na hora, no balcão: só vale dentro da faixa da receita.
  if (opts.price !== undefined) {
    const { min, max: top } = priceRange(s, recipeId);
    price = Math.round(Math.min(top, Math.max(min, opts.price)));
  }
  const max = maxPriceFor(s, c, recipeId);
  // Pedir acima da etiqueta a quem não pode pagar ofende: o morador vai embora, os outros pechincham bravos.
  const greedy = price > tag && price > max;
  const margin = greedy && c.archetype === 'morador' ? 1 : NEGOTIATION_MARGIN;
  if (price <= max || opts.basePrice) {
    completeSale(d, c, recipeId, price, price < tag);
  } else if (price <= max * margin) {
    c.offer = { recipeId, price: max };
    if (greedy) gainReputation(d, -1);
    c.remark = greedy ? `Acima da etiqueta?! Pago ${max}, e olhe lá.` : `Está um pouco caro… Faz por ${max} moedas?`;
    d.events.push({ type: 'COUNTER_OFFER', customerId, price: max });
  } else {
    c.remark = greedy ? 'Acima da etiqueta? Isso é abuso. Passar bem.' : 'Caro demais para mim. Fica para outro dia.';
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
  // Visitas especiais (Condessa no dia 1, convidado da festa) entram na hora marcada.
  if (maybeSpawnVip(d, s.customers.length < maxCustomers(s) && s.clockMin < CLOSE_MIN - 30)) return;
  if (s.spawnInMs <= 0) {
    s.spawnInMs = nextSpawnDelay(s, d.ctx.random);
    // Ninguém entra nos últimos 30 minutos do expediente.
    if (s.customers.length < maxCustomers(s) && s.clockMin < CLOSE_MIN - 30) spawnCustomer(d);
  }
}

export function sendAllCustomersHome(d: Draft) {
  for (const c of [...d.s.customers]) removeCustomer(d, c, 'fechou');
}
