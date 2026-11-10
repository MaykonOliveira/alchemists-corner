import type { GameSave } from '../models/types';
import { countIngredients, countPotions, has, ingredientCapacity, potionCapacity } from '../rules/economy';
import { APPRENTICE } from '../rules/helpers';
import { RAVEN } from '../rules/helpers';
import { rivalActive } from '../rules/street';

import { tr } from '../../i18n';
/** Dicas de contexto (pacote G): cada uma aparece uma vez, no momento em que faz sentido. */
export interface Tip {
  id: string;
  icon: string;
  title: string;
  text: string;
  /** Painel que o botão da dica abre. */
  panel?: 'ingredients' | 'production' | 'shelves' | 'orders' | 'upgrades' | 'street' | 'grimoire' | 'goals' | 'album';
  when: (s: GameSave) => boolean;
}

const potions = (s: GameSave) => s.potions.reduce((n, p) => n + p.quantity, 0);

export const TIPS: Tip[] = [
  { id: 'prateleira-vazia', icon: '🧪', title: tr('Prateleira vazia'), panel: 'production',
    text: tr('Sem poções prontas os clientes vão embora. Ponha algo no caldeirão antes de abrir a loja.'),
    when: (s) => s.day >= 2 && s.phase === 'preparacao' && potions(s) === 0 && !s.brew },
  { id: 'metas', icon: '🎯', title: tr('Metas do dia'), panel: 'goals',
    text: tr('Todo dia chegam três metas novas. Cada uma paga moedas e XP, e 10 metas na semana abrem o baú.'),
    when: (s) => s.day >= 2 && s.phase === 'preparacao' },
  { id: 'armario-cheio', icon: '🗄️', title: tr('Armário cheio'), panel: 'ingredients',
    text: tr('Não cabe mais nada no armário, então o corvo não consegue comprar. Use ingredientes ou compre a melhoria de espaço.'),
    when: (s) => has(s, RAVEN) && countIngredients(s) >= ingredientCapacity(s) },
  { id: 'prateleira-cheia', icon: '🧺', title: tr('Prateleira cheia'), panel: 'shelves',
    text: tr('As prateleiras lotaram: nem você nem o aprendiz conseguem preparar mais até vender um pouco.'),
    when: (s) => s.knownRecipes.length > 0 && countPotions(s) >= potionCapacity(s) && (has(s, APPRENTICE) || s.day >= 3) },
  { id: 'paciencia', icon: '⏳', title: tr('Cliente impaciente'), panel: undefined,
    text: tr('A barrinha sobre a cabeça é a paciência. Quando fica vermelha, atenda logo ou ofereça outra poção.'),
    when: (s) => s.phase === 'expediente' && s.customers.some((c) => c.waitedMs > c.patienceMs * 0.6) },
  { id: 'pedido', icon: '📜', title: tr('Pedido especial'), panel: 'orders',
    text: tr('Alguém deixou uma encomenda no quadro. Ela paga bem mais que a venda no balcão, mas tem prazo.'),
    when: (s) => !!s.order },
  { id: 'corvo', icon: '🐦‍⬛', title: tr('Um ajudante de penas'), panel: 'upgrades',
    text: tr('No nível 3 dá para contratar o corvo entregador: ele repõe os ingredientes sozinho toda manhã.'),
    when: (s) => s.level >= 3 && !has(s, RAVEN) },
  { id: 'velocidade', icon: '⏩', title: tr('Dia arrastado?'), panel: undefined,
    text: tr('O botão 1× no topo acelera o expediente para 2×. A barra de espaço pausa.'),
    when: (s) => s.day >= 3 && s.phase === 'expediente' },
  { id: 'gato', icon: '🐈', title: tr('O gato da loja'), panel: 'album',
    text: tr('Toque no gato que dorme no balcão. Uma vez por dia ele pode dar sorte.'),
    when: (s) => s.day >= 3 && s.petCount === 0 },
  { id: 'contrato', icon: '🏰', title: tr('Contrato na mesa'), panel: 'orders',
    text: tr('Contratos duram vários dias e pagam muito. Leia o que pedem antes de aceitar.'),
    when: (s) => !!s.contract && !s.contract.accepted },
  { id: 'rival', icon: '🎩', title: tr('Vizinha nova'), panel: 'street',
    text: tr('A Madame Vesper abriu a loja do outro lado da rua. Venda mais que ela na semana para levar o prêmio.'),
    when: (s) => rivalActive(s) },
  { id: 'estacao', icon: '🌸', title: tr('Poção da estação'), panel: 'street',
    text: tr('A partir de agora cada estação traz um ingrediente raro e uma poção que só se vende nela. Veja na aba Rua.'),
    when: (s) => s.level >= 5 },
  { id: 'bau', icon: '🎁', title: tr('Baú da semana'), panel: 'goals',
    text: tr('Você cumpriu metas suficientes. Abra o baú no Diário da loja antes que a semana vire.'),
    when: (s) => !!s.goals && !s.goals.chestClaimed && s.goals.weekDone >= 10 },
];

/** A primeira dica ainda não vista que vale agora (no máximo uma por dia). */
export const nextTip = (s: GameSave): Tip | null => s.tipDay === s.day ? null : TIPS.find((t) => !s.tipsSeen.includes(t.id) && t.when(s)) ?? null;
