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

export function useStageCards() {
  const tutorial = useGameStore(tutorialActive);
  const welcome = useGameStore((st) => st.ui.welcome) && !tutorial;
  const customer = useGameStore(customerCardVisible) && !welcome;
  // A dica é a última da fila: só no Início (sem painel aberto) e nunca com um capítulo do Concurso esperando.
  const calm = useGameStore((st) => st.ui.activePanel === null && !(st.save?.royal && st.save.royal.seen < st.save.royal.chapter));
  return {
    customer,
    tutorial,
    /** O bem-vindo pausa o relógio, então vem antes de tudo (e nunca durante o tutorial). */
    welcome,
    /** A dica só aparece quando nada mais está na tela. */
    tip: !tutorial && !customer && !welcome && calm,
  };
}
