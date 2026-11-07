import type { DayReport } from '../models/types';

export type Medal = 'ouro' | 'prata' | 'bronze' | null;

/** Medalha do dia: compara o lucro com a média dos 7 dias anteriores. */
export function dayMedal(reports: DayReport[]): { medal: Medal; record: boolean } {
  const today = reports.at(-1);
  if (!today) return { medal: null, record: false };
  const prev = reports.slice(0, -1);
  const recent = prev.slice(-7);
  const avg = recent.length ? recent.reduce((n, r) => n + r.profit, 0) / recent.length : 0;
  const record = prev.length > 0 && today.profit > 0 && today.profit > Math.max(...prev.map((r) => r.profit));
  let medal: Medal = null;
  if (today.profit > 0) medal = today.profit >= Math.max(avg * 1.3, avg + 20) ? 'ouro' : today.profit >= avg ? 'prata' : 'bronze';
  return { medal, record };
}

