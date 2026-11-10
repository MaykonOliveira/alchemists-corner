import { RECIPES_BY_ID } from '../domain/data/recipes';
import type { GameEvent, GameSave, Settings } from '../domain/models/types';
import { dayMedal } from '../domain/rules/medals';
import { gameEvents } from '../game/events';
import { useGameStore } from '../store/gameStore';
import { ambienceFor, degreeFreq, moodFor, THEMES, vibrationFor, type AmbienceLayer, type Mood, type Theme } from './mood';

import { tr } from '../i18n';
/**
 * Som do jogo, todo sintetizado com WebAudio (nenhum arquivo, nenhum direito autoral):
 * - trilha que muda com a estação, a hora e os eventos, com troca suave entre os temas;
 * - camadas de ambiente (chuva, vento, burburinho, passarinhos, caldeirão e lareira);
 * - efeitos de recompensa e um mixer com volumes separados.
 */
let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let themeGain: GainNode;
let sfxBus: GainNode;
let ambBus: GainNode;
let reverbSend: GainNode;
let noise: AudioBuffer;
let out: AudioNode;

const save = (): GameSave | null => useGameStore.getState().save;
const settings = (): Settings | undefined => save()?.settings;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  musicBus = ctx.createGain();
  themeGain = ctx.createGain();
  sfxBus = ctx.createGain();
  ambBus = ctx.createGain();
  // Um pouco de eco de sala: reverberação curta feita com ruído que decai.
  const reverb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.8);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  reverb.buffer = ir;
  reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.35;
  reverbSend.connect(reverb).connect(master);
  themeGain.connect(musicBus);
  musicBus.connect(master);
  musicBus.connect(reverbSend);
  sfxBus.connect(master);
  ambBus.connect(master);
  // Compressor na saída: deixa tudo mais cheio sem estourar quando vários sons tocam juntos.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  comp.attack.value = 0.005;
  comp.release.value = 0.25;
  out = master.connect(comp);
  out.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  applySettings();
  startScheduler();
  return ctx;
}

// ------------------------------------------------------------------ mixer

const MUSIC_LEVEL = 2.1;
const SFX_LEVEL = 2.2;
const AMB_LEVEL = 2.0;

function applySettings() {
  const s = settings();
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(s?.volume ?? 0.7, t, 0.05);
  sfxBus.gain.setTargetAtTime(s?.muted ? 0 : SFX_LEVEL * (s?.sfxVolume ?? 0.8), t, 0.05);
  musicBus.gain.setTargetAtTime(s?.music ? MUSIC_LEVEL * (s?.musicVolume ?? 0.6) : 0, t, 0.3);
  ambBus.gain.setTargetAtTime(AMB_LEVEL * (s?.ambienceVolume ?? 0.5), t, 0.3);
}

/** Abaixa a música um instante para a fanfarra aparecer. */
function duck(seconds = 1.2) {
  if (!ctx) return;
  const t = ctx.currentTime;
  themeGain.gain.cancelScheduledValues(t);
  themeGain.gain.setTargetAtTime(0.35, t, 0.05);
  themeGain.gain.setTargetAtTime(1, t + seconds, 0.4);
}

// ----------------------------------------------------------------- vozes

interface VoiceOpts {
  type?: OscillatorType;
  gain?: number;
  bus?: AudioNode;
  attack?: number;
  slideTo?: number;
  cutoff?: number;
  detune?: number;
}

function voice(freq: number, start: number, dur: number, o: VoiceOpts = {}) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, start);
  if (o.detune) osc.detune.value = o.detune;
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, start + dur);
  const peak = o.gain ?? 0.2;
  const attack = o.attack ?? 0.01;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  let node: AudioNode = osc;
  if (o.cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.cutoff;
    node = osc.connect(f);
  }
  node.connect(g).connect(o.bus ?? sfxBus);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function noiseHit(start: number, dur: number, o: { gain?: number; bus?: AudioNode; type?: BiquadFilterType; freq?: number; q?: number } = {}) {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'highpass';
  f.frequency.value = o.freq ?? 6000;
  f.Q.value = o.q ?? 0.7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.gain ?? 0.1, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(o.bus ?? sfxBus);
  src.start(start, Math.random() * 1.5);
  src.stop(start + dur + 0.05);
}

// ----------------------------------------------------------------- música

let mood: Mood | null = null;
let theme: Theme = THEMES.primavera;
let calm = true;
let nextStep = 0;
let step = 0;
let motif: (number | null)[] = [];
let switching = false;

/** Cria um motivo de 2 compassos (16 colcheias) que se repete com pequenas variações. */
function newMotif() {
  const d = theme.density * (calm ? 0.6 : 1);
  let deg = 2 + Math.floor(Math.random() * 3);
  motif = Array.from({ length: 16 }, (_, i) => {
    if (i % 2 === 1 && Math.random() > d * 0.7) return null;
    if (i % 2 === 0 && Math.random() > d + 0.2) return null;
    deg += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
    deg = Math.max(0, Math.min(9, deg));
    return deg;
  });
}

function playStep(at: number) {
  const bar = Math.floor(step / 8);
  const s8 = step % 8;
  const chord = theme.progression[bar % theme.progression.length];
  const beat = 60 / (theme.bpm * (calm ? 0.8 : 1)) / 2;
  if (s8 === 0) {
    // Pad: tríade longa e macia
    for (const k of [0, 2, 4]) voice(degreeFreq(theme, chord + k, -1), at, beat * 8.4, { type: 'sine', gain: 0.045, attack: 0.5, bus: themeGain });
    // A cada ciclo da progressão, um motivo novo
    if (bar % theme.progression.length === 0 && step % 16 === 0) newMotif();
  }
  // Baixo
  if (s8 === 0 || (s8 === 4 && !calm)) voice(degreeFreq(theme, chord, -2), at, beat * 3.5, { type: 'triangle', gain: 0.14, bus: themeGain, cutoff: 600 });
  // Melodia: motivo transposto para o acorde do compasso
  const m = motif[step % 16];
  if (m !== null && m !== undefined) {
    const deg = m + (chord % 3);
    const f = degreeFreq(theme, deg, 0);
    voice(f, at, beat * (Math.random() < 0.3 ? 3 : 1.8), { type: theme.lead, gain: theme.lead === 'square' ? 0.045 : 0.09, bus: themeGain, cutoff: theme.lead === 'square' ? 2200 : undefined });
    if (theme.bell && Math.random() < 0.25) voice(f * 2, at, beat * 4, { type: 'sine', gain: 0.03, bus: themeGain });
  }
  // Percussão leve
  if (!calm && theme.perc !== 'none') {
    if (theme.perc === 'festa' && (s8 === 0 || s8 === 4)) voice(130, at, 0.18, { type: 'sine', gain: 0.25, slideTo: 45, bus: themeGain });
    if (s8 % 2 === 1) noiseHit(at, 0.05, { gain: theme.perc === 'festa' ? 0.05 : 0.025, bus: themeGain });
    if (theme.perc === 'festa' && s8 === 6) noiseHit(at, 0.12, { gain: 0.05, bus: themeGain, type: 'bandpass', freq: 3500, q: 3 });
  }
}

function updateMood() {
  if (!ctx) return;
  const want = moodFor(save());
  if (mood && want.theme === mood.theme && want.calm === mood.calm) return;
  const first = !mood;
  mood = want;
  if (first) {
    theme = THEMES[want.theme];
    calm = want.calm;
    newMotif();
    return;
  }
  if (switching) return;
  // Troca suave: abaixa o tema atual, troca e sobe o novo.
  switching = true;
  const t = ctx.currentTime;
  themeGain.gain.cancelScheduledValues(t);
  themeGain.gain.setTargetAtTime(0.0001, t, 0.4);
  setTimeout(() => {
    const m = mood!;
    theme = THEMES[m.theme];
    calm = m.calm;
    step = 0;
    newMotif();
    if (ctx) themeGain.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
    switching = false;
  }, 1500);
}

/** Tema que está tocando (para mostrar nas configurações). */
export const nowPlaying = () => (mood ? `${THEMES[mood.theme].name}${mood.calm ? tr(' (calma)') : ''}` : null);

// --------------------------------------------------------------- ambiente

interface Layer {
  gain: GainNode;
  level: number;
}
const layers = new Map<AmbienceLayer, Layer>();

function loopNoise(filter: (f: BiquadFilterNode) => void, level: number) {
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx!.createBiquadFilter();
  filter(f);
  const g = ctx!.createGain();
  g.gain.value = 0;
  src.connect(f).connect(g).connect(ambBus);
  src.start();
  return { gain: g, level, filter: f };
}

function createLayers() {
  const c = ctx!;
  layers.set('chuva', loopNoise((f) => { f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 0.4; }, 0.22));
  const wind = loopNoise((f) => { f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 6; }, 0.16);
  // O vento sobe e desce devagar
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain).connect(wind.filter.frequency);
  lfo.start();
  layers.set('vento', wind);
  layers.set('multidao', loopNoise((f) => { f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 1.2; }, 0.2));
  // Camadas feitas de sons curtos (tocadas pelo agendador): só guardam o volume
  for (const id of ['passaros', 'caldeirao', 'lareira'] as AmbienceLayer[]) {
    const g = c.createGain();
    g.gain.value = 0;
    g.connect(ambBus);
    layers.set(id, { gain: g, level: 1 });
  }
}

let ambNext = { passaros: 0, caldeirao: 0, lareira: 0, chuva: 0, multidao: 0 };

function updateAmbience(now: number) {
  if (!ctx) return;
  if (!layers.size) createLayers();
  const on = ambienceFor(save());
  for (const [id, l] of layers) l.gain.gain.setTargetAtTime(on.has(id) ? l.level : 0, now, 0.8);
  const r = Math.random;
  if (on.has('passaros') && now > ambNext.passaros) {
    const g = layers.get('passaros')!.gain;
    const base = 2200 + r() * 1400;
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) voice(base * (1 + r() * 0.15), now + i * 0.11, 0.09, { gain: 0.05, slideTo: base * 1.35, bus: g });
    ambNext.passaros = now + 2 + r() * 5;
  }
  if (on.has('caldeirao') && now > ambNext.caldeirao) {
    const g = layers.get('caldeirao')!.gain;
    const f = 140 + r() * 120;
    voice(f, now, 0.14, { gain: 0.12, slideTo: f * 2.2, bus: g, cutoff: 900 });
    ambNext.caldeirao = now + 0.35 + r() * 0.9;
  }
  if (on.has('lareira') && now > ambNext.lareira) {
    const g = layers.get('lareira')!.gain;
    noiseHit(now, 0.03 + r() * 0.04, { gain: 0.08 + r() * 0.08, bus: g, type: 'bandpass', freq: 1500 + r() * 2500, q: 2 });
    ambNext.lareira = now + 0.08 + r() * 0.5;
  }
  if (on.has('chuva') && now > ambNext.chuva) {
    noiseHit(now, 0.02, { gain: 0.06, bus: layers.get('chuva')!.gain, type: 'bandpass', freq: 4000 + r() * 3000, q: 4 });
    ambNext.chuva = now + 0.03 + r() * 0.12;
  }
  if (on.has('multidao') && now > ambNext.multidao) {
    // Vozes ao longe: murmúrios graves que sobem e descem
    const f = 160 + r() * 140;
    voice(f, now, 0.35 + r() * 0.3, { type: 'sawtooth', gain: 0.012, slideTo: f * (0.8 + r() * 0.5), bus: ambBus, cutoff: 700, attack: 0.08 });
    ambNext.multidao = now + 0.15 + r() * 0.4;
  }
}

// -------------------------------------------------------------- agendador

let scheduler: ReturnType<typeof setInterval> | null = null;
let lastMoodCheck = 0;

function startScheduler() {
  if (scheduler || !ctx) return;
  nextStep = ctx.currentTime + 0.1;
  scheduler = setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - lastMoodCheck > 0.5) {
      lastMoodCheck = now;
      updateMood();
      updateAmbience(now);
    }
    const s = settings();
    const beat = 60 / (theme.bpm * (calm ? 0.8 : 1)) / 2;
    if (nextStep < now) nextStep = now + 0.05;
    while (nextStep < now + 0.15) {
      if (s?.music !== false && !switching) playStep(nextStep);
      nextStep += beat;
      step++;
    }
  }, 40);
}

// ---------------------------------------------------------------- efeitos

const at = () => (ensure() ? ctx!.currentTime : null);

export const sfx = {
  click() {
    const t = at();
    if (t !== null) voice(660, t, 0.06, { type: 'triangle', gain: 0.1 });
  },
  coin() {
    const t = at();
    if (t === null) return;
    voice(988, t, 0.09, { type: 'square', gain: 0.07, cutoff: 4000 });
    voice(1319, t + 0.08, 0.25, { type: 'square', gain: 0.07, cutoff: 4000 });
  },
  /** Venda acima do preço-base: moeda com brilho dourado. */
  bigCoin() {
    const t = at();
    if (t === null) return;
    sfx.coin();
    [1568, 2093, 2637, 3136].forEach((f, i) => voice(f, t + 0.16 + i * 0.045, 0.35, { type: 'sine', gain: 0.05 }));
  },
  bell() {
    const t = at();
    if (t === null) return;
    voice(1568, t, 0.6, { gain: 0.13 });
    voice(2093, t + 0.02, 0.5, { gain: 0.06 });
  },
  bubble() {
    const t = at();
    if (t === null) return;
    for (let i = 0; i < 3; i++) voice(300 + i * 80, t + i * 0.07, 0.12, { gain: 0.1, slideTo: 700 + i * 120 });
  },
  sparkle() {
    const t = at();
    if (t === null) return;
    [1047, 1319, 1568, 2093].forEach((f, i) => voice(f, t + i * 0.06, 0.3, { type: 'triangle', gain: 0.07 }));
  },
  /** Subida de nível: fanfarra com acorde e arpejo. */
  fanfare() {
    const t = at();
    if (t === null) return;
    duck(1.8);
    [523, 659, 784, 1047].forEach((f, i) => voice(f, t + i * 0.1, 0.3, { type: 'square', gain: 0.06, cutoff: 3000 }));
    [523, 659, 784, 1047].forEach((f) => voice(f, t + 0.45, 1.2, { type: 'triangle', gain: 0.06 }));
    voice(1568, t + 0.45, 1.4, { gain: 0.05 });
    voice(130, t + 0.45, 0.4, { gain: 0.2, slideTo: 60 });
  },
  /** Conquista: carrilhão de três sinos. */
  chime() {
    const t = at();
    if (t === null) return;
    duck(1.2);
    [1319, 1661, 1976].forEach((f, i) => { voice(f, t + i * 0.13, 1.1, { gain: 0.09 }); voice(f * 2.01, t + i * 0.13, 0.6, { gain: 0.025 }); });
  },
  /** Medalha do fechamento: ouro, prata ou bronze. */
  medal(kind: 'ouro' | 'prata' | 'bronze') {
    const t = at();
    if (t === null) return;
    duck(1.6);
    const notes = kind === 'ouro' ? [784, 988, 1175, 1568] : kind === 'prata' ? [659, 784, 988] : [523, 659];
    notes.forEach((f, i) => voice(f, t + 0.5 + i * 0.12, 0.6, { type: 'triangle', gain: 0.08 }));
    if (kind === 'ouro') [2093, 2637, 3136].forEach((f, i) => voice(f, t + 1 + i * 0.07, 0.6, { gain: 0.04 }));
  },
  heart() {
    const t = at();
    if (t === null) return;
    voice(880, t, 0.15, { type: 'triangle', gain: 0.08 });
    voice(1175, t + 0.12, 0.3, { type: 'triangle', gain: 0.08 });
  },
  /** Ronronar do gato: zumbido grave pulsando. */
  purr() {
    const t = at();
    if (t === null || !ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 48;
    lfo.frequency.value = 24;
    lg.gain.value = 0.05;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 300;
    lfo.connect(lg).connect(g.gain);
    o.connect(f).connect(g).connect(sfxBus);
    o.start(t); lfo.start(t);
    o.stop(t + 1.3); lfo.stop(t + 1.3);
  },
  whoosh() {
    const t = at();
    if (t !== null) noiseHit(t, 0.6, { gain: 0.12, type: 'bandpass', freq: 900, q: 0.8 });
  },
  win() {
    sfx.fanfare();
    const t = at();
    if (t !== null) [1568, 1976, 2349, 3136].forEach((f, i) => voice(f, t + 0.9 + i * 0.08, 0.5, { gain: 0.05 }));
  },
  lose() {
    const t = at();
    if (t === null) return;
    [523, 494, 466, 392].forEach((f, i) => voice(f, t + i * 0.18, 0.3, { type: 'triangle', gain: 0.07 }));
  },
  season() {
    const t = at();
    if (t === null) return;
    [784, 1047, 1319, 1568, 2093].forEach((f, i) => voice(f, t + i * 0.09, 0.9, { gain: 0.06 }));
  },
  sad() {
    const t = at();
    if (t !== null) voice(392, t, 0.4, { type: 'triangle', gain: 0.09, slideTo: 262 });
  },
  error() {
    const t = at();
    if (t !== null) voice(180, t, 0.15, { type: 'square', gain: 0.05, cutoff: 1200 });
  },
};

function onEvent(e: GameEvent) {
  const pattern = vibrationFor(e);
  if (pattern && settings()?.vibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* sem vibração */ }
  }
  switch (e.type) {
    case 'SALE': {
      const base = RECIPES_BY_ID[e.recipeId]?.basePrice ?? e.price;
      return e.price >= base * 1.1 ? sfx.bigCoin() : sfx.coin();
    }
    case 'ORDER_DONE':
    case 'CONTRACT_DONE': return sfx.fanfare();
    case 'CUSTOMER_ARRIVED': return sfx.bell();
    case 'BREW_STARTED': return sfx.bubble();
    case 'BREW_DONE':
    case 'MASTERY_STAR':
    case 'FIND': return sfx.sparkle();
    case 'LEVEL_UP':
    case 'MASTER_RANK': return sfx.fanfare();
    case 'ACHIEVEMENT':
    case 'REGULAR_GIFT': return sfx.chime();
    case 'REGULAR_HEART': return sfx.heart();
    case 'CAT_PETTED': return sfx.purr();
    case 'RIVAL_RESULT': return e.win ? sfx.win() : sfx.lose();
    case 'EXPEDITION_SENT':
    case 'EXPEDITION_BACK': return sfx.whoosh();
    case 'SEASON_STARTED': return sfx.season();
    case 'GOAL_DONE': return e.allDone ? sfx.fanfare() : sfx.chime();
    case 'CHEST_OPENED': return sfx.win();
    case 'DAY_CLOSED': {
      const s = save();
      const { medal } = dayMedal(s?.reports ?? [e.report]);
      return medal ? sfx.medal(medal) : undefined;
    }
    case 'UPGRADE_BOUGHT':
    case 'DISCOVERY': return sfx.sparkle();
    case 'PURCHASE':
    case 'RAVEN_DELIVERY': return sfx.click();
    case 'CUSTOMER_LEFT': if (e.reason === 'paciencia' || e.reason === 'preco') sfx.sad(); return;
    case 'ERROR': return sfx.error();
  }
}

/** Liga o áudio. O navegador só permite tocar depois de um gesto do jogador. */
export function initAudio() {
  const unlock = () => {
    const c = ensure();
    void c?.resume();
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  gameEvents.on(onEvent);
  useGameStore.subscribe((s) => s.save?.settings, applySettings);
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('button:not(:disabled)')) sfx.click();
  });
}

// Em desenvolvimento, expõe o áudio para gravar amostras nos testes com navegador.
if (import.meta.env.DEV) {
  (window as unknown as { __audio: unknown }).__audio = { ctx: () => ctx, master: () => out, nowPlaying };
}
