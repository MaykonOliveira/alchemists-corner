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
  /** Receita secreta: não libera por nível nem por experimento (a Poção da Coroa do Concurso Real). */
  secret?: boolean;
  /** Receita lendária (pacote U): só se descobre experimentando, com a ajuda das páginas rasgadas. */
  legend?: boolean;
  /** Charada do Cliente misterioso (pacote V): descreve o problema sem dizer a poção. */
  riddle?: string;
}

export interface PotionStack {
  recipeId: string;
  quantity: number;
  quality: number;
  forSale: boolean;
  /** Quantas desta pilha são de qualidade Fina e Primorosa (pacote V). O resto é Comum. */
  fine?: number;
  prime?: number;
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
  /** Cliente misterioso (pacote V): fala uma charada e só aceita a poção exata. */
  mystery?: boolean;
  /** Visita especial (Condessa no dia 1, convidado da festa da estação): nome próprio e preço fixo. */
  vip?: { name: string; pays: number; kind: 'estreia' | 'festa' | 'carta' };
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
  category: 'funcional' | 'visual' | 'ajudante' | 'expansao' | 'treino';
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
  /** Toque de mestre (pacote V): acertos ao mexer (0 a 3). Ausente = ninguém mexeu. */
  hits?: number;
  /** Preparo do aprendiz: sem toque de mestre. */
  byHelper?: boolean;
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

export type DayEventId = 'feira' | 'caravana' | 'chuva' | 'festival' | 'eclipse' | 'lua-cheia' | 'visitante' | 'festa-estacao';

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
  /** Fregueses fiéis atendidos hoje (para as cartas do fechamento). */
  regularsSeen?: string[];
  /** O que os clientes que foram embora queriam (receita → quantos). */
  lostByRecipe?: Record<string, number>;
  /** Cliente misterioso já apareceu hoje. */
  mystery?: boolean;
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
  /** Nível da loja no começo do dia (a medalha usa a meta do nível). */
  level?: number;
  /** O que os clientes que foram embora queriam (receita → quantos). */
  lostByRecipe?: Record<string, number>;
  /** Recordes pessoais batidos neste dia. */
  records?: RecordKind[];
}

/** Concurso Real de Alquimia (fase 4): campanha em 5 capítulos que abre no nível máximo. */
export interface RoyalState {
  /** Capítulo atual (0 a 4). 5 = concurso vencido. */
  chapter: number;
  /** Progresso do capítulo: vendas da categoria ou nobres atendidos em sequência. */
  progress: number;
  /** Poções já entregues neste capítulo, por receita. */
  delivered: Record<string, number>;
  /** Último dia para cumprir o capítulo (0 = sem prazo). */
  dueDay: number;
  /** Último capítulo cuja cena de abertura já foi vista (-1 = nenhum; 5 = a cerimônia final). */
  seen: number;
  /** Tentativas que venceram o prazo neste capítulo. */
  retries: number;
}

export type RecordKind = 'revenue' | 'served' | 'bestSale';

/** Recordes pessoais da loja. */
export interface Records {
  revenue: number;
  served: number;
  bestSale: number;
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

/** Metas do dia (pacote G): três por dia, e um baú na semana para quem cumprir bastante. */
export type GoalKind = 'vender' | 'faturar' | 'categoria' | 'preparar' | 'sem-troca' | 'pedido' | 'carinho';

export interface DailyGoal {
  id: string;
  kind: GoalKind;
  /** Categoria (para 'categoria') ou receita (para 'preparar'). */
  ref?: string;
  target: number;
  progress: number;
  coins: number;
  xp: number;
  done: boolean;
}

export interface GoalsState {
  day: number;
  list: DailyGoal[];
  /** Semana (índice) do baú e quantas metas foram cumpridas nela. */
  week: number;
  weekDone: number;
  chestClaimed: boolean;
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
  /** Mixer (0 a 1): música, efeitos e sons de ambiente. */
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  /** Vibração curta no celular em vendas, níveis e conquistas. */
  vibration: boolean;
  /** Lembretes do app instalado (caldeirão pronto, corvo de volta). Desligados por padrão. */
  reminders: boolean;
}

// ------------------------------------------------------------ fase 3

/** Cartas que chegam no fechamento e anunciam uma visita para amanhã. */
export interface Letter {
  /** Freguês fiel (id) ou 'condessa-estreia'. */
  from: string;
  text: string;
  /** Dia em que a visita (ou a encomenda) acontece. */
  day: number;
  done: boolean;
}

/** O que a loja fez enquanto o jogador esteve fora (livro do caixa). */
export interface AwayReport {
  awayMs: number;
  sold: number;
  coins: number;
  xp: number;
  brewed: Record<string, number>;
  /** Havia ajudantes para trabalhar? */
  helpers: boolean;
}

/** Calendário de presentes de visita: nunca zera, só espera. */
export interface VisitsState {
  /** Último dia real (AAAA-MM-DD, horário local) em que a loja foi aberta. */
  lastDate: string;
  /** Presentes já recebidos. */
  count: number;
  ready: boolean;
}

/** Trilha da Temporada: 28 dias reais, 30 recompensas gratuitas. */
export interface TrackState {
  period: number;
  points: number;
  /** Recompensas já entregues nesta temporada. */
  tier: number;
}

/** Desafio da semana: um dia jogado com a mesma semente para todos. */
export interface ChallengeState {
  week: number;
  active: boolean;
  /** Estado do gerador de números (mulberry32). */
  rng: number;
  score: number | null;
}

export const SAVE_VERSION = 10 as const;

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
  /** Metas do dia e baú da semana (pacote G). */
  goals: GoalsState;
  /** Dicas de contexto que o jogador já viu (ids). */
  tipsSeen: string[];
  /** Último preparo (receita e lotes): tocar no caldeirão parado repete. */
  lastBrew?: { recipeId: string; batches: number };
  /** Dia da última dica mostrada: no máximo uma dica por dia. */
  tipDay?: number;
  /** A história de abertura já foi vista. */
  storySeen: boolean;
  /** Nome da loja e cor do toldo, escolhidos na abertura (fase 3). */
  shopName: string;
  awning: string;
  /** A Condessa já fez a visita de estreia (dia 1). */
  debutDone: boolean;
  /** A Condessa da estreia foi atendida no dia 1 (a carta dela depende disso). */
  debutServed?: boolean;
  /** Carta para amanhã (freguês fiel ou Condessa). */
  letter: Letter | null;
  /** Evento sorteado no fechamento para o dia seguinte (a prévia do relatório mostra). */
  nextEvent: DayEventId | null;
  /** Livro do caixa da última volta (null depois de lido). */
  away: AwayReport | null;
  visits: VisitsState;
  /** Cristais de luar: ganhos só jogando, servem para decoração. */
  crystals: number;
  /** Itens que o jogador tem (decoração, títulos). Ver data/catalog.ts. */
  owned: string[];
  /** Decoração colocada em cada lugar da loja. */
  decor: Record<string, string>;
  track: TrackState;
  /** Festas da estação já celebradas (dia em que aconteceram). */
  festsDone: number[];
  /** Presentes de amigos já usados (ids) e o último dia real em que a loja mandou um. */
  giftsRedeemed: string[];
  giftSentDate: string;
  giftsSent: number;
  challenge: ChallengeState | null;
  /** Melhor pontuação no desafio, por semana. */
  challengeBest: { week: number; score: number } | null;
  /** Concurso Real (null antes do nível máximo). */
  royal: RoyalState | null;
  /** Recordes pessoais (dia de maior faturamento, mais clientes, maior venda). */
  records: Records;
  /** Obras da vila: etapas concluídas (0 a 3) por obra (pacote W). */
  village: Record<string, number>;
  /** Receitas lendárias (pacote U): quantos ingredientes de cada uma as páginas rasgadas já revelaram. */
  pages: Record<string, number>;
  tutorialStep: number;
  seq: number;
  settings: Settings;
}

/** Eventos emitidos pelas regras para a apresentação (sons, animações, avisos). */
export type GameEvent =
  | { type: 'PURCHASE'; ingredientId: string; qty: number; cost: number }
  | { type: 'BREW_STARTED'; recipeId: string; batches: number; by?: 'aprendiz'; slot?: 2 }
  | { type: 'BREW_DONE'; recipeId: string; qty: number; slot?: 2; quality?: 2 | 3 }
  | { type: 'CUSTOMER_ARRIVED'; customerId: string }
  | { type: 'SALE'; customerId: string; recipeId: string; price: number; substitute: boolean; by?: 'golem'; quality?: 2 | 3 }
  | { type: 'RAVEN_DELIVERY'; items: { ingredientId: string; qty: number }[]; cost: number; fee: number }
  | { type: 'GOLEM_DISMISSED'; customerId: string }
  | { type: 'HELPER_TOGGLED'; upgradeId: string; on: boolean }
  | { type: 'COUNTER_OFFER'; customerId: string; price: number }
  | { type: 'CUSTOMER_REFUSED'; customerId: string; reason: 'produto' | 'preco' }
  | { type: 'CUSTOMER_LEFT'; customerId: string; reason: 'paciencia' | 'preco' | 'recusou-oferta' | 'fechou' | 'atendido' }
  | { type: 'LEVEL_UP'; level: number; recipes: string[]; gift?: { coins: number; crystals: number; items: { ingredientId: string; qty: number }[] } }
  | { type: 'ORDER_NEW'; orderId: string }
  | { type: 'ORDER_DONE'; orderId: string; coins: number }
  | { type: 'ORDER_EXPIRED'; orderId: string }
  | { type: 'CONTRACT_OFFERED'; contractId: string }
  | { type: 'CONTRACT_ACCEPTED'; contractId: string }
  | { type: 'CONTRACT_PROGRESS'; contractId: string; delivered: number }
  | { type: 'CONTRACT_DONE'; contractId: string; coins: number; seal: boolean }
  | { type: 'CONTRACT_FAILED'; contractId: string; coins: number }
  | { type: 'UPGRADE_BOUGHT'; upgradeId: string }
  | { type: 'DISCOVERY'; recipeId: string; legend?: boolean }
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
  | { type: 'GOAL_DONE'; goalId: string; coins: number; xp: number; allDone: boolean }
  | { type: 'CHEST_OPENED'; coins: number; items: { ingredientId: string; qty: number }[] }
  | { type: 'VIP_ARRIVED'; customerId: string; name: string }
  | { type: 'VIP_SERVED'; name: string; coins: number; kind: 'estreia' | 'festa' | 'carta' }
  | { type: 'LETTER'; from: string }
  | { type: 'AWAY_REPORT'; report: AwayReport }
  | { type: 'VISIT_GIFT'; n: number; coins: number; crystals: number; items: { ingredientId: string; qty: number }[]; decor: string | null }
  | { type: 'CRYSTALS'; n: number; reason: string }
  | { type: 'TRACK_TIER'; tier: number; reward: string }
  | { type: 'DECOR_BOUGHT'; itemId: string }
  | { type: 'ITEM_GRANTED'; itemId: string; source: string }
  | { type: 'GIFT_SENT'; first: boolean }
  | { type: 'GIFT_REDEEMED'; from: string; crystals: number; items: { ingredientId: string; qty: number }[] }
  | { type: 'CHALLENGE_STARTED'; week: number }
  | { type: 'CHALLENGE_DONE'; week: number; score: number; best: boolean }
  | { type: 'ROYAL_INVITE' }
  | { type: 'ROYAL_PROGRESS'; chapter: number; progress: number; goal: number }
  | { type: 'ROYAL_CHAPTER_DONE'; chapter: number; coins: number; crystals: number }
  | { type: 'ROYAL_RETRY'; chapter: number }
  | { type: 'ROYAL_STREAK_LOST'; chapter: number }
  | { type: 'ROYAL_WON' }
  | { type: 'RECORD'; kind: RecordKind; value: number; prev: number }
  | { type: 'VILLAGE_STAGE'; projectId: string; stage: number }
  | { type: 'STIRRED'; hits: number; slot: 1 | 2 }
  | { type: 'MYSTERY_ARRIVED'; customerId: string }
  | { type: 'MYSTERY_SOLVED'; recipeId: string; coins: number; crystals: number }
  | { type: 'MYSTERY_WRONG'; customerId: string }
  | { type: 'PAGE_FOUND'; recipeId: string; ingredientId: string; source: string }
  | { type: 'ERROR'; message: string };
