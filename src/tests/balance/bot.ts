// Robô-jogador para simular a economia usando só as regras puras do domínio.
// Não faz parte do jogo: serve para medir o balanceamento (ver balance.test.ts).
import { ARCHETYPES } from '../../domain/data/customers';
import { INGREDIENTS_BY_ID } from '../../domain/data/ingredients';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { UPGRADES } from '../../domain/data/upgrades';
import type { DayReport, GameEvent, GameSave } from '../../domain/models/types';
import { maxBatches, POTIONS_PER_BATCH } from '../../domain/rules/alchemy';
import { applyCommand, type DomainCommand } from '../../domain/rules/commands';
import type { RuleContext } from '../../domain/rules/context';
import { countIngredients, ingredientCapacity, potionStock, priceRange } from '../../domain/rules/economy';
import { askOptions, suits } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';
import { sealsAvailable } from '../../domain/rules/progression';
import { TALENTS, talentCost } from '../../domain/data/talents';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BotProfile {
  name: string;
  /** Segundos reais que o jogador leva para atender quem chegou. */
  reactionS: [number, number];
  /** Fator de preço escolhido (1 = preço-base). */
  priceFactor: number;
  /** Segundos reais gastos na preparação de cada dia (comprar, preparar, decidir). */
  prepS: (day: number) => number;
  /** Estoque-alvo por receita conhecida. */
  targetStock: number;
  /** Moedas guardadas para ingredientes antes de comprar melhorias. */
  reserve: number;
  /** Contrata os ajudantes automáticos (corvo, aprendiz e golem)? */
  hireHelpers?: boolean;
  /**
   * A partir deste dia o jogador fica distraído: demora 20–45 s para atender e só mexe no
   * caldeirão antes de abrir. Serve para medir o valor dos ajudantes.
   */
  distractedFrom?: number;
  /** Lê o freguês no balcão: pede mais a quem tem dinheiro e faz um agrado a quem conta moedas. */
  readsCustomers?: boolean;
  /** Pede mais de todo mundo, sem olhar quem está no balcão. */
  greedy?: boolean;
}

export const CASUAL: BotProfile = {
  name: 'casual',
  reactionS: [4, 10],
  priceFactor: 1,
  prepS: (day) => (day === 1 ? 120 : 45),
  targetStock: 4,
  reserve: 30,
};

export const EFICIENTE: BotProfile = {
  name: 'eficiente',
  reactionS: [1.5, 4],
  priceFactor: 1.1,
  prepS: (day) => (day === 1 ? 60 : 25),
  targetStock: 6,
  reserve: 40,
};

/** O casual que presta atenção em quem está no balcão (auditoria P0.3). */
export const ESPERTO: BotProfile = { ...CASUAL, name: 'esperto', readsCustomers: true };

/** Pede o preço alto de todos: serve para mostrar que ler o freguês importa. */
export const GANANCIOSO: BotProfile = { ...ESPERTO, name: 'ganancioso', greedy: true };

/** Joga como o casual até o dia 5 e depois fica distraído. */
export const DISTRAIDO: BotProfile = { ...CASUAL, name: 'distraído', distractedFrom: 6 };

export const DISTRAIDO_COM_AJUDANTES: BotProfile = { ...DISTRAIDO, name: 'distraído + ajudantes', hireHelpers: true };

export interface DaySummary extends DayReport {
  coinsEnd: number;
  level: number;
  xp: number;
  reputation: number;
  upgrades: string[];
  /** Segundos reais acumulados no fim do dia (preparação + expediente). */
  elapsedS: number;
}

export interface SimResult {
  days: DaySummary[];
  firstUpgradeDay: number | null;
  /** Dia em que a primeira melhoria ficou ao alcance (nível e moedas). */
  firstAffordableDay: number | null;
}

const STEP_MS = 500;

export function simulate(profile: BotProfile, days: number, seed: number): SimResult {
  const random = mulberry32(seed);
  const ctx: RuleContext = { now: 0, random };
  let s: GameSave = createNewGame(0);
  const out: DaySummary[] = [];
  let firstUpgradeDay: number | null = null;
  let firstAffordableDay: number | null = null;
  let elapsedS = 0;
  const reactAt = new Map<string, number>();

  const cmd = (c: DomainCommand): GameEvent[] => {
    const r = applyCommand(s, c, ctx);
    s = r.save;
    return r.events;
  };

  const distracted = () => profile.distractedFrom !== undefined && s.day >= profile.distractedFrom;

  const demandWeight = (recipeId: string) =>
    Object.values(ARCHETYPES).reduce((n, a) => n + (a.wants.includes(recipeId) ? 1 / a.wants.length : 0), 0);

  const tryUpgrades = () => {
    // Quem contrata ajudantes dá prioridade a eles; os demais compram da mais barata para a mais cara.
    const rank = (u: (typeof UPGRADES)[number]) => (profile.hireHelpers && u.category === 'ajudante' ? 0 : 1);
    for (const up of [...UPGRADES].sort((a, b) => rank(a) - rank(b) || a.cost - b.cost)) {
      if (s.upgrades.includes(up.id) || s.level < up.requiredLevel) continue;
      if (up.category === 'ajudante' && !profile.hireHelpers) continue;
      if (firstAffordableDay === null && s.coins >= up.cost) firstAffordableDay = s.day;
      if (s.coins - up.cost < profile.reserve) {
        if (rank(up) === 0) break; // junta dinheiro para o ajudante
        continue;
      }
      cmd({ type: 'BUY_UPGRADE', upgradeId: up.id });
      if (firstUpgradeDay === null) firstUpgradeDay = s.day;
    }
  };

  /** Gasta os Selos de Mestre no talento mais barato disponível. */
  const tryTalents = () => {
    for (let guard = 0; guard < 20; guard++) {
      const free = sealsAvailable(s);
      const next = TALENTS.filter((t) => (s.talents[t.id] ?? 0) < t.max)
        .sort((a, b) => (s.talents[a.id] ?? 0) - (s.talents[b.id] ?? 0))[0];
      if (!next || talentCost(s.talents[next.id] ?? 0) > free) return;
      cmd({ type: 'LEARN_TALENT', talentId: next.id });
    }
  };

  const tryBrew = () => {
    if (s.brew) return;
    const candidates = s.knownRecipes
      .filter((id) => potionStock(s, id) < profile.targetStock)
      .sort((a, b) => potionStock(s, a) / demandWeight(a) - potionStock(s, b) / demandWeight(b));
    for (const id of candidates) {
      const r = RECIPES_BY_ID[id];
      const want = Math.max(1, Math.ceil((profile.targetStock - potionStock(s, id)) / POTIONS_PER_BATCH));
      // Compra o que faltar para `want` lotes, dentro do saldo, do estoque do fornecedor e do armário.
      for (let batches = want; batches >= 1; batches--) {
        let cost = 0;
        let ok = true;
        const buys: [string, number][] = [];
        for (const i of r.ingredients) {
          const need = i.qty * batches - (s.ingredients[i.ingredientId] ?? 0);
          if (need <= 0) continue;
          const avail = s.supplier[i.ingredientId];
          if (avail !== null && avail !== undefined && avail < need) ok = false;
          cost += need * INGREDIENTS_BY_ID[i.ingredientId].price;
          buys.push([i.ingredientId, need]);
        }
        const units = buys.reduce((n, [, q]) => n + q, 0);
        if (!ok || cost > s.coins || countIngredients(s) + units > ingredientCapacity(s)) continue;
        for (const [ingredientId, qty] of buys) cmd({ type: 'BUY_INGREDIENT', ingredientId, qty });
        const b = Math.min(batches, maxBatches(s, id));
        if (b >= 1) {
          cmd({ type: 'START_BREW', recipeId: id, batches: b });
          return;
        }
      }
    }
  };

  const serve = () => {
    for (const c of [...s.customers]) {
      if (!reactAt.has(c.id)) {
        const [lo, hi] = distracted() ? [20, 45] : profile.reactionS;
        reactAt.set(c.id, (lo + random() * (hi - lo)) * 1000);
      }
      if (c.waitedMs < reactAt.get(c.id)!) continue;
      const options = s.potions
        .filter((p) => p.forSale && p.quantity > 0 && suits(c, p.recipeId))
        .sort((a, b) => (a.recipeId === c.wantedRecipeId ? -1 : 0) - (b.recipeId === c.wantedRecipeId ? -1 : 0));
      if (!options.length) {
        // Espera um pouco se o caldeirão estiver fazendo a poção certa; senão dispensa.
        if (s.brew && suits(c, s.brew.recipeId) && c.waitedMs < c.patienceMs * 0.7) continue;
        cmd({ type: 'DISMISS_CUSTOMER', customerId: c.id });
        continue;
      }
      const recipeId = options[0].recipeId;
      let price: number | undefined;
      if (profile.readsCustomers && !c.vip && recipeId === c.wantedRecipeId) {
        const ask = askOptions(s, recipeId);
        // Só o morador não aguenta preço salgado (é o que a dica do balcão diz).
        if (c.archetype !== 'morador' || profile.greedy) price = ask.high;
      }
      cmd({ type: 'SERVE_CUSTOMER', customerId: c.id, recipeId, ...(price !== undefined ? { price } : {}) });
      const still = s.customers.find((x) => x.id === c.id);
      if (still?.offer) cmd({ type: 'ACCEPT_OFFER', customerId: c.id });
    }
  };

  const setPrices = () => {
    for (const id of s.knownRecipes) {
      const { base } = priceRange(s, id);
      cmd({ type: 'SET_PRICE', recipeId: id, price: base * profile.priceFactor });
    }
  };

  for (let day = 1; day <= days; day++) {
    // Preparação: o caldeirão trabalha enquanto o jogador decide.
    setPrices();
    if (s.order && potionStock(s, s.order.recipeId) >= s.order.qty) cmd({ type: 'DELIVER_ORDER' });
    tryUpgrades();
    tryTalents();
    const prepMs = profile.prepS(day) * 1000;
    for (let t = 0; t < prepMs; t += STEP_MS) {
      tryBrew();
      cmd({ type: 'ADVANCE', ms: STEP_MS });
    }
    elapsedS += prepMs / 1000;
    cmd({ type: 'OPEN_SHOP' });
    while (s.phase === 'expediente') {
      if (s.order && potionStock(s, s.order.recipeId) >= s.order.qty) cmd({ type: 'DELIVER_ORDER' });
      if (!distracted()) tryBrew();
      serve();
      cmd({ type: 'ADVANCE', ms: STEP_MS });
      elapsedS += STEP_MS / 1000;
    }
    const report = s.reports.at(-1)!;
    out.push({ ...report, coinsEnd: s.coins, level: s.level, xp: s.xp, reputation: s.reputation, upgrades: [...s.upgrades], elapsedS });
    cmd({ type: 'START_NEXT_DAY' });
    setPrices();
    tryUpgrades();
  }
  return { days: out, firstUpgradeDay, firstAffordableDay };
}

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};

/** Mediana por dia de várias partidas simuladas. */
export function summarize(profile: BotProfile, days: number, seeds: number) {
  const runs = Array.from({ length: seeds }, (_, i) => simulate(profile, days, 1000 + i));
  const perDay = Array.from({ length: days }, (_, d) => {
    const col = runs.map((r) => r.days[d]);
    const m = (f: (x: DaySummary) => number) => median(col.map(f));
    return {
      dia: d + 1,
      receita: m((x) => x.revenue),
      pedidos: m((x) => x.orderRewards),
      ingred: m((x) => x.ingredientCost),
      manut: m((x) => x.maintenance),
      lucro: m((x) => x.profit),
      saldo: m((x) => x.coinsEnd),
      nivel: m((x) => x.level),
      xp: m((x) => x.xp),
      rep: m((x) => x.reputation),
      atend: m((x) => x.customersServed),
      perd: m((x) => x.customersLost),
      melhorias: m((x) => x.upgrades.length),
      minutos: +(m((x) => x.elapsedS) / 60).toFixed(1),
    };
  });
  const fu = runs.map((r) => r.firstUpgradeDay ?? 99);
  const fa = runs.map((r) => r.firstAffordableDay ?? 99);
  return { perDay, firstUpgradeDay: median(fu), firstAffordableDay: median(fa), firstUpgradeMin: Math.min(...fu), firstUpgradeMax: Math.max(...fu) };
}
