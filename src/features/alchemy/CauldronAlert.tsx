import shopAtlas from '../../assets/sprites/shop.json';
import { RECIPES_BY_ID } from '../../domain/data/recipes';
import { repeatBatches } from '../../domain/rules/alchemy';
import { HOTSPOTS } from '../../game/phaser/interaction/hotspots';
import { useGameStore } from '../../store/gameStore';

const frames = (shopAtlas as { frames: Record<string, { frame: { w: number; h: number } }> }).frames;
const SPOT = HOTSPOTS.find((h) => h.id === 'cauldron')!;
const W = frames[SPOT.texture]?.frame.w ?? 32;

/** Do passo "Hora de ferver" em diante, o caldeirão parado chama atenção na própria cena. */
const SHOW_FROM_STEP = 5;

/**
 * Balão sobre o caldeirão quando ele está parado: um toque repete o último preparo
 * (ou abre o caldeirão, se não der para repetir). Assim ninguém perde a tarde com ele frio.
 */
export function CauldronAlert() {
  const save = useGameStore((s) => s.save);
  const zoom = useGameStore((s) => s.ui.zoom);
  const modal = useGameStore((s) => s.ui.modal);
  const dispatch = useGameStore((s) => s.dispatch);
  if (!save || modal || save.brew || save.phase === 'fechamento' || save.tutorialStep < SHOW_FROM_STEP) return null;
  if (save.knownRecipes.length === 0) return null;
  const n = repeatBatches(save);
  const last = save.lastBrew ? RECIPES_BY_ID[save.lastBrew.recipeId] : null;
  const label = n > 0 && last ? `Repetir ${last.shortName} ×${n}` : 'Caldeirão parado';
  return (
    <button
      className={`cauldron-alert ${n > 0 ? 'can-repeat' : ''}`}
      style={{ left: (SPOT.x + W / 2) * zoom, top: SPOT.y * zoom }}
      onClick={() => (n > 0 ? dispatch({ type: 'REPEAT_BREW' }) : dispatch({ type: 'OPEN_PANEL', panel: 'production' }))}
      title={n > 0 ? 'O caldeirão está parado. Toque para preparar de novo.' : 'O caldeirão está parado. Toque para escolher uma receita.'}
    >
      <span aria-hidden>🔥</span> {label}
    </button>
  );
}
