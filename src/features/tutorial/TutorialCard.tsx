import { TUTORIAL_DONE, useGameStore, type PanelId } from '../../store/gameStore';

interface Step {
  title: string;
  text: string;
  action?: { label: string; panel: PanelId };
  /** Objeto da loja que pisca na cena (id do hotspot). */
  spot?: string;
  /** Botão da interface que ganha destaque (seletor CSS); vale mais que o spot quando está visível. */
  ui?: string;
}

/** Tutorial contextual do primeiro dia (PRD 7.3). Cada passo avança sozinho quando o jogador faz a ação. */
export const TUTORIAL_STEPS: Step[] = [
  { title: 'Boas-vindas à sua loja!', text: 'O antigo dono deixou pouca coisa. Comece pelo armário: lá você vê seus ingredientes e compra do fornecedor.', action: { label: 'Abrir o armário', panel: 'ingredients' }, spot: 'cabinet', ui: '[data-tut="tab-ingredients"]' },
  { title: 'Compre ingredientes', text: 'A Poção de Cura leva Folha lunar e Pó de pedra. Escolha a quantidade e toque em Comprar.', spot: 'cabinet', ui: '[data-tut="buy"]' },
  { title: 'Hora de ferver', text: 'Toque no caldeirão, escolha uma receita e quantos lotes quer. Cada lote rende 2 poções.', action: { label: 'Ir ao caldeirão', panel: 'production' }, spot: 'cauldron', ui: '[data-tut="brew"]' },
  { title: 'Abra as portas', text: 'O caldeirão trabalha sozinho. Confira os preços nas prateleiras e, quando quiser, abra a loja pela porta.', action: { label: 'Ver preços', panel: 'shelves' }, spot: 'door', ui: '[data-tut="open-shop"]' },
  { title: 'Seu primeiro cliente', text: 'Quando alguém chega, o pedido aparece sobre a loja. Toque em Vender para atender com um toque, ou em Opções para escolher outra poção.', spot: 'counter', ui: '[data-tut="quick-sell"]' },
  { title: 'Muito bem!', text: 'Atenda quem aparecer. Clientes sem resposta perdem a paciência. Ao fim da tarde (ou quando quiser) encerre o dia.', spot: 'register', ui: '[data-tut="close-day"]' },
  { title: 'Relatório do dia', text: 'Aqui você vê o que vendeu, o que gastou e o lucro. Use isso para decidir o que preparar amanhã.' },
];

export function TutorialCard() {
  const step = useGameStore((s) => (s.save?.storySeen === false ? 99 : s.save?.tutorialStep ?? 99));
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
