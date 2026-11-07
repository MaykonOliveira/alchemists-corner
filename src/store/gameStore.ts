import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { INGREDIENTS_BY_ID } from '../domain/data/ingredients';
import { DAY_EVENTS } from '../domain/data/orders';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { TALENTS_BY_ID } from '../domain/data/talents';
import { UPGRADES_BY_ID } from '../domain/data/upgrades';
import type { GameEvent, GameSave } from '../domain/models/types';
import { applyCommand, type DomainCommand } from '../domain/rules/commands';
import { createNewGame } from '../domain/rules/initialState';
import { gameEvents } from '../game/events';
import { saveRepository } from '../persistence/saveRepository';

export type PanelId =
  | 'ingredients' | 'production' | 'recipes' | 'orders' | 'report' | 'shelves' | 'counter' | 'door' | 'upgrades' | 'grimoire';

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
  | { type: 'NEXT_TUTORIAL' }
  | { type: 'TOGGLE_SPEED' }
  | { type: 'DISMISS_WELCOME' };

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
  /** Multiplicador do relógio durante o expediente (1× ou 2×). */
  speed: 1 | 2;
  /** Cartão "bem-vindo de volta" ao continuar uma partida salva. */
  welcome: boolean;
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
  modal: null, levelUp: null, toasts: [], lastHint: null, speed: 1, welcome: false,
};

const UI_TYPES = new Set<GameCommand['type']>([
  'OPEN_PANEL', 'TOGGLE_PANEL', 'CLOSE_PANEL', 'SET_HOVER', 'SELECT_CUSTOMER', 'TOGGLE_PAUSE', 'SET_PAUSED',
  'SET_ZOOM', 'OPEN_MODAL', 'DISMISS_TOAST', 'SKIP_TUTORIAL', 'NEXT_TUTORIAL', 'TOGGLE_SPEED', 'DISMISS_WELCOME',
]);
const isUi = (cmd: GameCommand): cmd is UiCommand => UI_TYPES.has(cmd.type);

/** Último passo do tutorial; valores maiores significam "concluído". */
export const TUTORIAL_DONE = 7;

let toastSeq = 0;
export const MAX_TOASTS = 2;
let loadedSave: GameSave | null = null;

export const useGameStore = create<StoreState>()(
  subscribeWithSelector((set, get) => {
    /** Avisos curtos: no máximo 2 na tela e sem repetir o mesmo texto. */
    const toast = (text: string, tone: Toast['tone'] = 'info') => {
      const t = { id: ++toastSeq, text, tone };
      set((st) => ({
        ui: { ...st.ui, toasts: [...st.ui.toasts.filter((x) => x.text !== text).slice(-(MAX_TOASTS - 1)), t] },
      }));
      setTimeout(() => get().dispatch({ type: 'DISMISS_TOAST', id: t.id }), tone === 'warn' ? 2600 : 3400);
    };

    /** Depois que o cliente selecionado sai, o próximo da fila já fica pronto para o atendimento rápido. */
    const selectNextAfter = (customerId: string) => {
      if (get().ui.selectedCustomerId !== customerId) return;
      const next = get().save?.customers.find((c) => c.id !== customerId)?.id ?? null;
      set((st) => ({ ui: { ...st.ui, selectedCustomerId: next } }));
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
          if (e.by === 'aprendiz') return toast(`O aprendiz pôs no fogo: ${RECIPES_BY_ID[e.recipeId].name} (${e.batches} lote${e.batches > 1 ? 's' : ''}).`);
          toast(`O caldeirão começou a ferver: ${RECIPES_BY_ID[e.recipeId].name}.`);
          return advanceTutorial(2);
        case 'RAVEN_DELIVERY': {
          const units = e.items.reduce((n, i) => n + i.qty, 0);
          return toast(`O corvo trouxe ${units} ingredientes do fornecedor (−${e.cost} moedas).`);
        }
        case 'HELPER_TOGGLED':
          return toast(`${UPGRADES_BY_ID[e.upgradeId].name}: ${e.on ? 'de volta ao trabalho!' : 'descansando.'}`);
        case 'BREW_DONE': return toast(`${e.qty}× ${RECIPES_BY_ID[e.recipeId].name} prontas nas prateleiras!`, 'ok');
        case 'SALE':
          selectNextAfter(e.customerId);
          return advanceTutorial(4);
        case 'CUSTOMER_LEFT':
          selectNextAfter(e.customerId);
          if (e.reason === 'paciencia') toast('Um cliente cansou de esperar e foi embora (−1 reputação).', 'warn');
          return;
        case 'CUSTOMER_ARRIVED': {
          const s = get().save;
          // Sem ninguém selecionado, o cliente que chega já aparece no atendimento rápido (venda com um toque).
          const sel = get().ui.selectedCustomerId;
          if (s && (!sel || !s.customers.some((c) => c.id === sel))) {
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
        case 'UPGRADE_BOUGHT': {
          const up = UPGRADES_BY_ID[e.upgradeId];
          return toast(up.category === 'ajudante' ? `${up.name} contratado! Já está trabalhando na loja.` : `Melhoria instalada: ${up.name}!`, 'gold');
        }
        case 'DISCOVERY':
          set((st) => ({ ui: { ...st.ui, lastHint: null } }));
          return toast(`Descoberta! ${RECIPES_BY_ID[e.recipeId].name} foi anotada no livro.`, 'gold');
        case 'EXPERIMENT_FAILED':
          set((st) => ({ ui: { ...st.ui, lastHint: e.hint } }));
          return;
        case 'DAY_CLOSED':
          set((st) => ({ ui: { ...st.ui, activePanel: null, selectedCustomerId: null, paused: false } }));
          return advanceTutorial(5);
        case 'MASTERY_STAR':
          return toast(`Maestria! ${RECIPES_BY_ID[e.recipeId].name} agora tem ${'★'.repeat(e.stars)}: clientes pagam mais por ela.`, 'gold');
        case 'MASTER_RANK':
          return toast(`Grau de Mestre ${e.rank}! Você ganhou 1 Selo de Mestre para o Grimório.`, 'gold');
        case 'TALENT_LEARNED':
          return toast(`Talento aprendido: ${TALENTS_BY_ID[e.talentId].name} (grau ${e.rank}).`, 'gold');
        case 'SEAL_BOUGHT':
          return toast(`A Guilda dos Alquimistas agradece a doação de ${e.cost} moedas: +1 Selo de Mestre!`, 'gold');
        case 'FESTIVAL_SPONSORED':
          return toast(`Festival patrocinado (−${e.cost} moedas)! Amanhã a cidade estará em festa.`, 'gold');
        case 'GREENHOUSE_HARVEST': {
          const units = e.items.reduce((n, i) => n + i.qty, 0);
          return toast(`A estufa rendeu ${units} ervas fresquinhas para o armário.`, 'ok');
        }
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
          // Selecionar não abre mais o painel: o atendimento rápido aparece sobre a loja.
          return { ...ui, selectedCustomerId: cmd.id };
        case 'TOGGLE_SPEED':
          return { ...ui, speed: ui.speed === 1 ? 2 : 1 };
        case 'DISMISS_WELCOME':
          return ui.welcome ? { ...ui, welcome: false, paused: false } : ui;
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
        // No meio do expediente, o jogo volta pausado até o jogador fechar o "bem-vindo de volta".
        set({ status: 'playing', save: loadedSave, ui: { ...initialUi, welcome: true, paused: loadedSave.phase === 'expediente' } });
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
