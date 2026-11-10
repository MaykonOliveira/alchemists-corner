import type { CustomerArchetype } from '../models/types';

import { tr } from '../../i18n';
export interface ArchetypeInfo {
  id: CustomerArchetype;
  label: string;
  wants: string[];
  description: string;
  /** Quanto aceita pagar em relação ao preço-base. */
  budget: number;
  /** Como o arquétipo lida com preço, na voz do balcão (o jogador aprende a ler). */
  payHint: string;
  patienceMs: number;
}

export const ARCHETYPES: Record<CustomerArchetype, ArchetypeInfo> = {
  aventureiro: { id: 'aventureiro', payHint: tr('Tem pressa: costuma pagar mais para sair logo.'), label: tr('Aventureira'), budget: 1.25, patienceMs: 26000,
    wants: ['cura-simples', 'tonico-energia', 'visao-noturna', 'elixir-geada', 'elixir-fenix', 'refresco-solar', 'nectar-primavera', 'tonico-gigante', 'balsamo-sereia'],
    description: tr('Tem pressa e aceita pagar um pouco mais.') },
  estudioso: { id: 'estudioso', payHint: tr('Conta as moedas, mas aceita um pouco acima do justo.'), label: tr('Estudioso'), budget: 1.15, patienceMs: 40000,
    wants: ['elixir-concentracao', 'pocao-brilho', 'balsamo-calmante', 'elixir-estelar', 'pocao-sorte', 'cha-colheita', 'elixir-eco'],
    description: tr('Paciente. Valoriza qualidade.') },
  morador: { id: 'morador', payHint: tr('Compra o básico e não gosta de preço salgado.'), label: tr('Morador'), budget: 1.0, patienceMs: 34000,
    wants: ['cura-simples', 'balsamo-calmante', 'tonico-energia', 'pocao-sorte', 'nectar-primavera', 'cha-colheita', 'aurora-boreal', 'elixir-sonhos', 'tonico-gigante'],
    description: tr('Compra o básico e presta atenção ao preço.') },
  viajante: { id: 'viajante', payHint: tr('Conhece os preços de outras cidades: paga um pouco a mais.'), label: tr('Viajante'), budget: 1.12, patienceMs: 30000,
    wants: ['tonico-energia', 'pocao-brilho', 'visao-noturna', 'cura-simples', 'elixir-concentracao', 'pena-leve', 'elixir-geada', 'refresco-solar', 'aurora-boreal', 'balsamo-sereia', 'pocao-invisivel'],
    description: tr('Pedidos variados, às vezes raros.') },
  nobre: { id: 'nobre', payHint: tr('Mal olha a etiqueta. Paga bem pelo que é bom.'), label: tr('Nobre'), budget: 1.4, patienceMs: 36000,
    wants: ['pocao-brilho', 'pocao-sorte', 'pena-leve', 'elixir-estelar', 'elixir-fenix', 'nectar-primavera', 'aurora-boreal', 'pocao-coroa', 'pocao-invisivel', 'elixir-dragao', 'elixir-sonhos'],
    description: tr('Aparece a partir do nível 8. Só quer o que há de melhor e paga bem por isso.') },
};

/** Nível a partir do qual a nobreza começa a frequentar a loja. */
export const NOBLE_LEVEL = 8;
