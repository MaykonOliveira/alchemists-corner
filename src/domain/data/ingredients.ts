import type { Ingredient } from '../models/types';

import { tr } from '../../i18n';
export const INGREDIENTS: Ingredient[] = [
  { id: 'folha-lunar', supplierLevel: 1, dailyStock: null, name: tr('Folha lunar'), family: 'erva', rarity: 'comum', price: 5, color: '#9cc76a',
    description: tr('Folha prateada colhida sob a lua cheia. Base de quase toda cura.') },
  { id: 'hortela-brava', supplierLevel: 1, dailyStock: null, name: tr('Hortelã-brava'), family: 'erva', rarity: 'comum', price: 4, color: '#4f8a3a',
    description: tr('Aroma forte que desperta até o mais cansado dos viajantes.') },
  { id: 'cristal-ambar', supplierLevel: 1, dailyStock: null, name: tr('Cristal âmbar'), family: 'mineral', rarity: 'incomum', price: 9, color: '#e0a040',
    description: tr('Guarda o calor do sol. Dá brilho e firmeza às misturas.') },
  { id: 'po-de-pedra', supplierLevel: 1, dailyStock: null, name: tr('Pó de pedra'), family: 'mineral', rarity: 'comum', price: 3, color: '#a39a90',
    description: tr('Moído de pedras de rio. Estabiliza qualquer preparo.') },
  { id: 'orvalho-feerico', supplierLevel: 1, dailyStock: null, name: tr('Orvalho feérico'), family: 'magico', rarity: 'incomum', price: 10, color: '#7fd6d0',
    description: tr('Gotas que nunca evaporam. Clareiam a mente.') },
  { id: 'essencia-azul', supplierLevel: 2, dailyStock: null, name: tr('Essência azul'), family: 'magico', rarity: 'incomum', price: 11, color: '#4a6fd0',
    description: tr('Destilado de flores noturnas. Acalma e aguça os sentidos.') },
  { id: 'escama-salamandra', supplierLevel: 3, dailyStock: 4, name: tr('Escama de salamandra'), family: 'raro', rarity: 'raro', price: 20, color: '#d0583a',
    description: tr('Ainda morna ao toque. Rara e muito procurada.') },
  { id: 'cogumelo-lanterna', supplierLevel: 2, dailyStock: 5, name: tr('Cogumelo-lanterna'), family: 'raro', rarity: 'raro', price: 17, color: '#c9e070',
    description: tr('Brilha suavemente no escuro das cavernas.') },
  // Late game (níveis 6 a 14)
  { id: 'raiz-mandragora', supplierLevel: 6, dailyStock: null, name: tr('Raiz de mandrágora'), family: 'erva', rarity: 'incomum', price: 12, color: '#b07a4a',
    description: tr('Tem forma de gente e resmunga baixinho. Dizem que atrai a sorte.') },
  { id: 'cristal-geada', supplierLevel: 8, dailyStock: 8, name: tr('Cristal de geada'), family: 'mineral', rarity: 'incomum', price: 16, color: '#8ad8f0',
    description: tr('Colhido no alto das montanhas. Nunca derrete, nem perto do fogo.') },
  { id: 'pluma-grifo', supplierLevel: 10, dailyStock: 5, name: tr('Pluma de grifo'), family: 'raro', rarity: 'raro', price: 26, color: '#e8dcc0',
    description: tr('Mais leve que o ar. Flutua devagar quando você a solta.') },
  { id: 'areia-estelar', supplierLevel: 12, dailyStock: 6, name: tr('Areia estelar'), family: 'magico', rarity: 'raro', price: 22, color: '#7a6ad8',
    description: tr('Poeira de estrela cadente. Cintila mesmo dentro da bolsa fechada.') },
  { id: 'pena-fenix', supplierLevel: 14, dailyStock: 3, name: tr('Pena de fênix'), family: 'raro', rarity: 'raro', price: 45, color: '#f06a2a',
    description: tr('Quente como brasa e impossível de queimar. A mais rara do fornecedor.') },
  // Ingredientes da estação (pacote E): o fornecedor só vende na estação de cada um, a partir do nível 5.
  { id: 'petala-aurora', supplierLevel: 5, dailyStock: 6, season: 'primavera', name: tr('Pétala-da-aurora'), family: 'erva', rarity: 'raro', price: 18, color: '#f4a0c0',
    description: tr('Só desabrocha nas manhãs de primavera. Cheira a recomeço.') },
  { id: 'fruta-sol', supplierLevel: 5, dailyStock: 6, season: 'verao', name: tr('Fruta-do-sol'), family: 'erva', rarity: 'raro', price: 18, color: '#ffa030',
    description: tr('Amadurece no auge do verão e fica morna por dias.') },
  { id: 'folha-rubra', supplierLevel: 5, dailyStock: 6, season: 'outono', name: tr('Folha rubra'), family: 'erva', rarity: 'raro', price: 18, color: '#c84a28',
    description: tr('Cai das árvores velhas da academia. Dizem que guarda lembranças.') },
  { id: 'flor-neve', supplierLevel: 5, dailyStock: 6, season: 'inverno', name: tr('Flor-de-neve'), family: 'magico', rarity: 'raro', price: 18, color: '#cfe8ff',
    description: tr('Cresce sob a neve e brilha como a aurora nas noites longas.') },
];

export const INGREDIENTS_BY_ID: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENTS.map((i) => [i.id, i]),
);

export const FAMILY_LABEL: Record<Ingredient['family'], string> = {
  erva: tr('Ervas'),
  mineral: tr('Minerais'),
  magico: tr('Elementos mágicos'),
  raro: tr('Componentes raros'),
};
