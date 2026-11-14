// Contas puras das evoluções (E1 a E4), sem depender de outras regras: economia, clientes e
// caldeirão importam daqui sem criar ciclos.
import { FAMILIARS_BY_ID, SHINY_FACTOR, type FamiliarBonus } from '../data/familiars';
import { PERK_LEVELS, STAFF_BASE_CAP, STAFF_MAX_LEVEL } from '../data/staff';
import type { EvoState, GameSave, PerkSide, StaffMember } from '../models/types';

export const emptyEvo = (): EvoState => ({
  staff: {},
  dayWork: {},
  fairy: { strategy: 'lucro', locked: [], inMs: 4000 },
  peddlerInMs: 20000,
  branches: {},
  eggs: [],
  eggSeq: 0,
  eggDay: 0,
  familiars: [],
  shiny: [],
  activeFamiliars: [],
  moment: null,
  momentAt: null,
  news: [],
  gazette: null,
});

/** Experiência total para chegar ao nível n (nível 1 = 0). 50, 150, 300, 500... até 2250 no nível 10. */
export const staffXpFor = (level: number) => 25 * (level - 1) * level;

export const memberOf = (s: GameSave, id: string): StaffMember | null => s.evo?.staff[id] ?? null;

/** Nível do funcionário (1 a 10), limitado pelo teto liberado nos cursos. */
export function staffLevel(s: GameSave, id: string): number {
  const m = memberOf(s, id);
  if (!m) return 1;
  let lvl = 1;
  while (lvl < STAFF_MAX_LEVEL && m.xp >= staffXpFor(lvl + 1)) lvl++;
  return Math.min(lvl, m.cap ?? STAFF_BASE_CAP);
}

/** Nível que a experiência já alcançou (pode passar do teto: falta o curso). */
export function staffLevelUncapped(s: GameSave, id: string): number {
  const m = memberOf(s, id);
  if (!m) return 1;
  let lvl = 1;
  while (lvl < STAFF_MAX_LEVEL && m.xp >= staffXpFor(lvl + 1)) lvl++;
  return lvl;
}

/** Quantas vezes o jogador escolheu cada lado. */
export function perkCount(s: GameSave, id: string, side: PerkSide): number {
  return (memberOf(s, id)?.perks ?? []).filter((p) => p === side).length;
}

/** Escolhas de caminho em aberto (níveis 3, 6 e 9 alcançados sem escolha). */
export function pendingPerks(s: GameSave, id: string): number {
  const lvl = staffLevel(s, id);
  const due = PERK_LEVELS.filter((l) => lvl >= l).length;
  return Math.max(0, due - (memberOf(s, id)?.perks.length ?? 0));
}

/** Multiplicador de rapidez (lado a): +15% por escolha. */
export const staffSpeed = (s: GameSave, id: string) => 1 + 0.15 * perkCount(s, id, 'a');

/** Insígnia do uniforme: 0 (nenhuma), 1 bronze (nível 3), 2 prata (6), 3 ouro (9). */
export const staffTier = (s: GameSave, id: string) => PERK_LEVELS.filter((l) => staffLevel(s, id) >= l).length;

/**
 * Sorteio próprio das evoluções (0..1), calculado do save: não consome os números do sorteio
 * principal, então o resto do jogo (clientes, eventos) sorteia igual com ou sem as evoluções.
 */
export function evoRandom(s: GameSave, salt: number): number {
  let h = (Math.floor(s.createdAt) ^ (s.day * 2654435761) ^ (salt * 40503) ^ ((s.evo?.eggSeq ?? 0) * 97)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

// ------------------------------------------------------------------ familiares

/** Bônus somado dos familiares ativos (a versão brilhante vale 50% a mais). */
export function famBonus(s: GameSave, kind: FamiliarBonus): number {
  const evo = s.evo;
  if (!evo) return 0;
  let n = 0;
  for (const id of evo.activeFamiliars) {
    const f = FAMILIARS_BY_ID[id];
    if (f?.bonus === kind) n += f.value * (evo.shiny.includes(id) ? SHINY_FACTOR : 1);
  }
  return n;
}
