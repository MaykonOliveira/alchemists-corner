// Catálogo de itens da loja (fase 3, pacotes K e L).
// Tudo aqui se ganha jogando: com Cristais de luar, na Trilha da Temporada, nas festas da estação ou de presente.
// O campo `price` fica vazio de propósito: é onde um preço em dinheiro entraria no futuro, sem mudar as regras.

/** Lugares da loja que aceitam decoração. */
export type DecorSlot = 'tapete' | 'quadro' | 'luminaria' | 'planta' | 'toldo';

export type ItemSource = 'inicial' | 'cristais' | 'trilha' | 'festa' | 'presente' | 'apoio';

export interface CatalogItem {
  id: string;
  name: string;
  slot: DecorSlot;
  /** Preço em Cristais de luar (null = não se compra, vem de trilha, festa ou presente). */
  crystals: number | null;
  /** Encanto: cada ponto dá +1 de reputação no fechamento (até 3 no total). */
  charm: number;
  source: ItemSource;
  /** Cor (toldo) ou textura (os outros) usada pela cena. */
  look: string;
  text: string;
  /** Preço em dinheiro, em centavos. Sempre null por enquanto: nada é vendido. */
  price: null;
}

const item = (i: Omit<CatalogItem, 'price'>): CatalogItem => ({ ...i, price: null });

export const SLOT_LABEL: Record<DecorSlot, string> = {
  tapete: 'Tapete', quadro: 'Quadro', luminaria: 'Luminária', planta: 'Planta', toldo: 'Toldo',
};

/** Cores do toldo que o jogador escolhe ao dar nome à loja (todas grátis). */
export const AWNINGS = [
  { id: 'toldo-vermelho', name: 'Vermelho cereja', color: '#c8443e' },
  { id: 'toldo-azul', name: 'Azul da meia-noite', color: '#3450a8' },
  { id: 'toldo-verde', name: 'Verde musgo', color: '#466e30' },
  { id: 'toldo-violeta', name: 'Violeta arcano', color: '#8a62c0' },
  { id: 'toldo-ambar', name: 'Âmbar do caldeirão', color: '#d0842e' },
] as const;

export const CATALOG: CatalogItem[] = [
  // Toldos (os cinco da abertura e um dourado da trilha)
  ...AWNINGS.map((a) => item({ id: a.id, name: `Toldo ${a.name.toLowerCase()}`, slot: 'toldo', crystals: null, charm: 0, source: 'inicial', look: a.color, text: 'Escolhido na abertura da loja.' })),
  item({ id: 'toldo-dourado', name: 'Toldo dourado', slot: 'toldo', crystals: null, charm: 1, source: 'trilha', look: '#e8a840', text: 'Prêmio final da Trilha da Temporada.' }),

  // Tapetes
  item({ id: 'tapete-classico', name: 'Tapete clássico', slot: 'tapete', crystals: null, charm: 0, source: 'inicial', look: '', text: 'O tapete azul que veio com a loja.' }),
  item({ id: 'tapete-musgo', name: 'Tapete de musgo', slot: 'tapete', crystals: 15, charm: 0, source: 'cristais', look: 'rug-musgo', text: 'Verde e macio como a beira do rio.' }),
  item({ id: 'tapete-vinho', name: 'Tapete vinho e ouro', slot: 'tapete', crystals: 30, charm: 1, source: 'cristais', look: 'rug-vinho', text: 'Os nobres reparam. +1 de encanto.' }),
  item({ id: 'tapete-estrelas', name: 'Tapete das estrelas', slot: 'tapete', crystals: null, charm: 1, source: 'trilha', look: 'rug-estrelas', text: 'Bordado com fio de luar. Prêmio da trilha.' }),

  // Quadros
  item({ id: 'quadro-noite', name: 'Céu estrelado', slot: 'quadro', crystals: null, charm: 0, source: 'inicial', look: '', text: 'O quadrinho que o Bartolomeu deixou.' }),
  item({ id: 'quadro-caldeirao', name: 'Natureza-morta com caldeirão', slot: 'quadro', crystals: 12, charm: 0, source: 'cristais', look: 'frame-caldeirao', text: 'Pintado por um freguês agradecido.' }),
  item({ id: 'quadro-gato', name: 'Retrato do gato', slot: 'quadro', crystals: 18, charm: 0, source: 'cristais', look: 'frame-gato', text: 'Ele posou por três sardinhas.' }),
  item({ id: 'quadro-mapa', name: 'Mapa das terras', slot: 'quadro', crystals: 35, charm: 1, source: 'cristais', look: 'frame-mapa', text: 'Viajantes param para olhar. +1 de encanto.' }),
  item({ id: 'quadro-amizade', name: 'Laço da amizade', slot: 'quadro', crystals: null, charm: 0, source: 'presente', look: 'frame-amizade', text: 'Ganho ao mandar o primeiro presente para um amigo.' }),
  item({ id: 'quadro-neve', name: 'Paisagem de neve', slot: 'quadro', crystals: null, charm: 1, source: 'festa', look: 'frame-neve', text: 'Lembrança da Noite do Gelo (festa do inverno).' }),

  // Luminárias
  item({ id: 'luminaria-nenhuma', name: 'Sem luminária', slot: 'luminaria', crystals: null, charm: 0, source: 'inicial', look: '', text: 'O canto fica como está.' }),
  item({ id: 'luminaria-lua', name: 'Lua crescente', slot: 'luminaria', crystals: 20, charm: 0, source: 'cristais', look: 'lamp-lua', text: 'Brilha mais à noite.' }),
  item({ id: 'luminaria-cristal', name: 'Lustre de cristal', slot: 'luminaria', crystals: 40, charm: 1, source: 'cristais', look: 'lamp-cristal', text: 'Espalha arco-íris pela loja. +1 de encanto.' }),
  item({ id: 'lanterna-abobora', name: 'Lanterna de abóbora', slot: 'luminaria', crystals: null, charm: 1, source: 'festa', look: 'lamp-abobora', text: 'Lembrança da Noite das Abóboras (festa do outono).' }),
  item({ id: 'luminaria-sol', name: 'Sol de vitral', slot: 'luminaria', crystals: null, charm: 1, source: 'festa', look: 'lamp-sol', text: 'Lembrança da Festa do Sol (festa do verão).' }),

  // Plantas
  item({ id: 'planta-nenhuma', name: 'Sem planta extra', slot: 'planta', crystals: null, charm: 0, source: 'inicial', look: '', text: 'Só a samambaia de sempre.' }),
  item({ id: 'planta-cogumelos', name: 'Vaso de cogumelos', slot: 'planta', crystals: 10, charm: 0, source: 'cristais', look: 'plant-cogumelos', text: 'Cogumelos-lanterna que piscam devagar.' }),
  item({ id: 'planta-cacto', name: 'Cacto lunar', slot: 'planta', crystals: 25, charm: 1, source: 'cristais', look: 'plant-cacto', text: 'Floresce uma vez por lua. +1 de encanto.' }),
  item({ id: 'planta-flores', name: 'Cesto de flores', slot: 'planta', crystals: null, charm: 1, source: 'festa', look: 'plant-flores', text: 'Lembrança da Feira das Flores (festa da primavera).' }),
];

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((i) => [i.id, i]));

/** Itens que toda loja já tem desde o começo. */
export const STARTING_ITEMS = CATALOG.filter((i) => i.source === 'inicial' && i.slot !== 'toldo').map((i) => i.id);

export const DEFAULT_DECOR: Record<DecorSlot, string> = {
  tapete: 'tapete-classico', quadro: 'quadro-noite', luminaria: 'luminaria-nenhuma', planta: 'planta-nenhuma', toldo: 'toldo-vermelho',
};
