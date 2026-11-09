import type { GameSave } from '../models/types';
import { countIngredients, countPotions, has, ingredientCapacity, potionCapacity } from '../rules/economy';
import { APPRENTICE } from '../rules/helpers';
import { RAVEN } from '../rules/helpers';
import { rivalActive } from '../rules/street';

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
  { id: 'prateleira-vazia', icon: '🧪', title: 'Prateleira vazia', panel: 'production',
    text: 'Sem poções prontas os clientes vão embora. Ponha algo no caldeirão antes de abrir a loja.',
    when: (s) => s.day >= 2 && s.phase === 'preparacao' && potions(s) === 0 && !s.brew },
  { id: 'metas', icon: '🎯', title: 'Metas do dia', panel: 'goals',
    text: 'Todo dia chegam três metas novas. Cada uma paga moedas e XP, e 10 metas na semana abrem o baú.',
    when: (s) => s.day >= 2 && s.phase === 'preparacao' },
  { id: 'armario-cheio', icon: '🗄️', title: 'Armário cheio', panel: 'ingredients',
    text: 'Não cabe mais nada no armário, então o corvo não consegue comprar. Use ingredientes ou compre a melhoria de espaço.',
    when: (s) => has(s, RAVEN) && countIngredients(s) >= ingredientCapacity(s) },
  { id: 'prateleira-cheia', icon: '🧺', title: 'Prateleira cheia', panel: 'shelves',
    text: 'As prateleiras lotaram: nem você nem o aprendiz conseguem preparar mais até vender um pouco.',
    when: (s) => s.knownRecipes.length > 0 && countPotions(s) >= potionCapacity(s) && (has(s, APPRENTICE) || s.day >= 3) },
  { id: 'paciencia', icon: '⏳', title: 'Cliente impaciente', panel: undefined,
    text: 'A barrinha sobre a cabeça é a paciência. Quando fica vermelha, atenda logo ou ofereça outra poção.',
    when: (s) => s.phase === 'expediente' && s.customers.some((c) => c.waitedMs > c.patienceMs * 0.6) },
  { id: 'pedido', icon: '📜', title: 'Pedido especial', panel: 'orders',
    text: 'Alguém deixou uma encomenda no quadro. Ela paga bem mais que a venda no balcão, mas tem prazo.',
    when: (s) => !!s.order },
  { id: 'corvo', icon: '🐦‍⬛', title: 'Um ajudante de penas', panel: 'upgrades',
    text: 'No nível 3 dá para contratar o corvo entregador: ele repõe os ingredientes sozinho toda manhã.',
    when: (s) => s.level >= 3 && !has(s, RAVEN) },
  { id: 'velocidade', icon: '⏩', title: 'Dia arrastado?', panel: undefined,
    text: 'O botão 1× no topo acelera o expediente para 2×. A barra de espaço pausa.',
    when: (s) => s.day >= 3 && s.phase === 'expediente' },
  { id: 'gato', icon: '🐈', title: 'O gato da loja', panel: 'album',
    text: 'Toque no gato que dorme no balcão. Uma vez por dia ele pode dar sorte.',
    when: (s) => s.day >= 3 && s.petCount === 0 },
  { id: 'contrato', icon: '🏰', title: 'Contrato na mesa', panel: 'orders',
    text: 'Contratos duram vários dias e pagam muito. Leia o que pedem antes de aceitar.',
    when: (s) => !!s.contract && !s.contract.accepted },
  { id: 'rival', icon: '🎩', title: 'Vizinha nova', panel: 'street',
    text: 'A Madame Vesper abriu a loja do outro lado da rua. Venda mais que ela na semana para levar o prêmio.',
    when: (s) => rivalActive(s) },
  { id: 'estacao', icon: '🌸', title: 'Poção da estação', panel: 'street',
    text: 'A partir de agora cada estação traz um ingrediente raro e uma poção que só se vende nela. Veja na aba Rua.',
    when: (s) => s.level >= 5 },
  { id: 'bau', icon: '🎁', title: 'Baú da semana', panel: 'goals',
    text: 'Você cumpriu metas suficientes. Abra o baú no Diário da loja antes que a semana vire.',
    when: (s) => !!s.goals && !s.goals.chestClaimed && s.goals.weekDone >= 10 },
];

/** A primeira dica ainda não vista que vale agora (no máximo uma por dia). */
export const nextTip = (s: GameSave): Tip | null => s.tipDay === s.day ? null : TIPS.find((t) => !s.tipsSeen.includes(t.id) && t.when(s)) ?? null;
