import { tr } from '../../i18n';
// Filiais pelo reino (pacote E3): cinco cidades, cada uma com um gosto próprio.
// As filiais rendem um lucro por dia e pedem remessas das poções favoritas da cidade.

export interface City {
  id: string;
  name: string;
  /** Freguês típico, uma frase para o cartão. */
  text: string;
  /** Nível da loja para abrir a filial. */
  minLevel: number;
  /** Custo da barraca. A loja custa 80% disso e o empório 150%. */
  cost: number;
  /** Poções que a cidade pede nas remessas (pagando mais que na loja). */
  favorites: string[];
  /** Posição do marcador no mapa (pixels do mapa 192×108). */
  x: number;
  y: number;
}

export const CITIES: City[] = [
  { id: 'porto-sereias', name: tr('Porto das Sereias'), text: tr('Marinheiros cansados e pescadores com as mãos cortadas pela rede.'),
    minLevel: 12, cost: 25000, favorites: ['cura-simples', 'balsamo-calmante'], x: 28, y: 76 },
  { id: 'vila-neve', name: tr('Vila da Neve'), text: tr('Lenhadores no frio da montanha, sempre atrás de força e de gelo para as conservas.'),
    minLevel: 12, cost: 40000, favorites: ['elixir-geada', 'tonico-energia'], x: 44, y: 22 },
  { id: 'mina-anoes', name: tr('Mina dos Anões'), text: tr('Anões que trabalham no escuro e adoram tudo o que brilha.'),
    minLevel: 13, cost: 60000, favorites: ['visao-noturna', 'pocao-brilho'], x: 150, y: 24 },
  { id: 'floresta-fadas', name: tr('Floresta das Fadas'), text: tr('Fadas que estudam de noite e querem voar mais alto.'),
    minLevel: 14, cost: 90000, favorites: ['pena-leve', 'elixir-concentracao'], x: 162, y: 80 },
  { id: 'capital', name: tr('A Capital'), text: tr('Nobres, sábios e a corte inteira, que pagam bem pelo que é raro.'),
    minLevel: 15, cost: 150000, favorites: ['elixir-estelar', 'elixir-fenix', 'pocao-sorte'], x: 104, y: 50 },
];

export const CITIES_BY_ID: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

/** Nome de cada tamanho de filial. */
export const BRANCH_SIZES = [tr('Barraca'), tr('Loja'), tr('Empório')];
/** Custo de cada tamanho, em fração do custo da cidade. */
export const BRANCH_COST = [1, 0.8, 1.5];
/** Lucro diário de cada tamanho, em fração do custo da cidade. */
export const BRANCH_INCOME = [0.02, 0.036, 0.06];
/** Quantas poções de cada favorita a filial leva por dia, por tamanho. */
export const BRANCH_SHIP = [3, 5, 8];
/** As cidades pagam a mais pelas favoritas (frete incluído). */
export const SHIP_PRICE = 1.25;
/** Nível mínimo de um funcionário para supervisionar uma filial. */
export const MANAGER_LEVEL = 5;
