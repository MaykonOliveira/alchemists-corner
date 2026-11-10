// Dados da fase 3: presentes de visita, trilha da temporada, festas da estação, cartas e presentes de nível.
import type { SeasonId } from '../models/types';

import { tr } from '../../i18n';
/** Presentes dos níveis 2 a 5: a primeira meia hora tem uma recompensa em cada degrau. */
export const LEVEL_GIFTS: Record<number, { coins: number; crystals: number; items: { ingredientId: string; qty: number }[] }> = {
  2: { coins: 40, crystals: 0, items: [{ ingredientId: 'folha-lunar', qty: 4 }, { ingredientId: 'po-de-pedra', qty: 4 }] },
  3: { coins: 60, crystals: 2, items: [{ ingredientId: 'orvalho-feerico', qty: 3 }] },
  4: { coins: 80, crystals: 3, items: [{ ingredientId: 'essencia-azul', qty: 3 }] },
  5: { coins: 120, crystals: 5, items: [{ ingredientId: 'cogumelo-lanterna', qty: 3 }] },
};

/** Calendário de 7 presentes de visita. Faltar um dia não zera nada: o próximo presente só espera. */
export const VISIT_GIFTS: { coins: number; crystals: number; items: { ingredientId: string; qty: number }[]; decor?: string; label: string }[] = [
  { coins: 60, crystals: 0, items: [], label: tr('60 moedas') },
  { coins: 0, crystals: 0, items: [{ ingredientId: 'orvalho-feerico', qty: 3 }, { ingredientId: 'cristal-ambar', qty: 3 }], label: tr('Cesta de ingredientes') },
  { coins: 100, crystals: 0, items: [], label: tr('100 moedas') },
  { coins: 0, crystals: 4, items: [], label: tr('4 Cristais de luar') },
  { coins: 0, crystals: 0, items: [{ ingredientId: 'essencia-azul', qty: 3 }, { ingredientId: 'cogumelo-lanterna', qty: 3 }], label: tr('Ingredientes mágicos') },
  { coins: 180, crystals: 0, items: [], label: tr('180 moedas') },
  { coins: 0, crystals: 8, items: [], decor: 'planta-cogumelos', label: tr('Baú do sétimo dia: 8 cristais e um vaso de cogumelos') },
];

/** Pontos da trilha por tipo de feito. */
export const TRACK_POINTS = { goal: 10, allGoals: 10, order: 15, contract: 30, dayClosed: 5, visit: 10 } as const;
/** Pontos para cada recompensa da trilha. */
export const TRACK_STEP = 30;
/** Duração de uma temporada da trilha, em dias reais. */
export const TRACK_DAYS = 28;

export type TrackReward =
  | { kind: 'coins'; n: number }
  | { kind: 'crystals'; n: number }
  | { kind: 'ingredients'; items: { ingredientId: string; qty: number }[] }
  | { kind: 'item'; id: string };

const c = (n: number): TrackReward => ({ kind: 'coins', n });
const k = (n: number): TrackReward => ({ kind: 'crystals', n });
const ing = (ingredientId: string, qty: number): TrackReward => ({ kind: 'ingredients', items: [{ ingredientId, qty }] });

/** As 30 recompensas gratuitas da Trilha da Temporada (a mesma lista a cada temporada). */
export const TRACK_REWARDS: TrackReward[] = [
  c(50), k(2), ing('orvalho-feerico', 3), c(80), k(3),
  ing('essencia-azul', 3), c(100), k(3), ing('cogumelo-lanterna', 3), { kind: 'item', id: 'tapete-estrelas' },
  c(150), k(4), ing('raiz-mandragora', 2), c(180), k(4),
  ing('cristal-geada', 2), c(220), k(5), ing('pluma-grifo', 2), c(260),
  k(5), ing('areia-estelar', 2), c(300), k(6), ing('pena-fenix', 1),
  c(350), k(6), c(400), k(10), { kind: 'item', id: 'toldo-dourado' },
];

export const TRACK_NAMES: Record<SeasonId, string> = {
  primavera: tr('Temporada das Flores'), verao: tr('Temporada do Sol'), outono: tr('Temporada das Folhas'), inverno: tr('Temporada da Neve'),
};

/** Festa de cada estação do jogo: no último dia da estação, um convidado especial passa pela loja. */
export interface SeasonFest {
  season: SeasonId;
  name: string;
  text: string;
  guest: string;
  archetype: 'aventureiro' | 'estudioso' | 'morador' | 'viajante' | 'nobre';
  /** Poção que o convidado procura (a da estação, se a loja já sabe; senão uma da categoria). */
  wants: string;
  remark: string;
  reward: string;
}

export const SEASON_FESTS: Record<SeasonId, SeasonFest> = {
  primavera: { season: 'primavera', name: tr('Feira das Flores'), text: tr('A rua amanheceu enfeitada. A jardineira Flora vem buscar um néctar para a feira.'),
    guest: tr('Flora, a jardineira'), archetype: 'morador', wants: 'nectar-primavera', remark: tr('Feliz Feira das Flores! Tem algo que cheire a primavera?'), reward: 'planta-flores' },
  verao: { season: 'verao', name: tr('Festa do Sol'), text: tr('O dia mais longo do ano. O capitão Sol-Posto quer algo para a travessia.'),
    guest: tr('Capitão Sol-Posto'), archetype: 'viajante', wants: 'refresco-solar', remark: tr('Hoje o sol não se põe! Preciso de vigor para a travessia.'), reward: 'luminaria-sol' },
  outono: { season: 'outono', name: tr('Noite das Abóboras'), text: tr('Abóboras acesas em cada janela. A bruxa Morgana veio de longe atrás de um chá.'),
    guest: tr('Bruxa Morgana'), archetype: 'estudioso', wants: 'cha-colheita', remark: tr('Doce ou travessura? Prefiro um chá bem forte…'), reward: 'lanterna-abobora' },
  inverno: { season: 'inverno', name: tr('Noite do Gelo'), text: tr('A cidade patina no lago congelado. O guardião Bóreas procura uma luz para a noite.'),
    guest: tr('Guardião Bóreas'), archetype: 'aventureiro', wants: 'aurora-boreal', remark: tr('A noite mais longa chegou. Tem algo que brilhe no escuro?'), reward: 'quadro-neve' },
};

/** Cartas curtas dos fregueses fiéis, que anunciam a visita do dia seguinte. */
export const LETTERS: Record<string, string[]> = {
  'dona-celia': [tr('Meu neto ralou o joelho de novo. Passo aí amanhã cedinho!'), tr('Fiz bolo de fubá. Amanhã levo um pedaço e busco o de sempre.')],
  bram: [tr('A forja vai trabalhar dobrado amanhã. Separa um tônico para mim?'), tr('Ganhei uma encomenda grande de ferraduras. Amanhã apareço!')],
  lia: [tr('Prova de runas amanhã! Vou precisar do elixir. Torça por mim.'), tr('O professor passou trabalho para a noite toda. Amanhã eu passo aí.')],
  tobias: [tr('Volto da estrada amanhã. Guarda uma visão noturna para o mascate?'), tr('Achei um atalho pelas minas. Amanhã conto tudo e levo uma poção.')],
  'vovo-ze': [tr('Os joelhos avisaram que vem chuva. Amanhã passo para o bálsamo.'), tr('Minha netinha vem me visitar. Amanhã quero dormir cedo, sabe como é.')],
  condessa: [tr('Há um baile no palácio amanhã. Conto com seu brilho, como sempre.'), tr('A duquesa de Valtória copiou meu vestido. Amanhã preciso brilhar mais.')],
};

/** Carta da Condessa no fim do dia 1 e a encomenda que ela faz no dia 2. */
export const DEBUT = {
  name: tr('Condessa Amélia'),
  remark: tr('Então esta é a loja nova! Dizem que suas poções são as melhores da rua.'),
  letter: tr('Fiquei encantada com a loja. Volte amanhã: tenho uma encomenda maior para você.'),
  /** Carta quando ninguém atendeu a Condessa no dia 1. */
  letterMissed: tr('Passei pela loja ontem à tarde e esperei, mas ninguém me atendeu. Vou dar mais uma chance: preciso de poções para o baile.'),
  pays: 10,
  order: { client: tr('Condessa Amélia'), text: tr('Como prometido: o baile da corte precisa de poções de cura para os dançarinos mais animados.'), recipeId: 'cura-simples', qty: 4, rewardCoins: 160, rewardRep: 6, rewardXp: 60 },
};
