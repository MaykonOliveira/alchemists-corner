import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { INGREDIENTS_BY_ID } from '../domain/data/ingredients';
import { DAY_EVENTS } from '../domain/data/orders';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { REGULARS_BY_ID, SEASONS, TIP_HEARTS } from '../domain/data/world';
import { ACHIEVEMENTS, giftLabel } from '../domain/rules/world';

/** Conquistas mostradas em tela cheia (src/features/celebrate/Milestone.tsx). */
const BIG_ACHIEVEMENT_IDS = ['primeira-venda', 'mil-moedas', 'primeiro-contrato', 'amigo', 'maestria', 'rival-vencida'];
import { goalText } from '../domain/rules/goals';
import { TALENTS_BY_ID } from '../domain/data/talents';
import { UPGRADES_BY_ID } from '../domain/data/upgrades';
import { EXPEDITIONS_BY_ID, FINDS_BY_ID } from '../domain/data/street';
import type { GameEvent, GameSave } from '../domain/models/types';
import { applyCommand, type DomainCommand } from '../domain/rules/commands';
import { createNewGame } from '../domain/rules/initialState';
import { gameEvents } from '../game/events';
import { saveRepository } from '../persistence/saveRepository';
import { CATALOG_BY_ID } from '../domain/data/catalog';
import { SEASON_FESTS } from '../domain/data/retention';
import { seasonOf } from '../domain/rules/world';
import { funnel } from '../analytics/funnel';
import { ROYAL_CHAPTERS } from '../domain/data/royal';
import { STIR_LEVEL } from '../domain/rules/quality';
import { STAGE_NAMES, VILLAGE_BY_ID } from '../domain/data/village';

export type PanelId =
  | 'ingredients' | 'production' | 'recipes' | 'orders' | 'report' | 'shelves' | 'counter' | 'door' | 'upgrades' | 'grimoire' | 'album' | 'street' | 'goals' | 'season' | 'royal' | 'village';

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

export type ModalId = 'settings' | 'levelup' | 'share' | 'royal' | null;

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
  | { type: 'DISMISS_WELCOME' }
  | { type: 'SHOW_WELCOME' };

export type GameCommand = DomainCommand | UiCommand;

export interface UiState {
  activePanel: PanelId | null;
  hover: HoverInfo | null;
  selectedCustomerId: string | null;
  paused: boolean;
  zoom: number;
  modal: ModalId;
  levelUp: { level: number; recipes: string[]; gift?: { coins: number; crystals: number; items: { ingredientId: string; qty: number }[] } } | null;
  toasts: Toast[];
  lastHint: string | null;
  /** Multiplicador do relógio durante o expediente (1× ou 2×). */
  speed: 1 | 2;
  /** Cartão "bem-vindo de volta" ao continuar uma partida salva. */
  welcome: boolean;
}

export interface StoreState {
  status: 'loading' | 'menu' | 'playing';
  save: GameSave | null;
  hasStoredSave: boolean;
  storageError: string | null;
  ui: UiState;
  init: () => Promise<void>;
  newGame: () => void;
  continueGame: () => void;
  backToMenu: () => void;
  /** Save atual (em jogo) ou o guardado (no menu), para exportar. */
  exportableSave: () => GameSave | null;
  /** Troca a partida guardada por uma importada e já entra nela. */
  importSave: (save: GameSave) => Promise<void>;
  dispatch: (cmd: GameCommand) => void;
}

const initialUi: UiState = {
  activePanel: null, hover: null, selectedCustomerId: null, paused: false, zoom: 2,
  modal: null, levelUp: null, toasts: [], lastHint: null, speed: 1, welcome: false,
};

const UI_TYPES = new Set<GameCommand['type']>([
  'OPEN_PANEL', 'TOGGLE_PANEL', 'CLOSE_PANEL', 'SET_HOVER', 'SELECT_CUSTOMER', 'TOGGLE_PAUSE', 'SET_PAUSED',
  'SET_ZOOM', 'OPEN_MODAL', 'DISMISS_TOAST', 'SKIP_TUTORIAL', 'NEXT_TUTORIAL', 'TOGGLE_SPEED', 'DISMISS_WELCOME', 'SHOW_WELCOME',
]);
const isUi = (cmd: GameCommand): cmd is UiCommand => UI_TYPES.has(cmd.type);

/** Último passo do tutorial; valores maiores significam "concluído". */
export const TUTORIAL_DONE = 7;

/**
 * Sem ninguém no balcão, o relógio anda em 2× sozinho (só na velocidade normal e depois do tutorial):
 * menos espera parada, e volta ao normal assim que alguém entra.
 */
export const autoFast = (save: GameSave | null, ui: Pick<UiState, 'speed' | 'paused'>): boolean =>
  !!save && save.phase === 'expediente' && ui.speed === 1 && !ui.paused && save.customers.length === 0 && save.tutorialStep >= TUTORIAL_DONE;

let toastSeq = 0;
export const MAX_TOASTS = 1;
let loadedSave: GameSave | null = null;

export const useGameStore = create<StoreState>()(
  subscribeWithSelector((set, get) => {
    /** Avisos curtos: um por vez na tela (o mais novo) e sem repetir o mesmo texto. */
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
          return advanceTutorial(3);
        case 'BREW_STARTED':
          if (e.by === 'aprendiz') return toast(`O aprendiz pôs no fogo: ${RECIPES_BY_ID[e.recipeId].name} (${e.batches} lote${e.batches > 1 ? 's' : ''}).`);
          toast(`O caldeirão começou a ferver: ${RECIPES_BY_ID[e.recipeId].name}.${(get().save?.level ?? 0) >= STIR_LEVEL ? ' Dê o toque de mestre para um lote melhor!' : ''}`);
          return advanceTutorial(4);
        case 'RAVEN_DELIVERY': {
          const units = e.items.reduce((n, i) => n + i.qty, 0);
          return toast(`O corvo trouxe ${units} ingredientes do fornecedor (−${e.cost} moedas).`);
        }
        case 'HELPER_TOGGLED':
          return toast(`${UPGRADES_BY_ID[e.upgradeId].name}: ${e.on ? 'de volta ao trabalho!' : 'descansando.'}`);
        case 'BREW_DONE':
          if (e.quality) return toast(`${e.qty}× ${RECIPES_BY_ID[e.recipeId].name} ${e.quality === 3 ? 'primorosas ✦✦' : 'finas ✦'} nas prateleiras! Vendem ${e.quality === 3 ? '50' : '20'}% mais caro.`, 'gold');
          return toast(`${e.qty}× ${RECIPES_BY_ID[e.recipeId].name} prontas nas prateleiras!`, 'ok');
        case 'STIRRED':
          return toast(e.hits >= 3 ? '🥄 Mexida perfeita! O lote sai Primoroso.' : e.hits === 2 ? '🥄 Boa mexida: o lote sai Fino.' : '🥄 A mexida saiu torta. O lote sai comum.', e.hits >= 2 ? 'gold' : undefined);
        case 'PAGE_FOUND':
          return toast(`📜 Uma página rasgada veio com ${e.source}: uma lenda perdida leva ${INGREDIENTS_BY_ID[e.ingredientId].name}. Veja em Receitas.`, 'gold');
        case 'MYSTERY_ARRIVED':
          // O cartão do cliente já mostra o viajante e a charada: um aviso no topo só repetiria.
          return;
        case 'MYSTERY_SOLVED':
          return toast(`❓ Charada resolvida! Era ${RECIPES_BY_ID[e.recipeId].name}: +${e.coins} moedas e +${e.crystals} cristais.`, 'gold');
        case 'MYSTERY_WRONG':
          return toast('❓ “Não é isso…” O viajante ficou impaciente. Tente outra.', 'warn');
        case 'SALE':
          selectNextAfter(e.customerId);
          funnel.mark('first_sale');
          return advanceTutorial(1);
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
          if (e.level >= 3) funnel.mark('level_3');
          if (e.level >= 5) funnel.mark('level_5');
          set((st) => ({ ui: { ...st.ui, modal: 'levelup', levelUp: { level: e.level, recipes: e.recipes, gift: e.gift }, paused: true } }));
          return;
        case 'ORDER_NEW': return toast('Novo pedido especial no quadro de avisos!', 'gold');
        case 'ORDER_DONE': return toast(`Pedido entregue! +${e.coins} moedas.`, 'gold');
        case 'CONTRACT_OFFERED': return toast('📜 Um contrato grande chegou ao quadro de avisos!', 'gold');
        case 'CONTRACT_ACCEPTED': return toast('Contrato aceito! Você tem 3 dias para entregar.', 'ok');
        case 'CONTRACT_PROGRESS': return toast(`${e.delivered} poções entregues para o contrato.`, 'ok');
        case 'CONTRACT_DONE': return toast(`Contrato cumprido! +${e.coins} moedas${e.seal ? ' e 1 Selo de Mestre' : ''} e um baú de ingredientes raros.`, 'gold');
        case 'CONTRACT_FAILED': return toast(`O contrato venceu. O cliente pagou ${e.coins} pelo que recebeu e a reputação caiu.`, 'warn');
        case 'ORDER_EXPIRED': return toast('Um pedido especial expirou. Sem problemas, outros virão.');
        case 'UPGRADE_BOUGHT': {
          const up = UPGRADES_BY_ID[e.upgradeId];
          return toast(up.category === 'ajudante' ? `${up.name} contratado! Já está trabalhando na loja.` : `Melhoria instalada: ${up.name}!`, 'gold');
        }
        case 'DISCOVERY':
          set((st) => ({ ui: { ...st.ui, lastHint: null } }));
          if (e.legend) return toast(`📜 LENDA DESCOBERTA! ${RECIPES_BY_ID[e.recipeId].name} saiu do caldeirão. +5 cristais, e os clientes já ouviram falar.`, 'gold');
          return toast(`Descoberta! ${RECIPES_BY_ID[e.recipeId].name} foi anotada no livro.`, 'gold');
        case 'EXPERIMENT_FAILED':
          set((st) => ({ ui: { ...st.ui, lastHint: e.hint } }));
          return;
        case 'DAY_CLOSED': {
          set((st) => ({ ui: { ...st.ui, activePanel: null, selectedCustomerId: null, paused: false } }));
          if (e.report.day === 1) funnel.mark('day1_done');
          // Se o dia acabou no meio do tutorial, ele pula direto para o passo do relatório.
          const step = get().save?.tutorialStep ?? 99;
          if (step >= 1 && step <= 5) get().dispatch({ type: 'SET_TUTORIAL', step: 6 });
          return;
        }
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
        case 'REGULAR_HEART': {
          const r = REGULARS_BY_ID[e.regularId];
          if (e.hearts === TIP_HEARTS && !e.tip) return toast(`${r.name} ganhou ${TIP_HEARTS} corações: agora deixa gorjeta!`, 'ok');
          return;
        }
        case 'REGULAR_GIFT': {
          const r = REGULARS_BY_ID[e.regularId];
          return toast(`💛 ${r.name} virou amigo da loja! "${r.thanks}" (+${giftLabel(r)})`, 'gold');
        }
        case 'ACHIEVEMENT': {
          const a = ACHIEVEMENTS.find((x) => x.id === e.id);
          // As grandes viram um momento na tela (Milestone); aqui fica só o aviso das outras.
          return a && !BIG_ACHIEVEMENT_IDS.includes(a.id) ? toast(`🏆 Conquista no álbum: ${a.name}!`, 'gold') : undefined;
        }
        case 'CAT_PETTED':
          return e.lucky ? toast('O gato ronronou. Sorte do dia: +1 reputação!', 'ok') : undefined;
        case 'SEASON_STARTED': {
          const se = SEASONS.find((x) => x.id === e.season);
          return se ? toast(`${se.icon} Chegou ${se.id === 'verao' ? 'o' : se.id === 'outono' ? 'o' : se.id === 'inverno' ? 'o' : 'a'} ${se.name.toLowerCase()}! ${se.text}`, 'gold') : undefined;
        }
        case 'RIVAL_RESULT':
          return e.win
            ? toast(`🏆 Você venceu a Madame Vesper na semana (${Math.round(e.me)} × ${Math.round(e.her)})! +${e.coins} moedas e um mimo da despensa dela.`, 'gold')
            : toast(`A Madame Vesper venceu a semana (${Math.round(e.her)} × ${Math.round(e.me)}). Revanche amanhã!`, 'warn');
        case 'EXPEDITION_SENT': {
          const x = EXPEDITIONS_BY_ID[e.dest];
          return toast(`🐦‍⬛ O corvo partiu para ${x.name}. Volta ${x.days === 1 ? 'amanhã' : `em ${x.days} dias`}.`, 'ok');
        }
        case 'EXPEDITION_BACK': {
          const x = EXPEDITIONS_BY_ID[e.dest];
          const units = e.items.reduce((n, i) => n + i.qty, 0);
          const f = e.find ? FINDS_BY_ID[e.find] : null;
          return toast(`🐦‍⬛ O corvo voltou de ${x.name} com ${units} ingredientes${f ? ` e um achado: ${f.icon} ${f.name}!` : '.'}`, 'gold');
        }
        case 'FIND': {
          const f = FINDS_BY_ID[e.id];
          return f ? toast(`${f.icon} O Visitante deixou um achado lendário: ${f.name}!`, 'gold') : undefined;
        }
        case 'GOAL_DONE': {
          const g = get().save?.goals.list.find((x) => x.id === e.goalId);
          return toast(`🎯 Meta cumprida${g ? `: ${goalText(g)}` : ''}! +${e.coins} moedas, +${e.xp} XP${e.allDone ? '. As três metas do dia estão feitas!' : ''}`, 'gold');
        }
        case 'CHEST_OPENED': {
          const units = e.items.reduce((n, i) => n + i.qty, 0);
          return toast(`🎁 Baú da semana aberto: +${e.coins} moedas e ${units} ingredientes raros!`, 'gold');
        }
        case 'DAY_STARTED':
          if (e.event === 'festa-estacao') {
            const f = SEASON_FESTS[seasonOf(e.day).id];
            toast(`🎉 ${f.name}! ${f.text}`, 'gold');
          } else if (e.event) toast(`${DAY_EVENTS[e.event].name}: ${DAY_EVENTS[e.event].text}`, 'gold');
          return advanceTutorial(6);
        case 'VIP_ARRIVED':
          return toast(`✨ ${e.name} entrou na loja!`, 'gold');
        case 'VIP_SERVED':
          return toast(e.kind === 'estreia' ? `👑 ${e.name} pagou ${e.coins} moedas, dez vezes o preço! E deixou uma carta…` : `🎉 ${e.name} pagou ${e.coins} moedas pela poção da festa!`, 'gold');
        case 'VISIT_GIFT':
          return toast(`🎁 Presente de visita nº ${e.n} aberto!`, 'gold');
        case 'CRYSTALS':
          return e.reason === 'feitos' ? undefined : toast(`🌙 +${e.n} Cristais de luar`, 'ok');
        case 'TRACK_TIER':
          return toast(`🌙 Trilha da Temporada, recompensa ${e.tier}: ${e.reward}!`, 'gold');
        case 'ITEM_GRANTED':
          return toast(`🎀 Decoração nova: ${CATALOG_BY_ID[e.itemId]?.name ?? e.itemId}! Coloque na aba Temporada.`, 'gold');
        case 'DECOR_BOUGHT':
          return toast(`${CATALOG_BY_ID[e.itemId]?.name ?? 'Decoração'} já está na loja!`, 'ok');
        case 'GIFT_SENT':
          return toast(e.first ? '💌 Presente pronto! Você ganhou o quadro “Laço da amizade”.' : '💌 Presente pronto para mandar!', 'gold');
        case 'GIFT_REDEEMED':
          return toast(`💌 Presente de ${e.from} aberto: ingredientes raros e ${e.crystals} cristais!`, 'gold');
        case 'CHALLENGE_STARTED':
          return toast(`⚔️ Desafio da semana ${e.week}: abra a loja quando quiser. Os clientes de hoje são os mesmos para todo mundo!`, 'gold');
        case 'CHALLENGE_DONE':
          return toast(`⚔️ Desafio da semana: ${e.score} pontos${e.best ? ' (seu recorde)' : ''}! Compartilhe o placar.`, 'gold');
        case 'ROYAL_INVITE':
          return toast('📯 Uma carta com o selo da Coroa chegou: o Concurso Real de Alquimia começou!', 'gold');
        case 'ROYAL_PROGRESS':
          return e.progress < e.goal ? toast(`👑 Concurso Real: ${e.progress}/${e.goal}`, 'ok') : undefined;
        case 'ROYAL_STREAK_LOST':
          return toast('👑 Um nobre foi embora: a sequência do baile recomeçou.', 'warn');
        case 'ROYAL_RETRY':
          return toast(`👑 O prazo de “${ROYAL_CHAPTERS[e.chapter].title}” venceu. A Rainha deu mais tempo, e o que você entregou continua valendo.`, 'warn');
        case 'VILLAGE_STAGE': {
          const p = VILLAGE_BY_ID[e.projectId];
          return toast(e.stage >= 3 ? `${p.icon} ${p.name} inaugurada! ${p.bonusText}` : `${p.icon} ${p.name}: ${STAGE_NAMES[e.stage - 1].toLowerCase()} pronta.`, 'gold');
        }
        case 'RECORD':
          return e.kind === 'bestSale' ? toast(`🏅 Recorde pessoal: venda de ${e.value} moedas!`, 'gold') : undefined;
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
        case 'SHOW_WELCOME':
          // Durante o tutorial o bem-vindo não aparece (e não fica guardado para depois).
          if ((get().save?.tutorialStep ?? TUTORIAL_DONE) < TUTORIAL_DONE) return ui;
          return { ...ui, welcome: true, paused: get().save?.phase === 'expediente' ? true : ui.paused };
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
        funnel.mark('new_game');
        funnel.session();
        set({ status: 'playing', save: createNewGame(), ui: initialUi, hasStoredSave: true });
      },

      continueGame() {
        if (!loadedSave) return get().newGame();
        // No meio do expediente, o jogo volta pausado até o jogador fechar o "bem-vindo de volta".
        set({ status: 'playing', save: loadedSave, ui: { ...initialUi, welcome: loadedSave.tutorialStep >= TUTORIAL_DONE, paused: loadedSave.phase === 'expediente' && loadedSave.tutorialStep >= TUTORIAL_DONE } });
        funnel.session();
        // Livro do caixa (o que a loja fez enquanto você esteve fora), presente de visita e temporada.
        get().dispatch({ type: 'SESSION_START' });
      },

      backToMenu() {
        flushSave();
        loadedSave = get().save;
        set({ status: 'menu', ui: initialUi });
      },

      exportableSave() {
        return get().save ?? loadedSave;
      },

      async importSave(save) {
        await saveRepository.save(save);
        loadedSave = save;
        set({ hasStoredSave: true, storageError: null });
        get().continueGame();
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
            if (get().ui.activePanel === 'ingredients') advanceTutorial(2);
          }
          return;
        }
        const save = get().save;
        if (!save) return;
        const { save: next, events } = applyCommand(save, cmd);
        if (next !== save) set({ save: next });
        if (cmd.type === 'OPEN_SHOP' && next.phase === 'expediente' && save.phase !== 'expediente') advanceTutorial(0);
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
