import type { GameEvent, GameSave } from '../models/types';

/** Dependências externas das regras, injetadas para manter as funções determinísticas nos testes. */
export interface RuleContext {
  now: number;
  random: () => number;
}

/** Rascunho mutável usado durante a aplicação de um comando. */
export interface Draft {
  s: GameSave;
  events: GameEvent[];
  ctx: RuleContext;
}

export const pick = <T,>(arr: readonly T[], random: () => number): T => arr[Math.floor(random() * arr.length) % arr.length];

export function weightedPick<T extends string>(weights: Record<T, number>, random: () => number): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((n, [, w]) => n + w, 0);
  let r = random() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries[entries.length - 1][0];
}

export function nextId(d: Draft, prefix: string) {
  d.s.seq += 1;
  return `${prefix}-${d.s.seq}`;
}

export function fail(d: Draft, message: string): false {
  d.events.push({ type: 'ERROR', message });
  return false;
}
