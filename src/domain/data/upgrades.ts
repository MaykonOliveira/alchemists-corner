import type { ShopUpgrade } from '../models/types';

export const UPGRADES: ShopUpgrade[] = [
  { id: 'caldeirao-reforcado', name: 'Caldeirão reforçado', cost: 180, category: 'funcional', requiredLevel: 2,
    effect: 'Reduz em 25% o tempo de preparo.' },
  { id: 'prateleira-extra', name: 'Prateleira adicional', cost: 140, category: 'funcional', requiredLevel: 2,
    effect: 'Aumenta a capacidade de poções expostas.' },
  { id: 'iluminacao-aconchegante', name: 'Iluminação aconchegante', cost: 120, category: 'visual', requiredLevel: 3,
    effect: 'Deixa a loja mais acolhedora e ajuda na reputação.' },
];
