import { CounterPanel } from '../../features/customers/CounterPanel';
import { DoorPanel } from '../../features/customers/DoorPanel';
import { NoticeBoardPanel } from '../../features/customers/NoticeBoardPanel';
import { ProductionPanel } from '../../features/alchemy/ProductionPanel';
import { RecipesPanel } from '../../features/alchemy/RecipesPanel';
import { ReportPanel } from '../../features/economy/ReportPanel';
import { IngredientsPanel } from '../../features/inventory/IngredientsPanel';
import { ShelvesPanel } from '../../features/inventory/ShelvesPanel';
import { useGameStore, type PanelId } from '../../store/gameStore';

const TITLES: Record<PanelId, string> = {
  ingredients: 'Armário de ingredientes',
  production: 'Caldeirão',
  recipes: 'Livro de receitas',
  orders: 'Quadro de avisos',
  report: 'Caixa',
  shelves: 'Prateleiras',
  counter: 'Balcão',
  door: 'Porta da loja',
};

export function SidePanel() {
  const save = useGameStore((s) => s.save)!;
  const panel = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);

  if (!panel) {
    return (
      <aside className="side" aria-label="Painel">
        <h2 className="side-title">Sua loja</h2>
        <p className="panel-lead">Clique nos objetos da loja para ver o que cada um faz.</p>
        <ul className="hints">
          <li><strong>Armário</strong> guarda os ingredientes.</li>
          <li><strong>Caldeirão</strong> prepara as poções.</li>
          <li><strong>Prateleiras</strong> expõem o que está à venda.</li>
          <li><strong>Porta</strong> abre e fecha a loja.</li>
          <li><strong>Balcão</strong> é onde você atende.</li>
        </ul>
        {save.phase === 'preparacao' && (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir a loja</button>
        )}
      </aside>
    );
  }

  return (
    <aside className="side" aria-label={TITLES[panel]}>
      <div className="side-head">
        <h2 className="side-title">{TITLES[panel]}</h2>
        <button className="icon-btn" onClick={() => dispatch({ type: 'CLOSE_PANEL' })} aria-label="Fechar painel" title="Fechar (Esc)">×</button>
      </div>
      <div className="side-body">
        {panel === 'ingredients' && <IngredientsPanel save={save} />}
        {panel === 'shelves' && <ShelvesPanel save={save} />}
        {panel === 'production' && <ProductionPanel save={save} />}
        {panel === 'recipes' && <RecipesPanel save={save} />}
        {panel === 'orders' && <NoticeBoardPanel />}
        {panel === 'report' && <ReportPanel save={save} />}
        {panel === 'counter' && <CounterPanel save={save} />}
        {panel === 'door' && <DoorPanel save={save} />}
      </div>
    </aside>
  );
}
