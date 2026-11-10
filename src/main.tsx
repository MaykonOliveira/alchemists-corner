import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import './app/styles.css';
import { App } from './app/App';
import { initAudio } from './audio/sound';
import { registerServiceWorker } from './app/pwa';
import { initReminders } from './app/reminders';
import { GAME_NAME, LANG } from './i18n';

document.documentElement.lang = LANG === 'en' ? 'en' : 'pt-BR';
document.title = GAME_NAME;
initAudio();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Acesso ao store pelo console durante o desenvolvimento (útil para testes e depuração).
initReminders();

if (import.meta.env.DEV) {
  void import('./store/gameStore').then(({ useGameStore }) => {
    (window as unknown as { __store: typeof useGameStore }).__store = useGameStore;
  });
}
