import { nextTip } from '../../domain/data/tips';
import { TUTORIAL_DONE, useGameStore } from '../../store/gameStore';
import { useStageCards } from './stage';

/** Dica de contexto: aparece uma vez quando a situação pede, depois do tutorial. */
export function TipCard() {
  const save = useGameStore((s) => s.save);
  const modal = useGameStore((s) => s.ui.modal);
  const welcome = useGameStore((s) => s.ui.welcome);
  const stage = useStageCards();
  const dispatch = useGameStore((s) => s.dispatch);
  if (!save || save.tutorialStep < TUTORIAL_DONE || modal || welcome || !stage.tip || !save.storySeen) return null;
  const tip = nextTip(save);
  if (!tip) return null;
  const seen = () => dispatch({ type: 'SEE_TIP', tipId: tip.id });
  return (
    <div className="tutorial tip-card" role="status" key={tip.id}>
      <div className="tutorial-head">
        <span className="tutorial-step">{tip.icon} Dica</span>
        <button className="link-btn" onClick={seen} aria-label="Fechar dica">×</button>
      </div>
      <p className="tutorial-title">{tip.title}</p>
      <p className="tutorial-text">{tip.text}</p>
      <div className="btn-row">
        {tip.panel && (
          <button className="btn btn-small btn-primary" onClick={() => { dispatch({ type: 'OPEN_PANEL', panel: tip.panel! }); seen(); }}>Ver agora</button>
        )}
        <button className="btn btn-small" onClick={seen}>Entendi</button>
      </div>
    </div>
  );
}
