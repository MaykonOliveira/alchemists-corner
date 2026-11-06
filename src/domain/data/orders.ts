import type { DayEventId } from '../models/types';

/** Clientes que fazem pedidos especiais pelo quadro de avisos. */
export const ORDER_CLIENTS = [
  { client: 'Guarda da cidade', text: 'A patrulha da muralha precisa de reforços para a semana.' },
  { client: 'Academia Arcana', text: 'Os aprendizes têm exames finais. Pedimos uma encomenda especial.' },
  { client: 'Estalagem do Ganso Dourado', text: 'Hóspedes cansados chegam todos os dias. Pode nos abastecer?' },
  { client: 'Guilda dos Exploradores', text: 'Uma expedição parte em breve e precisa de suprimentos.' },
];

export interface DayEventInfo {
  id: DayEventId;
  name: string;
  text: string;
  /** Multiplicador do intervalo entre clientes (menor = mais clientes). */
  spawnFactor: number;
  /** Peso extra por arquétipo. */
  archetypeBoost: Partial<Record<'aventureiro' | 'estudioso' | 'morador' | 'viajante', number>>;
  budgetBonus: number;
}

export const DAY_EVENTS: Record<DayEventId, DayEventInfo> = {
  feira: { id: 'feira', name: 'Dia de feira', text: 'A praça está cheia. Mais moradores passam pela rua.',
    spawnFactor: 0.7, archetypeBoost: { morador: 3 }, budgetBonus: 0 },
  caravana: { id: 'caravana', name: 'Chegou uma caravana', text: 'Aventureiros e viajantes com bolsos cheios chegaram à cidade.',
    spawnFactor: 0.85, archetypeBoost: { aventureiro: 2, viajante: 2 }, budgetBonus: 0.1 },
  chuva: { id: 'chuva', name: 'Dia chuvoso', text: 'Pouca gente na rua, mas quem entra quer se aquecer e estudar.',
    spawnFactor: 1.25, archetypeBoost: { estudioso: 3 }, budgetBonus: 0.05 },
};
