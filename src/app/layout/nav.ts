import { DAY_EVENTS } from '../../domain/data/orders';
import { chestReady } from '../../domain/rules/goals';
import { sealsAvailable } from '../../domain/rules/progression';
import { royalChapter, royalDeliverable, royalStarsMissing } from '../../domain/rules/royal';
import type { GameSave } from '../../domain/models/types';
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
      { panel: 'royal', label: 'Concurso', title: 'Concurso Real de Alquimia', icon: '👑', key: 'c' },
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

/**
 * Telas que só aparecem quando passam a fazer sentido. Antes disso ficam escondidas,
 * em vez de mostrar "desperta no nível 11" para quem está no dia 2.
 * `fresh` diz até quando a tela recém-aberta ganha o selo "novo".
 */
const UNLOCK: Partial<Record<PanelId, { open: (s: GameSave) => boolean; fresh: (s: GameSave) => boolean }>> = {
  upgrades: { open: (s) => s.level >= 2, fresh: (s) => s.level <= 3 },
  report: { open: (s) => s.day >= 2, fresh: (s) => s.day <= 3 },
  season: { open: (s) => s.day >= 3, fresh: (s) => s.day <= 4 },
  street: { open: (s) => s.level >= 3, fresh: (s) => s.level <= 4 },
  grimoire: { open: (s) => s.level >= 8 || sealsAvailable(s) > 0, fresh: (s) => s.level <= 9 },
  royal: { open: (s) => !!s.royal, fresh: (s) => (s.royal?.chapter ?? 0) === 0 },
};

export const panelUnlocked = (s: GameSave | null, panel: PanelId): boolean => !s || (UNLOCK[panel]?.open(s) ?? true);

/** Tela que acabou de abrir e ainda não foi visitada: ganha o selo "novo". */
export const panelIsNew = (s: GameSave, panel: PanelId): boolean => {
  const u = UNLOCK[panel];
  return !!u && u.open(s) && u.fresh(s) && !s.tipsSeen.includes(`area:${panel}`);
};

/** As áreas só com as telas já abertas (a tela ativa sempre aparece). */
export function visibleGroups(s: GameSave | null, active: PanelId | null = null): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.panel === active || panelUnlocked(s, i.panel)) }));
}

/** Versão em hook: só recalcula quando muda o conjunto de telas abertas. */
export function useVisibleGroups(): NavGroup[] {
  const key = useGameStore((st) => SHORTCUTS.map((i) => (panelUnlocked(st.save, i.panel) || st.ui.activePanel === i.panel ? '1' : '0')).join(''));
  return cache.key === key ? cache.groups : (cache = { key, groups: NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => key[SHORTCUTS.indexOf(i)] === '1') })) }).groups;
}
let cache: { key: string; groups: NavGroup[] } = { key: '', groups: NAV_GROUPS };

/** Selo do Concurso: entrega pronta ou capítulo novo para ler. */
function royalBadge(s: GameSave): string | null {
  if (!royalChapter(s)) return null;
  if (s.royal!.seen < s.royal!.chapter) return '!';
  return royalDeliverable(s).length && !royalStarsMissing(s) ? '📦' : null;
}

/** Selos das abas: o que pede atenção em cada tela (número, "!" ou um ícone). */
export function useBadges() {
  const customers = useGameStore((s) => s.save?.customers.length ?? 0);
  const order = useGameStore((s) => !!s.save?.order || (!!s.save?.contract && !s.save.contract.accepted));
  const seals = useGameStore((s) => (s.save ? sealsAvailable(s.save) : 0));
  const rareEvent = useGameStore((s) => !!(s.save?.event && DAY_EVENTS[s.save.event].rare));
  const chest = useGameStore((s) => (s.save ? chestReady(s.save) : false));
  const fest = useGameStore((s) => s.save?.event === 'festa-estacao');
  const royal = useGameStore((s) => (s.save ? royalBadge(s.save) : null));
  // Caldeirão parado com a loja aberta: a aba avisa, para ninguém esquecer dele em outra tela.
  const fresh = useGameStore((s) => (s.save ? SHORTCUTS.filter((i) => panelIsNew(s.save!, i.panel)).map((i) => i.panel).join(',') : ''));
  const idlePot = useGameStore((s) => !!s.save && s.save.phase === 'expediente' && !s.save.brew && s.save.tutorialStep >= 5);
  return (panel: PanelId): string | number | null => {
    if (fresh && fresh.split(',').includes(panel)) return 'novo';
    switch (panel) {
      case 'counter': return customers > 0 ? customers : null;
      case 'production': return idlePot ? '!' : null;
      case 'orders': return order ? '!' : null;
      case 'grimoire': return seals > 0 ? seals : null;
      case 'street': return rareEvent ? '!' : null;
      case 'goals': return chest ? '🎁' : null;
      case 'season': return fest ? '🎉' : null;
      case 'royal': return royal;
      default: return null;
    }
  };
}

/** Ao tocar numa área: a tela com novidade, senão a última aberta, senão a primeira. */
export function panelForGroup(group: NavGroup, badgeFor: (p: PanelId) => unknown): PanelId {
  const withBadge = group.items.find((i) => badgeFor(i.panel) !== null);
  return withBadge?.panel ?? lastInGroup[group.id] ?? group.items[0].panel;
}
