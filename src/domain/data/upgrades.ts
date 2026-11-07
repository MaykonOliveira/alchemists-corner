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
