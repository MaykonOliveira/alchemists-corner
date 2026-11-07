import { RECIPES } from '../data/recipes';
import { SAVE_VERSION, type GameSave } from '../models/types';
import { freshStats } from './day';
import { supplierStock } from './economy';
import { OPEN_MIN } from './time';

/** Estado de uma partida nova: a loja herdada do antigo proprietário. */
export function createNewGame(now: number = Date.now()): GameSave {
  const s: GameSave = {
    saveVersion: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    day: 1,
    phase: 'preparacao',
    clockMin: OPEN_MIN,
    coins: 100,
    reputation: 5,
    level: 1,
    xp: 0,
    ingredients: {
      'folha-lunar': 4,
      'hortela-brava': 2,
      'cristal-ambar': 1,
      'po-de-pedra': 4,
      'orvalho-feerico': 1,
      'essencia-azul': 0,
      'escama-salamandra': 0,
      'cogumelo-lanterna': 0,
      'raiz-mandragora': 0,
      'cristal-geada': 0,
      'pluma-grifo': 0,
      'areia-estelar': 0,
      'pena-fenix': 0,
      'petala-aurora': 0,
      'fruta-sol': 0,
      'folha-rubra': 0,
      'flor-neve': 0,
    },
    potions: [
      { recipeId: 'cura-simples', quantity: 3, quality: 1, forSale: true },
      { recipeId: 'tonico-energia', quantity: 2, quality: 1, forSale: true },
    ],
    prices: Object.fromEntries(RECIPES.map((r) => [r.id, r.basePrice])),
    knownRecipes: ['cura-simples', 'tonico-energia', 'elixir-concentracao'],
    upgrades: [],
    helpers: { off: [], ravenInMs: 1500, golemInMs: 0 },
    brew: null,
    brew2: null,
    customers: [],
    spawnInMs: 2500,
    supplier: {},
    order: null,
    contract: null,
    nextContractDay: 1,
    contractsDone: 0,
    contractSeals: 0,
    regulars: {},
    achievements: [],
    lifetime: { sold: 0, earned: 0 },
    petCount: 0,
    petDay: 0,
    rival: { week: 0, me: 0, her: 0, wins: 0, losses: 0 },
    expedition: null,
    expeditionsDone: 0,
    finds: [],
    event: null,
    stats: null as unknown as GameSave['stats'],
    reports: [],
    researchPoints: 0,
    mastery: {},
    talents: {},
    sealsBought: 0,
    festivalSponsored: false,
    tutorialStep: 0,
    seq: 0,
    settings: { volume: 0.7, muted: false, music: true, reduceMotion: false },
  };
  s.supplier = supplierStock(s);
  s.stats = freshStats(s);
  return s;
}
