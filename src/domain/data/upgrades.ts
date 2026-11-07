import type { ShopUpgrade } from '../models/types';

export const UPGRADES: ShopUpgrade[] = [
  { id: 'caldeirao-reforcado', name: 'Caldeirão reforçado', cost: 700, category: 'funcional', requiredLevel: 3,
    effect: 'Cintas de cobre que aguentam fogo alto: preparo 30% mais rápido.' },
  { id: 'prateleira-extra', name: 'Expositor de poções', cost: 550, category: 'funcional', requiredLevel: 2,
    effect: '+12 lugares para poções e clientes um pouco mais dispostos a pagar.' },
  { id: 'armario-organizado', name: 'Armário organizado', cost: 400, category: 'funcional', requiredLevel: 2,
    effect: '+30 de capacidade para ingredientes.' },
  { id: 'letreiro-novo', name: 'Letreiro novo', cost: 900, category: 'funcional', requiredLevel: 4,
    effect: 'Uma placa pintada na fachada: chegam mais clientes.' },
  { id: 'iluminacao-aconchegante', name: 'Iluminação aconchegante', cost: 1100, category: 'visual', requiredLevel: 5,
    effect: 'Cordões de luz mágica no teto. A loja fica linda e a reputação cresce mais rápido.' },
  // Late game (níveis 7 a 15)
  { id: 'estufa', name: 'Estufa no quintal', cost: 2400, category: 'funcional', requiredLevel: 7,
    effect: 'Toda manhã rende de graça 4 folhas lunares, 4 hortelãs e 2 raízes de mandrágora (se couber no armário).' },
  { id: 'alambique-prata', name: 'Alambique de prata', cost: 3600, category: 'funcional', requiredLevel: 9,
    effect: 'Destila o que sobra no caldeirão: cada lote rende 3 poções em vez de 2.' },
  { id: 'despensa-encantada', name: 'Despensa encantada', cost: 4200, category: 'funcional', requiredLevel: 11,
    effect: 'Runas que dobram o espaço por dentro: +40 de capacidade para ingredientes e +12 lugares para poções.' },
  { id: 'vitral-arcano', name: 'Vitral arcano', cost: 5500, category: 'visual', requiredLevel: 13,
    effect: 'Uma janela de vidro colorido que brilha à noite. Clientes pagam 5% a mais e a nobreza aparece com mais frequência.' },
  { id: 'sino-encantado', name: 'Sino encantado', cost: 7000, category: 'funcional', requiredLevel: 15,
    effect: 'Um sino na porta que acalma quem espera: clientes têm 30% mais paciência e chegam com mais frequência.' },
  // Ajudantes: automatizam uma parte do trabalho e recebem salário diário (somado à manutenção).
  { id: 'corvo-entregador', name: 'Corvo entregador', cost: 600, category: 'ajudante', requiredLevel: 3, upkeep: 8,
    effect: 'Confere o armário a cada hora e busca no fornecedor o que está acabando (taxa de 3 moedas por viagem).' },
  { id: 'aprendiz', name: 'Aprendiz de alquimia', cost: 1000, category: 'ajudante', requiredLevel: 4, upkeep: 12,
    effect: 'Quando o caldeirão fica livre, prepara a poção que está mais em falta. Dá prioridade ao pedido especial.' },
  { id: 'golem-balconista', name: 'Golem balconista', cost: 1400, category: 'ajudante', requiredLevel: 5, upkeep: 15,
    effect: 'Atende quem espera há alguns segundos e aceita contrapropostas. Sem a poção certa, dispensa com educação.' },
];

export const HELPER_IDS = UPGRADES.filter((u) => u.category === 'ajudante').map((u) => u.id);

export const UPGRADES_BY_ID: Record<string, ShopUpgrade> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
