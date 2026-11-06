import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameScreen } from './routes/GameScreen';
import { MenuScreen } from './routes/MenuScreen';

export function App() {
  const status = useGameStore((s) => s.status);
  const init = useGameStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (status === 'loading') return <div className="loading">Acendendo as lanternas…</div>;
  if (status === 'menu') return <MenuScreen />;
  return <GameScreen />;
}
