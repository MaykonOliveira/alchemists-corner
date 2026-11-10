import shopAtlas from '../../assets/sprites/shop.json';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { freeCauldron, hasSecondCauldron, repeatBatches } from '../../domain/rules/alchemy';
import { HOTSPOTS } from '../../game/phaser/interaction/hotspots';
import { useGameStore } from '../../store/gameStore';
import { Icon } from '../../ui/Icon';

import { tr } from '../../i18n';
const frames = (shopAtlas as { frames: Record<string, { frame: { w: number; h: number } }> }).frames;
const SPOT = HOTSPOTS.find((h) => h.id === 'cauldron')!;
const W = frames[SPOT.texture]?.frame.w ?? 32;

/** Do passo "Hora de ferver" em diante, o caldeirão parado chama atenção na própria cena. */
const SHOW_FROM_STEP = 5;

/**
 * Marca pequena sobre o caldeirão quando ele está parado: um toque repete o último preparo
 * (ou abre o caldeirão, se não der para repetir). A cena é a dona dessa notícia, então a marca
 * é só um ícone: o texto fica no título e no leitor de tela, sem cobrir o resto da loja.
 */
export function CauldronAlert() {
  const save = useGameStore((s) => s.save);
  const zoom = useGameStore((s) => s.ui.zoom);
  const modal = useGameStore((s) => s.ui.modal);
  const dispatch = useGameStore((s) => s.dispatch);
  if (!save || modal || !freeCauldron(save) || save.phase === 'fechamento' || save.tutorialStep < SHOW_FROM_STEP) return null;
  if (save.knownRecipes.length === 0) return null;
  const n = repeatBatches(save);
  const last = save.lastBrew ? RECIPES_BY_ID[save.lastBrew.recipeId] : null;
  const two = hasSecondCauldron(save);
  const idle = two ? (!save.brew && !save.brew2 ? tr('Os 2 caldeirões estão parados') : tr('Um caldeirão está parado')) : tr('Caldeirão parado');
  const label = n > 0 && last ? tr('{0}. Toque para repetir {1} ×{2}.', idle, last.shortName, n) : tr('{0}. Toque para escolher uma receita.', idle);
  return (
    <button
      className={`cauldron-alert ${n > 0 ? 'can-repeat' : ''}`}
      style={{ left: (SPOT.x + W / 2) * zoom, top: SPOT.y * zoom }}
      onClick={() => (n > 0 ? dispatch({ type: 'REPEAT_BREW' }) : dispatch({ type: 'OPEN_PANEL', panel: 'production' }))}
      title={label}
      aria-label={label}
    >
      <Icon e="🔥" />
      <span className="ca-mark" aria-hidden>{n > 0 ? '↻' : '!'}</span>
    </button>
  );
}
