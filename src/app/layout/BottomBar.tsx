import { useState } from 'react';
import { sealsAvailable } from '../../domain/rules/progression';
import { useGameStore, type PanelId } from '../../store/gameStore';

export const SHORTCUTS: { key: string; label: string; panel: PanelId; icon: string; primary?: boolean; short?: string }[] = [
  { key: '1', label: 'Ingredientes', short: 'Armário', panel: 'ingredients', icon: '🌿', primary: true },
  { key: '2', label: 'Caldeirão', panel: 'production', icon: '⚗️', primary: true },
  { key: '3', label: 'Prateleiras', short: 'Preços', panel: 'shelves', icon: '🧪', primary: true },
  { key: '4', label: 'Balcão', panel: 'counter', icon: '🛎️', primary: true },
  { key: '5', label: 'Receitas', panel: 'recipes', icon: '📖' },
  { key: '6', label: 'Pedidos', panel: 'orders', icon: '📜' },
  { key: '7', label: 'Melhorias', panel: 'upgrades', icon: '🔨' },
  { key: '8', label: 'Mestre', panel: 'grimoire', icon: '✨' },
  { key: '9', label: 'Relatório', panel: 'report', icon: '📊' },
];

/**
 * Barra de atalhos. No desktop mostra as 9 abas; no celular mostra as 4 principais
 * e um botão "Mais" que abre as outras numa gaveta (com selo quando há novidade lá dentro).
 */
export function BottomBar() {
  const active = useGameStore((s) => s.ui.activePanel);
  const customers = useGameStore((s) => s.save?.customers.length ?? 0);
  const order = useGameStore((s) => !!s.save?.order);
  const seals = useGameStore((s) => (s.save ? sealsAvailable(s.save) : 0));
  const dispatch = useGameStore((s) => s.dispatch);
  const [moreOpen, setMoreOpen] = useState(false);

  const badgeFor = (panel: PanelId) =>
    panel === 'counter' && customers > 0 ? customers : panel === 'orders' && order ? '!' : panel === 'grimoire' && seals > 0 ? seals : null;
  const secondary = SHORTCUTS.filter((s) => !s.primary);
  const moreBadge = secondary.some((s) => badgeFor(s.panel) !== null);
  const moreActive = secondary.some((s) => s.panel === active);

  const tab = (s: (typeof SHORTCUTS)[number], extra = '') => {
    const badge = badgeFor(s.panel);
    return (
      <button
        key={s.panel}
        className={`tab ${extra} ${active === s.panel ? 'tab-active' : ''}`}
        aria-pressed={active === s.panel}
        onClick={() => { setMoreOpen(false); dispatch({ type: 'TOGGLE_PANEL', panel: s.panel }); }}
      >
        <span className="tab-icon" aria-hidden>{s.icon}</span>
        <span className="tab-label">{s.short ? <><span className="label-full">{s.label}</span><span className="label-short">{s.short}</span></> : s.label}</span>
        <kbd className="tab-key">{s.key}</kbd>
        {badge !== null && <span className="tab-badge">{badge}</span>}
      </button>
    );
  };

  return (
    <nav className="bottombar" aria-label="Atalhos">
      {SHORTCUTS.map((s) => tab(s, s.primary ? '' : 'tab-secondary'))}
      <button
        className={`tab tab-more ${moreActive || moreOpen ? 'tab-active' : ''}`}
        aria-expanded={moreOpen}
        aria-haspopup="menu"
        onClick={() => setMoreOpen((o) => !o)}
      >
        <span className="tab-icon" aria-hidden>☰</span>
        <span className="tab-label">Mais</span>
        {moreBadge && <span className="tab-badge">!</span>}
      </button>
      {moreOpen && (
        <>
          <div className="more-backdrop" onClick={() => setMoreOpen(false)} aria-hidden />
          <div className="more-sheet" role="menu" aria-label="Mais painéis">
            {secondary.map((s) => tab(s))}
          </div>
        </>
      )}
    </nav>
  );
}
