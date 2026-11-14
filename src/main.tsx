import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-700.css';
import './app/styles.css';
import './app/skin-vector.css';
import { App } from './app/App';
import { initAudio } from './audio/sound';
import { registerServiceWorker } from './app/pwa';
import { initReminders } from './app/reminders';
import { GAME_NAME, LANG } from './i18n';
import { SKIN } from './app/skin';

document.documentElement.lang = LANG === 'en' ? 'en' : 'pt-BR';
document.title = GAME_NAME;
// Visual em teste (Opções → Visual): a folha skin-vector.css só vale quando data-skin="vector".
document.documentElement.dataset.skin = SKIN;
// Os números que sobem na cena usam a letra redonda: pede a fonte já, antes de a cena precisar dela.
if (SKIN === 'vector') void document.fonts?.load('700 16px "Baloo 2"');
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
