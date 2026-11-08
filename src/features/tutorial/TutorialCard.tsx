import { useState } from 'react';
import { TUTORIAL_DONE, useGameStore, type PanelId } from '../../store/gameStore';
import { useStageCards } from './stage';

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
  { title: 'Abra as portas!', text: 'O antigo dono deixou 5 poções na prateleira. Abra a loja e faça sua primeira venda agora mesmo.', spot: 'door', ui: '[data-tut="open-shop"]' },
  { title: 'Seu primeiro cliente', text: 'O pedido aparece sobre a loja. Toque em Vender para atender com um toque.', spot: 'counter', ui: '[data-tut="quick-sell"]' },
  { title: 'Primeira venda!', text: 'As moedas já estão no caixa. Agora vamos repor o estoque: abra o armário para comprar ingredientes.', action: { label: 'Abrir o armário', panel: 'ingredients' }, spot: 'cabinet', ui: '[data-tut~="tab-ingredients"]' },
  { title: 'Compre ingredientes', text: 'A Poção de Cura leva Folha lunar e Pó de pedra. Escolha a quantidade e toque em Comprar.', spot: 'cabinet', ui: '[data-tut="buy"]' },
  { title: 'Hora de ferver', text: 'No caldeirão, escolha a receita e toque em Preparar. Ele já sugere o máximo de lotes que dá, e cada lote rende 2 poções.', action: { label: 'Ir ao caldeirão', panel: 'production' }, spot: 'cauldron', ui: '[data-tut="brew"]' },
  { title: 'Muito bem!', text: 'Atenda quem aparecer. Hoje o dia passa rápido, e dizem que uma visita importante vem à tarde… Ao anoitecer (ou quando quiser) encerre o dia.', spot: 'register', ui: '[data-tut="close-day"]' },
  { title: 'Relatório do dia', text: 'Aqui você vê o que vendeu, o que gastou e o lucro. Use isso para decidir o que preparar amanhã.' },
];

export function TutorialCard() {
  const step = useGameStore((s) => (s.save?.storySeen === false ? 99 : s.save?.tutorialStep ?? 99));
  const panel = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  const { customer } = useStageCards();
  const [open, setOpen] = useState(false);
  if (step >= TUTORIAL_DONE) return null;
  const s = TUTORIAL_STEPS[step];
  // O passo "primeiro cliente" já é explicado pelo próprio cartão do cliente e pelo anel no botão Vender.
  if (step === 1 && customer) return null;
  // Com cliente no balcão, o tutorial encolhe para uma linha e deixa a loja à vista.
  const compact = customer && !open;
  // O atalho some quando o jogador já está na tela certa.
  const action = s.action && panel !== s.action.panel ? s.action : null;
  const side = s.spot === 'cauldron' || s.spot === 'cabinet' ? 'tut-right' : '';
  if (compact) {
    return (
      <button className={`tutorial tutorial-compact ${side}`} onClick={() => setOpen(true)} aria-label={`Dica ${step + 1}: ${s.title}. Toque para ver.`}>
        <span className="tutorial-step">Dica {step + 1}/{TUTORIAL_STEPS.length}</span> <span className="tutorial-title">{s.title}</span> <span aria-hidden>▸</span>
      </button>
    );
  }
  return (
    <div className={`tutorial ${side}`} role="status">
      <div className="tutorial-head">
        <span className="tutorial-step">Dica {step + 1}/{TUTORIAL_STEPS.length}</span>
        {customer ? <button className="link-btn" onClick={() => setOpen(false)}>Recolher</button>
          : <button className="link-btn" onClick={() => dispatch({ type: 'SKIP_TUTORIAL' })}>Pular tutorial</button>}
      </div>
      <p className="tutorial-title">{s.title}</p>
      <p className="tutorial-text">{s.text}</p>
      <div className="btn-row">
        {action && (
          <button className="btn btn-small btn-primary" onClick={() => dispatch({ type: 'OPEN_PANEL', panel: action.panel })}>{action.label}</button>
        )}
        <button className="btn btn-small" onClick={() => dispatch({ type: 'NEXT_TUTORIAL' })}>{step === TUTORIAL_STEPS.length - 1 ? 'Entendi' : 'Próxima'}</button>
      </div>
    </div>
  );
}
