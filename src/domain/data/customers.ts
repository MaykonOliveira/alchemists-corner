import type { CustomerArchetype } from '../models/types';

export interface ArchetypeInfo {
  id: CustomerArchetype;
  label: string;
  wants: string[];
  description: string;
}

export const ARCHETYPES: Record<CustomerArchetype, ArchetypeInfo> = {
  aventureiro: { id: 'aventureiro', label: 'Aventureiro',
    wants: ['cura-simples', 'tonico-energia', 'visao-noturna'],
    description: 'Tem pressa e aceita pagar um pouco mais.' },
  estudioso: { id: 'estudioso', label: 'Estudioso',
    wants: ['elixir-concentracao', 'pocao-brilho'],
    description: 'Valoriza qualidade e consistência.' },
  morador: { id: 'morador', label: 'Morador',
    wants: ['cura-simples', 'balsamo-calmante'],
    description: 'Compra o básico e presta atenção ao preço.' },
  viajante: { id: 'viajante', label: 'Viajante',
    wants: ['tonico-energia', 'pocao-brilho', 'visao-noturna', 'cura-simples'],
    description: 'Pedidos variados, às vezes raros.' },
};
