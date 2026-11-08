import { CauldronAlert } from '../features/alchemy/CauldronAlert';
import { SceneSpotlight } from '../features/tutorial/Spotlight';
import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { WORLD_H, WORLD_W } from './phaser/art/sprites';
import { createGameConfig } from './phaser/config';
import { setCurrentGame } from './gameRef';

/** Maior escala inteira que cabe no espaço disponível (PRD 6.3). */
function fitZoom(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect();
  const exact = Math.min((width - 12) / WORLD_W, (height - 12) / WORLD_H);
  // Escala inteira sempre que possível (pixels perfeitos); em telas pequenas (celular) usa a escala exata.
  const whole = Math.floor(exact);
  if (whole >= 2 && whole / exact >= 0.88) return whole;
  return Math.max(0.5, Math.floor(exact * 100) / 100);
}

/** Monta o canvas do Phaser dentro do layout React. */
export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dispatch = useGameStore((s) => s.dispatch);

  useEffect(() => {
    const host = hostRef.current!;
    const parent = canvasRef.current!;
    const zoom = fitZoom(host);
    dispatch({ type: 'SET_ZOOM', zoom });
    const game = new Phaser.Game(createGameConfig(parent, zoom));
    setCurrentGame(game);

    const ro = new ResizeObserver(() => {
      const z = fitZoom(host);
      if (game.scale.zoom !== z) game.scale.setZoom(z);
      dispatch({ type: 'SET_ZOOM', zoom: z });
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      setCurrentGame(null);
      game.destroy(true);
    };
  }, [dispatch]);

  return (
    <div ref={hostRef} className="stage-host">
      <div className="stage" style={{ position: 'relative' }}>
        <div ref={canvasRef} className="stage-canvas" aria-label="Interior da loja" role="img" />
        <HotspotTooltip />
        <SceneSpotlight />
        <CauldronAlert />
      </div>
    </div>
  );
}

function HotspotTooltip() {
  const hover = useGameStore((s) => s.ui.hover);
  const zoom = useGameStore((s) => s.ui.zoom);
  if (!hover) return null;
  return (
    <div className="tooltip" style={{ left: hover.x * zoom, top: hover.y * zoom }} role="tooltip">
      {hover.label}
    </div>
  );
}
