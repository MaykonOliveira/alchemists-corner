import { useEffect } from 'react';
import { PhaserGame } from '../../game/PhaserGame';
import { TutorialCard } from '../../features/tutorial/TutorialCard';
import { WelcomeBack } from '../../features/tutorial/WelcomeBack';
import { TipCard } from '../../features/tutorial/TipCard';
import { StoryIntro } from '../../features/tutorial/StoryIntro';
import { UiSpotlight } from '../../features/tutorial/Spotlight';
import { QuickServe } from '../../features/customers/QuickServe';
import { useGameStore } from '../../store/gameStore';
import { BottomBar, SHORTCUTS } from '../layout/BottomBar';
import { DayEndModal } from '../layout/DayEndModal';
import { Hud } from '../layout/Hud';
import { LevelUpModal } from '../layout/LevelUpModal';
import { SettingsModal } from '../layout/SettingsModal';
import { SidePanel } from '../layout/SidePanel';
import { Toasts } from '../layout/Toasts';
import { ShareModal } from '../../features/share/ShareModal';

export function GameScreen() {
  const dispatch = useGameStore((s) => s.dispatch);
  const phase = useGameStore((s) => s.save?.phase);
  const panelOpen = useGameStore((s) => s.ui.activePanel !== null);

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
        if (sc) dispatch({ type: 'TOGGLE_PANEL', panel: sc.panel });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, phase]);

  return (
    <div className={`game ${panelOpen ? 'panel-open' : ''}`}>
      <Hud />
      <main className="game-main">
        <div className="stage-wrap">
          <PhaserGame />
          <TutorialCard />
          <TipCard />
          <WelcomeBack />
          <QuickServe placement="stage" />
          <Toasts />
        </div>
        <SidePanel />
      </main>
      <BottomBar />
      <DayEndModal />
      <LevelUpModal />
      <SettingsModal />
      <ShareModal />
      <UiSpotlight />
      <StoryIntro />
    </div>
  );
}
