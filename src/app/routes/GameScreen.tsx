import { useEffect, useRef, useState } from 'react';
import { PhaserGame } from '../../game/PhaserGame';
import { TutorialCard } from '../../features/tutorial/TutorialCard';
import { WelcomeBack } from '../../features/tutorial/WelcomeBack';
import { StoryIntro } from '../../features/tutorial/StoryIntro';
import { UiSpotlight } from '../../features/tutorial/Spotlight';
import { useGameStore } from '../../store/gameStore';
import { BottomBar, SHORTCUTS } from '../layout/BottomBar';
import { panelUnlocked } from '../layout/nav';
import { DayEndModal } from '../layout/DayEndModal';
import { Hud } from '../layout/Hud';
import { LevelUpModal } from '../layout/LevelUpModal';
import { SettingsModal } from '../layout/SettingsModal';
import { SidePanel } from '../layout/SidePanel';
import { Toasts } from '../layout/Toasts';
import { Milestone } from '../../features/celebrate/Milestone';
import { ShareModal } from '../../features/share/ShareModal';
import { RoyalScene } from '../../features/royal/RoyalScene';
import { StageControls } from '../../features/stage/StageControls';

import { tr } from '../../i18n';
export function GameScreen() {
  const dispatch = useGameStore((s) => s.dispatch);
  const phase = useGameStore((s) => s.save?.phase);
  const panelOpen = useGameStore((s) => s.ui.activePanel !== null);
  // Celular em pé (V5): o painel é uma gaveta. Puxar a alça para cima esconde a cena e dá a tela toda ao painel.
  const [drawerUp, setDrawerUp] = useState(false);
  const dragY = useRef<number | null>(null);
  useEffect(() => { if (!panelOpen) setDrawerUp(false); }, [panelOpen]);

  // Atalhos de teclado (PRD 7.4)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (useGameStore.getState().save?.storySeen === false) return;
      if (useGameStore.getState().ui.modal) {
        if (e.key === 'Escape') dispatch({ type: 'OPEN_MODAL', modal: null });
        return;
      }
      if (e.key === 'Escape') dispatch({ type: 'CLOSE_PANEL' });
      else if (e.key === ' ' && phase === 'expediente' && target.tagName !== 'BUTTON') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PAUSE' });
      } else {
        const sc = SHORTCUTS.find((s) => s.key === e.key.toLowerCase());
        if (sc && panelUnlocked(useGameStore.getState().save, sc.panel)) dispatch({ type: 'TOGGLE_PANEL', panel: sc.panel });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, phase]);

  return (
    <div className={`game ${panelOpen ? 'panel-open' : ''} ${drawerUp ? 'drawer-up' : ''}`}>
      <Hud />
      <main className="game-main">
        <div className="stage-wrap">
          <PhaserGame />
          <StageControls />
          <TutorialCard />
          <WelcomeBack />
          <Toasts />
          <Milestone />
        </div>
        <button
          className="drawer-handle"
          aria-label={drawerUp ? tr('Mostrar a loja de novo') : tr('Abrir o painel na tela toda')}
          aria-expanded={drawerUp}
          onPointerDown={(e) => { dragY.current = e.clientY; }}
          onPointerUp={(e) => {
            const dy = dragY.current === null ? 0 : e.clientY - dragY.current;
            dragY.current = null;
            setDrawerUp((up) => (dy < -24 ? true : dy > 24 ? false : !up));
          }}
        >
          <span className="drawer-grip" />
        </button>
        <SidePanel />
      </main>
      <BottomBar />
      <DayEndModal />
      <LevelUpModal />
      <SettingsModal />
      <ShareModal />
      <UiSpotlight />
      <StoryIntro />
      <RoyalScene />
    </div>
  );
}
