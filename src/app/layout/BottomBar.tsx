import { useGameStore } from '../../store/gameStore';
import { groupOf, NAV_GROUPS, panelForGroup, SHORTCUTS, useBadges, type NavItem } from './nav';

export { SHORTCUTS };

/**
 * Barra de navegação.
 * - Computador: as 13 telas em 4 grupos com nome (Oficina, Loja, Progresso, Mundo), com tecla de atalho.
 * - Celular: 5 botões grandes (Início + as 4 áreas). Cada área abre um painel com abas para as telas dela.
 */
export function BottomBar() {
  const active = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  const badgeFor = useBadges();
  const activeGroup = groupOf(active);

  const tab = (s: NavItem) => {
    const badge = badgeFor(s.panel);
    return (
      <button
        key={s.panel}
        data-tut={`tab-${s.panel}`}
        className={`tab ${active === s.panel ? 'tab-active' : ''}`}
        aria-pressed={active === s.panel}
        title={`${s.title} (tecla ${s.key.toUpperCase()})`}
        onClick={() => dispatch({ type: 'TOGGLE_PANEL', panel: s.panel })}
      >
        <span className="tab-icon" aria-hidden>{s.icon}</span>
        <span className="tab-label">{s.label}</span>
        <kbd className="tab-key">{s.key.toUpperCase()}</kbd>
        {badge !== null && <span className="tab-badge">{badge}</span>}
      </button>
    );
  };

  return (
    <nav className="bottombar" aria-label="Navegação">
      {/* Computador: grupos com rótulo */}
      <div className="nav-desk">
        <button
          className={`tab tab-home ${active === null ? 'tab-active' : ''}`}
          aria-pressed={active === null}
          title="Resumo do dia (Esc)"
          onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
        >
          <span className="tab-icon" aria-hidden>🏠</span>
          <span className="tab-label">Início</span>
        </button>
        {NAV_GROUPS.map((g) => (
          <div key={g.id} className={`nav-group nav-${g.id} ${activeGroup?.id === g.id ? 'nav-group-on' : ''}`} role="group" aria-label={g.label}>
            <span className="nav-group-label" aria-hidden>{g.label}</span>
            <div className="nav-group-tabs">{g.items.map(tab)}</div>
          </div>
        ))}
      </div>

      {/* Celular: Início + 4 áreas */}
      <div className="nav-mobile">
        <button
          className={`area ${active === null ? 'area-on' : ''}`}
          aria-pressed={active === null}
          onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
        >
          <span className="area-icon" aria-hidden>🏠</span>
          <span className="area-label">Início</span>
        </button>
        {NAV_GROUPS.map((g) => {
          const on = activeGroup?.id === g.id;
          const badges = g.items.map((i) => badgeFor(i.panel)).filter((b) => b !== null);
          const nums = badges.filter((b): b is number => typeof b === 'number');
          const badge = badges.length === 0 ? null : nums.length === badges.length ? nums.reduce((a, b) => a + b, 0) : badges.find((b) => typeof b === 'string') ?? '!';
          return (
            <button
              key={g.id}
              data-tut={['group-' + g.id, ...g.items.map((i) => `tab-${i.panel}`)].join(' ')}
              className={`area area-${g.id} ${on ? 'area-on' : ''}`}
              aria-pressed={on}
              aria-label={`${g.label}: ${g.hint}`}
              onClick={() => (on ? dispatch({ type: 'CLOSE_PANEL' }) : dispatch({ type: 'OPEN_PANEL', panel: panelForGroup(g, badgeFor) }))}
            >
              <span className="area-icon" aria-hidden>{g.icon}</span>
              <span className="area-label">{g.label}</span>
              {badge !== null && <span className="tab-badge">{badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
