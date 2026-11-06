import { SAVE_VERSION, type GameSave } from '../domain/models/types';
import { createNewGame } from '../domain/rules/initialState';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/**
 * Valida e migra um save lido do armazenamento.
 * Campos ausentes ou inválidos recebem os valores padrão de uma partida nova.
 * Retorna null quando o dado não é um save reconhecível.
 */
export function migrateSave(raw: unknown): GameSave | null {
  if (!isObj(raw) || typeof raw.saveVersion !== 'number') return null;
  if (raw.saveVersion > SAVE_VERSION) return null; // save de uma versão mais nova do jogo

  // Migrações futuras: if (raw.saveVersion === 1) raw = migrateV1toV2(raw) ...

  const base = createNewGame(num(raw.createdAt, Date.now()));
  const phase = raw.phase === 'preparacao' || raw.phase === 'expediente' || raw.phase === 'fechamento' ? raw.phase : base.phase;
  const settings = isObj(raw.settings) ? raw.settings : {};

  const ingredients: Record<string, number> = { ...base.ingredients };
  if (isObj(raw.ingredients)) {
    for (const [k, v] of Object.entries(raw.ingredients)) ingredients[k] = Math.max(0, num(v, 0));
  }

  return {
    saveVersion: SAVE_VERSION,
    createdAt: base.createdAt,
    updatedAt: num(raw.updatedAt, base.updatedAt),
    day: Math.max(1, num(raw.day, base.day)),
    phase,
    clockMin: num(raw.clockMin, base.clockMin),
    coins: Math.max(0, num(raw.coins, base.coins)),
    reputation: num(raw.reputation, base.reputation),
    level: Math.max(1, num(raw.level, base.level)),
    xp: Math.max(0, num(raw.xp, base.xp)),
    ingredients,
    potions: Array.isArray(raw.potions) ? (raw.potions as GameSave['potions']) : base.potions,
    knownRecipes: Array.isArray(raw.knownRecipes) ? (raw.knownRecipes as string[]) : base.knownRecipes,
    upgrades: Array.isArray(raw.upgrades) ? (raw.upgrades as string[]) : base.upgrades,
    reports: Array.isArray(raw.reports) ? (raw.reports as GameSave['reports']) : base.reports,
    settings: {
      volume: num(settings.volume, base.settings.volume),
      muted: typeof settings.muted === 'boolean' ? settings.muted : base.settings.muted,
      reduceMotion: typeof settings.reduceMotion === 'boolean' ? settings.reduceMotion : base.settings.reduceMotion,
    },
  };
}
