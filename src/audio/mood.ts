// Decide o clima sonoro a partir do estado da partida. Sem WebAudio: funções puras, testáveis.
import type { GameEvent, GameSave } from '../domain/models/types';
import { seasonOf } from '../domain/rules/world';

export type ThemeId = 'primavera' | 'verao' | 'outono' | 'inverno' | 'noite' | 'festival' | 'misterio';

export interface Theme {
  id: ThemeId;
  name: string;
  bpm: number;
  /** Frequência da tônica (Hz). */
  root: number;
  /** Escala em semitons a partir da tônica. */
  mode: number[];
  /** Graus da escala que servem de base para cada compasso. */
  progression: number[];
  lead: OscillatorType;
  /** Probabilidade de uma nota da melodia em cada colcheia. */
  density: number;
  perc: 'none' | 'soft' | 'festa';
  /** Sino por cima da melodia (harmônico uma oitava acima). */
  bell?: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MIXO = [0, 2, 4, 5, 7, 9, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const HARM_MINOR = [0, 2, 3, 5, 7, 8, 11];

export const THEMES: Record<ThemeId, Theme> = {
  primavera: { id: 'primavera', name: 'Jardim em flor', bpm: 92, root: 293.66, mode: MAJOR, progression: [0, 3, 4, 0, 5, 3, 4, 4], lead: 'triangle', density: 0.55, perc: 'none', bell: true },
  verao: { id: 'verao', name: 'Estrada ensolarada', bpm: 108, root: 261.63, mode: MIXO, progression: [0, 6, 3, 0, 0, 6, 4, 4], lead: 'square', density: 0.6, perc: 'soft' },
  outono: { id: 'outono', name: 'Folhas e livros', bpm: 84, root: 220, mode: DORIAN, progression: [0, 3, 6, 4, 0, 3, 1, 4], lead: 'triangle', density: 0.5, perc: 'none' },
  inverno: { id: 'inverno', name: 'Noite de neve', bpm: 72, root: 246.94, mode: MINOR, progression: [0, 5, 2, 6, 0, 5, 3, 4], lead: 'sine', density: 0.42, perc: 'none', bell: true },
  noite: { id: 'noite', name: 'Lampiões acesos', bpm: 64, root: 196, mode: MINOR, progression: [0, 5, 3, 4], lead: 'sine', density: 0.3, perc: 'none', bell: true },
  festival: { id: 'festival', name: 'Festival das Lanternas', bpm: 124, root: 293.66, mode: MAJOR, progression: [0, 4, 5, 3, 0, 4, 3, 4], lead: 'square', density: 0.75, perc: 'festa' },
  misterio: { id: 'misterio', name: 'Céu estranho', bpm: 70, root: 220, mode: HARM_MINOR, progression: [0, 5, 3, 4], lead: 'triangle', density: 0.38, perc: 'none', bell: true },
};

export interface Mood {
  theme: ThemeId;
  /** Versão calma (preparação): mais lenta e com menos notas. */
  calm: boolean;
}

/** Hora (minutos do relógio) a partir da qual a loja entra no clima de noite. */
export const NIGHT_MIN = 18 * 60 + 30;

/** Qual música toca agora. */
export function moodFor(s: GameSave | null): Mood {
  if (!s) return { theme: 'primavera', calm: true };
  if (s.phase === 'fechamento') return { theme: 'noite', calm: true };
  if (s.event === 'festival') return { theme: 'festival', calm: s.phase === 'preparacao' };
  if (s.event === 'eclipse' || s.event === 'lua-cheia' || s.event === 'visitante') return { theme: 'misterio', calm: s.phase === 'preparacao' };
  if (s.phase === 'expediente' && s.clockMin >= NIGHT_MIN) return { theme: 'noite', calm: false };
  return { theme: seasonOf(s.day).id, calm: s.phase === 'preparacao' };
}

export type AmbienceLayer = 'chuva' | 'vento' | 'multidao' | 'passaros' | 'caldeirao' | 'lareira';

/** Camadas de ambiente que tocam agora. */
export function ambienceFor(s: GameSave | null): Set<AmbienceLayer> {
  const out = new Set<AmbienceLayer>();
  if (!s) return out;
  const season = seasonOf(s.day).id;
  const night = s.phase === 'fechamento' || s.clockMin >= NIGHT_MIN;
  if (s.event === 'chuva') out.add('chuva');
  if (season === 'inverno' || s.event === 'eclipse') out.add('vento');
  if (s.phase === 'expediente' && (s.event === 'feira' || s.event === 'festival' || s.event === 'caravana' || s.event === 'lua-cheia')) out.add('multidao');
  if ((season === 'primavera' || season === 'verao') && !night && s.event !== 'chuva' && s.event !== 'eclipse') out.add('passaros');
  if (s.brew || s.brew2) out.add('caldeirao');
  if (season === 'inverno' || season === 'outono' || night) out.add('lareira');
  return out;
}

/** Vibração (padrão do navigator.vibrate) para os momentos que merecem. */
export function vibrationFor(e: GameEvent): number | number[] | null {
  switch (e.type) {
    case 'SALE': return 12;
    case 'LEVEL_UP': return [30, 50, 30, 50, 80];
    case 'ACHIEVEMENT': return [20, 40, 40];
    case 'RIVAL_RESULT': return e.win ? [30, 40, 30, 40, 90] : null;
    case 'ORDER_DONE':
    case 'CONTRACT_DONE':
    case 'GOAL_DONE': return [25, 40, 50];
    case 'CHEST_OPENED': return [30, 40, 30, 40, 90];
    default: return null;
  }
}

/** Frequência de um grau da escala do tema (graus negativos descem oitavas). */
export function degreeFreq(t: Theme, degree: number, octave = 0) {
  const n = t.mode.length;
  const oct = Math.floor(degree / n) + octave;
  const step = ((degree % n) + n) % n;
  return t.root * 2 ** ((t.mode[step] + 12 * oct) / 12);
}
