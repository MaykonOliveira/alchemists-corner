import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { Customer, GameSave } from '../../domain/models/types';
import { bestOffer } from '../../domain/rules/customers';
import { createNewGame } from '../../domain/rules/initialState';
import { MAX_TOASTS, useGameStore } from '../../store/gameStore';

const customer = (wantedRecipeId: string, extra: Partial<Customer> = {}): Customer => ({
  id: 'c1', archetype: 'morador', wantedRecipeId, budgetFactor: 1, patienceMs: 30000, waitedMs: 0, offer: null, remark: null, ...extra,
});

const withPotions = (s: GameSave, list: [string, number][]) => ({
  ...s,
  potions: list.map(([recipeId, quantity]) => ({ recipeId, quantity, quality: 1, forSale: true })),
});

describe('atendimento rápido: melhor poção para oferecer', () => {
  it('oferece a poção pedida quando ela está à venda', () => {
    const s = withPotions(createNewGame(), [['tonico-energia', 2], ['cura-simples', 3]]);
    expect(bestOffer(s, customer('cura-simples'))).toBe('cura-simples');
  });

  it('sem nada parecido, não oferece nada', () => {
    const s = withPotions(createNewGame(), [['tonico-energia', 2]]);
    expect(bestOffer(s, customer('cura-simples'))).toBeNull();
  });

  it('ignora poções tiradas da venda', () => {
    const base = createNewGame();
    const s = { ...base, potions: [{ recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: false }] };
    expect(bestOffer(s, customer('cura-simples'))).toBeNull();
  });
});

describe('avisos e seleção de clientes', () => {
  it('mostra no máximo 2 avisos e não repete o mesmo texto', () => {
    useGameStore.getState().newGame();
    const { dispatch } = useGameStore.getState();
    // Cada tentativa de abrir a loja já aberta gera um ERROR → aviso.
    dispatch({ type: 'OPEN_SHOP' });
    for (let i = 0; i < 4; i++) dispatch({ type: 'OPEN_SHOP' });
    dispatch({ type: 'START_BREW', recipeId: 'inexistente', batches: 1 });
    const toasts = useGameStore.getState().ui.toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts.length).toBeLessThanOrEqual(MAX_TOASTS);
    expect(new Set(toasts.map((t) => t.text)).size).toBe(toasts.length);
  });

  it('selecionar um cliente não abre mais o painel do balcão', () => {
    useGameStore.getState().newGame();
    useGameStore.getState().dispatch({ type: 'SELECT_CUSTOMER', id: 'x' });
    expect(useGameStore.getState().ui.activePanel).toBeNull();
    expect(useGameStore.getState().ui.selectedCustomerId).toBe('x');
  });

  it('alterna a velocidade entre 1× e 2×', () => {
    useGameStore.getState().newGame();
    useGameStore.getState().dispatch({ type: 'TOGGLE_SPEED' });
    expect(useGameStore.getState().ui.speed).toBe(2);
    useGameStore.getState().dispatch({ type: 'TOGGLE_SPEED' });
    expect(useGameStore.getState().ui.speed).toBe(1);
  });
});
