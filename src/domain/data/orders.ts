import type { DayEventId } from '../models/types';

/** Clientes que fazem pedidos especiais pelo quadro de avisos. */
export const ORDER_CLIENTS = [
  { client: 'Guarda da cidade', text: 'A patrulha da muralha precisa de reforços para a semana.' },
  { client: 'Academia Arcana', text: 'Os aprendizes têm exames finais. Pedimos uma encomenda especial.' },
  { client: 'Estalagem do Ganso Dourado', text: 'Hóspedes cansados chegam todos os dias. Pode nos abastecer?' },
  { client: 'Guilda dos Exploradores', text: 'Uma expedição parte em breve e precisa de suprimentos.' },
];

/** Clientes ilustres que passam a encomendar a partir do nível 10. */
export const ROYAL_CLIENTS = [
  { client: 'Corte da Rainha', text: 'Sua Majestade ouviu falar da loja e deseja uma encomenda para o baile.' },
  { client: 'Observatório Real', text: 'Os astrônomos varam a noite estudando o céu. Precisamos de reforços.' },
  { client: 'Ordem dos Cavaleiros', text: 'O torneio de outono se aproxima. Os cavaleiros contam com você.' },
];

export interface DayEventInfo {
  id: DayEventId;
  name: string;
  text: string;
  /** Multiplicador do intervalo entre clientes (menor = mais clientes). */
  spawnFactor: number;
  /** Peso extra por arquétipo. */
  archetypeBoost: Partial<Record<'aventureiro' | 'estudioso' | 'morador' | 'viajante' | 'nobre', number>>;
  /** Nível mínimo da loja para o evento acontecer. */
  minLevel?: number;
  budgetBonus: number;
  /** Evento especial raro (sorteado à parte, cerca de uma vez por estação). */
  rare?: boolean;
  /** Categoria de poção que paga mais no dia (multiplicador). */
  categoryBoost?: { category: 'cura' | 'vigor' | 'mente' | 'utilidade'; factor: number };
}

export const DAY_EVENTS: Record<DayEventId, DayEventInfo> = {
  feira: { id: 'feira', name: 'Dia de feira', text: 'A praça está cheia. Mais moradores passam pela rua.',
    spawnFactor: 0.7, archetypeBoost: { morador: 3 }, budgetBonus: 0 },
  caravana: { id: 'caravana', name: 'Chegou uma caravana', text: 'Aventureiros e viajantes com bolsos cheios chegaram à cidade.',
    spawnFactor: 0.85, archetypeBoost: { aventureiro: 2, viajante: 2 }, budgetBonus: 0.1 },
  chuva: { id: 'chuva', name: 'Dia chuvoso', text: 'Pouca gente na rua, mas quem entra quer se aquecer e estudar.',
    spawnFactor: 1.25, archetypeBoost: { estudioso: 3 }, budgetBonus: 0.05 },
  festival: { id: 'festival', name: 'Festival das Lanternas', text: 'A cidade está em festa! A nobreza desfila pelas ruas com bolsos cheios.',
    spawnFactor: 0.65, archetypeBoost: { nobre: 2.5, viajante: 1 }, budgetBonus: 0.12, minLevel: 8 },
  // Eventos especiais raros (pacote E)
  eclipse: { id: 'eclipse', name: 'Eclipse', text: 'O sol sumiu ao meio-dia! Estudiosos correm atrás de elixires para a mente, que valem quase o dobro.',
    spawnFactor: 0.9, archetypeBoost: { estudioso: 3 }, budgetBonus: 0, minLevel: 5, rare: true,
    categoryBoost: { category: 'mente', factor: 1.8 } },
  'lua-cheia': { id: 'lua-cheia', name: 'Mercado da Lua Cheia', text: 'Mercadores da noite trouxeram ingredientes de todas as estações e itens raros a mais.',
    spawnFactor: 0.85, archetypeBoost: { viajante: 2 }, budgetBonus: 0.05, minLevel: 5, rare: true },
  visitante: { id: 'visitante', name: 'Visitante Misterioso', text: 'Um viajante encapuzado deixou um pedido no quadro. Paga com algo que não se vende em loja nenhuma.',
    spawnFactor: 1, archetypeBoost: {}, budgetBonus: 0, minLevel: 5, rare: true },
  // Festa da estação (fase 3): último dia de cada estação, com um convidado especial (ver data/retention.ts).
  'festa-estacao': { id: 'festa-estacao', name: 'Festa da estação', text: 'A rua está enfeitada e um convidado especial vem à loja.',
    spawnFactor: 0.8, archetypeBoost: { morador: 1 }, budgetBonus: 0.08 },
};

/** Quem oferece contratos de vários dias (a partir do nível 6). */
export const CONTRACT_CLIENTS = [
  { client: 'Guilda dos Mercadores', text: 'Uma caravana sai em três dias e quer levar um carregamento completo.' },
  { client: 'Hospital de Santa Brígida', text: 'O inverno chegou cedo. Precisamos encher a enfermaria.' },
  { client: 'Exército do Norte', text: 'A tropa marcha para a fronteira. Um contrato de suprimentos, pago em ouro.' },
  { client: 'Universidade de Valtória', text: 'Um semestre inteiro de experimentos depende das suas poções.' },
];
