// Concurso Real de Alquimia (fase 4, pacote T): a campanha do fim de jogo.
// Abre quando a loja chega ao nível máximo. Cinco capítulos, um por vez, cada um com cena,
// prazo (quando tem), prêmio e um troféu que aparece na estante da loja.
import type { RecipeCategory } from '../models/types';

import { tr } from '../../i18n';
export type RoyalGoal =
  | { kind: 'vender'; category: RecipeCategory; qty: number }
  | { kind: 'entregar'; items: { recipeId: string; qty: number }[] }
  | { kind: 'nobres'; qty: number };

export interface RoyalChapter {
  id: string;
  title: string;
  icon: string;
  /** Falas da cena de abertura (quem fala é a Rainha ou o arauto). */
  intro: string[];
  /** Resumo curto do que fazer (cartão do capítulo). */
  task: string;
  goal: RoyalGoal;
  /** Dias para cumprir (null = sem prazo). Errar o prazo só recomeça o capítulo. */
  days: number | null;
  /** Exigência extra para entregar: estrelas de maestria numa receita. */
  stars?: { recipeId: string; n: number };
  reward: { coins: number; crystals: number };
  trophy: string;
}

export const ROYAL_RECIPE = 'pocao-coroa';
export const QUEEN = tr('Rainha Isolda');

export const ROYAL_CHAPTERS: RoyalChapter[] = [
  {
    id: 'febre', title: tr('A febre da vila'), icon: '🤒',
    intro: [
      tr('Um arauto de capa azul bate à porta e desenrola um pergaminho com o selo da Coroa.'),
      tr('“A {0} anuncia o Concurso Real de Alquimia. Só uma loja do reino levará a coroa de Grão-Alquimista.”', QUEEN),
      tr('“Primeira prova: uma febre se espalhou pela vila. Mostre que sua loja cuida do povo.”'),
    ],
    task: tr('Venda 20 poções de cura em 2 dias.'),
    goal: { kind: 'vender', category: 'cura', qty: 20 }, days: 2,
    reward: { coins: 2500, crystals: 10 }, trophy: tr('Taça de Bronze'),
  },
  {
    id: 'minas', title: tr('A expedição às minas'), icon: '⛏️',
    intro: [
      tr('“A vila agradece. A Coroa também.”'),
      tr('“Segunda prova: três exploradores reais vão descer às Minas de Cristal. Eles precisam enxergar no escuro, aguentar a viagem e iluminar o caminho.”'),
    ],
    task: tr('Entregue um kit de expedição: 6 Visão Noturna, 6 Tônicos e 6 Poções de Brilho, em 3 dias.'),
    goal: { kind: 'entregar', items: [{ recipeId: 'visao-noturna', qty: 6 }, { recipeId: 'tonico-energia', qty: 6 }, { recipeId: 'pocao-brilho', qty: 6 }] },
    days: 3, reward: { coins: 3500, crystals: 12 }, trophy: tr('Lanterna de Prata'),
  },
  {
    id: 'baile', title: tr('O baile da nobreza'), icon: '💃',
    intro: [
      tr('“Os exploradores voltaram cheios de cristais e de elogios.”'),
      tr('“Terceira prova: a nobreza inteira está na cidade para o baile. Eles são exigentes e não gostam de esperar.”'),
    ],
    task: tr('Atenda 6 nobres seguidos sem deixar nenhum ir embora. Sem prazo: a nobreza vem mais vezes enquanto durar o baile.'),
    goal: { kind: 'nobres', qty: 6 }, days: null,
    reward: { coins: 4500, crystals: 15 }, trophy: tr('Leque Dourado'),
  },
  {
    id: 'estrelas', title: tr('A noite das estrelas'), icon: '🌠',
    intro: [
      tr('“Nunca um baile terminou tão feliz.”'),
      tr('“Quarta prova: os astrônomos da Coroa vão observar a chuva de estrelas. Só aceitam o Elixir Estelar de quem domina a receita.”'),
    ],
    task: tr('Entregue 10 Elixires Estelares em 3 dias. Os astrônomos só aceitam com 3 estrelas de maestria ou mais.'),
    goal: { kind: 'entregar', items: [{ recipeId: 'elixir-estelar', qty: 10 }] }, days: 3,
    stars: { recipeId: 'elixir-estelar', n: 3 },
    reward: { coins: 6000, crystals: 20 }, trophy: tr('Medalha Estelar'),
  },
  {
    id: 'coroa', title: tr('A grande final'), icon: '👑',
    intro: [
      tr('O próprio arauto parece emocionado.'),
      tr('“Chegou a final. A {0} quer provar a Poção da Coroa, uma receita que só os grandes mestres conhecem.”', QUEEN),
      tr('“Ela foi anotada no seu livro agora mesmo: uma pena de fênix, areia estelar e uma pluma de grifo.”'),
    ],
    task: tr('Prepare e entregue 3 Poções da Coroa em 4 dias.'),
    goal: { kind: 'entregar', items: [{ recipeId: ROYAL_RECIPE, qty: 3 }] }, days: 4,
    reward: { coins: 15000, crystals: 50 }, trophy: tr('Coroa do Reino'),
  },
];

/** Título ganho ao vencer o concurso. */
export const ROYAL_TITLE = tr('Grão-Alquimista do Reino');

/** Peso extra da nobreza na rua enquanto o capítulo do baile está aberto. */
export const BALL_NOBLE_BOOST = 1.6;
