// Ícones em pixel art no lugar dos emojis do sistema (pacote V2 da revisão visual).
// Os dados do jogo continuam guardando o emoji (ex.: icon: '🧪'); a tela troca pelo desenho.
import type { ReactNode } from 'react';
import { SpriteIcon } from './SpriteIcon';

/** Emoji (sem o seletor de variação U+FE0F) → nome do ícone em src/assets/sprites/icons.png. */
export const EMOJI_ICON: Record<string, string> = {
  '🏠': 'ui-home', '⚗': 'ui-cauldron', '🫕': 'ui-cauldron', '🛎': 'ui-bell', '🔔': 'ui-bell',
  '🎯': 'ui-target', '🗺': 'ui-map', '🌿': 'ui-leaf', '🔥': 'ui-fire', '📖': 'ui-book',
  '📚': 'ui-books', '🎓': 'ui-books', '🧪': 'ui-flask', '📜': 'ui-scroll', '📌': 'ui-scroll',
  '🔨': 'ui-hammer', '⛏': 'ui-hammer', '🏗': 'ui-castle', '✨': 'ui-sparkle', '📊': 'ui-chart',
  '📈': 'ui-chart', '👑': 'ui-crown', '🏘': 'ui-houses', '🏪': 'ui-houses', '🏰': 'ui-castle',
  '🏛': 'ui-castle', '🌙': 'ui-moon', '🌘': 'ui-moon', '🌑': 'ui-moon', '🌕': 'ui-moon',
  '🏆': 'trophy-2', '🏅': 'ui-medal', '🎁': 'ui-gift', '🎀': 'ui-ribbon', '🎉': 'ui-party',
  '💃': 'ui-party', '⚔': 'ui-swords', '🐦': 'helper-corvo-entregador', '🐦‍⬛': 'helper-corvo-entregador',
  '🐈': 'ui-cat', '🌸': 'ui-flower', '💌': 'ui-letter', '✉': 'ui-letter', '📭': 'ui-letter',
  '🥄': 'ui-spoon', '📸': 'ui-camera', '💛': 'ui-heart', '💞': 'ui-heart', '🤝': 'ui-heart',
  '⏳': 'ui-hourglass', '🕰': 'ui-hourglass', '📯': 'ui-horn', '📣': 'ui-horn', '🗣': 'ui-horn',
  '🪙': 'ui-coin', '💰': 'ui-coin', '🏷': 'ui-coin', '❓': 'ui-question', '❔': 'ui-question',
  '🔒': 'ui-lock', '🧥': 'ui-cloak', '🎩': 'ui-hat', '🧙': 'ui-hat', '🧺': 'ui-basket',
  '🎒': 'ui-basket', '🗄': 'ui-basket', '🛒': 'ui-basket', '📦': 'ui-basket',
  '🙂': 'ui-face-happy', '😊': 'ui-face-happy', '😐': 'ui-face-meh', '😠': 'ui-face-angry',
  '🤒': 'ui-face-sick', '🔊': 'ui-speaker', '🔈': 'ui-speaker', '🎵': 'ui-note', '🌧': 'ui-drop',
  '⛲': 'ui-drop', '🌊': 'ui-drop', '💎': 'ui-gem', '🕳': 'ui-gem', '⭐': 'ui-star', '🌟': 'ui-star',
  '🌠': 'ui-star', '🏮': 'ui-lantern', '🕯': 'ui-lantern', '🚪': 'ui-door', '🔮': 'ui-orb',
  '🔭': 'ui-orb', '☀': 'ui-sun', '⛱': 'ui-sun', '❄': 'ui-snow', '🍂': 'ui-autumn', '🌰': 'ui-autumn',
  '🌲': 'ui-tree', '🏔': 'ui-mountain', '🥚': 'ui-egg', '🪺': 'ui-egg', '🗝': 'ui-key',
  '🪶': 'ingredient-pluma-grifo', '🌉': 'ui-bridge', '✋': 'ui-hand', '👆': 'ui-hand', '✅': 'ui-check',
  '🟦': 'ui-frame', '🖼': 'ui-frame', '⚙': 'ui-gear', '⏩': 'ui-fast',
};

/** Um emoji isolado, com seletor de variação e sequências com ZWJ (ex.: 🐦‍⬛). */
export const EMOJI_RE = /\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*/gu;

const clean = (e: string) => e.replace(/️/g, '');

/** Nome do ícone para um emoji, ou undefined se ele não tem desenho (fica como texto). */
export const iconFor = (e: string): string | undefined => EMOJI_ICON[clean(e)];

interface Props {
  /** O emoji que o dado guarda (ex.: '🧪'). */
  e: string;
  size?: number;
  title?: string;
}

/** Desenho em pixel para um emoji. Sem desenho, mostra o próprio caractere. */
export function Icon({ e, size = 16, title }: Props) {
  const name = iconFor(e);
  if (!name) return <>{e}</>;
  return <SpriteIcon name={name} size={size} title={title} />;
}

/** Troca os emojis de um texto (avisos, frases montadas nas regras) pelos desenhos. */
export function withIcons(text: string, size = 16): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(EMOJI_RE)) {
    if (!iconFor(m[0])) continue;
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push(<Icon key={m.index} e={m[0]} size={size} />);
    last = m.index! + m[0].length;
  }
  if (last === 0) return text;
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Texto (ou emoji) que pode vir dos dados: troca os emojis pelos desenhos. */
export const Txt = ({ children, size }: { children: string; size?: number }) => <>{withIcons(children, size)}</>;
