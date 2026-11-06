import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CustomerArchetype, GameSave } from '../domain/models/types';
import { applyCommand, type DomainCommand } from '../domain/rules/commands';
import { createNewGame } from '../domain/rules/initialState';
import { saveRepository } from '../persistence/saveRepository';

export type PanelId = 'ingredients' | 'production' | 'recipes' | 'orders' | 'report' | 'shelves' | 'counter' | 'door';

export interface HoverInfo {
  id: string;
  label: string;
  /** Ponto de ancoragem em coordenadas lógicas do canvas (384×216). */
  x: number;
  y: number;
}

/** Cliente visual provisório (Fase 1). O atendimento real chega na Fase 3. */
export interface VisitorInfo {
  id: string;
  archetype: CustomerArchetype;
  wantedRecipeId: string;
}

export type UiCommand =
  | { type: 'OPEN_PANEL'; panel: PanelId }
  | { type: 'TOGGLE_PANEL'; panel: PanelId }
  | { type: 'CLOSE_PANEL' }
  | { type: 'SET_HOVER'; hover: HoverInfo | null }
  | { type: 'SELECT_VISITOR'; visitor: VisitorInfo | null }
  | { type: 'VISITOR_LEFT'; id: string }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_ZOOM'; zoom: number };

export type GameCommand = DomainCommand | UiCommand;

export interface UiState {
  activePanel: PanelId | null;
  hover: HoverInfo | null;
  selectedVisitor: VisitorInfo | null;
  paused: boolean;
  zoom: number;
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

const initialUi: UiState = { activePanel: null, hover: null, selectedVisitor: null, paused: false, zoom: 2 };

const UI_TYPES = new Set<GameCommand['type']>([
  'OPEN_PANEL', 'TOGGLE_PANEL', 'CLOSE_PANEL', 'SET_HOVER', 'SELECT_VISITOR', 'VISITOR_LEFT', 'TOGGLE_PAUSE', 'SET_ZOOM',
]);
const isUi = (cmd: GameCommand): cmd is UiCommand => UI_TYPES.has(cmd.type);

function reduceUi(ui: UiState, cmd: UiCommand): UiState {
  switch (cmd.type) {
    case 'OPEN_PANEL':
      return { ...ui, activePanel: cmd.panel };
    case 'TOGGLE_PANEL':
      return { ...ui, activePanel: ui.activePanel === cmd.panel ? null : cmd.panel };
    case 'CLOSE_PANEL':
      return { ...ui, activePanel: null };
    case 'SET_HOVER':
      return { ...ui, hover: cmd.hover };
    case 'SELECT_VISITOR':
      return { ...ui, selectedVisitor: cmd.visitor, activePanel: cmd.visitor ? 'counter' : ui.activePanel };
    case 'VISITOR_LEFT':
      return ui.selectedVisitor?.id === cmd.id ? { ...ui, selectedVisitor: null } : ui;
    case 'TOGGLE_PAUSE':
      return { ...ui, paused: !ui.paused };
    case 'SET_ZOOM':
      return ui.zoom === cmd.zoom ? ui : { ...ui, zoom: cmd.zoom };
  }
}

let loadedSave: GameSave | null = null;

export const useGameStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
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
        const ui = reduceUi(get().ui, cmd);
        if (ui !== get().ui) set({ ui });
        return;
      }
      const save = get().save;
      if (!save) return;
      const next = applyCommand(save, cmd);
      if (next !== save) set({ save: next });
    },
  })),
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
    // Mudanças de fase salvam na hora; ticks do relógio são agrupados.
    if (prev && prev.phase !== save.phase) return flushSave();
    timer ??= setTimeout(flushSave, SAVE_INTERVAL_MS);
  },
);

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
}
