import { useEffect, useState } from 'react';

/**
 * Service worker e instalação como app.
 * Só registra no build de produção e fora de iframes (a prévia do Claude roda num iframe isolado,
 * onde o service worker não é permitido nem útil).
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  try {
    if (window.self !== window.top) return;
  } catch {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker não registrado', err));
  });
}

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

/** Devolve a função que abre o pedido de instalação, ou null quando o navegador não oferece. */
export function useInstallPrompt(): (() => void) | null {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  if (!deferred) return null;
  return () => {
    const ev = deferred;
    deferred = null;
    void ev?.prompt();
    listeners.forEach((l) => l());
  };
}
