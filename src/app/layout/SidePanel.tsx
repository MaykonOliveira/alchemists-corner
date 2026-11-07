import { CounterPanel } from '../../features/customers/CounterPanel';
import { DoorPanel } from '../../features/customers/DoorPanel';
import { OrdersPanel } from '../../features/customers/OrdersPanel';
import { ProductionPanel } from '../../features/alchemy/ProductionPanel';
import { RecipesPanel } from '../../features/alchemy/RecipesPanel';
import { ReportPanel } from '../../features/economy/ReportPanel';
import { IngredientsPanel } from '../../features/inventory/IngredientsPanel';
import { ShelvesPanel } from '../../features/inventory/ShelvesPanel';
import { UpgradesPanel } from '../../features/progression/UpgradesPanel';
import { GrimoirePanel } from '../../features/mastery/GrimoirePanel';
import { AlbumPanel } from '../../features/world/AlbumPanel';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { potionStock } from '../../domain/rules/economy';
import { QuickServe } from '../../features/customers/QuickServe';

const TITLES: Record<PanelId, string> = {
  ingredients: 'Armário e fornecedor',
  production: 'Caldeirão',
  recipes: 'Livro de receitas',
  orders: 'Quadro de avisos',
  report: 'Caixa e relatório',
  shelves: 'Prateleiras e preços',
  counter: 'Balcão',
  door: 'Porta da loja',
  upgrades: 'Melhorias',
  grimoire: 'Grimório do Mestre',
  album: 'Álbum da loja',
};

export function SidePanel() {
  const save = useGameStore((s) => s.save)!;
  const panel = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);

  if (!panel) {
    const stock = save.potions.reduce((n, p) => n + p.quantity, 0);
    return (
      <aside className="side side-idle" aria-label="Resumo">
        <QuickServe placement="side" />
        <h2 className="side-title">Dia {save.day}</h2>
        <ul className="checklist">
          <li className={stock > 0 ? 'done' : ''}>Poções nas prateleiras: <strong>{stock}</strong></li>
          <li className={save.brew || save.brew2 ? 'done' : ''}>
            {save.upgrades.includes('sala-dos-fundos')
              ? `Caldeirões: ${[save.brew, save.brew2].filter(Boolean).length} de 2 fervendo`
              : `Caldeirão: ${save.brew ? 'fervendo…' : 'livre'}`}
          </li>
          <li className={save.order ? 'todo' : ''}>
            Pedido especial: {save.order ? `${potionStock(save, save.order.recipeId)}/${save.order.qty}` : 'nenhum'}
          </li>
          <li>Clientes no balcão: {save.customers.length}</li>
        </ul>
        <p className="panel-lead small">Toque nos objetos da loja ou use a barra de baixo.</p>
        {save.phase === 'preparacao' && (
          <button className="btn btn-primary btn-big" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir a loja</button>
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
      <QuickServe placement="side" />
      <div className="side-body">
        {panel === 'ingredients' && <IngredientsPanel save={save} />}
        {panel === 'shelves' && <ShelvesPanel save={save} />}
        {panel === 'production' && <ProductionPanel save={save} />}
        {panel === 'recipes' && <RecipesPanel save={save} />}
        {panel === 'orders' && <OrdersPanel save={save} />}
        {panel === 'report' && <ReportPanel save={save} />}
        {panel === 'counter' && <CounterPanel save={save} />}
        {panel === 'door' && <DoorPanel save={save} />}
        {panel === 'upgrades' && <UpgradesPanel save={save} />}
        {panel === 'grimoire' && <GrimoirePanel save={save} />}
        {panel === 'album' && <AlbumPanel save={save} />}
      </div>
    </aside>
  );
}
