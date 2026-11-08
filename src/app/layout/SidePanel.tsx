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
import { StreetPanel } from '../../features/world/StreetPanel';
import { GoalsList, GoalsPanel } from '../../features/goals/GoalsPanel';
import { useEffect } from 'react';
import type { GameSave } from '../../domain/models/types';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { groupOf, panelForGroup, panelIsNew, panelTitle, rememberPanel, useBadges, useVisibleGroups } from './nav';
import { potionStock } from '../../domain/rules/economy';
import { QuickServe } from '../../features/customers/QuickServe';
import { SeasonPanel } from '../../features/season/SeasonPanel';
import { RoyalPanel } from '../../features/royal/RoyalPanel';

export function SidePanel() {
  const save = useGameStore((s) => s.save)!;
  const panel = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  const badgeFor = useBadges();
  const groups = useVisibleGroups();
  useEffect(() => rememberPanel(panel), [panel]);
  // Abriu uma tela "novo": o selo some.
  const isNew = !!panel && panelIsNew(save, panel);
  useEffect(() => { if (isNew && panel) dispatch({ type: 'SEE_TIP', tipId: `area:${panel}` }); }, [isNew, panel, dispatch]);

  if (!panel) return <HomePanel save={save} />;

  const full = groupOf(panel);
  const group = full ? groups.find((g) => g.id === full.id) ?? full : null;
  return (
    <aside className={`side ${group ? `side-${group.id}` : ''}`} aria-label={panelTitle(panel)}>
      <div className="side-top">
      <div className="side-head">
        <div className="side-head-text">
          {group && <span className="side-area">{group.icon} {group.label}</span>}
          <h2 className="side-title">{panelTitle(panel)}</h2>
        </div>
        <button className="icon-btn" onClick={() => dispatch({ type: 'CLOSE_PANEL' })} aria-label="Voltar ao início" title="Voltar ao início (Esc)">×</button>
      </div>
      {group && (
        <div className="subtabs" role="tablist" aria-label={`Telas de ${group.label}`}>
          {group.items.map((i) => {
            const badge = badgeFor(i.panel);
            return (
              <button
                key={i.panel}
                role="tab"
                aria-selected={panel === i.panel}
                className={`subtab ${panel === i.panel ? 'subtab-on' : ''}`}
                onClick={() => dispatch({ type: 'OPEN_PANEL', panel: i.panel })}
              >
                <span aria-hidden>{i.icon}</span> {i.label}
                {badge !== null && <span className="subtab-badge">{badge}</span>}
              </button>
            );
          })}
        </div>
      )}
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
        {panel === 'street' && <StreetPanel save={save} />}
        {panel === 'goals' && <GoalsPanel save={save} />}
        {panel === 'season' && <SeasonPanel save={save} />}
        {panel === 'royal' && <RoyalPanel save={save} />}
      </div>
    </aside>
  );
}

const PHASE = { preparacao: 'Preparação', expediente: 'Loja aberta', fechamento: 'Fechamento' } as const;

/** Início: o que fazer agora (cada linha leva à tela certa) e o mapa das 4 áreas. */
function HomePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const badgeFor = useBadges();
  const groups = useVisibleGroups();
  const go = (panel: PanelId) => dispatch({ type: 'OPEN_PANEL', panel });
  const stock = save.potions.reduce((n, p) => n + p.quantity, 0);
  const twoPots = save.upgrades.includes('sala-dos-fundos');
  const boiling = [save.brew, save.brew2].filter(Boolean).length;
  const potsFree = twoPots ? boiling < 2 : boiling === 0;
  const lowStock = Object.values(save.ingredients).reduce((n, q) => n + q, 0) < 4;

  type Row = { panel: PanelId; icon: string; text: React.ReactNode; state: 'done' | 'todo' | '' };
  const rows: Row[] = [
    { panel: 'counter', icon: '🛎️', text: <>Clientes no balcão: <strong>{save.customers.length}</strong></>, state: save.customers.length > 0 ? 'todo' : '' },
    { panel: 'production', icon: '🔥', text: twoPots ? <>Caldeirões: <strong>{boiling} de 2</strong> fervendo</> : <>Caldeirão: <strong>{boiling ? 'fervendo' : 'livre'}</strong></>, state: potsFree ? 'todo' : 'done' },
    { panel: 'shelves', icon: '🧪', text: <>Poções nas prateleiras: <strong>{stock}</strong></>, state: stock > 0 ? 'done' : 'todo' },
    { panel: 'ingredients', icon: '🌿', text: <>Ingredientes no armário: <strong>{lowStock ? 'acabando' : 'ok'}</strong></>, state: lowStock ? 'todo' : 'done' },
    { panel: 'orders', icon: '📜', text: save.order ? <>Pedido especial: <strong>{potionStock(save, save.order.recipeId)}/{save.order.qty}</strong></> : <>Pedido especial: nenhum</>, state: save.order ? 'todo' : '' },
  ];
  const next = rows.find((r) => r.state === 'todo');

  return (
    <aside className="side side-idle" aria-label="Início">
      <QuickServe placement="side" />
      <div className="home-head">
        <h2 className="side-title">Dia {save.day}</h2>
        <span className={`home-phase phase-${save.phase}`}>{PHASE[save.phase]}</span>
      </div>
      {save.phase === 'preparacao' && (
        <button data-tut="open-shop" className="btn btn-primary btn-big btn-glow home-open" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>Abrir a loja</button>
      )}
      <h3 className="mini-title">O que fazer agora</h3>
      <ul className="todo-list">
        {rows.map((r) => (
          <li key={r.panel}>
            <button className={`todo-row ${r.state} ${next === r ? 'todo-next' : ''}`} onClick={() => go(r.panel)}>
              <span className="todo-icon" aria-hidden>{r.icon}</span>
              <span className="todo-text">{r.text}</span>
              <span className="todo-go" aria-hidden>{next === r ? 'Ir ›' : '›'}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="home-goals" onClick={() => go('goals')} aria-label="Abrir metas do dia">
        <GoalsList save={save} compact />
      </button>
      <h3 className="mini-title">Áreas da loja</h3>
      <div className="area-map">
        {groups.map((g) => {
          const alert = g.items.some((i) => badgeFor(i.panel) !== null);
          return (
            <button key={g.id} className={`area-card area-${g.id}`} onClick={() => go(panelForGroup(g, badgeFor))}>
              <span className="area-card-head"><span aria-hidden>{g.icon}</span> {g.label}{alert && <span className="area-dot" aria-label="tem novidade" />}</span>
              <span className="area-card-hint">{g.hint}</span>
              <span className="area-card-items" aria-hidden>{g.items.map((i) => i.icon).join(' ')}</span>
            </button>
          );
        })}
      </div>
      <p className="panel-lead small home-tip">Dica: tocar nos objetos da loja (armário, caldeirão, balcão…) também abre a tela certa.</p>
    </aside>
  );
}
