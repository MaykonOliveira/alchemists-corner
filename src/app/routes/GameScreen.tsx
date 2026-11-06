import { useEffect } from 'react';
import { PhaserGame } from '../../game/PhaserGame';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { BottomBar, SHORTCUTS } from '../layout/BottomBar';
import { DayEndModal } from '../layout/DayEndModal';
import { Hud } from '../layout/Hud';
import { SidePanel } from '../layout/SidePanel';

export function GameScreen() {
  const dispatch = useGameStore((s) => s.dispatch);
  const phase = useGameStore((s) => s.save?.phase);

  // Atalhos de teclado (PRD 7.4)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_PANEL' });
      else if (e.key === ' ' && phase === 'expediente' && target.tagName !== 'BUTTON') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PAUSE' });
      } else {
        const sc = SHORTCUTS.find((s) => s.key === e.key);
        if (sc) dispatch({ type: 'TOGGLE_PANEL', panel: sc.panel as PanelId });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, phase]);

  return (
    <div className="game">
      <Hud />
      <main className="game-main">
        <PhaserGame />
        <SidePanel />
      </main>
      <BottomBar />
      <DayEndModal />
    </div>
  );
}
