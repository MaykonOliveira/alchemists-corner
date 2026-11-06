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
    wants: ['cura-simples', 'tonico-energia', 'visao-noturna'],
    description: 'Tem pressa e aceita pagar um pouco mais.' },
  estudioso: { id: 'estudioso', label: 'Estudioso', budget: 1.15, patienceMs: 40000,
    wants: ['elixir-concentracao', 'pocao-brilho', 'balsamo-calmante'],
    description: 'Paciente. Valoriza qualidade.' },
  morador: { id: 'morador', label: 'Morador', budget: 1.0, patienceMs: 34000,
    wants: ['cura-simples', 'balsamo-calmante', 'tonico-energia'],
    description: 'Compra o básico e presta atenção ao preço.' },
  viajante: { id: 'viajante', label: 'Viajante', budget: 1.12, patienceMs: 30000,
    wants: ['tonico-energia', 'pocao-brilho', 'visao-noturna', 'cura-simples', 'elixir-concentracao'],
    description: 'Pedidos variados, às vezes raros.' },
};
