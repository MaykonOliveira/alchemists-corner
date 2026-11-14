// Gazeta da Vila e momentos especiais (E5).
// A Gazeta junta as notícias do dia anterior numa página para ler de manhã. Os momentos são
// visitas raras na cena: tocar dá um prêmio, ignorar não tira nada.
import type { GameSave, MomentKind } from '../models/types';
import type { Draft } from './context';
import { grantCrystals } from './entitlements';
import { evoRandom } from './evoCore';
import { grantEgg } from './familiars';
import { gainReputation } from './progression';
import { CLOSE_MIN, OPEN_MIN } from './time';

/** Chance de um momento especial no dia (a partir do dia 4). */
export const MOMENT_CHANCE = 0.35;
export const MOMENT_DAY = 4;
/** Quanto tempo (ms reais) o momento fica na cena. */
export const MOMENT_MS = 14_000;
export const MOMENT_KINDS: MomentKind[] = ['estrela', 'dragao', 'borboleta'];

/** Sorteia no começo do dia se haverá um momento e a que horas. */
export function rollMoment(d: Draft) {
  const s = d.s;
  s.evo.moment = null;
  s.evo.momentAt = null;
  if (s.day < MOMENT_DAY || evoRandom(s, 1) >= MOMENT_CHANCE) return;
  const span = CLOSE_MIN - OPEN_MIN - 120;
  s.evo.momentAt = Math.round(OPEN_MIN + 60 + evoRandom(s, 2) * span);
}

/** Avança o momento do dia: aparece na hora sorteada e vai embora depois de alguns segundos. */
export function advanceMoment(d: Draft, ms: number) {
  const s = d.s;
  const evo = s.evo;
  if (!evo) return;
  if (evo.moment) {
    evo.moment = { ...evo.moment, leftMs: evo.moment.leftMs - ms };
    if (evo.moment.leftMs <= 0) {
      d.events.push({ type: 'MOMENT_GONE', kind: evo.moment.kind });
      evo.moment = null;
    }
    return;
  }
  if (evo.momentAt !== null && s.phase === 'expediente' && s.clockMin >= evo.momentAt) {
    const kind = MOMENT_KINDS[Math.floor(evoRandom(s, 3) * MOMENT_KINDS.length)];
    evo.moment = { kind, leftMs: MOMENT_MS };
    evo.momentAt = null;
    d.events.push({ type: 'MOMENT_STARTED', kind });
  }
}

/** Prêmio de cada momento: estrela = cristais; dragão = ovo; borboleta = moedas e reputação. */
export function catchMoment(d: Draft): boolean {
  const s = d.s;
  const m = s.evo.moment;
  if (!m) return false;
  s.evo.moment = null;
  let coins = 0;
  let crystals = 0;
  let egg = false;
  if (m.kind === 'estrela') {
    crystals = 3;
    grantCrystals(d, crystals, 'estrela');
  } else if (m.kind === 'dragao') {
    egg = grantEgg(d, 'dragao');
    if (!egg) {
      crystals = 3;
      grantCrystals(d, crystals, 'dragao');
    }
  } else {
    coins = Math.max(100, Math.round(s.stats.revenue * 0.1));
    s.coins += coins;
    s.stats.revenue += coins;
    gainReputation(d, 5);
  }
  s.evo.news = [...s.evo.news, { kind: 'moment' as const, ref: m.kind }].slice(-20);
  d.events.push({ type: 'MOMENT_CAUGHT', kind: m.kind, coins, crystals, egg });
  return true;
}

/** Manhã: as notícias guardadas viram a Gazeta do dia anterior. */
export function printGazette(s: GameSave) {
  s.evo.gazette = { day: s.day - 1, items: s.evo.news, read: false };
  s.evo.news = [];
}

export function readGazette(d: Draft): boolean {
  const g = d.s.evo.gazette;
  if (!g || g.read) return false;
  d.s.evo.gazette = { ...g, read: true };
  return true;
}

/** Gazeta nova esperando leitura. */
export const gazetteUnread = (s: GameSave) => !!s.evo?.gazette && !s.evo.gazette.read && s.evo.gazette.day >= 1;
