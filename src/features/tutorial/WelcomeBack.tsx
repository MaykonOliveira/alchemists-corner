import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { countPotions, potionStock } from '../../domain/rules/economy';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { CoinIcon } from '../../ui/icons';

/** Cartão "bem-vindo de volta": onde a partida parou e qual o próximo passo. */
export function WelcomeBack() {
  const welcome = useGameStore((s) => s.ui.welcome);
  const save = useGameStore((s) => s.save);
  const tutorial = useGameStore((s) => (s.save?.tutorialStep ?? 99) < 7);
  const dispatch = useGameStore((s) => s.dispatch);
  if (!welcome || !save || tutorial || save.phase === 'fechamento') return null;

  const potions = countPotions(save);
  const close = () => dispatch({ type: 'DISMISS_WELCOME' });
  const go = (panel: PanelId) => { close(); dispatch({ type: 'OPEN_PANEL', panel }); };

  let step: { text: string; label: string; act: () => void };
  if (save.phase === 'expediente') {
    step = { text: 'A loja está aberta e o relógio está pausado.', label: 'Continuar o dia', act: close };
  } else if (potions === 0 && !save.brew) {
    step = { text: 'As prateleiras estão vazias. Prepare poções antes de abrir.', label: 'Ir ao caldeirão', act: () => go('production') };
  } else {
    step = { text: 'Tudo pronto para receber clientes.', label: 'Abrir a loja', act: () => { close(); dispatch({ type: 'OPEN_SHOP' }); } };
  }

  return (
    <div className="tutorial welcome" role="status">
      <div className="tutorial-head">
        <span className="tutorial-step">Bem-vindo de volta</span>
        <button className="link-btn" onClick={close}>Fechar</button>
      </div>
      <p className="tutorial-title">Dia {save.day} · {save.phase === 'expediente' ? 'loja aberta' : 'preparação'}</p>
      <ul className="welcome-facts">
        <li><CoinIcon size={14} /> {save.coins} moedas</li>
        <li>{potions} poções à venda</li>
        {save.brew && <li>Caldeirão: {RECIPES_BY_ID[save.brew.recipeId].shortName}</li>}
        {save.order && <li>Pedido: {potionStock(save, save.order.recipeId)}/{save.order.qty} {RECIPES_BY_ID[save.order.recipeId].shortName}</li>}
      </ul>
      <p className="tutorial-text">{step.text}</p>
      <div className="btn-row">
        <button className="btn btn-small btn-primary" onClick={step.act}>{step.label}</button>
      </div>
    </div>
  );
}
