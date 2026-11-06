import type { GameEvent, Settings } from '../domain/models/types';
import { gameEvents } from '../game/events';
import { useGameStore } from '../store/gameStore';

/**
 * Sons sintetizados com WebAudio (nenhum arquivo externo): efeitos curtos e uma
 * música ambiente suave em caixinha de música. Tudo respeita volume/mudo.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function settings(): Settings | undefined {
  return useGameStore.getState().save?.settings;
}

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus = ctx.createGain();
  sfxBus.connect(master);
  musicBus.connect(master);
  master.connect(ctx.destination);
  applySettings();
  return ctx;
}

function applySettings() {
  const s = settings();
  if (!ctx || !master || !sfxBus || !musicBus) return;
  const vol = s?.volume ?? 0.7;
  master.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(s?.muted ? 0 : 0.6, ctx.currentTime, 0.05);
  musicBus.gain.setTargetAtTime(s?.music ? 0.22 : 0, ctx.currentTime, 0.3);
  if (s?.music && !musicTimer) startMusic();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.3, bus = sfxBus, slideTo?: number) {
  if (!ctx || !bus) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(bus);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export const sfx = {
  click() {
    const c = ensure();
    if (c) tone(660, c.currentTime, 0.06, 'triangle', 0.12);
  },
  coin() {
    const c = ensure();
    if (!c) return;
    tone(988, c.currentTime, 0.09, 'square', 0.08);
    tone(1319, c.currentTime + 0.08, 0.25, 'square', 0.08);
  },
  bell() {
    const c = ensure();
    if (!c) return;
    tone(1568, c.currentTime, 0.6, 'sine', 0.15);
    tone(2093, c.currentTime + 0.02, 0.5, 'sine', 0.07);
  },
  bubble() {
    const c = ensure();
    if (!c) return;
    for (let i = 0; i < 3; i++) tone(300 + i * 80, c.currentTime + i * 0.07, 0.12, 'sine', 0.12, sfxBus, 700 + i * 120);
  },
  sparkle() {
    const c = ensure();
    if (!c) return;
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, c.currentTime + i * 0.06, 0.3, 'triangle', 0.08));
  },
  fanfare() {
    const c = ensure();
    if (!c) return;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, c.currentTime + i * 0.11, 0.35, 'square', 0.07));
  },
  sad() {
    const c = ensure();
    if (c) tone(392, c.currentTime, 0.4, 'triangle', 0.1, sfxBus, 262);
  },
  error() {
    const c = ensure();
    if (c) tone(180, c.currentTime, 0.15, 'square', 0.06);
  },
};

// Música ambiente: arpejos lentos numa escala pentatônica, com variação aleatória.
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659, 784];
const CHORDS = [[0, 2, 4], [3, 5, 7], [1, 4, 6], [2, 4, 8]];
function startMusic() {
  if (!ctx) return;
  let beat = 0;
  musicTimer = setInterval(() => {
    const s = settings();
    if (!ctx || !s?.music || ctx.state !== 'running') return;
    const chord = CHORDS[Math.floor(beat / 8) % CHORDS.length];
    const t = ctx.currentTime + 0.05;
    if (beat % 2 === 0 || Math.random() < 0.3) {
      const note = SCALE[chord[Math.floor(Math.random() * chord.length)]] * (Math.random() < 0.3 ? 2 : 1);
      tone(note, t, 1.4, 'triangle', 0.18, musicBus);
    }
    if (beat % 8 === 0) tone(SCALE[chord[0]] / 2, t, 3, 'sine', 0.16, musicBus);
    beat++;
  }, 420);
}

function onEvent(e: GameEvent) {
  switch (e.type) {
    case 'SALE': return sfx.coin();
    case 'ORDER_DONE': return sfx.fanfare();
    case 'CUSTOMER_ARRIVED': return sfx.bell();
    case 'BREW_STARTED': return sfx.bubble();
    case 'BREW_DONE': return sfx.sparkle();
    case 'LEVEL_UP': return sfx.fanfare();
    case 'UPGRADE_BOUGHT':
    case 'DISCOVERY': return sfx.sparkle();
    case 'PURCHASE': return sfx.click();
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
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
  gameEvents.on(onEvent);
  useGameStore.subscribe((s) => s.save?.settings, applySettings);
  // Cliques de botões da interface
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('button:not(:disabled)')) sfx.click();
  });
}
