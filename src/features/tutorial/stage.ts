import { TUTORIAL_DONE, useGameStore, type StoreState as GameState } from '../../store/gameStore';

/**
 * Um cartão por vez sobre a loja. Ordem de prioridade:
 * "bem-vindo de volta" (o relógio fica pausado nele) > cliente no balcão > tutorial > dica.
 * Os cartões de baixo esperam o de cima sumir, em vez de se empilhar sobre a cena.
 */
export const customerCardVisible = (st: GameState): boolean => {
  const s = st.save;
  if (!s || s.phase !== 'expediente' || st.ui.activePanel === 'counter' || st.ui.modal) return false;
  return s.customers.some((c) => c.id === st.ui.selectedCustomerId);
};

export const tutorialActive = (st: GameState): boolean =>
  !!st.save && st.save.storySeen !== false && st.save.tutorialStep < TUTORIAL_DONE;

export interface StageCards { customer: boolean; tutorial: boolean; welcome: boolean; tip: boolean }

/** Quem pode aparecer agora (função pura, para o teste conferir que nunca há dois ao mesmo tempo além do tutorial). */
export function stageCards(st: GameState): StageCards {
  const tutorial = tutorialActive(st);
  const welcome = st.ui.welcome && !tutorial;
  const customer = customerCardVisible(st) && !welcome;
  // A dica é a última da fila: só no Início (sem painel aberto) e nunca com um capítulo do Concurso esperando.
  const royal = st.save?.royal;
  const calm = st.ui.activePanel === null && !(royal && royal.seen < royal.chapter);
  return { customer, tutorial, welcome, tip: !tutorial && !customer && !welcome && calm };
}

export function useStageCards(): StageCards {
  const key = useGameStore((st) => { const c = stageCards(st); return `${+c.customer}${+c.tutorial}${+c.welcome}${+c.tip}`; });
  return { customer: key[0] === '1', tutorial: key[1] === '1', welcome: key[2] === '1', tip: key[3] === '1' };
}
