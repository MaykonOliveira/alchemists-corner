import { SAVE_VERSION, type GameSave } from '../domain/models/types';
import { createNewGame } from '../domain/rules/initialState';

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
  // Os campos novos recebem os valores padrão abaixo.

  const base = createNewGame(num(raw.createdAt, Date.now()));
  const phase = raw.phase === 'preparacao' || raw.phase === 'expediente' || raw.phase === 'fechamento' ? raw.phase : base.phase;
  const settings = isObj(raw.settings) ? raw.settings : {};
  const supplier: GameSave['supplier'] = { ...base.supplier };
  if (isObj(raw.supplier)) for (const [k, v] of Object.entries(raw.supplier)) supplier[k] = v === null ? null : Math.max(0, num(v, 0));

  return {
    saveVersion: SAVE_VERSION,
    createdAt: base.createdAt,
    updatedAt: num(raw.updatedAt, base.updatedAt),
    day: Math.max(1, Math.floor(num(raw.day, base.day))),
    phase,
    clockMin: num(raw.clockMin, base.clockMin),
    coins: Math.max(0, num(raw.coins, base.coins)),
    reputation: Math.max(0, num(raw.reputation, base.reputation)),
    level: Math.max(1, num(raw.level, base.level)),
    xp: Math.max(0, num(raw.xp, base.xp)),
    ingredients: numRecord(raw.ingredients, base.ingredients),
    potions: arr(raw.potions, base.potions).filter((p) => isObj(p) && typeof p.recipeId === 'string' && num(p.quantity, 0) > 0),
    prices: numRecord(raw.prices, base.prices),
    knownRecipes: arr(raw.knownRecipes, base.knownRecipes),
    upgrades: arr(raw.upgrades, base.upgrades),
    brew: isObj(raw.brew) ? (raw.brew as unknown as GameSave['brew']) : null,
    customers: arr(raw.customers, []),
    spawnInMs: num(raw.spawnInMs, base.spawnInMs),
    supplier,
    order: isObj(raw.order) ? (raw.order as unknown as GameSave['order']) : null,
    event: raw.event === 'feira' || raw.event === 'caravana' || raw.event === 'chuva' ? raw.event : null,
    stats: isObj(raw.stats) ? { ...base.stats, ...(raw.stats as object) } : base.stats,
    reports: arr(raw.reports, base.reports),
    researchPoints: num(raw.researchPoints, 0),
    tutorialStep: num(raw.tutorialStep, raw.saveVersion === 1 ? 99 : 0),
    seq: num(raw.seq, 0),
    settings: {
      volume: num(settings.volume, base.settings.volume),
      muted: bool(settings.muted, base.settings.muted),
      music: bool(settings.music, base.settings.music),
      reduceMotion: bool(settings.reduceMotion, base.settings.reduceMotion),
    },
  };
}
