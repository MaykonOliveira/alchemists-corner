// Bônus das obras da vila (pacote W). Módulo sem dependências de regras, para economia,
// clientes e progressão poderem importar sem ciclo.
import { VILLAGE, type VillageBonus } from '../data/village';
import type { GameSave } from '../models/types';

export const villageStage = (s: GameSave, id: string) => s.village?.[id] ?? 0;
export const villageDone = (s: GameSave, id: string) => villageStage(s, id) >= 3;

/** Bônus das obras já inauguradas (0 se nenhuma). */
export function villageBonus(s: GameSave, bonus: VillageBonus): number {
  return VILLAGE.filter((p) => p.bonus === bonus && villageDone(s, p.id)).reduce((n, p) => n + p.value, 0);
}
