import { useGameStore, type PanelId } from '../../store/gameStore';

export const SHORTCUTS: { key: string; label: string; panel: PanelId; icon: string }[] = [
  { key: '1', label: 'Ingredientes', panel: 'ingredients', icon: '🌿' },
  { key: '2', label: 'Caldeirão', panel: 'production', icon: '⚗️' },
  { key: '3', label: 'Prateleiras', panel: 'shelves', icon: '🧪' },
  { key: '4', label: 'Balcão', panel: 'counter', icon: '🛎️' },
  { key: '5', label: 'Receitas', panel: 'recipes', icon: '📖' },
  { key: '6', label: 'Pedidos', panel: 'orders', icon: '📜' },
  { key: '7', label: 'Melhorias', panel: 'upgrades', icon: '🔨' },
  { key: '8', label: 'Relatório', panel: 'report', icon: '📊' },
];

export function BottomBar() {
  const active = useGameStore((s) => s.ui.activePanel);
  const customers = useGameStore((s) => s.save?.customers.length ?? 0);
  const order = useGameStore((s) => !!s.save?.order);
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <nav className="bottombar" aria-label="Atalhos">
      {SHORTCUTS.map((s) => {
        const badge = s.panel === 'counter' && customers > 0 ? customers : s.panel === 'orders' && order ? '!' : null;
        return (
          <button
            key={s.panel}
            className={`tab ${active === s.panel ? 'tab-active' : ''}`}
            aria-pressed={active === s.panel}
            onClick={() => dispatch({ type: 'TOGGLE_PANEL', panel: s.panel })}
          >
            <span className="tab-icon" aria-hidden>{s.icon}</span>
            <span className="tab-label">{s.label}</span>
            <kbd className="tab-key">{s.key}</kbd>
            {badge !== null && <span className="tab-badge">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
