import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../domain/rules/initialState';
import { migrateSave } from '../../persistence/migrations';
import { saveRepository } from '../../persistence/saveRepository';

describe('migrateSave', () => {
  it('rejeita dados que não são um save', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave('oi')).toBeNull();
    expect(migrateSave({ day: 3 })).toBeNull();
    expect(migrateSave({ saveVersion: 99 })).toBeNull();
    expect(migrateSave({ saveVersion: 0 })).toBeNull();
  });

  it('preenche campos ausentes com valores padrão', () => {
    const s = migrateSave({ saveVersion: 1, day: 4, coins: 55 })!;
    expect(s.day).toBe(4);
    expect(s.coins).toBe(55);
    expect(s.settings.reduceMotion).toBe(false);
    expect(s.ingredients['folha-lunar']).toBeGreaterThanOrEqual(0);
  });

  it('corrige valores inválidos', () => {
    const s = migrateSave({ saveVersion: 1, coins: -10, phase: 'xyz', day: 'dois' })!;
    expect(s.coins).toBe(0);
    expect(s.phase).toBe('preparacao');
    expect(s.day).toBe(1);
  });
});

describe('saveRepository (IndexedDB)', () => {
  it('grava e lê a partida', async () => {
    const save = { ...createNewGame(1), day: 7, coins: 321 };
    await saveRepository.save(save);
    const loaded = await saveRepository.load();
    expect(loaded).toMatchObject({ day: 7, coins: 321 });
    await saveRepository.clear();
    expect(await saveRepository.load()).toBeNull();
  });
});
