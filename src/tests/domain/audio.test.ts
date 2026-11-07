import { describe, expect, it } from 'vitest';
import { ambienceFor, degreeFreq, moodFor, NIGHT_MIN, THEMES, vibrationFor } from '../../audio/mood';
import type { GameSave } from '../../domain/models/types';
import { createNewGame } from '../../domain/rules/initialState';
import { migrateSave } from '../../persistence/migrations';

const at = (over: Partial<GameSave>): GameSave => ({ ...createNewGame(0), ...over });

describe('trilha sonora', () => {
  it('cada estação tem o próprio tema, mais calmo na preparação', () => {
    expect(moodFor(at({ day: 2, phase: 'expediente' }))).toEqual({ theme: 'primavera', calm: false });
    expect(moodFor(at({ day: 9, phase: 'expediente' })).theme).toBe('verao');
    expect(moodFor(at({ day: 16, phase: 'expediente' })).theme).toBe('outono');
    expect(moodFor(at({ day: 23, phase: 'preparacao' }))).toEqual({ theme: 'inverno', calm: true });
  });

  it('noite, festival e eventos raros trocam a música', () => {
    expect(moodFor(at({ phase: 'expediente', clockMin: NIGHT_MIN + 5 })).theme).toBe('noite');
    expect(moodFor(at({ phase: 'fechamento' })).theme).toBe('noite');
    expect(moodFor(at({ phase: 'expediente', event: 'festival' })).theme).toBe('festival');
    expect(moodFor(at({ phase: 'expediente', event: 'eclipse' })).theme).toBe('misterio');
  });

  it('as notas saem da escala do tema e descem oitavas', () => {
    const t = THEMES.primavera;
    expect(degreeFreq(t, 0)).toBeCloseTo(t.root);
    expect(degreeFreq(t, 7)).toBeCloseTo(t.root * 2);
    expect(degreeFreq(t, 0, -1)).toBeCloseTo(t.root / 2);
    expect(degreeFreq(t, -7)).toBeCloseTo(t.root / 2);
  });
});

describe('ambiente', () => {
  it('chuva, vento, burburinho e passarinhos dependem do dia', () => {
    expect(ambienceFor(at({ day: 2, event: 'chuva' })).has('chuva')).toBe(true);
    expect(ambienceFor(at({ day: 2, event: 'chuva' })).has('passaros')).toBe(false);
    expect(ambienceFor(at({ day: 2 })).has('passaros')).toBe(true);
    expect(ambienceFor(at({ day: 23 })).has('vento')).toBe(true);
    expect(ambienceFor(at({ day: 4, phase: 'expediente', event: 'feira' })).has('multidao')).toBe(true);
    expect(ambienceFor(at({ day: 4, phase: 'preparacao', event: 'feira' })).has('multidao')).toBe(false);
  });

  it('o caldeirão borbulha quando há preparo', () => {
    const brew = { recipeId: 'cura-simples', batches: 1, elapsedMs: 0, totalMs: 1000 };
    expect(ambienceFor(at({ brew })).has('caldeirao')).toBe(true);
    expect(ambienceFor(at({ brew: null, brew2: null })).has('caldeirao')).toBe(false);
  });
});

describe('vibração e mixer', () => {
  it('vibra nas vendas, níveis e conquistas, e não em qualquer evento', () => {
    expect(vibrationFor({ type: 'SALE', customerId: 'c', recipeId: 'x', price: 10, substitute: false })).toBe(12);
    expect(vibrationFor({ type: 'LEVEL_UP', level: 2, recipes: [] })).toBeTruthy();
    expect(vibrationFor({ type: 'PURCHASE', ingredientId: 'x', qty: 1, cost: 1 })).toBeNull();
  });

  it('saves antigos ganham o mixer com valores padrão e limites de 0 a 1', () => {
    const old = { ...createNewGame(0), settings: { volume: 0.5, muted: false, music: true, reduceMotion: false, musicVolume: 3 } };
    const s = migrateSave(old)!;
    expect(s.settings.musicVolume).toBe(1);
    expect(s.settings.sfxVolume).toBe(0.8);
    expect(s.settings.ambienceVolume).toBe(0.5);
    expect(s.settings.vibration).toBe(true);
  });
});
