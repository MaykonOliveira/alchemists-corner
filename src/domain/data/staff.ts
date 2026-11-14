import { tr } from '../../i18n';
// Carreira da equipe (pacote E1): cada funcionário sobe de nível trabalhando e, nos níveis 3, 6 e 9,
// o jogador escolhe um caminho. "Rapidez" (lado a) e "Capricho" (lado b) significam coisas
// diferentes para cada cargo; o texto de cada lado diz exatamente o que muda.

export interface StaffRole {
  /** Id da melhoria do ajudante (categoria 'ajudante'). */
  id: string;
  /** Cargo curto (aparece quando o jogador não deu nome). */
  role: string;
  /** O que conta como trabalho (para a barra de experiência). */
  work: string;
  a: { name: string; text: string };
  b: { name: string; text: string };
}

export const STAFF_ROLES: StaffRole[] = [
  {
    id: 'corvo-entregador', role: tr('Corvo'), work: tr('entregas'),
    a: { name: tr('Asas ligeiras'), text: tr('Confere o armário 15% mais vezes.') },
    b: { name: tr('Bom de troco'), text: tr('Volta do fornecedor com 4% do valor das compras.') },
  },
  {
    id: 'aprendiz', role: tr('Aprendiz'), work: tr('preparos'),
    a: { name: tr('Mãos rápidas'), text: tr('Mantém 2 poções a mais de cada receita e prepara 1 lote a mais por vez.') },
    b: { name: tr('Caprichoso'), text: tr('20% de chance de cada preparo dele sair Fino (ou Primoroso, se já sai Fino).') },
  },
  {
    id: 'golem-balconista', role: tr('Golem'), work: tr('atendimentos'),
    a: { name: tr('Engrenagem leve'), text: tr('Atende 15% mais rápido.') },
    b: { name: tr('Charmoso'), text: tr('Ganha gorjeta: +3% do preço em cada venda dele.') },
  },
  {
    id: 'gnomo-jardineiro', role: tr('Gnomo'), work: tr('colheitas'),
    a: { name: tr('Canteiro extra'), text: tr('Traz 2 unidades a mais do ingrediente raro.') },
    b: { name: tr('Adubo de lua'), text: tr('Cada planta da estufa rende 1 a mais.') },
  },
  {
    id: 'coruja-sabia', role: tr('Coruja'), work: tr('charadas e pedidos'),
    a: { name: tr('Pensa rápido'), text: tr('Resolve a charada 15% mais depressa.') },
    b: { name: tr('Negociadora'), text: tr('Pedidos especiais entregues por ela rendem 10% a mais.') },
  },
  {
    id: 'bardo-da-porta', role: tr('Bardo'), work: tr('clientes recebidos'),
    a: { name: tr('Refrão animado'), text: tr('5% mais clientes chegando.') },
    b: { name: tr('Balada calma'), text: tr('Clientes esperam 8% mais.') },
  },
  {
    id: 'fada-contadora', role: tr('Fada'), work: tr('preços ajustados'),
    a: { name: tr('Calculista'), text: tr('Revê os preços 15% mais vezes.') },
    b: { name: tr('Simpática'), text: tr('A loja ganha +1 de reputação por dia.') },
  },
  {
    id: 'mascate', role: tr('Mascate'), work: tr('poções vendidas na praça'),
    a: { name: tr('Carroça grande'), text: tr('Leva 1 poção a mais por viagem.') },
    b: { name: tr('Lábia de feira'), text: tr('Vende na praça por 8% a mais.') },
  },
  {
    id: 'exploradora', role: tr('Exploradora'), work: tr('expedições'),
    a: { name: tr('Mochila funda'), text: tr('Volta com 30% mais ingredientes.') },
    b: { name: tr('Olho de lince'), text: tr('10% mais chance de trazer um achado.') },
  },
  {
    id: 'salamandra', role: tr('Salamandra'), work: tr('preparos aquecidos'),
    a: { name: tr('Chama alta'), text: tr('Preparos 5% mais rápidos.') },
    b: { name: tr('Ponto perfeito'), text: tr('10% mais chance de um preparo da equipe sair Primoroso.') },
  },
  {
    id: 'gerente-noturno', role: tr('Gerente'), work: tr('vendas da noite'),
    a: { name: tr('Turno longo'), text: tr('Vende 10 poções a mais enquanto você está fora.') },
    b: { name: tr('Fornalha acesa'), text: tr('Faz 3 preparos a mais enquanto você está fora.') },
  },
];

export const STAFF_BY_ID: Record<string, StaffRole> = Object.fromEntries(STAFF_ROLES.map((r) => [r.id, r]));

/** Níveis em que o jogador escolhe um caminho. */
export const PERK_LEVELS = [3, 6, 9];
/** Nível máximo sem curso e com todos os cursos. */
export const STAFF_BASE_CAP = 5;
export const STAFF_MAX_LEVEL = 10;
/** Curso na Guilda para liberar o nível indicado (6 a 10). */
export const COURSE_COST: Record<number, number> = { 6: 5000, 7: 9000, 8: 15000, 9: 24000, 10: 40000 };
/** Experiência por dia trabalhado (cada funcionário ligado ganha no fechamento). */
export const STAFF_DAY_XP = 10;
/** Salário sobe 10% por nível do funcionário (pacote E7: o salário volta a pesar). */
export const WAGE_PER_LEVEL = 0.1;
