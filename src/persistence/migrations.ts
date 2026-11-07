import { SAVE_VERSION, type GameSave } from '../domain/models/types';
import { createNewGame } from '../domain/rules/initialState';
import { MAX_LEVEL, unlockRecipesUpTo, xpForLevel } from '../domain/rules/progression';
import { DAY_EVENTS } from '../domain/data/orders';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
const numRecord = (v: unknown, base: Record<string, number>) => {
  const out = { ...base };
  if (isObj(v)) for (const [k, x] of Object.entries(v)) out[k] = Math.max(0, num(x, out[k] ?? 0));
  return out;
};

/**
 * Valida e migra um save lido do armazenamento.
 * Campos ausentes ou inválidos recebem os valores padrão de uma partida nova.
 * Retorna null quando o dado não é um save reconhecível.
 */
export function migrateSave(raw: unknown): GameSave | null {
  if (!isObj(raw) || typeof raw.saveVersion !== 'number') return null;
  if (raw.saveVersion > SAVE_VERSION || raw.saveVersion < 1) return null;

  // v1 → v2: entraram preços, clientes, caldeirão, fornecedor, pedidos e tutorial.
  // v2 → v3: entraram os ajudantes automáticos (helpers) e o trabalho deles no relatório.
  // v3 → v4: late game (níveis 11 a 15, maestria das receitas e talentos do Grimório do Mestre).
  // v4 → v5: contratos de vários dias e expansão da loja (segundo caldeirão).
  // Os campos novos recebem os valores padrão abaixo.

  const base = createNewGame(num(raw.createdAt, Date.now()));
  const level = Math.max(1, num(raw.level, base.level));
  const phase = raw.phase === 'preparacao' || raw.phase === 'expediente' || raw.phase === 'fechamento' ? raw.phase : base.phase;
  const settings = isObj(raw.settings) ? raw.settings : {};
  const supplier: GameSave['supplier'] = { ...base.supplier };
  if (isObj(raw.supplier)) for (const [k, v] of Object.entries(raw.supplier)) supplier[k] = v === null ? null : Math.max(0, num(v, 0));

  // Até a v3 o nível máximo era 10 e a XP seguia acumulando sem efeito. Ela fica guardada até a
  // porta do nível 11, para a próxima venda já subir de nível.
  let xp = Math.max(xpForLevel(level), num(raw.xp, base.xp));
  if (raw.saveVersion < 4 && level < MAX_LEVEL) xp = Math.min(xp, xpForLevel(level + 1) - 1);

  // Maestria inicial para saves antigos: estimada pelas vendas dos relatórios guardados.
  const mastery: Record<string, number> = {};
  if (isObj(raw.mastery)) for (const [k, v] of Object.entries(raw.mastery)) mastery[k] = Math.max(0, Math.floor(num(v, 0)));
  else if (Array.isArray(raw.reports)) {
    for (const r of raw.reports) {
      if (!isObj(r) || !isObj(r.salesByRecipe)) continue;
      for (const [k, v] of Object.entries(r.salesByRecipe)) mastery[k] = (mastery[k] ?? 0) + Math.max(0, Math.floor(num(v, 0)));
    }
  }
  const talents: Record<string, number> = {};
  if (isObj(raw.talents)) for (const [k, v] of Object.entries(raw.talents)) talents[k] = Math.max(0, Math.floor(num(v, 0)));

  const save: GameSave = {
    saveVersion: SAVE_VERSION,
    createdAt: base.createdAt,
    updatedAt: num(raw.updatedAt, base.updatedAt),
    day: Math.max(1, Math.floor(num(raw.day, base.day))),
    phase,
    clockMin: num(raw.clockMin, base.clockMin),
    coins: Math.max(0, num(raw.coins, base.coins)),
    reputation: Math.max(0, num(raw.reputation, base.reputation)),
    level,
    // A curva de XP mudou no rebalanceamento: saves antigos mantêm o nível e começam no piso dele.
    xp,
    ingredients: numRecord(raw.ingredients, base.ingredients),
    potions: arr(raw.potions, base.potions).filter((p) => isObj(p) && typeof p.recipeId === 'string' && num(p.quantity, 0) > 0),
    prices: numRecord(raw.prices, base.prices),
    knownRecipes: arr(raw.knownRecipes, base.knownRecipes),
    upgrades: arr(raw.upgrades, base.upgrades),
    helpers: {
      off: isObj(raw.helpers) ? arr<string>(raw.helpers.off, []).filter((x) => typeof x === 'string') : [],
      ravenInMs: isObj(raw.helpers) ? num(raw.helpers.ravenInMs, base.helpers.ravenInMs) : base.helpers.ravenInMs,
      golemInMs: isObj(raw.helpers) ? num(raw.helpers.golemInMs, 0) : 0,
    },
    brew: isObj(raw.brew) ? (raw.brew as unknown as GameSave['brew']) : null,
    brew2: isObj(raw.brew2) ? (raw.brew2 as unknown as GameSave['brew2']) : null,
    customers: arr(raw.customers, []),
    spawnInMs: num(raw.spawnInMs, base.spawnInMs),
    supplier,
    order: isObj(raw.order) ? (raw.order as unknown as GameSave['order']) : null,
    contract: isObj(raw.contract) && Array.isArray(raw.contract.items) ? (raw.contract as unknown as GameSave['contract']) : null,
    nextContractDay: num(raw.nextContractDay, 1),
    contractsDone: Math.max(0, Math.floor(num(raw.contractsDone, 0))),
    contractSeals: Math.max(0, Math.floor(num(raw.contractSeals, 0))),
    event: typeof raw.event === 'string' && raw.event in DAY_EVENTS ? (raw.event as GameSave['event']) : null,
    stats: isObj(raw.stats)
      ? { ...base.stats, ...(raw.stats as object), helperWork: { ...base.stats.helperWork, ...(isObj(raw.stats.helperWork) ? raw.stats.helperWork : {}) } }
      : base.stats,
    reports: arr(raw.reports, base.reports),
    researchPoints: num(raw.researchPoints, 0),
    mastery,
    talents,
    sealsBought: Math.max(0, Math.floor(num(raw.sealsBought, 0))),
    festivalSponsored: bool(raw.festivalSponsored, false),
    tutorialStep: num(raw.tutorialStep, raw.saveVersion === 1 ? 99 : 0),
    seq: num(raw.seq, 0),
    settings: {
      volume: num(settings.volume, base.settings.volume),
      muted: bool(settings.muted, base.settings.muted),
      music: bool(settings.music, base.settings.music),
      reduceMotion: bool(settings.reduceMotion, base.settings.reduceMotion),
    },
  };
  // Receitas de níveis que o jogador já alcançou (as novas dos níveis 6 a 10 entram direto).
  unlockRecipesUpTo(save, save.level);
  return save;
}
