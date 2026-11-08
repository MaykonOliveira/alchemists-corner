import { DAY_EVENTS } from '../../domain/data/orders';
import { chestReady } from '../../domain/rules/goals';
import { sealsAvailable } from '../../domain/rules/progression';
import { useGameStore, type PanelId } from '../../store/gameStore';

/**
 * Mapa da navegação: as 13 telas do jogo ficam em 4 áreas com nome fixo.
 * A mesma estrutura aparece na barra de baixo (computador), nos 5 botões do celular,
 * nas abas dentro do painel e no resumo do dia. Um nome por tela, em todo lugar.
 */
export type GroupId = 'oficina' | 'loja' | 'progresso' | 'mundo';

export interface NavItem {
  panel: PanelId;
  /** Nome curto (aba). */
  label: string;
  /** Nome completo (título do painel). */
  title: string;
  icon: string;
  key: string;
}

export interface NavGroup {
  id: GroupId;
  label: string;
  icon: string;
  /** O que se faz nesta área, em poucas palavras. */
  hint: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'oficina', label: 'Oficina', icon: '⚗️', hint: 'Comprar ingredientes e preparar poções',
    items: [
      { panel: 'ingredients', label: 'Armário', title: 'Armário e fornecedor', icon: '🌿', key: '1' },
      { panel: 'production', label: 'Caldeirão', title: 'Caldeirão', icon: '🔥', key: '2' },
      { panel: 'recipes', label: 'Receitas', title: 'Livro de receitas', icon: '📖', key: '3' },
    ],
  },
  {
    id: 'loja', label: 'Loja', icon: '🛎️', hint: 'Preços, clientes e pedidos especiais',
    items: [
      { panel: 'shelves', label: 'Prateleiras', title: 'Prateleiras e preços', icon: '🧪', key: '4' },
      { panel: 'counter', label: 'Balcão', title: 'Balcão', icon: '🛎️', key: '5' },
      { panel: 'orders', label: 'Pedidos', title: 'Quadro de pedidos', icon: '📜', key: '6' },
    ],
  },
  {
    id: 'progresso', label: 'Progresso', icon: '🎯', hint: 'Metas, melhorias, talentos e relatório',
    items: [
      { panel: 'goals', label: 'Metas', title: 'Metas do dia', icon: '🎯', key: '7' },
      { panel: 'upgrades', label: 'Melhorias', title: 'Melhorias e ajudantes', icon: '🔨', key: '8' },
      { panel: 'grimoire', label: 'Grimório', title: 'Grimório do Mestre', icon: '✨', key: '9' },
      { panel: 'report', label: 'Relatório', title: 'Caixa e relatório', icon: '📊', key: '0' },
    ],
  },
  {
    id: 'mundo', label: 'Mundo', icon: '🗺️', hint: 'A rua, a temporada e o álbum',
    items: [
      { panel: 'street', label: 'Rua', title: 'A rua da loja', icon: '🏘️', key: 'r' },
      { panel: 'season', label: 'Temporada', title: 'Temporada e decoração', icon: '🌙', key: 't' },
      { panel: 'album', label: 'Álbum', title: 'Álbum da loja', icon: '🏆', key: 'a' },
    ],
  },
];

/** Todas as telas em ordem, com o atalho de teclado. */
export const SHORTCUTS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

const ITEM_BY_PANEL = new Map(SHORTCUTS.map((s) => [s.panel, s]));
const GROUP_BY_PANEL = new Map(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.panel, g] as const)));

/** A porta da loja não tem aba própria: abre pela cena e fica na área Loja. */
export const groupOf = (panel: PanelId | null): NavGroup | null =>
  panel ? GROUP_BY_PANEL.get(panel) ?? (panel === 'door' ? NAV_GROUPS[1] : null) : null;

export const panelTitle = (panel: PanelId): string => (panel === 'door' ? 'Porta da loja' : ITEM_BY_PANEL.get(panel)?.title ?? '');

/** Última tela aberta em cada área: tocar na área volta para ela. */
const lastInGroup: Partial<Record<GroupId, PanelId>> = {};
export const rememberPanel = (panel: PanelId | null) => {
  const g = groupOf(panel);
  if (g && panel && ITEM_BY_PANEL.has(panel)) lastInGroup[g.id] = panel;
};

/** Selos das abas: o que pede atenção em cada tela (número, "!" ou um ícone). */
export function useBadges() {
  const customers = useGameStore((s) => s.save?.customers.length ?? 0);
  const order = useGameStore((s) => !!s.save?.order || (!!s.save?.contract && !s.save.contract.accepted));
  const seals = useGameStore((s) => (s.save ? sealsAvailable(s.save) : 0));
  const rareEvent = useGameStore((s) => !!(s.save?.event && DAY_EVENTS[s.save.event].rare));
  const chest = useGameStore((s) => (s.save ? chestReady(s.save) : false));
  const fest = useGameStore((s) => s.save?.event === 'festa-estacao');
  // Caldeirão parado com a loja aberta: a aba avisa, para ninguém esquecer dele em outra tela.
  const idlePot = useGameStore((s) => !!s.save && s.save.phase === 'expediente' && !s.save.brew && s.save.tutorialStep >= 5);
  return (panel: PanelId): string | number | null => {
    switch (panel) {
      case 'counter': return customers > 0 ? customers : null;
      case 'production': return idlePot ? '!' : null;
      case 'orders': return order ? '!' : null;
      case 'grimoire': return seals > 0 ? seals : null;
      case 'street': return rareEvent ? '!' : null;
      case 'goals': return chest ? '🎁' : null;
      case 'season': return fest ? '🎉' : null;
      default: return null;
    }
  };
}

/** Ao tocar numa área: a tela com novidade, senão a última aberta, senão a primeira. */
export function panelForGroup(group: NavGroup, badgeFor: (p: PanelId) => unknown): PanelId {
  const withBadge = group.items.find((i) => badgeFor(i.panel) !== null);
  return withBadge?.panel ?? lastInGroup[group.id] ?? group.items[0].panel;
}
