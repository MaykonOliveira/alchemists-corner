import { tr } from '../../i18n';
// Conteúdo do pacote E: a rival da rua, as expedições do corvo e os achados raros.

export const RIVAL = {
  name: tr('Madame Vesper'),
  shop: tr('Botica Vesper'),
  /** A disputa começa neste nível e a partir deste dia. */
  minLevel: 4,
  minDay: 8,
};

/** Falas da rival conforme o placar. */
export const RIVAL_LINES = {
  ahead: [tr('Minha vitrine está lotada hoje, querida.'), tr('Quem sabe na semana que vem…'), tr('Meus frascos brilham mais que os seus.')],
  behind: [tr('Hmpf. Sorte de principiante.'), tr('Aproveite enquanto dura.'), tr('Estou só aquecendo o caldeirão.')],
  win: tr('Você venceu desta vez. Tome, um mimo da minha despensa. Mas semana que vem é minha!'),
  loss: tr('A rua inteira veio à minha botica! Quem sabe na próxima, vizinha.'),
};

export interface ExpeditionInfo {
  id: string;
  name: string;
  icon: string;
  days: number;
  cost: number;
  minLevel: number;
  text: string;
  /** Ingredientes que podem voltar: [id, mínimo, máximo, nível mínimo]. */
  loot: [string, number, number, number][];
  /** Achados raros possíveis neste destino. */
  finds: string[];
}

export const EXPEDITIONS: ExpeditionInfo[] = [
  { id: 'floresta', name: tr('Floresta Sussurrante'), icon: '🌲', days: 1, cost: 40, minLevel: 4,
    text: tr('Um dia de voo. Ervas frescas e, às vezes, algo da estação.'),
    loot: [['folha-lunar', 4, 8, 1], ['hortela-brava', 4, 8, 1], ['raiz-mandragora', 1, 3, 6]],
    finds: ['bolota-dourada', 'ninho-fada'] },
  { id: 'caverna', name: tr('Cavernas de Cristal'), icon: '🕳️', days: 2, cost: 110, minLevel: 6,
    text: tr('Dois dias no escuro. Cogumelos, escamas e cristais.'),
    loot: [['cogumelo-lanterna', 3, 6, 1], ['escama-salamandra', 2, 4, 1], ['cristal-geada', 2, 4, 8], ['essencia-azul', 2, 5, 1]],
    finds: ['geodo-cantante', 'mapa-anao'] },
  { id: 'montanha', name: tr('Pico dos Grifos'), icon: '🏔️', days: 3, cost: 220, minLevel: 9,
    text: tr('Três dias até o topo. Plumas, areia estelar e, com sorte, uma pena de fênix.'),
    loot: [['pluma-grifo', 2, 4, 1], ['areia-estelar', 2, 4, 1], ['cristal-geada', 2, 4, 1], ['pena-fenix', 0, 2, 1]],
    finds: ['casca-grifo', 'estrela-caida'] },
];

export const EXPEDITIONS_BY_ID: Record<string, ExpeditionInfo> = Object.fromEntries(EXPEDITIONS.map((e) => [e.id, e]));

/** Chance de um ingrediente da estação voltar da floresta. */
export const FOREST_SEASONAL = { min: 2, max: 3 };
/** Chance de a expedição trazer um achado (enquanto faltar algum daquele destino). */
export const FIND_CHANCE = 0.35;

export interface FindInfo {
  id: string;
  name: string;
  icon: string;
  text: string;
}

export const FINDS: FindInfo[] = [
  { id: 'bolota-dourada', name: tr('Bolota dourada'), icon: '🌰', text: tr('Caiu de um carvalho que, dizem, tem mil anos.') },
  { id: 'ninho-fada', name: tr('Ninho de fada'), icon: '🪺', text: tr('Pequenino, tecido com fios de teia e luz.') },
  { id: 'geodo-cantante', name: tr('Geodo que canta'), icon: '💎', text: tr('Encoste o ouvido: ele cantarola uma melodia antiga.') },
  { id: 'mapa-anao', name: tr('Mapa dos anões'), icon: '🗺️', text: tr('Mostra túneis que ninguém mais lembra onde ficam.') },
  { id: 'casca-grifo', name: tr('Casca de ovo de grifo'), icon: '🥚', text: tr('Dourada por dentro. O filhote já voa por aí.') },
  { id: 'estrela-caida', name: tr('Estrela caída'), icon: '🌠', text: tr('Ainda morna. Ilumina a loja inteira à noite.') },
  // Só o Visitante Misterioso traz estes
  { id: 'ampulheta', name: tr('Ampulheta do viajante'), icon: '⏳', text: tr('A areia sobe em vez de descer. Presente do Visitante Misterioso.') },
  { id: 'chave-lua', name: tr('Chave da lua'), icon: '🗝️', text: tr('Não abre porta nenhuma que se conheça. Ainda.') },
  { id: 'pena-sombra', name: tr('Pena de sombra'), icon: '🪶', text: tr('Some quando ninguém está olhando, e volta ao mesmo lugar.') },
];

export const FINDS_BY_ID: Record<string, FindInfo> = Object.fromEntries(FINDS.map((f) => [f.id, f]));
export const VISITOR_FINDS = ['ampulheta', 'chave-lua', 'pena-sombra'];
