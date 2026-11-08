// Medição do funil (pacote L): eventos anônimos guardados só neste aparelho.
// Nada sai do navegador. O painel "Números deste aparelho" (Configurações) mostra o resultado,
// e `funnel.export()` devolve o resumo para quem quiser ligar um serviço de estatísticas sem cookies no futuro.

const KEY = 'ac-funnel-v1';
const DAY_MS = 86_400_000;

export type FunnelStep = 'new_game' | 'story_done' | 'first_sale' | 'day1_done' | 'level_3' | 'level_5' | 'first_decor' | 'shared_card' | 'gift_sent';

interface FunnelData {
  /** Id aleatório deste aparelho (não identifica a pessoa). */
  id: string;
  firstOpen: number;
  steps: Partial<Record<FunnelStep, number>>;
  /** Dias (desde a primeira abertura) em que o jogo foi aberto. */
  days: number[];
  sessions: number;
}

function load(): FunnelData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FunnelData) : null;
  } catch {
    return null;
  }
}

function store(d: FunnelData) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* armazenamento bloqueado: segue sem medir */ }
}

function data(now = Date.now()): FunnelData {
  return load() ?? { id: Math.random().toString(36).slice(2, 10), firstOpen: now, steps: {}, days: [0], sessions: 0 };
}

export interface FunnelSummary {
  firstOpen: number;
  sessions: number;
  /** Segundos entre a partida nova e a primeira venda. */
  secondsToFirstSale: number | null;
  steps: Partial<Record<FunnelStep, number>>;
  /** Voltou no dia seguinte à primeira abertura (D1) e depois de 7 dias (D7). */
  d1: boolean;
  d7: boolean;
  activeDays: number;
}

export const funnel = {
  /** Marca a primeira vez que um passo acontece. */
  mark(step: FunnelStep, now = Date.now()) {
    const d = data(now);
    if (d.steps[step]) return;
    d.steps[step] = now;
    store(d);
  },
  /** Uma abertura do jogo (conta os dias ativos para D1 e D7). */
  session(now = Date.now()) {
    const d = data(now);
    const day = Math.floor((now - d.firstOpen) / DAY_MS);
    if (!d.days.includes(day)) d.days = [...d.days, day].slice(-60);
    d.sessions += 1;
    store(d);
  },
  summary(now = Date.now()): FunnelSummary {
    const d = data(now);
    const start = d.steps.new_game;
    const sale = d.steps.first_sale;
    return {
      firstOpen: d.firstOpen,
      sessions: d.sessions,
      secondsToFirstSale: start && sale && sale >= start ? Math.round((sale - start) / 1000) : null,
      steps: d.steps,
      d1: d.days.includes(1),
      d7: d.days.some((x) => x >= 7),
      activeDays: d.days.length,
    };
  },
  reset() {
    try { localStorage.removeItem(KEY); } catch { /* nada a fazer */ }
  },
};
