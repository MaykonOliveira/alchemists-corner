// Reconstruir a vila (fase 4, pacote W): obras grandes para as moedas do fim de jogo.
// Cada obra tem 3 etapas (fundação, paredes, inauguração). A última etapa de algumas pede poções doadas.

export type VillageBonus = 'paciencia' | 'movimento' | 'fornecedor' | 'experiencia' | 'pedidos' | 'preco';

export interface VillageProject {
  id: string;
  name: string;
  icon: string;
  /** Para que serve, em uma frase. */
  text: string;
  /** Custo em moedas de cada etapa (3 etapas). */
  stages: [number, number, number];
  /** Poções doadas na última etapa (opcional). */
  donation?: { recipeId: string; qty: number };
  bonus: VillageBonus;
  /** Valor do bônus (fração). */
  value: number;
  bonusText: string;
}

/** Nível a partir do qual a prefeitura aceita ajuda para as obras. */
export const VILLAGE_LEVEL = 12;

export const STAGE_NAMES = ['Fundação', 'Paredes', 'Inauguração'] as const;

export const VILLAGE: VillageProject[] = [
  { id: 'fonte', name: 'Fonte da praça', icon: '⛲', text: 'A praça seca ganha água limpa e um banco à sombra.',
    stages: [3000, 4000, 5000], donation: { recipeId: 'cura-simples', qty: 10 },
    bonus: 'paciencia', value: 0.1, bonusText: 'Clientes esperam 10% mais.' },
  { id: 'ponte', name: 'Ponte de pedra', icon: '🌉', text: 'A ponte velha do rio é trocada por uma de pedra: chegam viajantes de longe.',
    stages: [4500, 6000, 7500], donation: { recipeId: 'tonico-energia', qty: 10 },
    bonus: 'movimento', value: 0.06, bonusText: 'Chegam 6% mais clientes.' },
  { id: 'mercado', name: 'Mercado coberto', icon: '🏪', text: 'Barracas cobertas para os fornecedores da região.',
    stages: [6000, 8000, 10000],
    bonus: 'fornecedor', value: 0.08, bonusText: 'Ingredientes 8% mais baratos.' },
  { id: 'biblioteca', name: 'Biblioteca', icon: '📚', text: 'Estantes até o teto e uma mesa de estudos para os aprendizes da vila.',
    stages: [7500, 10000, 12500], donation: { recipeId: 'elixir-concentracao', qty: 12 },
    bonus: 'experiencia', value: 0.1, bonusText: '10% a mais de XP em tudo.' },
  { id: 'relogio', name: 'Torre do relógio', icon: '🕰️', text: 'Um relógio que toca nas horas cheias: ninguém mais perde a hora do pedido.',
    stages: [9000, 12000, 15000],
    bonus: 'pedidos', value: 0.2, bonusText: 'Pedidos especiais pagam 20% a mais.' },
  { id: 'jardim', name: 'Jardim das lanternas', icon: '🏮', text: 'Um jardim com lanternas mágicas, o lugar mais bonito do reino.',
    stages: [11000, 15000, 19000], donation: { recipeId: 'pocao-brilho', qty: 15 },
    bonus: 'preco', value: 0.04, bonusText: 'Clientes aceitam pagar 4% a mais.' },
];

export const VILLAGE_BY_ID: Record<string, VillageProject> = Object.fromEntries(VILLAGE.map((p) => [p.id, p]));
