// Recordes pessoais (pacote X): pequenas vitórias que voltam todo dia, mesmo no fim de jogo.
import type { DayReport, GameSave, RecordKind, Records } from '../models/types';
import type { Draft } from './context';

import { tr } from '../../i18n';
/** A partir deste dia os recordes começam a ser comemorados (antes disso todo dia seria recorde). */
export const RECORD_FROM_DAY = 4;

export const RECORD_LABEL: Record<RecordKind, string> = {
  revenue: tr('Maior faturamento num dia'),
  served: tr('Mais clientes atendidos num dia'),
  bestSale: tr('Venda mais cara'),
};

export const emptyRecords = (): Records => ({ revenue: 0, served: 0, bestSale: 0 });

/** Recordes de um save antigo, tirados dos relatórios guardados (para não comemorar à toa no primeiro dia). */
export function recordsFromReports(reports: DayReport[]): Records {
  return {
    revenue: Math.max(0, ...reports.map((r) => Number(r.revenue) || 0)),
    served: Math.max(0, ...reports.map((r) => Number(r.customersServed) || 0)),
    bestSale: 0,
  };
}

const celebrate = (s: GameSave, prev: number) => s.day >= RECORD_FROM_DAY && prev > 0;

/** Venda feita: confere a venda mais cara. */
export function noteSale(d: Draft, price: number) {
  const s = d.s;
  const prev = s.records.bestSale;
  if (price <= prev) return;
  s.records = { ...s.records, bestSale: price };
  if (celebrate(s, prev)) d.events.push({ type: 'RECORD', kind: 'bestSale', value: price, prev });
}

/** Fechamento: confere faturamento e clientes do dia. Retorna os recordes batidos. */
export function noteDay(d: Draft, report: DayReport): RecordKind[] {
  const s = d.s;
  const broken: RecordKind[] = [];
  const check = (kind: 'revenue' | 'served', value: number) => {
    const prev = s.records[kind];
    if (value <= prev) return;
    s.records = { ...s.records, [kind]: value };
    if (celebrate(s, prev)) {
      broken.push(kind);
      d.events.push({ type: 'RECORD', kind, value, prev });
    }
  };
  check('revenue', report.revenue);
  check('served', report.customersServed);
  return broken;
}
