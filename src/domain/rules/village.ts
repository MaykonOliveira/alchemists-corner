// Reconstruir a vila (pacote W).
import { RECIPES_BY_ID } from '../data/recipes';
import { VILLAGE, VILLAGE_BY_ID, VILLAGE_LEVEL } from '../data/village';
import type { GameSave } from '../models/types';
import { fail, type Draft } from './context';
import { potionStock, takePotions } from './economy';
import { gainReputation, gainXp } from './progression';

import { villageStage } from './villageBonus';
export { villageBonus, villageDone, villageStage } from './villageBonus';

/** Progresso da vila inteira (0..1). */
export const villageProgress = (s: GameSave) => VILLAGE.reduce((n, p) => n + villageStage(s, p.id), 0) / (VILLAGE.length * 3);


/** O que falta para a próxima etapa (null = pode construir). */
export function villageBlocker(s: GameSave, id: string): string | null {
  const p = VILLAGE_BY_ID[id];
  if (!p) return 'Obra desconhecida.';
  if (s.level < VILLAGE_LEVEL) return `A prefeitura aceita ajuda a partir do nível ${VILLAGE_LEVEL}.`;
  const stage = villageStage(s, id);
  if (stage >= 3) return 'Obra já inaugurada.';
  const cost = p.stages[stage];
  if (s.coins < cost) return `Faltam ${cost - s.coins} moedas.`;
  const need = p.needs[stage];
  if (potionStock(s, need.recipeId) < need.qty) {
    return `A encomenda pede ${need.qty}× ${RECIPES_BY_ID[need.recipeId].name} (você tem ${potionStock(s, need.recipeId)}).`;
  }
  return null;
}

export function buildVillage(d: Draft, id: string): boolean {
  const s = d.s;
  const blocker = villageBlocker(s, id);
  if (blocker) return fail(d, blocker);
  const p = VILLAGE_BY_ID[id];
  const stage = villageStage(s, id);
  s.coins -= p.stages[stage];
  takePotions(s, p.needs[stage].recipeId, p.needs[stage].qty);
  s.village = { ...s.village, [id]: stage + 1 };
  gainXp(d, 150 + 100 * stage);
  if (stage === 2) gainReputation(d, 10);
  d.events.push({ type: 'VILLAGE_STAGE', projectId: id, stage: stage + 1 });
  return true;
}
