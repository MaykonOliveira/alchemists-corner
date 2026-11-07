// Talentos do Grimório do Mestre: bônus permanentes comprados com Selos de Mestre.

export interface Talent {
  id: string;
  name: string;
  icon: string;
  max: number;
  /** Descrição do efeito por grau. */
  perRank: string;
  /** Valor do efeito por grau (fração, lotes etc.). */
  value: number;
}

export const TALENTS: Talent[] = [
  { id: 'labia', name: 'Lábia de mercador', icon: '🗣️', max: 5, value: 0.04, perRank: 'Clientes aceitam pagar 4% a mais.' },
  { id: 'maos-ageis', name: 'Mãos ágeis', icon: '🥄', max: 3, value: 0.08, perRank: 'Preparo 8% mais rápido.' },
  { id: 'freguesia', name: 'Freguesia fiel', icon: '💞', max: 3, value: 0.12, perRank: 'Clientes esperam 12% mais.' },
  { id: 'fama', name: 'Fama na região', icon: '📣', max: 3, value: 0.08, perRank: 'Chegam 8% mais clientes.' },
  { id: 'fornecedor-amigo', name: 'Amigo do fornecedor', icon: '🤝', max: 3, value: 0.06, perRank: 'Ingredientes 6% mais baratos.' },
  { id: 'contatos', name: 'Rede de contatos', icon: '📜', max: 3, value: 0.15, perRank: 'Pedidos especiais pagam 15% a mais.' },
  { id: 'caldeirao-grande', name: 'Caldeirão grande', icon: '🫕', max: 2, value: 1, perRank: '+1 lote por preparo.' },
];

export const TALENTS_BY_ID: Record<string, Talent> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

/** Custo em Selos do próximo grau (1, 2, 3…). */
export const talentCost = (currentRank: number) => currentRank + 1;
