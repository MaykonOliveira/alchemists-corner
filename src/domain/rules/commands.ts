import type { GameSave } from '../models/types';
import { CLOSE_MIN, OPEN_MIN } from './time';

/**
 * Comandos tipados que alteram o estado canônico da partida.
 * React e Phaser enviam estes comandos; nenhum dos dois altera o save diretamente.
 */
export type DomainCommand =
  | { type: 'OPEN_SHOP' }
  | { type: 'TICK'; minutes: number }
  | { type: 'CLOSE_SHOP' }
  | { type: 'START_NEXT_DAY' }
  | { type: 'SET_REDUCE_MOTION'; value: boolean };

/** Função pura: devolve um novo save (ou o mesmo objeto, se nada mudou). */
export function applyCommand(save: GameSave, cmd: DomainCommand, now: number = Date.now()): GameSave {
  const next = reduce(save, cmd);
  return next === save ? save : { ...next, updatedAt: now };
}

function reduce(save: GameSave, cmd: DomainCommand): GameSave {
  switch (cmd.type) {
    case 'OPEN_SHOP':
      if (save.phase !== 'preparacao') return save;
      return { ...save, phase: 'expediente' };

    case 'TICK': {
      if (save.phase !== 'expediente' || cmd.minutes <= 0) return save;
      const clockMin = Math.min(CLOSE_MIN, save.clockMin + cmd.minutes);
      return { ...save, clockMin, phase: clockMin >= CLOSE_MIN ? 'fechamento' : save.phase };
    }

    case 'CLOSE_SHOP':
      if (save.phase !== 'expediente') return save;
      return { ...save, phase: 'fechamento' };

    case 'START_NEXT_DAY':
      if (save.phase !== 'fechamento') return save;
      return { ...save, day: save.day + 1, phase: 'preparacao', clockMin: OPEN_MIN };

    case 'SET_REDUCE_MOTION':
      if (save.settings.reduceMotion === cmd.value) return save;
      return { ...save, settings: { ...save.settings, reduceMotion: cmd.value } };
  }
}
