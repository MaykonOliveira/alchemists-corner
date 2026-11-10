import { tr } from '../../i18n';
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
  /** Talento sem fim (pacote X): sem grau máximo, só abre no nível máximo da loja. */
  endless?: boolean;
}

export const TALENTS: Talent[] = [
  { id: 'labia', name: tr('Lábia de mercador'), icon: '🗣️', max: 5, value: 0.04, perRank: tr('Clientes aceitam pagar 4% a mais.') },
  { id: 'maos-ageis', name: tr('Mãos ágeis'), icon: '🥄', max: 3, value: 0.08, perRank: tr('Preparo 8% mais rápido.') },
  { id: 'freguesia', name: tr('Freguesia fiel'), icon: '💞', max: 3, value: 0.12, perRank: tr('Clientes esperam 12% mais.') },
  { id: 'fama', name: tr('Fama na região'), icon: '📣', max: 3, value: 0.08, perRank: tr('Chegam 8% mais clientes.') },
  { id: 'fornecedor-amigo', name: tr('Amigo do fornecedor'), icon: '🤝', max: 3, value: 0.06, perRank: tr('Ingredientes 6% mais baratos.') },
  { id: 'contatos', name: tr('Rede de contatos'), icon: '📜', max: 3, value: 0.15, perRank: tr('Pedidos especiais pagam 15% a mais.') },
  { id: 'caldeirao-grande', name: tr('Caldeirão grande'), icon: '🫕', max: 2, value: 1, perRank: tr('+1 lote por preparo.') },
  // Talentos sem fim (pacote X): os Selos nunca ficam parados.
  { id: 'toque-de-ouro', name: tr('Toque de ouro'), icon: '🪙', max: 999, endless: true, value: 0.01, perRank: tr('Clientes aceitam pagar 1% a mais.') },
  { id: 'renome', name: tr('Renome no reino'), icon: '📯', max: 999, endless: true, value: 0.01, perRank: tr('Chegam 1% mais clientes.') },
  { id: 'sabedoria', name: tr('Sabedoria antiga'), icon: '📚', max: 999, endless: true, value: 0.02, perRank: tr('2% a mais de XP em tudo.') },
];

/** Nível da loja em que os talentos sem fim abrem. */
export const ENDLESS_TALENT_LEVEL = 15;

export const TALENTS_BY_ID: Record<string, Talent> = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

/** Custo em Selos do próximo grau (1, 2, 3…). */
export const talentCost = (currentRank: number) => currentRank + 1;
