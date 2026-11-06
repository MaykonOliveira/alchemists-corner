import type { GameEvent } from '../domain/models/types';

type Listener = (e: GameEvent) => void;
const listeners = new Set<Listener>();

/** Canal de eventos visuais/sonoros. Ninguém altera regras a partir daqui. */
export const gameEvents = {
  on(fn: Listener) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  emit(events: GameEvent[]) {
    for (const e of events) for (const fn of listeners) fn(e);
  },
};
