import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { INGREDIENTS_BY_ID } from '../domain/data/ingredients';
import { DAY_EVENTS } from '../domain/data/orders';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { UPGRADES_BY_ID } from '../domain/data/upgrades';
import type { GameEvent, GameSave } from '../domain/models/types';
import { applyCommand, type DomainCommand } from '../domain/rules/commands';
import { createNewGame } from '../domain/rules/initialState';
import { gameEvents } from '../game/events';
import { saveRepository } from '../persistence/saveRepository';

export type PanelId =
  | 'ingredients' | 'production' | 'recipes' | 'orders' | 'report' | 'shelves' | 'counter' | 'door' | 'upgrades';

export interface HoverInfo {
  id: string;
  label: string;
  /** Ponto de ancoragem em coordenadas lógicas do canvas (384×216). */
  x: number;
  y: number;
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'gold';
}

export type ModalId = 'settings' | 'levelup' | null;

export type UiCommand =
  | { type: 'OPEN_PANEL'; panel: PanelId }
  | { type: 'TOGGLE_PANEL'; panel: PanelId }
  | { type: 'CLOSE_PANEL' }
  | { type: 'SET_HOVER'; hover: HoverInfo | null }
  | { type: 'SELECT_CUSTOMER'; id: string | null }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'OPEN_MODAL'; modal: ModalId }
  | { type: 'DISMISS_TOAST'; id: number }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'NEXT_TUTORIAL' };

export type GameCommand = DomainCommand | UiCommand;

export interface UiState {
  activePanel: PanelId | null;
  hover: HoverInfo | null;
  selectedCustomerId: string | null;
  paused: boolean;
  zoom: number;
  modal: ModalId;
  levelUp: { level: number; recipes: string[] } | null;
  toasts: Toast[];
  lastHint: string | null;
}

interface StoreState {
  status: 'loading' | 'menu' | 'playing';
  save: GameSave | null;
  hasStoredSave: boolean;
  storageError: string | null;
  ui: UiState;
  init: () => Promise<void>;
  newGame: () => void;
  continueGame: () => void;
  backToMenu: () => void;
  dispatch: (cmd: GameCommand) => void;
}

const initialUi: UiState = {
  activePanel: null, hover: null, selectedCustomerId: null, paused: false, zoom: 2,
  modal: null, levelUp: null, toasts: [], lastHint: null,
};

const UI_TYPES = new Set<GameCommand['type']>([
  'OPEN_PANEL', 'TOGGLE_PANEL', 'CLOSE_PANEL', 'SET_HOVER', 'SELECT_CUSTOMER', 'TOGGLE_PAUSE', 'SET_PAUSED',
  'SET_ZOOM', 'OPEN_MODAL', 'DISMISS_TOAST', 'SKIP_TUTORIAL', 'NEXT_TUTORIAL',
]);
const isUi = (cmd: GameCommand): cmd is UiCommand => UI_TYPES.has(cmd.type);

/** Último passo do tutorial; valores maiores significam "concluído". */
export const TUTORIAL_DONE = 7;

let toastSeq = 0;
let loadedSave: GameSave | null = null;

export const useGameStore = create<StoreState>()(
  subscribeWithSelector((set, get) => {
    const toast = (text: string, tone: Toast['tone'] = 'info') => {
      const t = { id: ++toastSeq, text, tone };
      set((st) => ({ ui: { ...st.ui, toasts: [...st.ui.toasts.slice(-3), t] } }));
      setTimeout(() => get().dispatch({ type: 'DISMISS_TOAST', id: t.id }), tone === 'warn' ? 3200 : 4200);
    };

    const tutorialAt = (step: number) => get().save?.tutorialStep === step;
    const advanceTutorial = (from: number) => {
      if (tutorialAt(from)) get().dispatch({ type: 'SET_TUTORIAL', step: from + 1 });
    };

    /** Efeitos de interface para cada evento de regra (avisos, tutorial, seleção). */
    const react = (e: GameEvent) => {
      switch (e.type) {
        case 'ERROR': return toast(e.message, 'warn');
        case 'PURCHASE':
          toast(`Comprou ${e.qty}× ${INGREDIENTS_BY_ID[e.ingredientId].name} por ${e.cost} moedas.`);
          return advanceTutorial(1);
        case 'BREW_STARTED':
          toast(`O caldeirão começou a ferver: ${RECIPES_BY_ID[e.recipeId].name}.`);
          return advanceTutorial(2);
        case 'BREW_DONE': return toast(`${e.qty}× ${RECIPES_BY_ID[e.recipeId].name} prontas nas prateleiras!`, 'ok');
        case 'SALE':
          if (get().ui.selectedCustomerId === e.customerId) set((st) => ({ ui: { ...st.ui, selectedCustomerId: null } }));
          return advanceTutorial(4);
        case 'CUSTOMER_LEFT':
          if (get().ui.selectedCustomerId === e.customerId) set((st) => ({ ui: { ...st.ui, selectedCustomerId: null } }));
          if (e.reason === 'paciencia') toast('Um cliente cansou de esperar e foi embora (−1 reputação).', 'warn');
          return;
        case 'CUSTOMER_ARRIVED': {
          const s = get().save;
          // Seleciona automaticamente quando é o único cliente, para o atendimento ficar a um clique.
          if (s && s.customers.length === 1 && !get().ui.selectedCustomerId) {
            set((st) => ({ ui: { ...st.ui, selectedCustomerId: e.customerId } }));
          }
          return;
        }
        case 'LEVEL_UP':
          set((st) => ({ ui: { ...st.ui, modal: 'levelup', levelUp: { level: e.level, recipes: e.recipes }, paused: true } }));
          return;
        case 'ORDER_NEW': return toast('Novo pedido especial no quadro de avisos!', 'gold');
        case 'ORDER_DONE': return toast(`Pedido entregue! +${e.coins} moedas.`, 'gold');
        case 'ORDER_EXPIRED': return toast('Um pedido especial expirou. Sem problemas, outros virão.');
        case 'UPGRADE_BOUGHT': return toast(`Melhoria instalada: ${UPGRADES_BY_ID[e.upgradeId].name}!`, 'gold');
        case 'DISCOVERY':
          set((st) => ({ ui: { ...st.ui, lastHint: null } }));
          return toast(`Descoberta! ${RECIPES_BY_ID[e.recipeId].name} foi anotada no livro.`, 'gold');
        case 'EXPERIMENT_FAILED':
          set((st) => ({ ui: { ...st.ui, lastHint: e.hint } }));
          return;
        case 'DAY_CLOSED':
          set((st) => ({ ui: { ...st.ui, activePanel: null, selectedCustomerId: null, paused: false } }));
          return advanceTutorial(5);
        case 'DAY_STARTED':
          if (e.event) toast(`${DAY_EVENTS[e.event].name}: ${DAY_EVENTS[e.event].text}`, 'gold');
          return advanceTutorial(6);
        default:
          return;
      }
    };

    const reduceUi = (ui: UiState, cmd: UiCommand): UiState => {
      switch (cmd.type) {
        case 'OPEN_PANEL':
          return { ...ui, activePanel: cmd.panel };
        case 'TOGGLE_PANEL':
          return { ...ui, activePanel: ui.activePanel === cmd.panel ? null : cmd.panel };
        case 'CLOSE_PANEL':
          return { ...ui, activePanel: null };
        case 'SET_HOVER':
          return { ...ui, hover: cmd.hover };
        case 'SELECT_CUSTOMER':
          return { ...ui, selectedCustomerId: cmd.id, activePanel: cmd.id ? 'counter' : ui.activePanel };
        case 'TOGGLE_PAUSE':
          return { ...ui, paused: !ui.paused };
        case 'SET_PAUSED':
          return ui.paused === cmd.paused ? ui : { ...ui, paused: cmd.paused };
        case 'SET_ZOOM':
          return ui.zoom === cmd.zoom ? ui : { ...ui, zoom: cmd.zoom };
        case 'OPEN_MODAL':
          return { ...ui, modal: cmd.modal, levelUp: cmd.modal === 'levelup' ? ui.levelUp : null, paused: cmd.modal ? true : false };
        case 'DISMISS_TOAST':
          return { ...ui, toasts: ui.toasts.filter((t) => t.id !== cmd.id) };
        default:
          return ui;
      }
    };

    return {
      status: 'loading',
      save: null,
      hasStoredSave: false,
      storageError: null,
      ui: initialUi,

      async init() {
        try {
          loadedSave = await saveRepository.load();
          set({ status: 'menu', hasStoredSave: loadedSave !== null });
        } catch (err) {
          console.error(err);
          set({
            status: 'menu',
            storageError: 'Não foi possível acessar o armazenamento do navegador. O progresso não será salvo.',
          });
        }
      },

      newGame() {
        set({ status: 'playing', save: createNewGame(), ui: initialUi, hasStoredSave: true });
      },

      continueGame() {
        if (!loadedSave) return get().newGame();
        set({ status: 'playing', save: loadedSave, ui: initialUi });
      },

      backToMenu() {
        flushSave();
        loadedSave = get().save;
        set({ status: 'menu', ui: initialUi });
      },

      dispatch(cmd) {
        if (isUi(cmd)) {
          if (cmd.type === 'SKIP_TUTORIAL') return get().dispatch({ type: 'SET_TUTORIAL', step: 99 });
          if (cmd.type === 'NEXT_TUTORIAL') {
            const step = get().save?.tutorialStep ?? 99;
            return get().dispatch({ type: 'SET_TUTORIAL', step: step + 1 });
          }
          const ui = reduceUi(get().ui, cmd);
          if (ui !== get().ui) set({ ui });
          if (cmd.type === 'OPEN_PANEL' || cmd.type === 'TOGGLE_PANEL') {
            if (get().ui.activePanel === 'ingredients') advanceTutorial(0);
          }
          return;
        }
        const save = get().save;
        if (!save) return;
        const { save: next, events } = applyCommand(save, cmd);
        if (next !== save) set({ save: next });
        if (cmd.type === 'OPEN_SHOP' && next.phase === 'expediente' && save.phase !== 'expediente') advanceTutorial(3);
        events.forEach(react);
        gameEvents.emit(events);
      },
    };
  }),
);

// ---------- Salvamento automático (com limite de frequência) ----------
const SAVE_INTERVAL_MS = 2000;
let pending: GameSave | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function flushSave() {
  if (timer) clearTimeout(timer);
  timer = null;
  const data = pending;
  pending = null;
  if (!data) return;
  saveRepository.save(data).catch((err) => {
    console.error(err);
    useGameStore.setState({ storageError: 'Falha ao salvar a partida neste navegador.' });
  });
}

useGameStore.subscribe(
  (s) => s.save,
  (save, prev) => {
    if (!save || save === prev) return;
    pending = save;
    // Mudanças de fase salvam na hora; o resto é agrupado.
    if (!prev || prev.phase !== save.phase) return flushSave();
    timer ??= setTimeout(flushSave, SAVE_INTERVAL_MS);
  },
);

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
}
