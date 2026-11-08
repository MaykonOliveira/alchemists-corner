import type { CustomerArchetype } from '../models/types';

export interface ArchetypeInfo {
  id: CustomerArchetype;
  label: string;
  wants: string[];
  description: string;
  /** Quanto aceita pagar em relação ao preço-base. */
  budget: number;
  patienceMs: number;
}

export const ARCHETYPES: Record<CustomerArchetype, ArchetypeInfo> = {
  aventureiro: { id: 'aventureiro', label: 'Aventureira', budget: 1.25, patienceMs: 26000,
    wants: ['cura-simples', 'tonico-energia', 'visao-noturna', 'elixir-geada', 'elixir-fenix', 'refresco-solar', 'nectar-primavera'],
    description: 'Tem pressa e aceita pagar um pouco mais.' },
  estudioso: { id: 'estudioso', label: 'Estudioso', budget: 1.15, patienceMs: 40000,
    wants: ['elixir-concentracao', 'pocao-brilho', 'balsamo-calmante', 'elixir-estelar', 'pocao-sorte', 'cha-colheita'],
    description: 'Paciente. Valoriza qualidade.' },
  morador: { id: 'morador', label: 'Morador', budget: 1.0, patienceMs: 34000,
    wants: ['cura-simples', 'balsamo-calmante', 'tonico-energia', 'pocao-sorte', 'nectar-primavera', 'cha-colheita', 'aurora-boreal'],
    description: 'Compra o básico e presta atenção ao preço.' },
  viajante: { id: 'viajante', label: 'Viajante', budget: 1.12, patienceMs: 30000,
    wants: ['tonico-energia', 'pocao-brilho', 'visao-noturna', 'cura-simples', 'elixir-concentracao', 'pena-leve', 'elixir-geada', 'refresco-solar', 'aurora-boreal'],
    description: 'Pedidos variados, às vezes raros.' },
  nobre: { id: 'nobre', label: 'Nobre', budget: 1.4, patienceMs: 36000,
    wants: ['pocao-brilho', 'pocao-sorte', 'pena-leve', 'elixir-estelar', 'elixir-fenix', 'nectar-primavera', 'aurora-boreal', 'pocao-coroa'],
    description: 'Aparece a partir do nível 8. Só quer o que há de melhor e paga bem por isso.' },
};

/** Nível a partir do qual a nobreza começa a frequentar a loja. */
export const NOBLE_LEVEL = 8;
