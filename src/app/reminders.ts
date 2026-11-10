// Lembretes opcionais (pacote J). Desligados por padrão; o jogador liga em Configurações.
// Funcionam com o app instalado (ou a aba aberta em segundo plano): quando o jogo sai da tela,
// agendamos UM aviso para o que vai acontecer primeiro (caldeirão pronto). No máximo 1 aviso por dia.
import { useGameStore } from '../store/gameStore';
import { RECIPES_BY_ID } from '../domain/data/recipes';
import { AWAY_MIN_MS } from '../domain/rules/retention';

import { tr } from '../i18n';
const KEY = 'ac-reminder-day';
let timer: ReturnType<typeof setTimeout> | null = null;

export const remindersSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function askReminderPermission(): Promise<boolean> {
  if (!remindersSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

function today() {
  return new Date().toDateString();
}

async function notify(title: string, body: string) {
  try {
    if (localStorage.getItem(KEY) === today()) return;
    localStorage.setItem(KEY, today());
  } catch { /* sem armazenamento: avisa mesmo assim */ }
  const reg = await navigator.serviceWorker?.getRegistration?.().catch(() => undefined);
  if (reg) reg.showNotification(title, { body, icon: './icon-192.png', tag: 'alchemists-corner' });
  else new Notification(title, { body, icon: './icon-192.png' });
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = null;
  const { save } = useGameStore.getState();
  if (!save?.settings.reminders || !remindersSupported() || Notification.permission !== 'granted') return;
  const brews = [save.brew, save.brew2].filter(Boolean) as NonNullable<typeof save.brew>[];
  if (!brews.length) return;
  const next = brews.sort((a, b) => (a.totalMs - a.elapsedMs) - (b.totalMs - b.elapsedMs))[0];
  const ms = Math.max(5_000, next.totalMs - next.elapsedMs);
  timer = setTimeout(() => notify(tr('{0}: o caldeirão terminou!', save.shopName), tr('{0} pronta nas prateleiras.', RECIPES_BY_ID[next.recipeId].name)), ms);
}

/** Liga os lembretes ao ciclo de vida da página. */
export function initReminders() {
  if (typeof document === 'undefined') return;
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      schedule();
      return;
    }
    if (timer) { clearTimeout(timer); timer = null; }
    // Voltou depois de um bom tempo com o jogo aberto em segundo plano: mostra o livro do caixa.
    const st = useGameStore.getState();
    if (st.status === 'playing' && hiddenAt && Date.now() - hiddenAt >= AWAY_MIN_MS) {
      st.dispatch({ type: 'SESSION_START' });
      st.dispatch({ type: 'SHOW_WELCOME' });
    }
    hiddenAt = 0;
  });
}
