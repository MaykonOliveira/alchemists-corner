import { SAVE_VERSION, type GameSave } from '../models/types';
import { OPEN_MIN } from './time';

/** Estado de uma partida nova: a loja herdada do antigo proprietário. */
export function createNewGame(now: number = Date.now()): GameSave {
  return {
    saveVersion: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    day: 1,
    phase: 'preparacao',
    clockMin: OPEN_MIN,
    coins: 120,
    reputation: 10,
    level: 1,
    xp: 0,
    ingredients: {
      'folha-lunar': 6,
      'hortela-brava': 4,
      'cristal-ambar': 2,
      'po-de-pedra': 5,
      'orvalho-feerico': 1,
      'essencia-azul': 0,
      'escama-salamandra': 0,
      'cogumelo-lanterna': 0,
    },
    potions: [
      { recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: true },
      { recipeId: 'tonico-energia', quantity: 2, quality: 1, forSale: true },
    ],
    knownRecipes: ['cura-simples', 'tonico-energia', 'elixir-concentracao'],
    upgrades: [],
    reports: [],
    settings: { volume: 0.7, muted: false, reduceMotion: false },
  };
}
