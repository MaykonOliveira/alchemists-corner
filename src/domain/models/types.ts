// Tipos de domínio do Alchemist's Corner.
// Este módulo não depende de React nem de Phaser.

export type SeasonId = 'primavera' | 'verao' | 'outono' | 'inverno';

export type IngredientFamily = 'erva' | 'mineral' | 'magico' | 'raro';
export type Rarity = 'comum' | 'incomum' | 'raro';

export interface Ingredient {
  id: string;
  name: string;
  family: IngredientFamily;
  description: string;
  price: number;
  rarity: Rarity;
  /** Nível da loja a partir do qual o fornecedor oferece o item. */
  supplierLevel: number;
  /** Estoque diário do fornecedor (null = ilimitado). */
  dailyStock: number | null;
  /** Cor principal usada nos ícones. */
  color: string;
  /** Ingrediente da estação: o fornecedor só vende nela. */
  season?: SeasonId;
}

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
}

export type RecipeCategory = 'cura' | 'vigor' | 'mente' | 'utilidade';

export interface Recipe {
  id: string;
  name: string;
  shortName: string;
  ingredients: RecipeIngredient[];
  /** Duração do preparo de um lote, em minutos de jogo. */
  durationMin: number;
  basePrice: number;
  category: RecipeCategory;
  need: string;
  /** Frase curta que o cliente diz ao pedir. */
  request: string;
  customerProfile: string;
  unlockLevel: number;
  /** Pista mostrada no livro antes da descoberta. */
  hint: string;
  color: string;
  /** Poção da estação: só é procurada nela (e só se prepara com o ingrediente dela). */
  season?: SeasonId;
}

export interface PotionStack {
  recipeId: string;
  quantity: number;
  quality: number;
  forSale: boolean;
}

export type CustomerArchetype = 'aventureiro' | 'estudioso' | 'morador' | 'viajante' | 'nobre';

export interface Customer {
  id: string;
  archetype: CustomerArchetype;
  wantedRecipeId: string;
  /** Multiplicador sobre o preço-base que o cliente aceita pagar. */
  budgetFactor: number;
  patienceMs: number;
  waitedMs: number;
  /** Contraproposta feita pelo cliente quando o preço passou um pouco do orçamento. */
  offer: { recipeId: string; price: number } | null;
  /** Última reação, para a interface mostrar. */
  remark: string | null;
  /** Freguês fiel (id em REGULARS), se for um. */
  regularId?: string | null;
}

/** Amizade com um freguês fiel. */
export interface RegularState {
  visits: number;
  hearts: number;
  /** Já deu o presente de amizade. */
  gift: boolean;
}

export interface ShopUpgrade {
  id: string;
  name: string;
  cost: number;
  effect: string;
  category: 'funcional' | 'visual' | 'ajudante' | 'expansao';
  requiredLevel: number;
  /** Melhoria que precisa ser comprada antes (etapas da expansão). */
  requires?: string;
  /** Salário diário (ajudantes), somado à manutenção no fechamento. */
  upkeep?: number;
}

/** O que os ajudantes fizeram no dia. */
export interface HelperWork {
  brews: number;
  served: number;
  deliveries: number;
  delivered: number;
}

/** Estado dos ajudantes automáticos. */
export interface HelpersState {
  /** Ajudantes contratados que o jogador mandou descansar (desligados). */
  off: string[];
  /** Tempo (ms reais) até o corvo conferir o armário de novo. */
  ravenInMs: number;
  /** Tempo (ms reais) até o golem poder atender de novo. */
  golemInMs: number;
}

export interface BrewJob {
  recipeId: string;
  batches: number;
  elapsedMs: number;
  totalMs: number;
}

export interface SpecialOrder {
  id: string;
  client: string;
  text: string;
  recipeId: string;
  qty: number;
  rewardCoins: number;
  rewardRep: number;
  rewardXp: number;
  dueDay: number;
  /** Pedido do Visitante Misterioso (evento raro): vale só no dia e traz um achado lendário. */
  visitor?: boolean;
  rewardSeal?: boolean;
  rewardFind?: string;
}

/** Uma linha de um contrato: quantas poções de uma receita, e quantas já foram entregues. */
export interface ContractItem {
  recipeId: string;
  qty: number;
  delivered: number;
}

/** Encomenda grande de vários dias (late game), aceita no quadro de avisos e entregue aos poucos. */
export interface Contract {
  id: string;
  client: string;
  text: string;
  items: ContractItem[];
  rewardCoins: number;
  rewardRep: number;
  rewardXp: number;
  /** Ingredientes raros que vêm no baú da recompensa. */
  rewardIngredients: { ingredientId: string; qty: number }[];
  rewardSeal: boolean;
  /** Último dia para aceitar (oferta) ou para entregar (aceito). */
  dueDay: number;
  accepted: boolean;
}

export type DayEventId = 'feira' | 'caravana' | 'chuva' | 'festival' | 'eclipse' | 'lua-cheia' | 'visitante';

export interface DayStats {
  revenue: number;
  ingredientCost: number;
  orderRewards: number;
  salesByRecipe: Record<string, number>;
  served: number;
  lost: number;
  repStart: number;
  xpStart: number;
  levelStart: number;
  ordersDone: number;
  helperWork: HelperWork;
}

export interface DayReport {
  day: number;
  revenue: number;
  ingredientCost: number;
  orderRewards: number;
  maintenance: number;
  profit: number;
  salesByRecipe: Record<string, number>;
  customersServed: number;
  customersLost: number;
  reputationDelta: number;
  xpGained: number;
  levelUps: number;
  /** Parte da manutenção que foi salário dos ajudantes. */
  wages?: number;
  helperWork?: HelperWork;
  /** Placar da semana contra a rival, depois deste dia. */
  rival?: { me: number; her: number; result: 'win' | 'loss' | null };
}

/** Disputa semanal de vendas com a Madame Vesper, a alquimista do outro lado da rua. */
export interface RivalState {
  /** Semana (índice) do placar atual. */
  week: number;
  me: number;
  her: number;
  wins: number;
  losses: number;
}

/** Expedição do corvo (volta no começo do dia indicado). */
export interface Expedition {
  dest: string;
  returnDay: number;
}

export type DayPhase = 'preparacao' | 'expediente' | 'fechamento';
export type TimeOfDay = 'manha' | 'tarde' | 'noite';

export interface Settings {
  volume: number;
  muted: boolean;
  music: boolean;
  reduceMotion: boolean;
}

export const SAVE_VERSION = 7 as const;

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
  /** Preço de venda definido pelo jogador, por receita. */
  prices: Record<string, number>;
  knownRecipes: string[];
  upgrades: string[];
  helpers: HelpersState;
  brew: BrewJob | null;
  /** Segundo caldeirão (expansão "Sala dos fundos"). */
  brew2: BrewJob | null;
  customers: Customer[];
  /** Tempo (ms reais de expediente) até o próximo cliente. */
  spawnInMs: number;
  /** Estoque restante do fornecedor hoje (null = ilimitado). */
  supplier: Record<string, number | null>;
  order: SpecialOrder | null;
  /** Contrato de vários dias (oferecido ou aceito). */
  contract: Contract | null;
  /** Dia a partir do qual um novo contrato pode aparecer. */
  nextContractDay: number;
  contractsDone: number;
  /** Selos de Mestre ganhos em contratos. */
  contractSeals: number;
  event: DayEventId | null;
  stats: DayStats;
  reports: DayReport[];
  researchPoints: number;
  /** Maestria: quantas poções de cada receita já saíram do caldeirão. */
  mastery: Record<string, number>;
  /** Talentos do Grimório do Mestre (grau por id), comprados com Selos. */
  talents: Record<string, number>;
  /** Selos comprados com moedas (doações à Guilda dos Alquimistas). */
  sealsBought: number;
  /** O jogador patrocinou o Festival das Lanternas para o próximo dia. */
  festivalSponsored: boolean;
  /** Amizade com os fregueses fiéis, por id. */
  regulars: Record<string, RegularState>;
  /** Conquistas do álbum já desbloqueadas (ids, na ordem em que vieram). */
  achievements: string[];
  /** Totais da partida inteira (para o álbum). */
  lifetime: { sold: number; earned: number };
  /** Carinhos no gato da loja e o último dia em que ele deu sorte. */
  petCount: number;
  petDay: number;
  /** Rival da rua (pacote E). */
  rival: RivalState;
  expedition: Expedition | null;
  expeditionsDone: number;
  /** Achados de expedições e do Visitante Misterioso (ids). */
  finds: string[];
  tutorialStep: number;
  seq: number;
  settings: Settings;
}

/** Eventos emitidos pelas regras para a apresentação (sons, animações, avisos). */
export type GameEvent =
  | { type: 'PURCHASE'; ingredientId: string; qty: number; cost: number }
  | { type: 'BREW_STARTED'; recipeId: string; batches: number; by?: 'aprendiz'; slot?: 2 }
  | { type: 'BREW_DONE'; recipeId: string; qty: number; slot?: 2 }
  | { type: 'CUSTOMER_ARRIVED'; customerId: string }
  | { type: 'SALE'; customerId: string; recipeId: string; price: number; substitute: boolean; by?: 'golem' }
  | { type: 'RAVEN_DELIVERY'; items: { ingredientId: string; qty: number }[]; cost: number; fee: number }
  | { type: 'GOLEM_DISMISSED'; customerId: string }
  | { type: 'HELPER_TOGGLED'; upgradeId: string; on: boolean }
  | { type: 'COUNTER_OFFER'; customerId: string; price: number }
  | { type: 'CUSTOMER_REFUSED'; customerId: string; reason: 'produto' | 'preco' }
  | { type: 'CUSTOMER_LEFT'; customerId: string; reason: 'paciencia' | 'preco' | 'recusou-oferta' | 'fechou' | 'atendido' }
  | { type: 'LEVEL_UP'; level: number; recipes: string[] }
  | { type: 'ORDER_NEW'; orderId: string }
  | { type: 'ORDER_DONE'; orderId: string; coins: number }
  | { type: 'ORDER_EXPIRED'; orderId: string }
  | { type: 'CONTRACT_OFFERED'; contractId: string }
  | { type: 'CONTRACT_ACCEPTED'; contractId: string }
  | { type: 'CONTRACT_PROGRESS'; contractId: string; delivered: number }
  | { type: 'CONTRACT_DONE'; contractId: string; coins: number; seal: boolean }
  | { type: 'CONTRACT_FAILED'; contractId: string; coins: number }
  | { type: 'UPGRADE_BOUGHT'; upgradeId: string }
  | { type: 'DISCOVERY'; recipeId: string }
  | { type: 'EXPERIMENT_FAILED'; hint: string }
  | { type: 'DAY_CLOSED'; report: DayReport }
  | { type: 'DAY_STARTED'; day: number; event: DayEventId | null }
  | { type: 'MASTERY_STAR'; recipeId: string; stars: number }
  | { type: 'MASTER_RANK'; rank: number }
  | { type: 'TALENT_LEARNED'; talentId: string; rank: number }
  | { type: 'SEAL_BOUGHT'; cost: number }
  | { type: 'FESTIVAL_SPONSORED'; cost: number }
  | { type: 'GREENHOUSE_HARVEST'; items: { ingredientId: string; qty: number }[] }
  | { type: 'REGULAR_HEART'; regularId: string; hearts: number; tip: number }
  | { type: 'REGULAR_GIFT'; regularId: string }
  | { type: 'ACHIEVEMENT'; id: string }
  | { type: 'CAT_PETTED'; lucky: boolean }
  | { type: 'SEASON_STARTED'; season: string }
  | { type: 'RIVAL_RESULT'; win: boolean; me: number; her: number; coins: number }
  | { type: 'EXPEDITION_SENT'; dest: string; returnDay: number }
  | { type: 'EXPEDITION_BACK'; dest: string; items: { ingredientId: string; qty: number }[]; find: string | null }
  | { type: 'FIND'; id: string }
  | { type: 'ERROR'; message: string };
