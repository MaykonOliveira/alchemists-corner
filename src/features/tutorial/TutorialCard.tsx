import { TUTORIAL_DONE, useGameStore, type PanelId } from '../../store/gameStore';

interface Step {
  title: string;
  text: string;
  action?: { label: string; panel: PanelId };
}

/** Tutorial contextual do primeiro dia (PRD 7.3). Cada passo avança sozinho quando o jogador faz a ação. */
export const TUTORIAL_STEPS: Step[] = [
  { title: 'Boas-vindas à sua loja!', text: 'O antigo dono deixou pouca coisa. Comece pelo armário: lá você vê seus ingredientes e compra do fornecedor.', action: { label: 'Abrir o armário', panel: 'ingredients' } },
  { title: 'Compre ingredientes', text: 'A Poção de Cura leva Folha lunar e Pó de pedra. Escolha a quantidade e toque em Comprar.' },
  { title: 'Hora de ferver', text: 'Toque no caldeirão, escolha uma receita e quantos lotes quer. Cada lote rende 2 poções.', action: { label: 'Ir ao caldeirão', panel: 'production' } },
  { title: 'Abra as portas', text: 'O caldeirão trabalha sozinho. Confira os preços nas prateleiras e, quando quiser, abra a loja pela porta.', action: { label: 'Ver preços', panel: 'shelves' } },
  { title: 'Seu primeiro cliente', text: 'Toque no cliente no balcão, veja o que ele quer e ofereça a poção certa.', action: { label: 'Ir ao balcão', panel: 'counter' } },
  { title: 'Muito bem!', text: 'Atenda quem aparecer. Clientes sem resposta perdem a paciência. Ao fim da tarde (ou quando quiser) encerre o dia.' },
  { title: 'Relatório do dia', text: 'Aqui você vê o que vendeu, o que gastou e o lucro. Use isso para decidir o que preparar amanhã.' },
];

export function TutorialCard() {
  const step = useGameStore((s) => s.save?.tutorialStep ?? 99);
  const dispatch = useGameStore((s) => s.dispatch);
  if (step >= TUTORIAL_DONE) return null;
  const s = TUTORIAL_STEPS[step];
  return (
    <div className="tutorial" role="status">
      <div className="tutorial-head">
        <span className="tutorial-step">Dica {step + 1}/{TUTORIAL_STEPS.length}</span>
        <button className="link-btn" onClick={() => dispatch({ type: 'SKIP_TUTORIAL' })}>Pular tutorial</button>
      </div>
      <p className="tutorial-title">{s.title}</p>
      <p className="tutorial-text">{s.text}</p>
      <div className="btn-row">
        {s.action && (
          <button className="btn btn-small btn-primary" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: s.action!.panel })}>{s.action.label}</button>
        )}
        <button className="btn btn-small" onClick={() => dispatch({ type: 'NEXT_TUTORIAL' })}>{step === TUTORIAL_STEPS.length - 1 ? 'Entendi' : 'Próxima'}</button>
      </div>
    </div>
  );
}
