import type { CustomerArchetype, RecipeCategory, SeasonId } from '../models/types';

export type { SeasonId };

/** Fregueses fiéis: sempre voltam, pedem a mesma poção e viram amigos da loja. */
export interface RegularInfo {
  id: string;
  name: string;
  archetype: CustomerArchetype;
  favorite: string;
  /** Nível da loja a partir do qual começa a aparecer. */
  minLevel: number;
  greeting: string;
  /** Presente dado ao virar amigo (5 corações). */
  gift: { ingredientId: string; qty: number };
  /** Frase de agradecimento junto com o presente. */
  thanks: string;
}

export const REGULARS: RegularInfo[] = [
  { id: 'dona-celia', name: 'Dona Célia', archetype: 'morador', favorite: 'cura-simples', minLevel: 2,
    greeting: 'Bom dia, querida loja! O de sempre, por favor.', gift: { ingredientId: 'orvalho-feerico', qty: 8 },
    thanks: 'Trouxe orvalho do meu jardim. É para você!' },
  { id: 'bram', name: 'Bram, o ferreiro', archetype: 'aventureiro', favorite: 'tonico-energia', minLevel: 2,
    greeting: 'A forja não descansa! Me vê aquele tônico.', gift: { ingredientId: 'cristal-ambar', qty: 10 },
    thanks: 'Achei esses cristais na mina. Fazem mais falta aqui do que lá.' },
  { id: 'lia', name: 'Lia, aprendiz de maga', archetype: 'estudioso', favorite: 'elixir-concentracao', minLevel: 3,
    greeting: 'Mais uma noite de estudos… O elixir de sempre?', gift: { ingredientId: 'essencia-azul', qty: 8 },
    thanks: 'Passei na prova! Guardei um pouco de essência da academia para você.' },
  { id: 'tobias', name: 'Tobias, o mascate', archetype: 'viajante', favorite: 'visao-noturna', minLevel: 4,
    greeting: 'Voltei da estrada! As minas me esperam de novo.', gift: { ingredientId: 'cogumelo-lanterna', qty: 10 },
    thanks: 'Na última viagem lembrei de você. Cogumelos fresquinhos!' },
  { id: 'vovo-ze', name: 'Vovô Zé', archetype: 'morador', favorite: 'balsamo-calmante', minLevel: 5,
    greeting: 'Sabe como é, na minha idade o sono é curto…', gift: { ingredientId: 'raiz-mandragora', qty: 4 },
    thanks: 'Essa mandrágora estava no meu porão desde moço. Faça bom uso!' },
  { id: 'condessa', name: 'Condessa Amélia', archetype: 'nobre', favorite: 'pocao-brilho', minLevel: 8,
    greeting: 'O baile é hoje. Só confio no seu brilho.', gift: { ingredientId: 'pluma-grifo', qty: 4 },
    thanks: 'Uma pluma de grifo do meu brasão. Você merece.' },
];

export const REGULARS_BY_ID: Record<string, RegularInfo> = Object.fromEntries(REGULARS.map((r) => [r.id, r]));

/** Corações para virar amigo. */
export const MAX_HEARTS = 5;
/** A partir de quantos corações o freguês deixa gorjeta. */
export const TIP_HEARTS = 3;
export const TIP_RATE = 0.15;


export interface SeasonInfo {
  id: SeasonId;
  name: string;
  icon: string;
  /** Categoria de poção mais procurada (e mais bem paga) na estação. */
  category: RecipeCategory;
  text: string;
}

export const SEASONS: SeasonInfo[] = [
  { id: 'primavera', name: 'Primavera', icon: '🌸', category: 'cura', text: 'Pólen no ar e joelhos ralados: poções de cura vendem mais.' },
  { id: 'verao', name: 'Verão', icon: '☀️', category: 'vigor', text: 'Viagens longas e dias quentes: tônicos e vigor em alta.' },
  { id: 'outono', name: 'Outono', icon: '🍂', category: 'mente', text: 'Volta às aulas na academia: elixires para a mente valem mais.' },
  { id: 'inverno', name: 'Inverno', icon: '❄️', category: 'utilidade', text: 'Noites longas e escuras: luz, visão e utilidades em alta.' },
];

/** Dias em cada estação. */
export const SEASON_DAYS = 7;
/** Quanto a mais os clientes pagam pela categoria da estação. */
export const SEASON_PRICE_BONUS = 1.12;

export const CATEGORY_LABEL: Record<RecipeCategory, string> = { cura: 'cura', vigor: 'vigor', mente: 'mente', utilidade: 'utilidade' };
