import type { TimeOfDay } from '../models/types';

export const OPEN_MIN = 8 * 60;
export const CLOSE_MIN = 20 * 60;
/** Minutos de jogo que passam a cada segundo real durante o expediente (~6 min reais por dia). */
export const GAME_MIN_PER_SECOND = 2;

export function timeOfDay(clockMin: number): TimeOfDay {
  if (clockMin < 12 * 60) return 'manha';
  if (clockMin < 17 * 60) return 'tarde';
  return 'noite';
}

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export function formatClock(clockMin: number): string {
  const h = Math.floor(clockMin / 60) % 24;
  const m = Math.floor(clockMin % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Fração do expediente já percorrida (0..1). */
export function dayProgress(clockMin: number): number {
  return Math.min(1, Math.max(0, (clockMin - OPEN_MIN) / (CLOSE_MIN - OPEN_MIN)));
}
