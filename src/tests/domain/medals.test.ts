import { describe, expect, it } from 'vitest';
import type { DayReport } from '../../domain/models/types';
import { dayMedal, medalTarget } from '../../domain/rules/medals';

const rep = (day: number, profit: number): DayReport => ({
  day, profit, revenue: Math.max(0, profit), ingredientCost: 0, orderRewards: 0, maintenance: 0, salesByRecipe: {},
  customersServed: 0, customersLost: 0, reputationDelta: 0, xpGained: 0, levelUps: 0,
});

describe('medalha do fechamento', () => {
  it('dia com prejuízo não ganha medalha', () => {
    expect(dayMedal([rep(1, 50), rep(2, -10)])).toEqual({ medal: null, record: false });
  });
  it('primeiro dia com lucro ganha ouro, mas não conta como recorde', () => {
    expect(dayMedal([rep(1, 30)])).toEqual({ medal: 'ouro', record: false });
  });
  it('bem acima da média é ouro e bate o recorde', () => {
    expect(dayMedal([rep(1, 100), rep(2, 100), rep(3, 200)])).toEqual({ medal: 'ouro', record: true });
  });
  it('na média é prata; abaixo da média é bronze', () => {
    expect(dayMedal([rep(1, 100), rep(2, 100), rep(3, 105)]).medal).toBe('prata');
    expect(dayMedal([rep(1, 100), rep(2, 100), rep(3, 40)]).medal).toBe('bronze');
  });
});

describe('medalha pela meta do nível', () => {
  const lv = (profit: number, level: number): DayReport => ({ ...rep(5, profit), level, customersServed: 10 });
  it('a meta é fixa por nível: um dia ruim depois de outro ruim não vira prata', () => {
    expect(dayMedal([lv(30, 3), lv(30, 3)]).medal).toBe('bronze');
    expect(dayMedal([lv(medalTarget(3), 3)]).medal).toBe('ouro');
    expect(dayMedal([lv(Math.ceil(medalTarget(3) * 0.6), 3)]).medal).toBe('prata');
  });
});
