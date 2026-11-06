import type { ShopUpgrade } from '../models/types';

export const UPGRADES: ShopUpgrade[] = [
  { id: 'caldeirao-reforcado', name: 'Caldeirão reforçado', cost: 160, category: 'funcional', requiredLevel: 2,
    effect: 'Cintas de cobre que aguentam fogo alto: preparo 30% mais rápido.' },
  { id: 'prateleira-extra', name: 'Expositor de poções', cost: 140, category: 'funcional', requiredLevel: 2,
    effect: '+12 lugares para poções e clientes um pouco mais dispostos a pagar.' },
  { id: 'armario-organizado', name: 'Armário organizado', cost: 110, category: 'funcional', requiredLevel: 3,
    effect: '+30 de capacidade para ingredientes.' },
  { id: 'letreiro-novo', name: 'Letreiro novo', cost: 200, category: 'funcional', requiredLevel: 3,
    effect: 'Uma placa pintada na fachada: chegam mais clientes.' },
  { id: 'iluminacao-aconchegante', name: 'Iluminação aconchegante', cost: 180, category: 'visual', requiredLevel: 4,
    effect: 'Cordões de luz mágica no teto. A loja fica linda e a reputação cresce mais rápido.' },
];

export const UPGRADES_BY_ID: Record<string, ShopUpgrade> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
