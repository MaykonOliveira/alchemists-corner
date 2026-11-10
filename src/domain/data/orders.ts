import type { DayEventId } from '../models/types';

import { tr } from '../../i18n';
/** Clientes que fazem pedidos especiais pelo quadro de avisos. */
export const ORDER_CLIENTS = [
  { client: tr('Guarda da cidade'), text: tr('A patrulha da muralha precisa de reforços para a semana.') },
  { client: tr('Academia Arcana'), text: tr('Os aprendizes têm exames finais. Pedimos uma encomenda especial.') },
  { client: tr('Estalagem do Ganso Dourado'), text: tr('Hóspedes cansados chegam todos os dias. Pode nos abastecer?') },
  { client: tr('Guilda dos Exploradores'), text: tr('Uma expedição parte em breve e precisa de suprimentos.') },
];

/** Clientes ilustres que passam a encomendar a partir do nível 10. */
export const ROYAL_CLIENTS = [
  { client: tr('Corte da Rainha'), text: tr('Sua Majestade ouviu falar da loja e deseja uma encomenda para o baile.') },
  { client: tr('Observatório Real'), text: tr('Os astrônomos varam a noite estudando o céu. Precisamos de reforços.') },
  { client: tr('Ordem dos Cavaleiros'), text: tr('O torneio de outono se aproxima. Os cavaleiros contam com você.') },
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
  feira: { id: 'feira', name: tr('Dia de feira'), text: tr('A praça está cheia. Mais moradores passam pela rua.'),
    spawnFactor: 0.7, archetypeBoost: { morador: 3 }, budgetBonus: 0 },
  caravana: { id: 'caravana', name: tr('Chegou uma caravana'), text: tr('Aventureiros e viajantes com bolsos cheios chegaram à cidade.'),
    spawnFactor: 0.85, archetypeBoost: { aventureiro: 2, viajante: 2 }, budgetBonus: 0.1 },
  chuva: { id: 'chuva', name: tr('Dia chuvoso'), text: tr('Pouca gente na rua, mas quem entra quer se aquecer e estudar.'),
    spawnFactor: 1.25, archetypeBoost: { estudioso: 3 }, budgetBonus: 0.05 },
  festival: { id: 'festival', name: tr('Festival das Lanternas'), text: tr('A cidade está em festa! A nobreza desfila pelas ruas com bolsos cheios.'),
    spawnFactor: 0.65, archetypeBoost: { nobre: 2.5, viajante: 1 }, budgetBonus: 0.12, minLevel: 8 },
  // Eventos especiais raros (pacote E)
  eclipse: { id: 'eclipse', name: tr('Eclipse'), text: tr('O sol sumiu ao meio-dia! Estudiosos correm atrás de elixires para a mente, que valem quase o dobro.'),
    spawnFactor: 0.9, archetypeBoost: { estudioso: 3 }, budgetBonus: 0, minLevel: 5, rare: true,
    categoryBoost: { category: 'mente', factor: 1.8 } },
  'lua-cheia': { id: 'lua-cheia', name: tr('Mercado da Lua Cheia'), text: tr('Mercadores da noite trouxeram ingredientes de todas as estações e itens raros a mais.'),
    spawnFactor: 0.85, archetypeBoost: { viajante: 2 }, budgetBonus: 0.05, minLevel: 5, rare: true },
  visitante: { id: 'visitante', name: tr('Visitante Misterioso'), text: tr('Um viajante encapuzado deixou um pedido no quadro. Paga com algo que não se vende em loja nenhuma.'),
    spawnFactor: 1, archetypeBoost: {}, budgetBonus: 0, minLevel: 5, rare: true },
  // Festa da estação (fase 3): último dia de cada estação, com um convidado especial (ver data/retention.ts).
  'festa-estacao': { id: 'festa-estacao', name: tr('Festa da estação'), text: tr('A rua está enfeitada e um convidado especial vem à loja.'),
    spawnFactor: 0.8, archetypeBoost: { morador: 1 }, budgetBonus: 0.08 },
};

/** Quem oferece contratos de vários dias (a partir do nível 6). */
export const CONTRACT_CLIENTS = [
  { client: tr('Guilda dos Mercadores'), text: tr('Uma caravana sai em três dias e quer levar um carregamento completo.') },
  { client: tr('Hospital de Santa Brígida'), text: tr('O inverno chegou cedo. Precisamos encher a enfermaria.') },
  { client: tr('Exército do Norte'), text: tr('A tropa marcha para a fronteira. Um contrato de suprimentos, pago em ouro.') },
  { client: tr('Universidade de Valtória'), text: tr('Um semestre inteiro de experimentos depende das suas poções.') },
];
