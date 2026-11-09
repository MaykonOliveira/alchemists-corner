// Reconstruir a vila (fase 4, pacote W): obras grandes para as moedas do fim de jogo.
// Cada obra tem 3 etapas (fundação, paredes, inauguração). Auditoria P2.2: cada etapa é uma encomenda da vila,
// que pede poções (as raras no fim) e menos moedas. O sumidouro do fim de jogo é produção, não só dinheiro.

export type VillageBonus = 'paciencia' | 'movimento' | 'fornecedor' | 'experiencia' | 'pedidos' | 'preco';

export interface VillageNeed { recipeId: string; qty: number }

export interface VillageProject {
  id: string;
  name: string;
  icon: string;
  /** Para que serve, em uma frase. */
  text: string;
  /** Custo em moedas de cada etapa (3 etapas). */
  stages: [number, number, number];
  /** Encomenda de poções de cada etapa (3 etapas). */
  needs: [VillageNeed, VillageNeed, VillageNeed];
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
    stages: [1800, 2400, 3000], needs: [{ recipeId: 'cura-simples', qty: 8 }, { recipeId: 'balsamo-calmante', qty: 8 }, { recipeId: 'cura-simples', qty: 12 }],
    bonus: 'paciencia', value: 0.1, bonusText: 'Clientes esperam 10% mais.' },
  { id: 'ponte', name: 'Ponte de pedra', icon: '🌉', text: 'A ponte velha do rio é trocada por uma de pedra: chegam viajantes de longe.',
    stages: [2700, 3600, 4500], needs: [{ recipeId: 'tonico-energia', qty: 8 }, { recipeId: 'pena-leve', qty: 6 }, { recipeId: 'tonico-energia', qty: 12 }],
    bonus: 'movimento', value: 0.06, bonusText: 'Chegam 6% mais clientes.' },
  { id: 'mercado', name: 'Mercado coberto', icon: '🏪', text: 'Barracas cobertas para os fornecedores da região.',
    stages: [3600, 4800, 6000], needs: [{ recipeId: 'visao-noturna', qty: 8 }, { recipeId: 'pocao-sorte', qty: 6 }, { recipeId: 'pocao-sorte', qty: 10 }],
    bonus: 'fornecedor', value: 0.08, bonusText: 'Ingredientes 8% mais baratos.' },
  { id: 'biblioteca', name: 'Biblioteca', icon: '📚', text: 'Estantes até o teto e uma mesa de estudos para os aprendizes da vila.',
    stages: [4500, 6000, 7500], needs: [{ recipeId: 'elixir-concentracao', qty: 8 }, { recipeId: 'elixir-concentracao', qty: 10 }, { recipeId: 'elixir-estelar', qty: 8 }],
    bonus: 'experiencia', value: 0.1, bonusText: '10% a mais de XP em tudo.' },
  { id: 'relogio', name: 'Torre do relógio', icon: '🕰️', text: 'Um relógio que toca nas horas cheias: ninguém mais perde a hora do pedido.',
    stages: [5400, 7200, 9000], needs: [{ recipeId: 'pocao-brilho', qty: 8 }, { recipeId: 'elixir-estelar', qty: 6 }, { recipeId: 'elixir-estelar', qty: 10 }],
    bonus: 'pedidos', value: 0.2, bonusText: 'Pedidos especiais pagam 20% a mais.' },
  { id: 'jardim', name: 'Jardim das lanternas', icon: '🏮', text: 'Um jardim com lanternas mágicas, o lugar mais bonito do reino.',
    stages: [6600, 9000, 11400], needs: [{ recipeId: 'pocao-brilho', qty: 10 }, { recipeId: 'pocao-sorte', qty: 10 }, { recipeId: 'pocao-brilho', qty: 15 }],
    bonus: 'preco', value: 0.04, bonusText: 'Clientes aceitam pagar 4% a mais.' },
];

export const VILLAGE_BY_ID: Record<string, VillageProject> = Object.fromEntries(VILLAGE.map((p) => [p.id, p]));
