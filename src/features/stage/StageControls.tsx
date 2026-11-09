import { useGameStore } from '../../store/gameStore';

/**
 * Celular em pé: velocidade e pausa num canto pequeno da cena, longe das prateleiras.
 * "Encerrar o dia" mora no Início. No computador esses botões continuam no topo.
 */
export function StageControls() {
  const phase = useGameStore((s) => s.save?.phase);
  const paused = useGameStore((s) => s.ui.paused);
  const speed = useGameStore((s) => s.ui.speed);
  const dispatch = useGameStore((s) => s.dispatch);
  if (phase !== 'expediente') return null;
  return (
    <div className="stage-controls" role="group" aria-label="Ritmo do dia">
      <button className={`sc-btn ${speed === 2 ? 'on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_SPEED' })} aria-pressed={speed === 2} aria-label={speed === 2 ? 'Voltar à velocidade normal' : 'Acelerar o dia (2×)'}>
        {speed === 2 ? '2×' : '1×'}
      </button>
      <button className="sc-btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })} aria-pressed={paused} aria-label={paused ? 'Continuar' : 'Pausar'}>
        {paused ? '▶︎' : '❚❚'}
      </button>
    </div>
  );
}
