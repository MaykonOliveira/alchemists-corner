import { useGameStore } from '../../store/gameStore';
import { groupOf, panelForGroup, SHORTCUTS, tabsOf, useBadges, useVisibleGroups } from './nav';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
export { SHORTCUTS };

/**
 * Barra de navegação: Início + as 4 áreas, igual no computador e no celular.
 * As telas de cada área viram abas dentro do painel. Os atalhos de teclado continuam valendo.
 * Novidade numa área aparece como um ponto; o número fica na aba, dentro da área.
 */
export function BottomBar() {
  const active = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  const badgeFor = useBadges();
  const activeGroup = groupOf(active);
  const groups = useVisibleGroups();

  return (
    <nav className="bottombar" aria-label={tr('Navegação')}>
      <div className="nav-areas">
        <button
          className={`area ${active === null ? 'area-on' : ''}`}
          aria-pressed={active === null}
          title={tr('Início (Esc)')}
          onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
        >
          <span className="area-icon" aria-hidden><Icon e="🏠" size={32} /></span>
          <span className="area-label">{tr('Início')}</span>
        </button>
        {groups.map((g) => {
          const on = activeGroup?.id === g.id;
          const alert = g.items.some((i) => badgeFor(i.panel) !== null);
          const keys = tabsOf(g).map((i) => `${i.label} (${i.key.toUpperCase()})`).join(' · ');
          return (
            <button
              key={g.id}
              data-tut={['group-' + g.id, ...g.items.map((i) => `tab-${i.panel}`)].join(' ')}
              className={`area area-${g.id} ${on ? 'area-on' : ''}`}
              aria-pressed={on}
              aria-label={`${g.label}: ${g.hint}${alert ? tr(' (tem novidade)') : ''}`}
              title={keys}
              onClick={() => (on ? dispatch({ type: 'CLOSE_PANEL' }) : dispatch({ type: 'OPEN_PANEL', panel: panelForGroup(g, badgeFor) }))}
            >
              <span className="area-icon" aria-hidden><Icon e={g.icon} size={32} /></span>
              <span className="area-label">{g.label}</span>
              {alert && <span className="area-alert" aria-hidden />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
