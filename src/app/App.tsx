import { lazy, Suspense, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { MenuScreen } from './routes/MenuScreen';

import { tr } from '../i18n';
// A loja (com o Phaser, a maior parte do código) carrega à parte: a tela de título abre mais rápido no 4G.
const loadGame = () => import('./routes/GameScreen');
const GameScreen = lazy(() => loadGame().then((m) => ({ default: m.GameScreen })));

export function App() {
  const status = useGameStore((s) => s.status);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  // Enquanto o jogador lê o título, a loja já vai carregando em segundo plano.
  useEffect(() => {
    if (status !== 'menu') return;
    const t = setTimeout(() => void loadGame(), 300);
    return () => clearTimeout(t);
  }, [status]);

  const loading = <div className="loading">{tr('Acendendo as lanternas…')}</div>;
  if (status === 'loading') return loading;
  if (status === 'menu') return <MenuScreen />;
  return <Suspense fallback={loading}><GameScreen /></Suspense>;
}
