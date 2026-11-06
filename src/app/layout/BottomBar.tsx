import { useGameStore, type PanelId } from '../../store/gameStore';

export const SHORTCUTS: { key: string; label: string; panel: PanelId }[] = [
  { key: '1', label: 'Ingredientes', panel: 'ingredients' },
  { key: '2', label: 'Produção', panel: 'production' },
  { key: '3', label: 'Receitas', panel: 'recipes' },
  { key: '4', label: 'Pedidos', panel: 'orders' },
  { key: '5', label: 'Relatório', panel: 'report' },
];

export function BottomBar() {
  const active = useGameStore((s) => s.ui.activePanel);
  const dispatch = useGameStore((s) => s.dispatch);
  return (
    <nav className="bottombar" aria-label="Atalhos">
      {SHORTCUTS.map((s) => (
        <button
          key={s.panel}
          className={`tab ${active === s.panel ? 'tab-active' : ''}`}
          aria-pressed={active === s.panel}
          onClick={() => dispatch({ type: 'TOGGLE_PANEL', panel: s.panel })}
        >
          <kbd>{s.key}</kbd> {s.label}
        </button>
      ))}
    </nav>
  );
}
