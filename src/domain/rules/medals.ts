import type { DayReport } from '../models/types';

export type Medal = 'ouro' | 'prata' | 'bronze' | null;

/**
 * Lucro que vale ouro num dia do nível informado. A meta é fixa por nível (e não a sua média),
 * para que um dia ruim depois de outro ruim não ganhe prata por comparação.
 */
// Calibrada com o robô casual depois da demanda apertada (auditoria P0.4): ele lucra de 165 a 240 moedas
// por nível, então o ouro pede jogar melhor que a mediana, e a prata fica ao alcance de quem joga direito.
export const medalTarget = (level: number) => 200 * Math.max(1, level);
/** Fração da meta de ouro que vale prata. */
export const SILVER_SHARE = 0.6;

/** Medalha do dia: compara o lucro com a meta do nível (relatórios antigos, sem nível, usam a média dos 7 dias anteriores). */
export function dayMedal(reports: DayReport[]): { medal: Medal; record: boolean } {
  const today = reports.at(-1);
  if (!today) return { medal: null, record: false };
  const prev = reports.slice(0, -1);
  const recent = prev.slice(-7);
  const avg = recent.length ? recent.reduce((n, r) => n + r.profit, 0) / recent.length : 0;
  const record = prev.length > 0 && today.profit > 0 && today.profit > Math.max(...prev.map((r) => r.profit));
  let medal: Medal = null;
  if (today.profit > 0 && today.level !== undefined) {
    const target = medalTarget(today.level);
    medal = today.profit >= target ? 'ouro' : today.profit >= target * SILVER_SHARE ? 'prata' : 'bronze';
  } else if (today.profit > 0) medal = today.profit >= Math.max(avg * 1.3, avg + 20) ? 'ouro' : today.profit >= avg ? 'prata' : 'bronze';
  // Um dia em que muita gente saiu sem nada não é de ouro: cada faixa de clientes perdidos tira um degrau.
  const rate = serviceRate(today);
  const steps = rate < 0.4 ? 2 : rate < 0.65 ? 1 : 0;
  for (let i = 0; i < steps && medal; i++) medal = medal === 'ouro' ? 'prata' : 'bronze';
  return { medal, record };
}


/** Parte dos clientes do dia que saiu atendida (1 quando ninguém apareceu). */
export function serviceRate(r: DayReport): number {
  const total = r.customersServed + r.customersLost;
  return total === 0 ? 1 : r.customersServed / total;
}

/** Receita que mais fez falta no dia (a mais pedida por quem foi embora). */
export function mostMissed(r: DayReport): { recipeId: string; n: number } | null {
  const top = Object.entries(r.lostByRecipe ?? {}).sort((a, b) => b[1] - a[1])[0];
  return top ? { recipeId: top[0], n: top[1] } : null;
}
