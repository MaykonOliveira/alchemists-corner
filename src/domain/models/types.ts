// Tipos de domínio do Alchemist's Corner.
// Este módulo não depende de React nem de Phaser.

export type IngredientFamily = 'erva' | 'mineral' | 'magico' | 'raro';
export type Rarity = 'comum' | 'incomum' | 'raro';

export interface Ingredient {
  id: string;
  name: string;
  family: IngredientFamily;
  description: string;
  price: number;
  rarity: Rarity;
  /** Cor principal usada em ícones provisórios. */
  color: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
}

export type RecipeCategory = 'cura' | 'vigor' | 'mente' | 'utilidade';

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  /** Duração do preparo em minutos de jogo. */
  durationMin: number;
  basePrice: number;
  category: RecipeCategory;
  need: string;
  customerProfile: string;
  unlockLevel: number;
  /** Pista mostrada no livro antes da descoberta. */
  hint: string;
  color: string;
}

export interface PotionStack {
  recipeId: string;
  quantity: number;
  quality: number;
  forSale: boolean;
}

export type CustomerArchetype = 'aventureiro' | 'estudioso' | 'morador' | 'viajante';

export interface Customer {
  id: string;
  archetype: CustomerArchetype;
  wantedRecipeId: string;
  budget: number;
  patienceSec: number;
  state: 'entrando' | 'esperando' | 'atendido' | 'desistiu';
  reward: number;
}

export interface ShopUpgrade {
  id: string;
  name: string;
  cost: number;
  effect: string;
  category: 'funcional' | 'visual';
  requiredLevel: number;
}

export interface DayReport {
  day: number;
  revenue: number;
  expenses: number;
  profit: number;
  salesByRecipe: Record<string, number>;
  customersServed: number;
  reputationDelta: number;
}

export type DayPhase = 'preparacao' | 'expediente' | 'fechamento';
export type TimeOfDay = 'manha' | 'tarde' | 'noite';

export interface Settings {
  volume: number;
  muted: boolean;
  reduceMotion: boolean;
}

export const SAVE_VERSION = 1 as const;

export interface GameSave {
  saveVersion: typeof SAVE_VERSION;
  createdAt: number;
  updatedAt: number;
  day: number;
  phase: DayPhase;
  /** Minutos desde 00:00 no relógio do jogo. */
  clockMin: number;
  coins: number;
  reputation: number;
  level: number;
  xp: number;
  /** Quantidade por id de ingrediente. */
  ingredients: Record<string, number>;
  potions: PotionStack[];
  knownRecipes: string[];
  upgrades: string[];
  reports: DayReport[];
  settings: Settings;
}
