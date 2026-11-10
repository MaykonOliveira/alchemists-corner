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
import { useEffect, useRef, useState } from 'react';
import type { GameSave } from '../../domain/models/types';
import { useGameStore, type PanelId } from '../../store/gameStore';
import { groupOf, panelIsNew, panelLabel, panelsInTab, panelTitle, panelUnlocked, rememberPanel, SHORTCUTS, tabOf, tabsOf, useBadges, useVisibleGroups } from './nav';
import { potionStock } from '../../domain/rules/economy';
import { freeCauldron, hasSecondCauldron, repeatBatches } from '../../domain/rules/alchemy';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { customerCardVisible, tutorialActive } from '../../features/tutorial/stage';
import { TipCard } from '../../features/tutorial/TipCard';
import { QuickServe } from '../../features/customers/QuickServe';
import { SeasonPanel } from '../../features/season/SeasonPanel';
import { RoyalPanel } from '../../features/royal/RoyalPanel';
import { VillagePanel } from '../../features/world/VillagePanel';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const BODY: Partial<Record<PanelId, (save: GameSave) => React.ReactNode>> = {
  ingredients: (s) => <IngredientsPanel save={s} />,
  shelves: (s) => <ShelvesPanel save={s} />,
  production: (s) => <ProductionPanel save={s} />,
  recipes: (s) => <RecipesPanel save={s} />,
  orders: (s) => <OrdersPanel save={s} />,
  report: (s) => <ReportPanel save={s} />,
  counter: (s) => <CounterPanel save={s} />,
  door: (s) => <DoorPanel save={s} />,
  upgrades: (s) => <UpgradesPanel save={s} />,
  grimoire: (s) => <GrimoirePanel save={s} />,
  album: (s) => <AlbumPanel save={s} />,
  street: (s) => <StreetPanel save={s} />,
  goals: (s) => <GoalsPanel save={s} />,
  season: (s) => <SeasonPanel save={s} />,
  royal: (s) => <RoyalPanel save={s} />,
  village: (s) => <VillagePanel save={s} />,
};

export function SidePanel() {
  const save = useGameStore((s) => s.save)!;
  const panel = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  const badgeFor = useBadges();
  const groups = useVisibleGroups();
  useEffect(() => rememberPanel(panel), [panel]);
  // Telas que aparecem nesta aba (a pedida primeiro). Abriu uma tela "novo": o selo some.
  const tab = panel ? tabOf(panel) : null;
  const shown = tab ? panelsInTab(tab).filter((p) => p === panel || panelUnlocked(save, p)) : [];
  if (panel && shown[0] !== panel) shown.sort((a, b) => (a === panel ? -1 : b === panel ? 1 : 0));
  const fresh = shown.filter((p) => panelIsNew(save, p)).join(',');
  useEffect(() => { if (fresh) for (const p of fresh.split(',')) dispatch({ type: 'SEE_TIP', tipId: `area:${p}` }); }, [fresh, dispatch]);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.closest('.side')?.scrollTo({ top: 0 }); }, [panel]);

  if (!panel || !tab) return <HomePanel save={save} />;

  const full = groupOf(panel);
  const group = full ? groups.find((g) => g.id === full.id) ?? full : null;
  const tabs = group ? tabsOf(group) : [];
  const tabBadge = (t: PanelId) => panelsInTab(t).map((p) => badgeFor(p)).find((b) => b !== null) ?? null;
  return (
    <aside className={`side ${group ? `side-${group.id}` : ''}`} aria-label={panelTitle(panel)}>
      <div className="side-top">
      <div className="side-head">
        <h2 className="side-title">
          {group && <span className="side-area"><Icon e={group.icon} /> {group.label}</span>}
          {shown.length > 1 ? (shown.includes('royal') ? tr('Vila e Concurso Real') : shown.map((p) => panelLabel(p)).join(tr(' e '))) : panelTitle(panel)}
        </h2>
        <button className="icon-btn" onClick={() => dispatch({ type: 'CLOSE_PANEL' })} aria-label={tr('Voltar ao início')} title={tr('Voltar ao início (Esc)')}>×</button>
      </div>
      {tabs.length > 1 && (
        <div className="subtabs" role="tablist" aria-label={tr('Telas de {0}', group!.label)}>
          {tabs.map((i) => {
            const badge = tabBadge(i.panel);
            return (
              <button
                key={i.panel}
                role="tab"
                aria-selected={tab === i.panel}
                className={`subtab ${tab === i.panel ? 'subtab-on' : ''}`}
                onClick={() => dispatch({ type: 'OPEN_PANEL', panel: i.panel })}
              >
                <span aria-hidden><Icon e={i.icon} /></span> {i.label}
                {badge !== null && <span className="subtab-badge">{badge}</span>}
              </button>
            );
          })}
        </div>
      )}
      </div>
      <QuickServe placement="side" />
      <div className="side-body" ref={bodyRef}>
        {shown.map((p, n) => (
          <section key={p} className={n > 0 ? 'side-section' : undefined} aria-label={n > 0 ? panelTitle(p) : undefined}>
            {n > 0 && <h3 className="side-section-title"><Icon e={SHORTCUTS.find((i) => i.panel === p)?.icon ?? ''} /> {panelTitle(p)}</h3>}
            {BODY[p]?.(save)}
          </section>
        ))}
      </div>
    </aside>
  );
}

/** O único próximo passo que o Início sugere (ou nenhum, quando está tudo andando). */
type Next = { icon: string; title: string; label: string; act: () => void } | null;

/**
 * Início enxuto: a cena já mostra clientes, caldeirões e prateleiras. Aqui fica só
 * o que fazer agora (um passo), o botão do dia e as metas em linhas finas.
 * Dia e fase moram no topo; as áreas moram na barra de baixo.
 */
function HomePanel({ save }: { save: GameSave }) {
  const dispatch = useGameStore((s) => s.dispatch);
  const customerCard = useGameStore(customerCardVisible);
  const tutorial = useGameStore(tutorialActive);
  const [confirmClose, setConfirmClose] = useState(false);
  const go = (panel: PanelId) => dispatch({ type: 'OPEN_PANEL', panel });
  const stock = save.potions.reduce((n, p) => n + p.quantity, 0);
  const lowStock = Object.values(save.ingredients).reduce((n, q) => n + q, 0) < 4;
  const free = save.phase !== 'fechamento' && save.knownRecipes.length > 0 ? freeCauldron(save) : null;
  const twoPots = hasSecondCauldron(save);
  const repeat = repeatBatches(save);
  const last = save.lastBrew ? RECIPES_BY_ID[save.lastBrew.recipeId] : null;

  let next: Next = null;
  // Durante o tutorial quem guia é o cartão do tutorial: o Início não sugere outro caminho.
  if (tutorial) next = null;
  else if (save.customers.length > 0 && !customerCard) {
    const n = save.customers.length;
    next = { icon: '🛎️', title: n > 1 ? tr('{0} clientes esperando no balcão', n) : tr('Um cliente esperando no balcão'), label: tr('Atender'), act: () => go('counter') };
  } else if (free && repeat > 0 && last) {
    next = { icon: '🔥', title: twoPots && !save.brew && !save.brew2 ? tr('Os 2 caldeirões estão parados') : twoPots ? tr('Um caldeirão está parado') : tr('O caldeirão está parado'), label: tr('Repetir {0} ×{1}', last.shortName, repeat), act: () => dispatch({ type: 'REPEAT_BREW' }) };
  } else if (free && !lowStock) {
    next = { icon: '🔥', title: twoPots && !save.brew && !save.brew2 ? tr('Os 2 caldeirões estão parados') : twoPots ? tr('Um caldeirão está parado') : tr('O caldeirão está parado'), label: tr('Preparar poções'), act: () => go('production') };
  } else if (lowStock) {
    next = { icon: '🌿', title: tr('Os ingredientes estão acabando'), label: tr('Comprar ingredientes'), act: () => go('ingredients') };
  } else if (stock === 0) {
    next = { icon: '🧪', title: tr('As prateleiras estão vazias'), label: tr('Ver prateleiras'), act: () => go('shelves') };
  } else if (save.order && potionStock(save, save.order.recipeId) < save.order.qty) {
    next = { icon: '📜', title: tr('Pedido especial: {0}/{1} {2}', potionStock(save, save.order.recipeId), save.order.qty, RECIPES_BY_ID[save.order.recipeId].shortName), label: tr('Ver pedido'), act: () => go('orders') };
  }

  return (
    <aside className="side side-idle" aria-label={tr('Início')}>
      <QuickServe placement="side" />
      {next && (
        <div className="home-next">
          <span className="home-next-kicker">{tr('Próximo passo')}</span>
          <p className="home-next-title"><Icon e={next.icon} /> {next.title}</p>
          <button className="btn btn-small" onClick={next.act}>{next.label}</button>
        </div>
      )}
      {save.phase === 'preparacao' && (
        <button data-tut="open-shop" className="btn btn-primary btn-big btn-glow home-open" onClick={() => dispatch({ type: 'OPEN_SHOP' })}>{tr('Abrir a loja')}</button>
      )}
      {!next && save.phase === 'expediente' && !customerCard && <p className="home-calm">{tr('Tudo andando. Os clientes chegam pela porta.')}</p>}
      <TipCard />
      <button className="home-goals" onClick={() => go('goals')} aria-label={tr('Abrir metas do dia')}>
        <GoalsList save={save} compact />
      </button>
      {save.phase === 'expediente' && (
        <div className="home-close only-phone">
          {confirmClose ? (
            <>
              <button className="btn btn-danger btn-small" onClick={() => { setConfirmClose(false); dispatch({ type: 'CLOSE_SHOP' }); }}>{tr('Fechar a loja agora?')}</button>
              <button className="btn btn-ghost btn-small" onClick={() => setConfirmClose(false)}>{tr('Não')}</button>
            </>
          ) : (
            <button data-tut="close-day" className="btn btn-ghost btn-small" onClick={() => setConfirmClose(true)}>{tr('Encerrar o dia')}</button>
          )}
        </div>
      )}
    </aside>
  );
}
