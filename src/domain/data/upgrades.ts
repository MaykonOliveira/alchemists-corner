import type { ShopUpgrade } from '../models/types';

import { tr } from '../../i18n';
export const UPGRADES: ShopUpgrade[] = [
  { id: 'caldeirao-reforcado', name: tr('Caldeirão reforçado'), cost: 700, category: 'funcional', requiredLevel: 3,
    effect: tr('Cintas de cobre que aguentam fogo alto: preparo 30% mais rápido.') },
  { id: 'prateleira-extra', name: tr('Expositor de poções'), cost: 550, category: 'funcional', requiredLevel: 2,
    effect: tr('+12 lugares para poções e clientes um pouco mais dispostos a pagar.') },
  { id: 'armario-organizado', name: tr('Armário organizado'), cost: 400, category: 'funcional', requiredLevel: 2,
    effect: tr('+30 de capacidade para ingredientes.') },
  { id: 'letreiro-novo', name: tr('Letreiro novo'), cost: 900, category: 'funcional', requiredLevel: 4,
    effect: tr('Uma placa pintada na fachada: chegam mais clientes.') },
  { id: 'iluminacao-aconchegante', name: tr('Iluminação aconchegante'), cost: 1100, category: 'visual', requiredLevel: 5,
    effect: tr('Cordões de luz mágica no teto. A loja fica linda e a reputação cresce mais rápido.') },
  // Late game (níveis 7 a 15)
  { id: 'estufa', name: tr('Estufa no quintal'), cost: 2400, category: 'funcional', requiredLevel: 7,
    effect: tr('Toda manhã rende de graça 4 folhas lunares, 4 hortelãs e 2 raízes de mandrágora (se couber no armário).') },
  { id: 'alambique-prata', name: tr('Alambique de prata'), cost: 3600, category: 'funcional', requiredLevel: 9,
    effect: tr('Destila o que sobra no caldeirão: cada lote rende 3 poções em vez de 2.') },
  { id: 'despensa-encantada', name: tr('Despensa encantada'), cost: 4200, category: 'funcional', requiredLevel: 11,
    effect: tr('Runas que dobram o espaço por dentro: +40 de capacidade para ingredientes e +12 lugares para poções.') },
  { id: 'vitral-arcano', name: tr('Vitral arcano'), cost: 5500, category: 'visual', requiredLevel: 13,
    effect: tr('Uma janela de vidro colorido que brilha à noite. Clientes pagam 5% a mais e a nobreza aparece com mais frequência.') },
  { id: 'refeitorio', name: tr('Refeitório da equipe'), cost: 6500, category: 'funcional', requiredLevel: 10,
    effect: tr('Uma mesa farta no fundo da loja: os salários de todos os ajudantes ficam 40% menores.') },
  { id: 'sino-encantado', name: tr('Sino encantado'), cost: 7000, category: 'funcional', requiredLevel: 15,
    effect: tr('Um sino na porta que acalma quem espera: clientes têm 30% mais paciência e chegam com mais frequência.') },
  // Expansão da loja: etapas caras, em ordem, para o late game.
  { id: 'sala-dos-fundos', name: tr('Sala dos fundos'), cost: 9000, category: 'expansao', requiredLevel: 9,
    effect: tr('Derruba a parede do depósito e instala um segundo caldeirão: dois preparos ao mesmo tempo.') },
  { id: 'balcao-duplo', name: tr('Balcão duplo'), cost: 14000, category: 'expansao', requiredLevel: 11, requires: 'sala-dos-fundos',
    effect: tr('Um balcão maior: até 4 clientes esperando e 10% mais movimento na rua.') },
  { id: 'torre-alquimista', name: tr('Torre do alquimista'), cost: 22000, category: 'expansao', requiredLevel: 13, requires: 'balcao-duplo',
    effect: tr('Uma torre com observatório no telhado. Clientes pagam 8% a mais e os contratos rendem 25% mais moedas.') },
  // Ajudantes: automatizam uma parte do trabalho e recebem salário diário (somado à manutenção).
  { id: 'corvo-entregador', name: tr('Corvo entregador'), cost: 600, category: 'ajudante', requiredLevel: 3, upkeep: 8,
    effect: tr('Confere o armário a cada hora e busca no fornecedor o que está acabando (taxa de 3 moedas por viagem).') },
  { id: 'aprendiz', name: tr('Aprendiz de alquimia'), cost: 2200, category: 'ajudante', requiredLevel: 8, upkeep: 20,
    effect: tr('Quando o caldeirão fica livre, prepara a poção que está mais em falta (sempre Comum). Dá prioridade ao pedido especial.') },
  { id: 'golem-balconista', name: tr('Golem balconista'), cost: 3000, category: 'ajudante', requiredLevel: 9, upkeep: 25,
    effect: tr('Atende o balcão sozinho: reconhece qualquer problema que o cliente contar, entrega a poção certa (ou uma parecida, se acabou) e cobra a sua etiqueta, ou o que o cliente pode pagar, nunca menos que o preço-base. Histórias dos fregueses e visitas especiais ele deixa alguns segundos para você. Quer diagnosticar você mesmo? Mande o golem descansar.') },
  // Funcionários novos: cada um tira mais um trabalho das suas mãos e deixa a loja mais viva.
  { id: 'gnomo-jardineiro', name: tr('Gnomo jardineiro'), cost: 2800, category: 'ajudante', requiredLevel: 7, requires: 'estufa', upkeep: 15,
    effect: tr('Cuida dos canteiros da estufa: a colheita da manhã rende o dobro, e ele ainda traz 3 unidades do ingrediente mais raro que o fornecedor vende no seu nível.') },
  { id: 'coruja-sabia', name: tr('Coruja sábia'), cost: 4500, category: 'ajudante', requiredLevel: 10, upkeep: 30,
    effect: tr('Decifra a charada do Cliente misterioso (se a poção está na prateleira) e entrega o pedido especial assim que o estoque fica pronto. Você continua ganhando os cristais e a recompensa.') },
  { id: 'bardo-da-porta', name: tr('Bardo da porta'), cost: 6000, category: 'ajudante', requiredLevel: 12, upkeep: 35,
    effect: tr('Toca alaúde na entrada: 15% mais clientes, 25% mais paciência na fila e todo mundo paga 3% a mais, de bom humor.') },
  // Funcionários do pacote E2: o que ainda pedia clique repetido ganha alguém para cuidar.
  { id: 'mascate', name: tr('Mascate da praça'), cost: 3500, category: 'ajudante', requiredLevel: 8, upkeep: 20,
    effect: tr('Quando uma poção lota a prateleira, ele leva o excesso numa carroça e vende na praça por 70% da etiqueta. Acaba a prateleira cheia.') },
  { id: 'fada-contadora', name: tr('Fada contadora'), cost: 5000, category: 'ajudante', requiredLevel: 9, upkeep: 30,
    effect: tr('Ajusta os preços sozinha pela procura do dia, seguindo a estratégia que você escolher na Equipe. Preço travado por você ela não mexe.') },
  { id: 'exploradora', name: tr('Exploradora'), cost: 6000, category: 'ajudante', requiredLevel: 11, requires: 'corvo-entregador', upkeep: 30,
    effect: tr('Parte em expedição sozinha toda manhã, para o destino com o achado que falta no álbum. O corvo fica em casa trabalhando.') },
  { id: 'salamandra', name: tr('Salamandra do forno'), cost: 7000, category: 'ajudante', requiredLevel: 13, upkeep: 35,
    effect: tr('Mora embaixo do caldeirão: todo preparo fica 15% mais rápido e os preparos da equipe saem Finos, às vezes Primorosos.') },
  { id: 'gerente-noturno', name: tr('Gerente noturno'), cost: 9000, category: 'ajudante', requiredLevel: 15, upkeep: 40,
    effect: tr('Um fantasma de lampião que cuida da loja enquanto você está fora: até 60 vendas e 20 preparos, em vez de 24 e 8.') },
  // Treino da equipe (pacote X): cada ajudante pode evoluir uma vez no fim de jogo.
  { id: 'corvo-veloz', name: tr('Corvo veloz'), cost: 9000, category: 'treino', requiredLevel: 15, requires: 'corvo-entregador',
    effect: tr('O corvo confere o armário duas vezes por hora e não cobra mais a taxa da viagem.') },
  { id: 'aprendiz-dedicado', name: tr('Aprendiz dedicado'), cost: 12000, category: 'treino', requiredLevel: 15, requires: 'aprendiz',
    effect: tr('O aprendiz prepara até 5 lotes de uma vez e mantém 10 poções de cada receita nas prateleiras.') },
  { id: 'golem-polido', name: tr('Golem polido'), cost: 15000, category: 'treino', requiredLevel: 15, requires: 'golem-balconista',
    effect: tr('Engrenagens novas: o golem atende duas vezes mais rápido e espera menos antes de dar a vez a você.') },
  // Mestres da equipe: a segunda evolução de cada ajudante, para quem já treinou o primeiro passo.
  { id: 'corvo-da-guilda', name: tr('Corvo da guilda'), cost: 22000, category: 'treino', requiredLevel: 15, requires: 'corvo-veloz',
    effect: tr('O corvo vira sócio da guilda dos fornecedores: tudo o que ele compra sai 20% mais barato.') },
  { id: 'aprendiz-prodigio', name: tr('Aprendiz prodígio'), cost: 28000, category: 'treino', requiredLevel: 15, requires: 'aprendiz-dedicado',
    effect: tr('O aprendiz aprendeu o toque de mestre: todo preparo dele sai Fino (★★), que vende mais caro.') },
  { id: 'golem-de-cristal', name: tr('Golem de cristal'), cost: 35000, category: 'treino', requiredLevel: 15, requires: 'golem-polido',
    effect: tr('Um coração de cristal: o golem atende dois clientes de cada vez e convence quem pode pagar a deixar até 10% acima da etiqueta.') },
];

/** Ajudante de origem de uma evolução (para o retrato): segue a cadeia de "requires" até um ajudante. */
export function helperRoot(id: string): string | null {
  let u = UPGRADES.find((x) => x.id === id);
  while (u && u.category !== 'ajudante') u = u.requires ? UPGRADES.find((x) => x.id === u!.requires) : undefined;
  return u?.id ?? null;
}

export const HELPER_IDS = UPGRADES.filter((u) => u.category === 'ajudante').map((u) => u.id);

export const UPGRADES_BY_ID: Record<string, ShopUpgrade> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
