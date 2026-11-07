import type { Ingredient } from '../models/types';

export const INGREDIENTS: Ingredient[] = [
  { id: 'folha-lunar', supplierLevel: 1, dailyStock: null, name: 'Folha lunar', family: 'erva', rarity: 'comum', price: 5, color: '#9cc76a',
    description: 'Folha prateada colhida sob a lua cheia. Base de quase toda cura.' },
  { id: 'hortela-brava', supplierLevel: 1, dailyStock: null, name: 'Hortelã-brava', family: 'erva', rarity: 'comum', price: 4, color: '#4f8a3a',
    description: 'Aroma forte que desperta até o mais cansado dos viajantes.' },
  { id: 'cristal-ambar', supplierLevel: 1, dailyStock: null, name: 'Cristal âmbar', family: 'mineral', rarity: 'incomum', price: 9, color: '#e0a040',
    description: 'Guarda o calor do sol. Dá brilho e firmeza às misturas.' },
  { id: 'po-de-pedra', supplierLevel: 1, dailyStock: null, name: 'Pó de pedra', family: 'mineral', rarity: 'comum', price: 3, color: '#a39a90',
    description: 'Moído de pedras de rio. Estabiliza qualquer preparo.' },
  { id: 'orvalho-feerico', supplierLevel: 1, dailyStock: null, name: 'Orvalho feérico', family: 'magico', rarity: 'incomum', price: 10, color: '#7fd6d0',
    description: 'Gotas que nunca evaporam. Clareiam a mente.' },
  { id: 'essencia-azul', supplierLevel: 2, dailyStock: null, name: 'Essência azul', family: 'magico', rarity: 'incomum', price: 11, color: '#4a6fd0',
    description: 'Destilado de flores noturnas. Acalma e aguça os sentidos.' },
  { id: 'escama-salamandra', supplierLevel: 3, dailyStock: 4, name: 'Escama de salamandra', family: 'raro', rarity: 'raro', price: 20, color: '#d0583a',
    description: 'Ainda morna ao toque. Rara e muito procurada.' },
  { id: 'cogumelo-lanterna', supplierLevel: 2, dailyStock: 5, name: 'Cogumelo-lanterna', family: 'raro', rarity: 'raro', price: 17, color: '#c9e070',
    description: 'Brilha suavemente no escuro das cavernas.' },
];

export const INGREDIENTS_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

export const FAMILY_LABEL: Record<Ingredient['family'], string> = {
  erva: 'Ervas',
  mineral: 'Minerais',
  magico: 'Elementos mágicos',
  raro: 'Componentes raros',
};
