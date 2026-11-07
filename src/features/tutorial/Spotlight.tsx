import { useEffect, useState } from 'react';
import shopAtlas from '../../assets/sprites/shop.json';
import { HOTSPOTS } from '../../game/phaser/interaction/hotspots';
import { TUTORIAL_DONE, useGameStore } from '../../store/gameStore';
import { TUTORIAL_STEPS } from './TutorialCard';

const frames = (shopAtlas as { frames: Record<string, { frame: { w: number; h: number } }> }).frames;

function useStep() {
  const step = useGameStore((s) => (s.save?.storySeen === false ? 99 : s.save?.tutorialStep ?? 99));
  const modal = useGameStore((s) => s.ui.modal);
  return step < TUTORIAL_DONE && !modal ? TUTORIAL_STEPS[step] : null;
}

/** Objeto da loja que o tutorial está apontando: contorno pulsando e seta quicando, dentro da cena. */
export function SceneSpotlight() {
  const step = useStep();
  const zoom = useGameStore((s) => s.ui.zoom);
  const spot = step?.spot ? HOTSPOTS.find((h) => h.id === step.spot) : null;
  if (!spot) return null;
  const f = frames[spot.texture]?.frame ?? { w: 32, h: 32 };
  const pad = 3;
  return (
    <div
      className="scene-spot"
      aria-hidden
      style={{ left: (spot.x - pad) * zoom, top: (spot.y - pad) * zoom, width: (f.w + pad * 2) * zoom, height: (f.h + pad * 2) * zoom }}
    >
      <span className="scene-spot-arrow">▼</span>
    </div>
  );
}

/** Botão da interface que o tutorial pede para tocar: anel dourado por cima, sem bloquear o toque. */
export function UiSpotlight() {
  const step = useStep();
  const selector = step?.ui ?? null;
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!selector) { setRect(null); return; }
    const find = () => {
      const el = [...document.querySelectorAll<HTMLElement>(selector)].find((e) => e.offsetParent !== null && !(e as HTMLButtonElement).disabled)
        ?? document.querySelector<HTMLElement>(selector);
      const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
      setRect((old) => (r && r.width > 0 ? (old && old.x === r.x && old.y === r.y && old.width === r.width ? old : r) : null));
    };
    find();
    const t = setInterval(find, 250);
    return () => clearInterval(t);
  }, [selector]);
  if (!rect) return null;
  return (
    <div className="ui-spot" aria-hidden style={{ left: rect.left - 5, top: rect.top - 5, width: rect.width + 10, height: rect.height + 10 }}>
      <span className="ui-spot-hand">👆</span>
    </div>
  );
}
